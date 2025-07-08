import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { formatIndianCurrency } from '@/utils/currency';

interface AgentEarningsProps {
  stats: any;
}

const AgentEarnings: React.FC<AgentEarningsProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#061D58]">Earnings Overview</h3>
        <TrendingUp className="h-5 w-5 text-green-500" />
      </div>
      
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Commission</p>
              <p className="text-2xl font-bold text-green-600">{formatIndianCurrency(stats?.monthlyCommission || 0)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600">Sales Commission</p>
            <p className="text-lg font-semibold text-blue-600">2%</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-600">Rental Commission</p>
            <p className="text-lg font-semibold text-purple-600">1 Month</p>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Portfolio Value</span>
            <span className="font-semibold text-[#90C641]">
              {formatIndianCurrency((stats?.portfolioValue?.totalSaleValue || 0) + (stats?.portfolioValue?.totalRentValue || 0))}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Total Properties Value</span>
            <span className="text-xs text-gray-500">
              Sales: {formatIndianCurrency(stats?.portfolioValue?.totalSaleValue || 0)} | 
              Rent: {formatIndianCurrency(stats?.portfolioValue?.totalRentValue || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentEarnings;