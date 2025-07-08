import React from 'react';

const ScrollingBanner: React.FC = () => {
  const messages = [
    "🏠 We are hiring Agents - Qualification required: Minimum degree",
    "💼 Join our team of real estate professionals",
    "📈 Grow your career with Home & Own",
    "🎯 Excellent commission structure available",
    "🌟 Training and support provided for new agents"
  ];

  return (
    <div className="scrolling-banner bg-[#90C641] text-white py-2 overflow-hidden">
      <div className="animate-scroll whitespace-nowrap">
        <span className="inline-block px-8">
          {messages.map((message, index) => (
            <span key={index} className="mx-8 text-sm font-medium">
              {message}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {messages.map((message, index) => (
            <span key={`duplicate-${index}`} className="mx-8 text-sm font-medium">
              {message}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};

export default ScrollingBanner;