import React from 'react';

const ScrollingBanner: React.FC = () => {
  const messages = [
    "🏠 We are hiring Real Estate Agents - Qualification: Minimum Graduate Degree Required",
    "💼 Join our team of 500+ verified real estate professionals across India",
    "📈 Grow your career with Home & Own - India's fastest growing property platform",
    "🎯 Excellent commission structure: 2% on sales + 1 month rent on rentals",
    "🌟 Complete training and support provided for new agents - No experience required",
    "📞 Contact us for agent opportunities: careers@homeandown.com | 1800-123-4567",
    "🚀 Be part of India's most trusted property platform with 10,000+ satisfied customers",
    "💰 Top agents earning ₹50,000+ monthly commission - Join the success story",
    "🏆 Award-winning platform with 4.8★ rating - Your success is our priority"
  ];

  return (
    <div className="scrolling-banner bg-[#90C641] text-white py-3 overflow-hidden relative z-40">
      <div className="animate-scroll whitespace-nowrap flex">
        <span className="inline-block px-8">
          {messages.map((message, index) => (
            <span key={index} className="mx-12 text-sm font-medium">
              {message}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {messages.map((message, index) => (
            <span key={`duplicate-${index}`} className="mx-12 text-sm font-medium">
              {message}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};

export default ScrollingBanner;