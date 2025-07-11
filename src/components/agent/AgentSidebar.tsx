import React from 'react';
import { 
  Home,
  BarChart3,
  Calendar, 
  DollarSign,
  Users,
  FileText,
  Target,
  TrendingUp,
  Settings as SettingsIcon
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
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Agent Dashboard',
      icon: BarChart3,
      tab: 'dashboard'
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: TrendingUp,
      tab: 'performance'
    },
    {
      id: 'earnings',
      label: 'My Earnings',
      icon: DollarSign,
      tab: 'earnings'
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: Calendar,
      tab: 'activity'
    },
    {
      id: 'analytics',
      label: 'My Analytics',
      icon: Users,
      tab: 'analytics'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      tab: 'settings'
    },
    {
      id: 'help',
      label: 'Support',
      icon: FileText,
      tab: 'help'
    }
  ];

  return (
    <div className={`bg-[#3B5998] text-white transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 no-print`}>
      {/* Agent Logo */}
      <div className="p-4 border-b border-blue-700">
        <div className="flex items-center">
          <div className="bg-white p-2 rounded">
            <Home className="h-6 w-6 text-[#3B5998]" />
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3">
              <span className="text-lg font-bold">HOME & OWN</span>
              <div className="text-xs text-blue-200">Agent Portal</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.tab)}
            className={`w-full flex items-center px-4 py-3 text-sm transition-colors ${
              activeTab === item.tab
                ? 'bg-green-500 text-white border-r-4 border-green-300'
                : 'text-gray-300 hover:bg-blue-700 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            {!sidebarCollapsed && (
              <span className="ml-3">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Agent Info */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-blue-700 bg-blue-800">
          <div className="text-center">
            <div className="text-xs text-blue-200 mb-1">Agent Portal</div>
            <div className="text-sm font-medium">Real Estate Agent</div>
            <div className="text-xs text-blue-300 mt-1">Commission Based</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSidebar;