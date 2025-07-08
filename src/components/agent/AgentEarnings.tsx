import React from 'react';
import { formatIndianCurrency } from '@/utils/currency';

interface AgentEarningsProps {
  stats: any;
}

const AgentEarnings: React.FC<AgentEarningsProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-[#061D58] mb-4">Earnings Overview</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Monthly Commission</span>
          <span className="font-semibold text-[#90C641]">{formatIndianCurrency(stats?.monthlyCommission || 0)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Commission Rate (Sales)</span>
          <span className="font-semibold">2%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Commission Rate (Rentals)</span>
          <span className="font-semibold">1 Month Rent</span>
        </div>
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Portfolio Value</span>
            <span className="font-semibold text-[#90C641]">
              {formatIndianCurrency((stats?.portfolioValue?.totalSaleValue || 0) + (stats?.portfolioValue?.totalRentValue || 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentEarnings;