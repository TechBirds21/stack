import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Users,
  Home,
  CalendarClock,
  ListTodo,
  HelpCircle,
  FileText,
  Key,
  Globe,
  Wallet,
  Building2,
  Map,
  Languages,
  FileJson,
  UserCog,
  Shield,
  Image,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path)
        ? prev.filter(item => item !== path)
        : [...prev, path]
    );
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard', highlight: true },
    {
      icon: <Settings size={20} />,
      label: 'Manage Admin',
      path: 'manage-admin',
      subItems: [
        { icon: <UserCog size={20} />, label: 'Admin Users', path: '/dashboard/manage-admin/users' },
        { icon: <Shield size={20} />, label: 'Roles & Privileges', path: '/dashboard/manage-admin/roles' },
        { icon: <Image size={20} />, label: 'Admin Sliders', path: '/dashboard/manage-admin/sliders' },
      ]
    },
    {
      icon: <Users size={20} />,
      label: 'Manage Users',
      path: 'manage-users',
      subItems: [
        { icon: <UserCog size={20} />, label: 'Users', path: '/dashboard/manage-users/users' },
        { icon: <Shield size={20} />, label: 'Agents', path: '/dashboard/manage-users/agents' },
        { icon: <Image size={20} />, label: 'Email to Users', path: '/dashboard/manage-users/email' },
      ]
    },
    {
      icon: <Home size={20} />,
      label: 'Home Page',
      path: 'home-page',
      subItems: [
        { icon: <Image size={20} />, label: 'Sliders', path: '/dashboard/home/sliders' },
        { icon: <Building2 size={20} />, label: 'Featured Cities', path: '/dashboard/home/featured-cities' },
        { icon: <Image size={20} />, label: 'Community Banners', path: '/dashboard/home/banners' },
        { icon: <Image size={20} />, label: 'Pre Footers', path: '/dashboard/home/pre-footers' },
      ]
    },
    {
      icon: <CalendarClock size={20} />,
      label: 'Request Tour',
      path: 'request-tour',
      subItems: [
        { icon: <CalendarClock size={20} />, label: 'Request Tour', path: '/dashboard/tours/requests' },
        { icon: <CalendarClock size={20} />, label: 'Bookings', path: '/dashboard/tours/bookings' },
      ]
    },
    {
      icon: <ListTodo size={20} />,
      label: 'Listing Management',
      path: 'listing-management',
      subItems: [
        { icon: <Home size={20} />, label: 'Properties', path: '/dashboard/listings/properties' },
        { icon: <FileText size={20} />, label: 'Property Onboard Requests', path: '/dashboard/listings/onboard-requests' },
        { icon: <ListTodo size={20} />, label: 'Property Categories', path: '/dashboard/listings/categories' },
        { icon: <ListTodo size={20} />, label: 'Property Types', path: '/dashboard/listings/types' },
        { icon: <ListTodo size={20} />, label: 'Property Feature Types', path: '/dashboard/listings/features' },
        { icon: <ListTodo size={20} />, label: 'Amenity Types', path: '/dashboard/listings/amenity-types' },
        { icon: <ListTodo size={20} />, label: 'Amenities', path: '/dashboard/listings/amenities' },
        { icon: <Wallet size={20} />, label: 'Property Payments', path: '/dashboard/listings/payments' },
      ]
    },
    {
      icon: <HelpCircle size={20} />,
      label: 'Help Management',
      path: 'help-management',
      subItems: [
        { icon: <ListTodo size={20} />, label: 'Help Categories', path: '/dashboard/help/categories' },
        { icon: <HelpCircle size={20} />, label: 'Helps', path: '/dashboard/help/articles' },
      ]
    },
    {
      icon: <FileText size={20} />,
      label: 'Blog Management',
      path: 'blog-management',
      subItems: [
        { icon: <ListTodo size={20} />, label: 'Blog Categories', path: '/dashboard/blog/categories' },
        { icon: <FileText size={20} />, label: 'Blogs', path: '/dashboard/blog/posts' },
      ]
    },
    {
      icon: <Key size={20} />,
      label: 'Credentials',
      path: 'credentials',
      subItems: [
        { icon: <Key size={20} />, label: 'API Credentials', path: '/dashboard/credentials/api' },
        { icon: <Wallet size={20} />, label: 'Payment Gateways', path: '/dashboard/credentials/payment' },
        { icon: <Settings size={20} />, label: 'Email Configurations', path: '/dashboard/credentials/email' },
      ]
    },
    {
      icon: <Settings size={20} />,
      label: 'Site Management',
      path: 'site-settings',
      subItems: [
        { icon: <Settings size={20} />, label: 'Global Settings', path: '/dashboard/settings/global' },
        { icon: <Globe size={20} />, label: 'Social Media Links', path: '/dashboard/settings/social' },
        { icon: <FileText size={20} />, label: 'Meta Informations', path: '/dashboard/settings/meta' },
        { icon: <Wallet size={20} />, label: 'Fees', path: '/dashboard/settings/fees' },
      ]
    },
    { icon: <FileText size={20} />, label: 'Reports', path: '/dashboard/reports' },
    { icon: <Wallet size={20} />, label: 'Transactions', path: '/dashboard/transactions' },
    { icon: <Globe size={20} />, label: 'Countries', path: '/dashboard/countries' },
    { icon: <Map size={20} />, label: 'States', path: '/dashboard/states' },
    { icon: <Building2 size={20} />, label: 'Cities', path: '/dashboard/cities' },
    { icon: <Map size={20} />, label: 'Zones', path: '/dashboard/zones' },
    { icon: <Wallet size={20} />, label: 'Currencies', path: '/dashboard/currencies' },
    { icon: <Languages size={20} />, label: 'Languages', path: '/dashboard/languages' },
    { icon: <FileJson size={20} />, label: 'Static Pages', path: '/dashboard/static-pages' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#1E40AF] text-white">
      <div className="p-4">
        <img
          src="https://qnaixvfssjdwdwhmvnyt.supabase.co/storage/v1/object/sign/Foodlu-Pickles/HomeandOwn-Logo-white.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJGb29kbHUtUGlja2xlcy9Ib21lYW5kT3duLUxvZ28td2hpdGUucG5nIiwiaWF0IjoxNzQ1MTM1MjIzLCJleHAiOjE3OTY5NzUyMjN9.UHJ1y1O95ZdO26aduzYKkFSlWOw0_PtMpNajPL8Lj1M"
          alt="Home & Own Logo"
          className="h-12 w-auto mb-6"
        />
      </div>
      <nav className="flex-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          <div key={index}>
            {item.subItems ? (
              <div>
                <button
                  onClick={() => toggleExpand(item.path)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-gray-300 hover:bg-[#1E3A8A] transition-colors ${
                    expandedItems.includes(item.path) ? 'bg-[#1E3A8A]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {expandedItems.includes(item.path) ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                <div className={`ml-4 border-l border-[#2563EB] overflow-hidden transition-all duration-200 ${
                  expandedItems.includes(item.path) ? 'max-h-[500px]' : 'max-h-0'
                }`}>
                  {item.subItems.map((subItem, subIndex) => (
                    <NavLink
                      key={subIndex}
                      to={subItem.path}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-4 py-2 text-sm transition-colors
                        ${isActive ? 'bg-[#22C55E] text-white' : 'text-gray-300 hover:bg-[#1E3A8A]'}
                      `}
                    >
                      {subItem.icon}
                      <span>{subItem.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : (
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                  ${isActive || item.highlight ? 'bg-[#22C55E] text-white' : 'text-gray-300 hover:bg-[#1E3A8A]'}
                `}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;