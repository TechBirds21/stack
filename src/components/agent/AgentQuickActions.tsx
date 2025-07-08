import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, MessageCircle, Calendar } from 'lucide-react';

const AgentQuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-[#061D58] mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/add-property')}
          className="bg-[#90C641] text-white p-4 rounded-lg hover:bg-[#7DAF35] transition-colors flex items-center justify-center"
        >
          <Building2 className="mr-2" size={20} />
          Add Property
        </button>
        
        <button
          onClick={() => navigate('/my-properties')}
          className="bg-[#3B5998] text-white p-4 rounded-lg hover:bg-[#2d4373] transition-colors flex items-center justify-center"
        >
          <Eye className="mr-2" size={20} />
          View Properties
        </button>
        
        <button
          onClick={() => navigate('/agent/assignments')}
          className="bg-[#FF6B6B] text-white p-4 rounded-lg hover:bg-[#ff5252] transition-colors flex items-center justify-center"
        >
          <MessageCircle className="mr-2" size={20} />
          Assignments
        </button>
        
        <button
          onClick={() => navigate('/property-bookings')}
          className="bg-[#10B981] text-white p-4 rounded-lg hover:bg-[#059669] transition-colors flex items-center justify-center"
        >
          <Calendar className="mr-2" size={20} />
          Bookings
        </button>
      </div>
    </div>
  );
};

export default AgentQuickActions;