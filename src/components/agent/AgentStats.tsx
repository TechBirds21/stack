import React from 'react';
import { Building2, MessageCircle, Calendar, DollarSign, Target } from 'lucide-react';
import { formatIndianCurrency } from '@/utils/currency';

interface AgentStatsProps {
  stats: any;
}

const AgentStats: React.FC<AgentStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 bg-green-100 rounded-lg">
            <Building2 className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Properties</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalProperties || 0}</p>
            <p className="text-xs text-green-600">Active listings</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-lg">
            <MessageCircle className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalInquiries || 0}</p>
            <p className="text-xs text-blue-600">Customer interest</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Calendar className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Tour Requests</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalBookings || 0}</p>
            <p className="text-xs text-purple-600">Scheduled visits</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 bg-orange-100 rounded-lg">
            <Target className="h-6 w-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Assignments</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalAssignments || 0}</p>
            <p className="text-xs text-orange-600">Total assigned</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <DollarSign className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Earnings</p>
            <p className="text-2xl font-bold text-gray-900">{formatIndianCurrency(stats?.totalEarnings || 0)}</p>
            <p className="text-xs text-yellow-600">Commission earned</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentStats;