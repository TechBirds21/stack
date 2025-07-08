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
    <div className="scrolling-banner bg-gradient-to-r from-[#90C641] via-[#7DAF35] to-[#90C641] text-white py-6 overflow-hidden relative z-40 shadow-lg">
      <div className="animate-scroll whitespace-nowrap flex">
        <span className="inline-block px-12">
          {messages.map((message, index) => (
            <span key={index} className="mx-16 text-lg font-bold tracking-wide">
              {message}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {messages.map((message, index) => (
            <span key={`duplicate-${index}`} className="mx-16 text-lg font-bold tracking-wide">
              {message}
            </span>
          ))}
        </span>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-2 left-4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
      <div className="absolute bottom-2 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse delay-1000"></div>
    </div>
  );
};

export default ScrollingBanner;