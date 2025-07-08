import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, MessageCircle, Calendar, Plus, Target, Users, FileText } from 'lucide-react';

const AgentQuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Add Property',
      description: 'List a new property',
      icon: Plus,
      color: 'bg-[#90C641] hover:bg-[#7DAF35]',
      action: () => navigate('/add-property')
    },
    {
      title: 'View Properties',
      description: 'Manage listings',
      icon: Eye,
      color: 'bg-[#3B5998] hover:bg-[#2d4373]',
      action: () => navigate('/my-properties')
    },
    {
      title: 'Assignments',
      description: 'Check new assignments',
      icon: Target,
      color: 'bg-[#FF6B6B] hover:bg-[#ff5252]',
      action: () => navigate('/agent/assignments')
    },
    {
      title: 'Tour Bookings',
      description: 'Manage appointments',
      icon: Calendar,
      color: 'bg-[#10B981] hover:bg-[#059669]',
      action: () => navigate('/property-bookings')
    },
    {
      title: 'Inquiries',
      description: 'Customer inquiries',
      icon: MessageCircle,
      color: 'bg-[#8B5CF6] hover:bg-[#7C3AED]',
      action: () => navigate('/property-inquiries')
    },
    {
      title: 'My Clients',
      description: 'Client management',
      icon: Users,
      color: 'bg-[#F59E0B] hover:bg-[#D97706]',
      action: () => navigate('/clients')
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-[#061D58] mb-4 flex items-center">
        <FileText className="mr-2 h-5 w-5" />
        Quick Actions
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`${action.color} text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-between hover:shadow-lg transform hover:scale-105`}
          >
            <div className="text-left">
              <div className="font-semibold text-sm">{action.title}</div>
              <div className="text-xs opacity-90">{action.description}</div>
            </div>
            <action.icon size={20} />
          </button>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">4.8★</div>
            <div className="text-xs text-gray-600">Rating</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">68%</div>
            <div className="text-xs text-gray-600">Success Rate</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">< 2h</div>
            <div className="text-xs text-gray-600">Response</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentQuickActions;