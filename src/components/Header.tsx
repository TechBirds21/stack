import React, { useState } from 'react';
import { Menu, User, Sun, Moon, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    setShowDropdown(false);
  };

  const handleSignOut = () => {
    navigate('/');
  };

  return (
    <div className="bg-white shadow-sm p-4 flex justify-between items-center">
      <button
        onClick={toggleSidebar}
        className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
      >
        <Menu size={24} />
      </button>
      
      <div className="relative ml-auto">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full"
        >
          <div className="w-8 h-8 bg-[#1E3A8A] rounded-full flex items-center justify-center">
            <User className="text-white" size={20} />
          </div>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
            <button
              onClick={() => {/* Handle settings */}}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-gray-100"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;