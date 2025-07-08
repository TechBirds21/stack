import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Calendar, Target, Users, FileText, Phone, Mail, BarChart3 } from 'lucide-react';

const AgentQuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'View Assignments',
      description: 'Check new assignments',
      icon: Target,
      color: 'bg-[#FF6B6B] hover:bg-[#ff5252]',
      action: () => navigate('/agent/assignments')
    },
    {
      title: 'Customer Inquiries',
      description: 'Manage inquiries',
      icon: MessageCircle,
      color: 'bg-[#8B5CF6] hover:bg-[#7C3AED]',
      action: () => navigate('/property-inquiries')
    },
    {
      title: 'Tour Bookings',
      description: 'Schedule appointments',
      icon: Calendar,
      color: 'bg-[#10B981] hover:bg-[#059669]',
      action: () => navigate('/property-bookings')
    },
    {
      title: 'My Clients',
      description: 'Client management',
      icon: Users,
      color: 'bg-[#F59E0B] hover:bg-[#D97706]',
      action: () => navigate('/clients')
    },
    {
      title: 'Contact Support',
      description: 'Get help & support',
      icon: Phone,
      color: 'bg-[#3B5998] hover:bg-[#2d4373]',
      action: () => window.open('tel:1800-123-4567')
    },
    {
      title: 'Agent Reports',
      description: 'View performance',
      icon: BarChart3,
      color: 'bg-[#6366F1] hover:bg-[#4F46E5]',
      action: () => navigate('/agent-reports')
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Agent Performance</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">4.8★</div>
              <div className="text-xs text-gray-600">Customer Rating</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">68%</div>
              <div className="text-xs text-gray-600">Success Rate</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">{'< 2h'}</div>
              <div className="text-xs text-gray-600">Response Time</div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-600 mb-2">Need Help?</div>
          <div className="flex justify-center space-x-4">
            <a href="tel:1800-123-4567" className="text-[#90C641] hover:underline text-sm flex items-center">
              <Phone size={14} className="mr-1" />
              Call Support
            </a>
            <a href="mailto:agents@homeandown.com" className="text-[#90C641] hover:underline text-sm flex items-center">
              <Mail size={14} className="mr-1" />
              Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentQuickActions;