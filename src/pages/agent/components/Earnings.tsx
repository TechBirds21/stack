import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import { formatIndianCurrency } from '@/utils/currency';

interface EarningsProps {
  dashboardStats: any;
}

const Earnings: React.FC<EarningsProps> = ({ dashboardStats }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#061D58]">Earnings Overview</h3>
        <DollarSign className="h-5 w-5 text-green-500" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Commission</p>
              <p className="text-3xl font-bold text-green-600">{formatIndianCurrency(dashboardStats?.monthlyCommission || 0)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-3xl font-bold text-blue-600">{formatIndianCurrency(dashboardStats?.totalEarnings || 0)}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-blue-500" />
          </div>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Sales Commission</p>
          <p className="text-2xl font-semibold text-blue-600">2%</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-gray-600">Rental Commission</p>
          <p className="text-2xl font-semibold text-purple-600">1 Month</p>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-4">Commission Structure</h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
            <span className="font-medium">Property Sale</span>
            <span className="text-green-600 font-semibold">2% of Sale Value</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
            <span className="font-medium">Property Rental</span>
            <span className="text-green-600 font-semibold">1 Month Rent</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
            <span className="font-medium">Inquiry Conversion</span>
            <span className="text-green-600 font-semibold">₹500 per Conversion</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
            <span className="font-medium">Performance Bonus</span>
            <span className="text-green-600 font-semibold">Up to ₹10,000/month</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earnings;