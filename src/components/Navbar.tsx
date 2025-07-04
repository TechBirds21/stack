/* -------------------------------------------------------------------------- */
/*  components/Navbar.tsx  ―  pill-style header (1400 × 90)                   */
/* -------------------------------------------------------------------------- */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NAV = [
  { label: 'Buy',   to: '/buy'    },
  { label: 'Rent',  to: '/rent'   },
  { label: 'Sell',  to: '/sell'   },
  { label: 'Agent', to: '/agents' },
];

const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Full-width transparent strip -- height ≈ 142 px */}
      <header className="fixed inset-x-0 top-0 z-50 h-[142px] pointer-events-none">
        {/* The 1400×90 pill positioned 26 px / 260 px as per spec */}
        <div
          className="
            pointer-events-auto
            absolute top-[26px] left-[260px]
            w-[1400px] h-[90px] bg-white rounded-[50px] shadow-md
            flex items-center px-8
            max-w-[90%] md:left-1/2 md:-translate-x-1/2
          "
        >
          {/* LOGO */}
          <Link to="/" className="flex-shrink-0">
            <img
              src="https://qnaixvfssjdwdwhmvnyt.supabase.co/storage/v1/object/sign/Foodlu-Pickles/Home&Own-Logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJGb29kbHUtUGlja2xlcy9Ib21lJk93bi1Mb2dvLnBuZyIsImlhdCI6MTc0NTEzNDI2MiwiZXhwIjoxNzc2NjcwMjYyfQ.5kNyGYdfvAjCj8yNDgBq0hWcPC3GZAOQkixhs5jp-hA"
              alt="Home & Own"
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex ml-auto space-x-12">
            {NAV.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className="text-sm font-semibold text-gray-800 hover:text-[#90C641] transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Burger (mobile) */}
          <button
            onClick={() => setOpen((s) => !s)}
            className="md:hidden ml-auto text-gray-700 hover:text-[#90C641] transition-colors"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-x-0 top-[142px] bg-white border-t shadow-sm z-40">
          {NAV.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="block px-6 py-4 font-semibold text-gray-700 hover:text-[#90C641] transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

export default Navbar;
