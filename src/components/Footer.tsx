import React from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Apple,
  Store as PlayStore,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowUp
} from 'lucide-react';

const Footer = () => (
  <footer className="relative">
    {/* Top light section */}
    <div className="bg-[#EFF6FF] py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* About */}
          <div>
            <h3 className="text-[#061D58] font-semibold mb-4 relative pb-1">
              About
              <span className="absolute bottom-0 left-0 w-12 h-1 bg-[#90C641]" />
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-[#061D58]">▸</span>
                <Link to="/about" target="_blank" className="hover:text-[#90C641] transition-colors">About Us</Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#061D58]">▸</span>
                <Link to="/about" target="_blank" className="hover:text-[#90C641] transition-colors">Privacy policy</Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#061D58]">▸</span>
                <Link to="/about" target="_blank" className="hover:text-[#90C641] transition-colors">Terms Of Services</Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#061D58]">▸</span>
                <Link to="/about" target="_blank" className="hover:text-[#90C641] transition-colors">Blogs</Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#061D58]">▸</span>
                <Link to="/about" target="_blank" className="hover:text-[#90C641] transition-colors">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Host */}
          <div>
            <h3 className="text-[#061D58] font-semibold mb-4 relative pb-1">
              Host
              <span className="absolute bottom-0 left-0 w-12 h-1 bg-[#90C641]" />
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-[#061D58]">▸</span>
                <Link to="/host" target="_blank" className="hover:text-[#90C641] transition-colors">Why Host</Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#061D58]">▸</span>
                <Link to="/host" target="_blank" className="hover:text-[#90C641] transition-colors">Responsible hosting</Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#061D58]">▸</span>
                <Link to="/host" target="_blank" className="hover:text-[#90C641] transition-colors">Trust and Safety</Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-[#061D58] font-semibold mb-4 relative pb-1">
              Community
              <span className="absolute bottom-0 left-0 w-12 h-1 bg-[#90C641]" />
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-[#061D58]">▸</span>
                <Link to="/community" target="_blank" className="hover:text-[#90C641] transition-colors">Diversity & Belonging</Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#061D58]">▸</span>
                <Link to="/community" target="_blank" className="hover:text-[#90C641] transition-colors">Accessibility</Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#061D58]">▸</span>
                <Link to="/community" target="_blank" className="hover:text-[#90C641] transition-colors">Frontline Stays</Link>
              </li>
            </ul>
          </div>

          {/* Info & Address */}
          <div>
            <h3 className="text-[#061D58] font-semibold mb-4 relative pb-1">
              Our Info & Address
              <span className="absolute bottom-0 left-0 w-12 h-1 bg-[#90C641]" />
            </h3>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-full">
                  <Phone className="text-[#90C641]" size={20} />
                </div>
                <span>9876543210</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-full">
                  <Mail className="text-[#90C641]" size={20} />
                </div>
                <span>support@homeandown.com</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-white p-2 rounded-full mt-1">
                  <MapPin className="text-[#90C641]" size={20} />
                </div>
                <span>
                  Chandanagar, Hyderabad<br />
                  Telangana-500050
                </span>
              </li>
            </ul>
          </div>

          {/* App links */}
          <div>
            <h3 className="text-[#061D58] font-semibold mb-4 relative pb-1">
              Get the app
              <span className="absolute bottom-0 left-0 w-12 h-1 bg-[#90C641]" />
            </h3>
            <div className="space-y-4">
              <a href="#" className="flex items-center gap-4 bg-[#90C641] text-white rounded-lg px-4 py-3 hover:bg-[#7DAF35] transition">
                <Apple size={24} />
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="font-medium">Apple Store</div>
                </div>
              </a>
              <a href="#" className="flex items-center gap-4 bg-[#90C641] text-white rounded-lg px-4 py-3 hover:bg-[#7DAF35] transition">
                <PlayStore size={24} />
                <div className="text-left">
                  <div className="text-xs">Get it on</div>
                  <div className="font-medium">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom dark section */}
    <div className="bg-[#061D58] py-4">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <p className="text-white text-sm">© Home & Own 2025. All Rights Reserved</p>
        <div className="flex items-center space-x-6 mt-4 md:mt-0 text-[#90C641]">
          <a href="#"><Facebook size={20} /></a>
          <a href="#"><Twitter size={20} /></a>
          <a href="#"><Instagram size={20} /></a>
          <a href="#"><Linkedin size={20} /></a>
        </div>
      </div>
      {/* Scroll to top */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-6 right-6 bg-[#90C641] text-white p-3 rounded-full hover:bg-[#7DAF35] transition">
        <ArrowUp size={20} />
      </button>
    </div>
  </footer>
);

export default Footer;