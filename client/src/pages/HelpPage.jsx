import React, { useState } from "react";
import Card from "../components/common/Card";
import Separator from "../components/common/Separator";

const HelpPage = () => {
  const [activeCategory, setActiveCategory] = useState("Flight Info");

  const faqData = {
    "Flight Info": [
      {
        q: "How early should I arrive at the airport?",
        a: "For domestic flights, arrive 2 hours early. For international, 3 hours is recommended.",
      },
      {
        q: "Where can I find my gate number?",
        a: "Gate assignments are updated in real-time on your 'Flight Search' results page.",
      },
      {
        q: "What is the policy for delayed flights?",
        a: "If a flight is delayed more than 4 hours, you are eligible for a meal voucher or rebooking.",
      },
    ],
    Passengers: [
      {
        q: "How do I update my passport info?",
        a: "Go to 'Manage Passenger' and enter your ID to edit details.",
      },
      {
        q: "Can I add a lap infant to my booking?",
        a: "Yes, infants under 2 years old can be added during the passenger check-in process.",
      },
    ],
    "Account & Security": [
      {
        q: "My account got hacked how do I get it back?",
        a: "Please contact us ASAP through the phone number or the email.",
      },
      {
        q: "How do I delete my account?",
        a: "Account deletion can be requested through mail or call.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes, we use college-standard encryption and do not store full credit card numbers.",
      },
    ],
    Payments: [
      {
        q: "What payment methods are accepted?",
        a: "We accept all credit cards and PayPal too!",
      },
      {
        q: "Can I pay with multiple cards?",
        a: "Currently, our system only supports one payment method per booking.",
      },
    ],
    "Contact Us": [],
  };

  return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
          {/* Left sidebar */}
          <Card className="h-fit p-3">
            <div className="space-y-2">
              {Object.keys(faqData).map((cat) => (
                  <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                          activeCategory === cat
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                      }`}
                  >
                    {cat}
                  </button>
              ))}
            </div>
          </Card>

          {/* Right content */}
          <Card className="p-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              {activeCategory}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Find help and support information for common airline questions.
            </p>

            <Separator className="my-6" />

            <div className="space-y-4">
              {activeCategory === "Contact Us" ? (
                  <>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
                      <h2 className="text-base font-semibold text-blue-600">
                        📞 Phone Support
                      </h2>
                      <p className="mt-2 text-sm font-medium text-gray-900">
                        +1 (800) 338-0000
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Available 24/7 for urgent flight changes.
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
                      <h2 className="text-base font-semibold text-blue-600">
                        📧 Email Us
                      </h2>
                      <p className="mt-2 text-sm font-medium text-gray-900">
                        support@dividedairlines.com
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        We typically respond within 24 hours.
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
                      <h2 className="text-base font-semibold text-blue-600">
                        ✉️ Mailing Address
                      </h2>
                      <p className="mt-2 text-sm font-medium text-gray-900">
                        University of Houston - Computer Science Dept
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        6767 Donot mailus RD, TX 77777
                      </p>
                    </div>
                  </>
              ) : (
                  faqData[activeCategory]?.map((item, index) => (
                      <div
                          key={index}
                          className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4"
                      >
                        <h2 className="text-base font-semibold text-gray-900">
                          {item.q}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {item.a}
                        </p>
                      </div>
                  ))
              )}
            </div>
          </Card>
        </div>
      </div>
  );
};

export default HelpPage;
