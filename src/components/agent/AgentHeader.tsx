import React from 'react';
import { Menu, User, LogOut, Bell } from 'lucide-react';
import NotificationPanel from '@/components/admin/NotificationPanel';

interface AgentHeaderProps {
  user: any;
  agentProfile: any;
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  onSignOut: () => void;
}

const AgentHeader: React.FC<AgentHeaderProps> = ({
  user,
  agentProfile,
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
        {!sidebarCollapsed && (
          <div className="ml-4">
            <h2 className="text-lg font-semibold">Agent Dashboard</h2>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <NotificationPanel />
        
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-[#3B5998]" />
          </div>
          <div>
            <div className="font-medium text-sm">{user?.first_name} {user?.last_name}</div>
            <div className="text-xs text-blue-200 flex items-center">
              <span className="mr-2">License: {agentProfile?.agent_license_number || 'Pending'}</span>
              {agentProfile?.experience_years && (
                <span className="bg-blue-700 px-2 py-0.5 rounded-full text-xs">
                  {agentProfile.experience_years}+ yrs exp
                </span>
              )}
            </div>
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