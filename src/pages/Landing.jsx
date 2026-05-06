import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-600">
            MeterFlow
          </h1>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-medium px-3 py-1 rounded-full mb-6">
          Now in Beta — Free to get started
        </span>
        <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
          One Platform for
          <br />
          <span className="text-indigo-600">
            API Owners and Developers
          </span>
        </h2>
        <p className="text-gray-500 text-lg mb-4 max-w-2xl mx-auto">
          Whether you're building an API or consuming one — MeterFlow gives
          you everything you need. Publish APIs, manage access, track
          usage, and handle billing all in one place.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          API owners monetize effortlessly. Developers get clean access
          with transparent pricing.
        </p>

        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            to="/register"
            className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700"
          >
            Get Started Free →
          </Link>
          <Link
            to="/login"
            className="border border-gray-200 text-gray-600 px-6 py-3 rounded-md font-medium hover:bg-gray-50"
          >
            Sign In
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Inspired by Stripe · RapidAPI · AWS API Gateway · OpenAI
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-14">
          <div>
            <p className="text-3xl font-bold text-indigo-600">1,000</p>
            <p className="text-sm text-gray-400 mt-1">
              Free requests every month
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold text-indigo-600">&lt;10ms</p>
            <p className="text-sm text-gray-400 mt-1">
              Gateway overhead
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold text-indigo-600">₹0</p>
            <p className="text-sm text-gray-400 mt-1">
              To get started today
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-2xl font-bold text-gray-800 text-center mb-4">
            How It Works
          </h3>
          <p className="text-gray-400 text-sm text-center mb-12">
            Two roles. One platform. Everything connected.
          </p>

          {/* Two column - owner vs consumer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">

            {/* Owner side */}
            <div className="bg-white rounded-xl border border-indigo-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">🔌</span>
                <h4 className="font-bold text-gray-800">
                  For API Owners
                </h4>
                <span className="ml-auto text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                  Publisher
                </span>
              </div>
              <div className="space-y-4">
                {[
                  {
                    icon: "1️⃣",
                    text: "Register your API with a base URL and set a pricing plan",
                  },
                  {
                    icon: "2️⃣",
                    text: "Review and approve access requests from developers",
                  },
                  {
                    icon: "3️⃣",
                    text: "Set custom rate limits per developer key",
                  },
                  {
                    icon: "4️⃣",
                    text: "Monitor every request your API receives in real time",
                  },
                  {
                    icon: "5️⃣",
                    text: "View usage billing and track revenue automatically",
                  },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <p className="text-sm text-gray-500">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Consumer side */}
            <div className="bg-white rounded-xl border border-purple-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">👨‍💻</span>
                <h4 className="font-bold text-gray-800">
                  For Developers
                </h4>
                <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                  Consumer
                </span>
              </div>
              <div className="space-y-4">
                {[
                  {
                    icon: "1️⃣",
                    text: "Browse available APIs on the platform",
                  },
                  {
                    icon: "2️⃣",
                    text: "Request access with a reason — get approved in minutes",
                  },
                  {
                    icon: "3️⃣",
                    text: "Get your API key and start making requests immediately",
                  },
                  {
                    icon: "4️⃣",
                    text: "Test APIs directly in the built-in playground — no Postman needed",
                  },
                  {
                    icon: "5️⃣",
                    text: "Track your usage and pay bills securely via Razorpay",
                  },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <p className="text-sm text-gray-500">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h3 className="text-2xl font-bold text-gray-800 text-center mb-4">
          Everything Built In
        </h3>
        <p className="text-gray-400 text-sm text-center mb-12">
          No third party tools needed. Everything works out of the box.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: "🚪",
              title: "API Gateway",
              desc: "Every request is validated, rate-limited, logged and forwarded through your gateway automatically.",
              tag: "Both",
            },
            {
              icon: "🔑",
              title: "Key Management",
              desc: "Generate, revoke and rotate API keys. Set rate limits per key. Keys are cached for fast validation.",
              tag: "Owner",
            },
            {
              icon: "🧪",
              title: "API Playground",
              desc: "Test any API directly from your dashboard. Pick a key, enter an endpoint, see the response instantly.",
              tag: "Both",
            },
            {
              icon: "👥",
              title: "Access Control",
              desc: "Consumers request access. Owners approve. Keys are auto-generated on approval with custom limits.",
              tag: "Both",
            },
            {
              icon: "📋",
              title: "Request Logs",
              desc: "Every request logged with endpoint, HTTP method, status code, latency and which key was used.",
              tag: "Both",
            },
            {
              icon: "💳",
              title: "Automated Billing",
              desc: "1,000 free requests per month. Pay-as-you-go after that. Invoices generated automatically.",
              tag: "Consumer",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="border border-gray-100 rounded-lg p-5 hover:shadow-sm transition"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-2xl">{feature.icon}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    feature.tag === "Both"
                      ? "bg-indigo-50 text-indigo-500"
                      : feature.tag === "Owner"
                      ? "bg-green-50 text-green-600"
                      : "bg-purple-50 text-purple-600"
                  }`}
                >
                  {feature.tag}
                </span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">
                {feature.title}
              </h4>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Simple Pricing
          </h3>
          <p className="text-gray-500 mb-12">
            Start free. Pay only when you scale.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                name: "Free",
                price: "₹0",
                period: "/month",
                features: [
                  "1,000 requests/month",
                  "1 API",
                  "60 req/min rate limit",
                  "Basic logs",
                ],
                cta: "Get Started",
                highlighted: false,
              },
              {
                name: "Pro",
                price: "₹999",
                period: "/month",
                features: [
                  "10,000 requests included",
                  "Unlimited APIs",
                  "300 req/min rate limit",
                  "Advanced analytics",
                  "₹0.50 per 100 extra",
                ],
                cta: "Upgrade to Pro",
                highlighted: true,
              },
              {
                name: "Enterprise",
                price: "₹4,999",
                period: "/month",
                features: [
                  "100,000 requests included",
                  "Unlimited APIs",
                  "1000 req/min rate limit",
                  "Priority support",
                  "₹0.30 per 100 extra",
                ],
                cta: "Go Enterprise",
                highlighted: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg p-6 ${
                  plan.highlighted
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white border border-gray-100"
                }`}
              >
                <h4
                  className={`font-bold text-lg mb-1 ${
                    plan.highlighted ? "text-white" : "text-gray-800"
                  }`}
                >
                  {plan.name}
                </h4>
                <div className="mb-4">
                  <span
                    className={`text-3xl font-bold ${
                      plan.highlighted ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={
                      plan.highlighted
                        ? "text-indigo-200 text-sm"
                        : "text-gray-400 text-sm"
                    }
                  >
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-2 mb-6 text-left">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`text-sm flex items-start gap-2 ${
                        plan.highlighted
                          ? "text-indigo-100"
                          : "text-gray-500"
                      }`}
                    >
                      <span className="mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block text-center py-2 rounded-md text-sm font-medium ${
                    plan.highlighted
                      ? "bg-white text-indigo-600 hover:bg-indigo-50"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          Ready to get started?
        </h3>
        <p className="text-gray-500 mb-3">
          Whether you're publishing an API or consuming one — MeterFlow has
          you covered.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Free to start. No credit card needed.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            to="/register"
            className="bg-indigo-600 text-white px-8 py-3 rounded-md font-medium hover:bg-indigo-700"
          >
            Create Free Account →
          </Link>
          <Link
            to="/login"
            className="border border-gray-200 text-gray-600 px-8 py-3 rounded-md font-medium hover:bg-gray-50"
          >
            Already have an account?
          </Link>
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <p className="text-sm font-bold text-indigo-600">MeterFlow</p>
          <p className="text-xs text-gray-400">
            Built with Node.js, React, MongoDB, Redis & Razorpay
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;