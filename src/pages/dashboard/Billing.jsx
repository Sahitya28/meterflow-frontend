/* eslint-disable */
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { billingAPI, paymentAPI, accessAPI } from "../../services/api";
import { useAuth } from "../../store/authStore";

const formatAmount = (amount) => {
  if (amount === 0) return "₹0.00";
  return `₹${amount.toFixed(2)}`;
};

const StatusBadge = ({ status }) => {
  const styles = {
    free: "bg-green-50 text-green-600",
    paid: "bg-blue-50 text-blue-600",
    unpaid: "bg-red-50 text-red-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Owner billing - shows revenue and consumer usage
const OwnerBilling = ({ bills, summary, onCalculate, calculating }) => {
  const totalRevenue = bills
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + b.amount, 0);

  const pendingRevenue = bills
    .filter((b) => b.status === "unpaid")
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <>
      {/* Owner stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400">Total API Requests</p>
          <p className="text-xl font-bold text-indigo-600 mt-1">
            {summary?.summary?.totalRequests || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400">Free Requests</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            {summary?.summary?.totalFreeRequests || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400">Billable Requests</p>
          <p className="text-xl font-bold text-orange-500 mt-1">
            {summary?.summary?.totalBillableRequests || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400">Total Amount</p>
          <p className="text-xl font-bold text-gray-800 mt-1">
            {formatAmount(summary?.summary?.totalAmount || 0)}
          </p>
        </div>
      </div>

      {/* Info box for owner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-indigo-700 mb-2">
          📊 Your API Usage Summary
        </h3>
        <p className="text-xs text-indigo-600">
          This shows total usage across all your APIs including requests
          made by consumers. Free tier is{" "}
          {bills?.[0]?.freeRequests || 1000} requests per API per month.
          After that ₹0.50 per 100 requests applies.
        </p>
      </div>

      {/* Bills table for owner */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-700">
            API Usage Bills
          </h3>
          <span className="text-xs text-gray-400">
            {bills.length} bill{bills.length !== 1 ? "s" : ""}
          </span>
        </div>

        {bills.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No bills yet. Click "Calculate Current Bill" to generate one.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">API</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Total Requests</th>
                <th className="px-4 py-3">Free</th>
                <th className="px-4 py-3">Billable</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr
                  key={bill._id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-700">
                    {bill.apiId?.name || "Unknown API"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {bill.billingMonth}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {bill.totalRequests}
                  </td>
                  <td className="px-4 py-3 text-green-600">
                    {bill.freeRequests}
                  </td>
                  <td className="px-4 py-3 text-orange-500">
                    {bill.billableRequests}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {formatAmount(bill.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={bill.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

// Consumer billing - shows their usage and pay now
const ConsumerBilling = ({
  bills,
  summary,
  onCalculate,
  calculating,
}) => {
  const [payingBillId, setPayingBillId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const freeTierUsed = summary?.summary?.totalRequests || 0;
  const freeTierLimit = bills?.[0]?.freeRequests || 1000;
  const billableRequests =
    summary?.summary?.totalBillableRequests || 0;
  const percentage = Math.min(
    (freeTierUsed / freeTierLimit) * 100,
    100
  );
  const isOver = billableRequests > 0;
  const isNear = percentage >= 80 && !isOver;

  const handlePayNow = async (bill) => {
    setError("");
    setSuccess("");
    setPayingBillId(bill._id);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Failed to load payment gateway.");
        return;
      }

      const amountInPaise = Math.max(
        Math.round(bill.amount * 100),
        100
      );

      const orderRes = await paymentAPI.createOrderForBill({
        billId: bill._id,
        amount: amountInPaise,
      });

      const { orderId, keyId, paymentId } = orderRes.data;

      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: "INR",
        name: "MeterFlow",
        description: `API Usage - ${bill.billingMonth}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await paymentAPI.verifyBillPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              billId: bill._id,
              paymentId: paymentId,
            });
            setSuccess("Payment successful! Bill marked as paid ✅");
            onCalculate();
          } catch (err) {
            setError("Payment verification failed.");
          }
        },
        theme: { color: "#4f46e5" },
        modal: { ondismiss: () => setPayingBillId("") },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to initiate payment"
      );
    } finally {
      setPayingBillId("");
    }
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Free tier warning */}
      {isOver && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm font-semibold text-red-700">
            🚨 Free Tier Exhausted
          </p>
          <p className="text-xs text-red-600 mt-1">
            You have used all {freeTierLimit} free requests this month.
            Charges are now applying at ₹0.50 per 100 requests.
          </p>
        </div>
      )}

      {isNear && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm font-semibold text-yellow-700">
            ⚠️ Approaching Free Tier Limit
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            You have used {freeTierUsed} of {freeTierLimit} free
            requests this month.
          </p>
        </div>
      )}

      {/* Consumer stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400">Amount Due</p>
          <p className="text-xl font-bold text-red-500 mt-1">
            {formatAmount(summary?.summary?.totalAmount || 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400">Total Requests</p>
          <p className="text-xl font-bold text-gray-800 mt-1">
            {summary?.summary?.totalRequests || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400">Free Used</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            {summary?.summary?.totalFreeRequests || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400">Billable</p>
          <p className="text-xl font-bold text-orange-500 mt-1">
            {summary?.summary?.totalBillableRequests || 0}
          </p>
        </div>
      </div>

      {/* Free tier progress bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Free Tier Usage — {summary?.billingMonth}
        </h3>
        <div className="flex justify-between text-xs mb-2">
          <span className="text-gray-500">
            {freeTierUsed} of {freeTierLimit} requests used
          </span>
          <span className={isOver ? "text-red-500" : "text-green-600"}>
            {isOver
              ? `${billableRequests} billable`
              : `${freeTierLimit - freeTierUsed} remaining`}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${
              isOver
                ? "bg-red-500"
                : isNear
                ? "bg-yellow-400"
                : "bg-green-400"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Consumer bills table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-700">
            My Invoices
          </h3>
        </div>

        {bills.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No invoices yet. Make some API requests first.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">API</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Requests</th>
                <th className="px-4 py-3">Free</th>
                <th className="px-4 py-3">Billable</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr
                  key={bill._id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-700">
                    {bill.apiId?.name || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {bill.billingMonth}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {bill.totalRequests}
                  </td>
                  <td className="px-4 py-3 text-green-600">
                    {bill.freeRequests}
                  </td>
                  <td className="px-4 py-3 text-orange-500">
                    {bill.billableRequests}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {formatAmount(bill.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={bill.status} />
                  </td>
                  <td className="px-4 py-3">
                    {bill.status === "unpaid" && bill.amount > 0 && (
                      <button
                        onClick={() => handlePayNow(bill)}
                        disabled={payingBillId === bill._id}
                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {payingBillId === bill._id
                          ? "Opening..."
                          : "💳 Pay Now"}
                      </button>
                    )}
                    {bill.status === "paid" && (
                      <span className="text-xs text-green-600">
                        Paid ✅
                      </span>
                    )}
                    {bill.status === "free" && (
                      <span className="text-xs text-gray-400">
                        No charge
                      </span>
                    )}
                    {bill.status === "unpaid" && bill.amount === 0 && (
                      <span className="text-xs text-gray-400">
                        No charge
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

// Main Billing component
const Billing = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");

  const isOwner =
    user?.role === "api_owner" || user?.role === "admin";

  const fetchData = async () => {
    try {
      await billingAPI.calculate();
      const [billsRes, summaryRes] = await Promise.all([
        billingAPI.getAll(),
        billingAPI.getSummary(),
      ]);
      setBills(billsRes.data.bills);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load billing data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCalculate = async () => {
    setCalculating(true);
    setError("");
    try {
      await billingAPI.calculate();
      await fetchData();
    } catch (err) {
      setError("Failed to calculate bill");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {isOwner ? "API Usage & Billing" : "My Billing"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isOwner
              ? "Track usage across all your APIs"
              : "Track your usage and pay outstanding bills"}
          </p>
        </div>
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {calculating ? "Calculating..." : "🔄 Refresh Bill"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading billing data...</p>
      ) : isOwner ? (
        <OwnerBilling
          bills={bills}
          summary={summary}
          onCalculate={handleCalculate}
          calculating={calculating}
        />
      ) : (
        <ConsumerBilling
          bills={bills}
          summary={summary}
          onCalculate={handleCalculate}
          calculating={calculating}
        />
      )}
    </DashboardLayout>
  );
};

export default Billing;