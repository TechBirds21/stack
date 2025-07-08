import React from 'react';
import { Star, Clock, TrendingUp, Award } from 'lucide-react';

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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#061D58]">Performance Metrics</h3>
        <Award className="h-5 w-5 text-yellow-500" />
      </div>
      
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-blue-600">{stats?.performance?.conversionRate || 0}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">Response Time</span>
            </div>
            <span className="font-semibold text-green-600">{stats?.performance?.responseTime || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 mr-2" />
              <span className="text-sm text-gray-600">Customer Rating</span>
            </div>
            <div className="flex items-center">
              {renderStars(stats?.performance?.customerRating || 0)}
              <span className="ml-2 font-semibold">{stats?.performance?.customerRating || 0}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
            <span className="text-sm text-gray-600">Active Assignments</span>
            <span className="font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full text-xs">
              {stats?.performance?.activeAssignments || 0} Pending
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPerformance;