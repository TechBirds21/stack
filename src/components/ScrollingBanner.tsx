import React from 'react';

const ScrollingBanner: React.FC = () => {
  const messages = [
    "🏠 WE ARE HIRING REAL ESTATE AGENTS - QUALIFICATION: MINIMUM GRADUATE DEGREE REQUIRED - APPLY NOW!",
    "💼 JOIN OUR TEAM OF 500+ VERIFIED REAL ESTATE PROFESSIONALS ACROSS INDIA - UNLIMITED EARNING POTENTIAL",
    "📈 GROW YOUR CAREER WITH HOME & OWN - INDIA'S FASTEST GROWING PROPERTY PLATFORM - 10X YOUR INCOME",
    "🎯 EXCELLENT COMMISSION STRUCTURE: 2% ON SALES + 1 MONTH RENT ON RENTALS - HIGHEST IN INDUSTRY",
    "🌟 COMPLETE TRAINING AND SUPPORT PROVIDED FOR NEW AGENTS - NO EXPERIENCE REQUIRED - START TODAY",
    "📞 CONTACT US FOR AGENT OPPORTUNITIES: CAREERS@HOMEANDOWN.COM | 1800-123-4567 - CALL NOW",
    "🚀 BE PART OF INDIA'S MOST TRUSTED PROPERTY PLATFORM WITH 10,000+ SATISFIED CUSTOMERS - JOIN SUCCESS",
    "💰 TOP AGENTS EARNING ₹50,000+ MONTHLY COMMISSION - JOIN THE SUCCESS STORY - FINANCIAL FREEDOM AWAITS",
    "🏆 AWARD-WINNING PLATFORM WITH 4.8★ RATING - YOUR SUCCESS IS OUR PRIORITY - PROVEN TRACK RECORD"
  ];

  return (
    <div className="scrolling-banner bg-gradient-to-r from-[#90C641] via-[#7DAF35] to-[#90C641] text-white py-20 overflow-hidden relative z-40 shadow-2xl border-b-8 border-white/30">
      <div className="animate-scroll whitespace-nowrap flex items-center">
        <span className="inline-block px-16">
          {messages.map((message, index) => (
            <span key={index} className="mx-32 text-5xl font-black tracking-widest drop-shadow-2xl uppercase">
              {message}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {messages.map((message, index) => (
            <span key={`duplicate-${index}`} className="mx-32 text-5xl font-black tracking-widest drop-shadow-2xl uppercase">
              {message}
            </span>
          ))}
        </span>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"></div>
      <div className="absolute top-8 left-12 w-10 h-10 bg-white/50 rounded-full animate-pulse"></div>
      <div className="absolute bottom-8 right-24 w-12 h-12 bg-white/40 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-white/35 rounded-full animate-pulse delay-500"></div>
      <div className="absolute top-1/4 right-1/3 w-10 h-10 bg-white/45 rounded-full animate-pulse delay-1500"></div>
      <div className="absolute top-3/4 left-1/2 w-6 h-6 bg-white/30 rounded-full animate-pulse delay-2000"></div>
      
      {/* Additional visual effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 via-white to-yellow-300 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 via-white to-yellow-300 animate-pulse delay-1000"></div>
    </div>
  );
};

export default ScrollingBanner;