import React from 'react';
import { Menu, User, LogOut, Bell } from 'lucide-react';
import NotificationPanel from '@/components/admin/NotificationPanel';

interface AgentHeaderProps {
  user: any;
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  onSignOut: () => void;
}

const AgentHeader: React.FC<AgentHeaderProps> = ({
  user,
  sidebarCollapsed,
  onSidebarToggle,
  onSignOut
}) => {
  return (
    <header className="bg-[#3B5998] text-white p-4 flex items-center justify-between no-print">
      <div className="flex items-center">
        <button
          onClick={onSidebarToggle}
          className="p-2 hover:bg-blue-700 rounded"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <NotificationPanel />
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-[#3B5998]" />
          </div>
          <div className="text-sm">
            <div className="font-medium">{user?.first_name} {user?.last_name}</div>
            <div className="text-xs text-blue-200">Real Estate Agent</div>
          </div>
          <button
            onClick={onSignOut}
            className="p-2 hover:bg-blue-700 rounded"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AgentHeader;