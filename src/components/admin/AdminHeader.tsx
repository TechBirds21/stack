import React from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import NotificationPanel from './NotificationPanel';

interface AdminHeaderProps {
  user: any;
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  onSignOut: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
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
          <span className="text-sm">{user?.first_name} {user?.last_name}</span>
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

export default AdminHeader;