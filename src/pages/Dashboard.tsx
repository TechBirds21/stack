import React from 'react';
import { Users, Home, CalendarClock, Building2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, className = "" }) => (
  <div className={`rounded-xl p-4 sm:p-6 text-white flex items-center gap-3 sm:gap-4 ${className}`}>
    <div className="bg-white bg-opacity-20 p-2 sm:p-3 rounded-lg shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="text-2xl sm:text-3xl font-bold">{value}</h3>
      <p className="text-xs sm:text-sm opacity-90">{title}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const transactionData = [
    { name: 'Jan', value: 12000000 },
    { name: 'Feb', value: 8000000 },
    { name: 'Mar', value: 6000000 },
    { name: 'Apr', value: 4000000 },
    { name: 'May', value: 2000000 },
    { name: 'Jun', value: 1000000 },
    { name: 'Jul', value: 500000 },
    { name: 'Aug', value: 200000 },
    { name: 'Sep', value: 100000 },
    { name: 'Oct', value: 50000 },
    { name: 'Nov', value: 25000 },
    { name: 'Dec', value: 10000 }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Home & Own</h1>
          <p className="text-sm sm:text-base text-gray-600">Quick Summary Of the System Reports</p>
        </div>
        <button className="bg-[#64748B] text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-[#475569] transition-colors w-full sm:w-auto">
          Reports
        </button>
      </div>

      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Overall Statistics</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4">Overall information about statistics in system</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Users"
            value="32"
            icon={<Users size={20} className="text-white" />}
            className="bg-[#3B82F6]"
          />
          <StatCard
            title="Total Agents"
            value="12"
            icon={<Users size={20} className="text-white" />}
            className="bg-[#4F46E5]"
          />
          <StatCard
            title="Total Properties"
            value="21"
            icon={<Home size={20} className="text-white" />}
            className="bg-[#10B981]"
          />
          <StatCard
            title="Total Request Tours"
            value="68"
            icon={<CalendarClock size={20} className="text-white" />}
            className="bg-[#F59E0B]"
          />
          <StatCard
            title="Purchased Property"
            value="17"
            icon={<Building2 size={20} className="text-white" />}
            className="bg-[#22C55E]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Total income & Payout Statistics</h3>
          <div className="space-y-4">
            <div>
              <p className="text-[#3B82F6] font-medium text-sm sm:text-base">Total Transactions</p>
              <p className="text-xl sm:text-2xl font-bold">₹ 13864638.17</p>
            </div>
            <div>
              <p className="text-[#22C55E] font-medium text-sm sm:text-base">Total Transactions</p>
              <p className="text-xl sm:text-2xl font-bold">₹ 13864638.17</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-semibold">Transaction Breakdown</h3>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span>2025</span>
              <div className="flex gap-1">
                <button className="px-2 py-1 rounded bg-gray-100">{'<'}</button>
                <button className="px-2 py-1 rounded bg-gray-100">{'>'}</button>
              </div>
            </div>
          </div>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Country Based Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>India</span>
              <span>59</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>United States</span>
              <span>10</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Recent Users</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium">John Doe</p>
                <p className="text-sm text-gray-500">john@example.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Jane Smith</p>
                <p className="text-sm text-gray-500">jane@example.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Building2 size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Property Purchase</p>
                  <p className="text-sm text-gray-500">Transaction ID: #12345</p>
                </div>
              </div>
              <p className="font-semibold text-green-600">+ ₹250,000</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Building2 size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Property Purchase</p>
                  <p className="text-sm text-gray-500">Transaction ID: #12344</p>
                </div>
              </div>
              <p className="font-semibold text-green-600">+ ₹180,000</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;