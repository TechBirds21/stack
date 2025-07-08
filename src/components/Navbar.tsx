import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-semibold text-gray-900">
              Real Estate
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;