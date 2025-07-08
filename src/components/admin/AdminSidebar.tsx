import React from 'react';
import { 
  Home,
  Users,
  Calendar,
  Building2,
  ChevronDown,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { MenuItem } from '@/types/admin';

interface AdminSidebarProps {
  sidebarCollapsed: boolean;
  activeTab: string;
  expandedMenus: string[];
  onTabChange: (tab: string) => void;
  onMenuToggle: (menuId: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  sidebarCollapsed,
  activeTab,
  expandedMenus,
  onTabChange,
  onMenuToggle
}) => {
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      path: 'dashboard'
    },
    {
      id: 'manage-users',
      label: 'Manage Users',
      icon: Users,
      children: [
        { id: 'users', label: 'Users', path: 'users', icon: Users },
        { id: 'agents', label: 'Agents', path: 'agents', icon: Users }
      ]
    },
    {
      id: 'request-tour',
      label: 'Request Tour',
      icon: Calendar,
      children: [
        { id: 'bookings', label: 'Bookings', path: 'bookings', icon: Calendar }
      ]
    },
    {
      id: 'listing-management',
      label: 'Listing Management',
      icon: Building2,
      children: [
        { id: 'properties', label: 'Properties', path: 'properties', icon: Building2 },
        { id: 'properties-sale', label: 'Properties for Sale', path: 'properties-sale', icon: Building2 },
        { id: 'properties-rent', label: 'Properties for Rent', path: 'properties-rent', icon: Building2 },
        { id: 'inquiries', label: 'Inquiries', path: 'inquiries', icon: Building2 }
      ]
    }
  ];

  return (
    <div className={`bg-[#3B5998] text-white transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 no-print`}>
      {/* Logo */}
      <div className="p-4 border-b border-blue-700">
        <div className="flex items-center">
          <div className="bg-white p-2 rounded">
            <Home className="h-6 w-6 text-[#3B5998]" />
          </div>
          {!sidebarCollapsed && (
            <span className="ml-3 text-lg font-bold">HOME & OWN</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => (
          <div key={item.id}>
            {item.children ? (
              <div>
                <button
                  onClick={() => onMenuToggle(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-gray-300 hover:bg-blue-700 transition-colors ${
                    expandedMenus.includes(item.id) ? 'bg-blue-700' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon size={20} />
                    {!sidebarCollapsed && (
                      <span className="ml-3 text-sm">{item.label}</span>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    expandedMenus.includes(item.id) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )
                  )}
                </button>
                {expandedMenus.includes(item.id) && !sidebarCollapsed && (
                  <div className="ml-4 border-l border-blue-600">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => onTabChange(child.path!)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          activeTab === child.path
                            ? 'bg-green-500 text-white'
                            : 'text-gray-300 hover:bg-blue-700'
                        }`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onTabChange(item.path!)}
                className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                  activeTab === item.path
                    ? 'bg-green-500 text-white'
                    : 'text-gray-300 hover:bg-blue-700'
                }`}
              >
                <item.icon size={20} />
                {!sidebarCollapsed && (
                  <span className="ml-3">{item.label}</span>
                )}
              </button>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;