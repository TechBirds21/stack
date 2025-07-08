import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home,
  BarChart3,
  Building2,
  MessageCircle,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
  Target,
  TrendingUp
} from 'lucide-react';

interface AgentSidebarProps {
  sidebarCollapsed: boolean;
  activeTab: string;
  expandedMenus: string[];
  onTabChange: (tab: string) => void;
  onMenuToggle: (menuId: string) => void;
}

const AgentSidebar: React.FC<AgentSidebarProps> = ({
  sidebarCollapsed,
  activeTab,
  expandedMenus,
  onTabChange,
  onMenuToggle
}) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      action: () => onTabChange('dashboard')
    },
    {
      id: 'properties',
      label: 'My Properties',
      icon: Building2,
      children: [
        { id: 'my-properties', label: 'View Properties', action: () => navigate('/my-properties') },
        { id: 'add-property', label: 'Add Property', action: () => navigate('/add-property') }
      ]
    },
    {
      id: 'assignments',
      label: 'Assignments',
      icon: Target,
      action: () => navigate('/agent/assignments')
    },
    {
      id: 'inquiries',
      label: 'Inquiries',
      icon: MessageCircle,
      action: () => navigate('/property-inquiries')
    },
    {
      id: 'bookings',
      label: 'Tour Bookings',
      icon: Calendar,
      action: () => navigate('/property-bookings')
    },
    {
      id: 'clients',
      label: 'My Clients',
      icon: Users,
      action: () => navigate('/clients')
    },
    {
      id: 'earnings',
      label: 'Earnings',
      icon: DollarSign,
      action: () => onTabChange('earnings')
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: TrendingUp,
      action: () => onTabChange('performance')
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      action: () => navigate('/agent-reports')
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
                        onClick={child.action}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-blue-700 transition-colors"
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={item.action}
                className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                  activeTab === item.id
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

export default AgentSidebar;