import React from 'react';

const ScrollingBanner: React.FC = () => {
  const messages = [
    "🏠 WE ARE HIRING REAL ESTATE AGENTS - QUALIFICATION: MINIMUM GRADUATE DEGREE REQUIRED",
    "💼 JOIN OUR TEAM OF 500+ VERIFIED REAL ESTATE PROFESSIONALS ACROSS INDIA",
    "📈 GROW YOUR CAREER WITH HOME & OWN - INDIA'S FASTEST GROWING PROPERTY PLATFORM",
    "🎯 EXCELLENT COMMISSION STRUCTURE: 2% ON SALES + 1 MONTH RENT ON RENTALS",
    "🌟 COMPLETE TRAINING AND SUPPORT PROVIDED FOR NEW AGENTS - NO EXPERIENCE REQUIRED",
    "📞 CONTACT US FOR AGENT OPPORTUNITIES: CAREERS@HOMEANDOWN.COM | 1800-123-4567",
    "🚀 BE PART OF INDIA'S MOST TRUSTED PROPERTY PLATFORM WITH 10,000+ SATISFIED CUSTOMERS",
    "💰 TOP AGENTS EARNING ₹50,000+ MONTHLY COMMISSION - JOIN THE SUCCESS STORY",
    "🏆 AWARD-WINNING PLATFORM WITH 4.8★ RATING - YOUR SUCCESS IS OUR PRIORITY"
  ];

  return (
    <div className="scrolling-banner bg-gradient-to-r from-[#90C641] via-[#7DAF35] to-[#90C641] text-white py-8 overflow-hidden relative z-40 shadow-lg border-b-4 border-white/20">
      <div className="animate-scroll whitespace-nowrap flex">
        <span className="inline-block px-12">
          {messages.map((message, index) => (
            <span key={index} className="mx-20 text-xl font-black tracking-wider drop-shadow-lg">
              {message}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {messages.map((message, index) => (
            <span key={`duplicate-${index}`} className="mx-20 text-xl font-black tracking-wider drop-shadow-lg">
              {message}
            </span>
          ))}
        </span>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
      <div className="absolute top-3 left-6 w-3 h-3 bg-white/40 rounded-full animate-pulse"></div>
      <div className="absolute bottom-3 right-12 w-4 h-4 bg-white/30 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white/25 rounded-full animate-pulse delay-500"></div>
      <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-white/35 rounded-full animate-pulse delay-1500"></div>
    </div>
  );
};

export default ScrollingBanner;