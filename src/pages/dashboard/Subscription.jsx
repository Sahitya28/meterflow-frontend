import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import PageHeader from "../../components/common/PageHeader";
import { paymentAPI } from "../../services/api";

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Single plan card component
const PlanCard = ({ planKey, plan, currentPlan, onSelect, loading }) => {
  const isCurrentPlan = currentPlan === planKey;
  const isFree = planKey === "free";

  return (
    <div
      className={`bg-white rounded-lg border-2 p-6 flex flex-col transition ${
        isCurrentPlan
          ? "border-indigo-500 shadow-md"
          : "border-gray-100 hover:border-gray-300 shadow-sm"
      }`}
    >
      {/* Plan header */}
      <div className="mb-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-gray-800">{plan.name}</h3>
          {isCurrentPlan && (
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
              Current Plan
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mt-2">
          {plan.price === 0 ? (
            <p className="text-3xl font-bold text-gray-800">Free</p>
          ) : (
            <div>
              <span className="text-3xl font-bold text-gray-800">
                ₹{plan.price}
              </span>
              <span className="text-gray-400 text-sm">/month</span>
            </div>
          )}
        </div>
      </div>

      {/* Features list */}
      <ul className="space-y-2 mb-6 flex-1">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="text-green-500 mt-0.5 shrink-0">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Action button */}
      <button
        onClick={() => onSelect(planKey)}
        disabled={isCurrentPlan || loading === planKey || isFree}
        className={`w-full py-2.5 rounded-md text-sm font-medium transition ${
          isCurrentPlan
            ? "bg-indigo-100 text-indigo-600 cursor-default"
            : isFree
            ? "bg-gray-100 text-gray-400 cursor-default"
            : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        }`}
      >
        {loading === planKey
          ? "Processing..."
          : isCurrentPlan
          ? "Current Plan"
          : isFree
          ? "Default Plan"
          : `Upgrade to ${plan.name}`}
      </button>
    </div>
  );
};

const Subscription = () => {
  const [plans, setPlans] = useState({});
  const [subscription, setSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(""); // which plan is being purchased
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = () => {
    Promise.all([
      paymentAPI.getPlans(),
      paymentAPI.getSubscription(),
      paymentAPI.getHistory(),
    ])
      .then(([plansRes, subRes, historyRes]) => {
        setPlans(plansRes.data.plans);
        setSubscription(subRes.data.subscription);
        setPaymentHistory(historyRes.data.payments);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load subscription data");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle plan selection and Razorpay checkout
  const handleSelectPlan = async (planKey) => {
    setError("");
    setSuccess("");
    setProcessingPlan(planKey);

    try {
      // Step 1 - Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Failed to load payment gateway. Check your internet.");
        return;
      }

      // Step 2 - Create order in our backend
      const orderRes = await paymentAPI.createOrder({ plan: planKey });
      const { orderId, amount, currency, keyId, paymentId } = orderRes.data;

      // Step 3 - Open Razorpay checkout modal
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "MeterFlow",
        description: `${plans[planKey]?.name} Plan - Monthly`,
        order_id: orderId,

        // This runs when payment is successful
        handler: async (response) => {
          try {
            // Step 4 - Verify payment with our backend
            await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planKey,
              paymentId: paymentId,
            });

            setSuccess(
              `Successfully upgraded to ${plans[planKey]?.name} plan!`
            );
            fetchData(); // refresh data
          } catch (err) {
            setError("Payment verification failed. Contact support.");
          }
        },

        // Pre-fill user details
        prefill: {
          name: "",
          email: "",
        },

        theme: {
          color: "#4f46e5", // indigo
        },

        // This runs if user closes the modal
        modal: {
          ondismiss: () => {
            setProcessingPlan("");
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setProcessingPlan("");
    }
  };

  // Cancel subscription
  const handleCancel = async () => {
    if (
      !window.confirm(
        "Cancel your subscription? You will be downgraded to the free plan."
      )
    )
      return;

    try {
      await paymentAPI.cancel();
      setSuccess("Subscription cancelled. You are now on the free plan.");
      fetchData();
    } catch (err) {
      setError("Failed to cancel subscription");
    }
  };

  // Format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Subscription & Billing"
        subtitle="Manage your plan and payment history"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4 text-sm">
          {success}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading plans...</p>
      ) : (
        <>
          {/* Current subscription info */}
          {subscription && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Current Subscription
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Plan</p>
                  <span className="font-semibold text-indigo-600 capitalize">
                    {subscription.plan}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Status</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      subscription.status === "active"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {subscription.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">
                    Free Requests
                  </p>
                  <p className="font-medium text-gray-700">
                    {subscription.planDetails?.freeLimit?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Renews</p>
                  <p className="font-medium text-gray-700">
                    {formatDate(subscription.endDate)}
                  </p>
                </div>
              </div>

              {/* Cancel button - only show for paid plans */}
              {subscription.plan !== "free" && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleCancel}
                    className="text-sm text-red-500 hover:text-red-600 hover:underline"
                  >
                    Cancel subscription →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pricing plans */}
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Available Plans
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {Object.entries(plans).map(([planKey, plan]) => (
              <PlanCard
                key={planKey}
                planKey={planKey}
                plan={plan}
                currentPlan={subscription?.plan}
                onSelect={handleSelectPlan}
                loading={processingPlan}
              />
            ))}
          </div>

          {/* Test mode notice */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-8 text-sm">
            <p className="font-medium text-yellow-700 mb-1">
              🧪 Test Mode Active
            </p>
            <p className="text-yellow-600 text-xs">
              Use card number <strong>4111 1111 1111 1111</strong> with any
              future expiry and any CVV to test payments. No real money will be
              charged.
            </p>
          </div>

          {/* Payment history */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">
                Payment History
              </h3>
            </div>

            {paymentHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No payments yet. Upgrade your plan to see history here.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-gray-500 text-xs uppercase">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Order ID</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr
                      key={payment._id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize font-medium text-gray-700">
                          {payment.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        ₹{(payment.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            payment.status === "paid"
                              ? "bg-green-50 text-green-600"
                              : payment.status === "failed"
                              ? "bg-red-50 text-red-500"
                              : "bg-yellow-50 text-yellow-600"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">
                        {payment.razorpayOrderId?.substring(0, 20)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Subscription;