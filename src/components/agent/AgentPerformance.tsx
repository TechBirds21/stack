import React from 'react';
import { Star } from 'lucide-react';

interface AgentPerformanceProps {
  stats: any;
}

const AgentPerformance: React.FC<AgentPerformanceProps> = ({ stats }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-[#061D58] mb-4">Performance Metrics</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Conversion Rate</span>
          <span className="font-semibold text-green-600">{stats?.performance?.conversionRate || 0}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Response Time</span>
          <span className="font-semibold text-blue-600">{stats?.performance?.responseTime || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Customer Rating</span>
          <div className="flex items-center">
            {renderStars(stats?.performance?.customerRating || 0)}
            <span className="ml-2 font-semibold">{stats?.performance?.customerRating || 0}</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Active Assignments</span>
          <span className="font-semibold text-orange-600">
            {stats?.performance?.activeAssignments || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AgentPerformance;