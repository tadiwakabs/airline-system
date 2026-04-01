import React, { useState } from 'react';
import './HelpPage.css';

const HelpPage = () => {
  const [activeCategory, setActiveCategory] = useState('Flight Info');

  const faqData = {
    "Flight Info": [
      { q: "How early should I arrive at the airport?", a: "For domestic flights, arrive 2 hours early. For international, 3 hours is recommended." },
      { q: "Where can I find my gate number?", a: "Gate assignments are updated in real-time on your 'Flight Search' results page." },
      { q: "What is the policy for delayed flights?", a: "If a flight is delayed more than 4 hours, you are eligible for a meal voucher or rebooking." }
    ],
    "Passengers": [
      { q: "How do I update my passport info?", a: "Go to 'Manage Passenger' and enter your ID to edit details." },
      { q: "Can I add a lap infant to my booking?", a: "Yes, infants under 2 years old can be added during the passenger check-in process." }
    ],
    "Account & Security": [
      { q: "I forgot my password, what do I do?", a: "Click 'Forgot Password' on the login screen to receive a reset link via email." },
      { q: "How do I delete my account?", a: "Account deletion can be requested through mail or call." },
      { q: "Is my payment information secure?", a: "Yes, we use industry-standard encryption and do not store full credit card numbers." }
    ],
    "Payments": [
      { q: "What payment methods are accepted?", a: "We accept all credit cards and PayPal too! We broke " },
      { q: "Can I pay with multiple cards?", a: "Currently, our system only supports one payment method per booking." }
    ],
    "Contact Us": [] 
  };

  return (
    <div className="help-page-layout">
      {/* SIDEBAR */}
      <nav className="help-sidebar">
        <h2>Help Center</h2>
        <ul>
          {Object.keys(faqData).map((cat) => (
            <li 
              key={cat} 
              className={activeCategory === cat ? 'active' : ''}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </li>
          ))}
        </ul>
      </nav>

      {/* CONTENT AREA */}
      <main className="help-content">
        <h1>{activeCategory}</h1>
        
        <div className="faq-container">
          {activeCategory === "Contact Us" ? (
            /* SPECIAL CONTACT LAYOUT */
            <div className="contact-info">
              <div className="faq-box">
                <h3>📞 Phone Support</h3>
                <p>+1 (800) 338-0000</p>
                <p>Available 24/7 for urgent flight changes.</p>
              </div>
              <div className="faq-box">
                <h3>📧 Email Us</h3>
                <p>support@3380airlines.com</p>
                <p>We typically respond within 24 hours.</p>
              </div>
              <div className="faq-box">
                <h3>✉️ Mailing Address</h3>
                <p>University of Houston - Computer Science Dept</p>
                <p>6767 Donot mailus RD, TX 77777</p>
              </div>
            </div>
          ) : (
            /* REGULAR FAQ LAYOUT */
            faqData[activeCategory]?.map((item, index) => (
              <div key={index} className="faq-box">
                <h3>{item.q}</h3>
                <p>{item.a}</p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default HelpPage;