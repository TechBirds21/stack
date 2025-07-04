import React, { useState, useEffect } from 'react';
import { Home, TrendingUp, Users, Eye, MousePointer, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Notification } from '../../types';
import { apiService } from '../../services/api';

const NotificationAnalytics = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  const [analytics, setAnalytics] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    avgDeliveryRate: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const response = await apiService.getNotifications({ limit: 100 });
    
    if (response.success && response.data) {
      const sentNotifications = response.data.notifications.filter(n => n.status === 'sent' && n.analytics);
      setNotifications(sentNotifications);
      
      // Calculate analytics
      const totalSent = sentNotifications.length;
      const totalDelivered = sentNotifications.reduce((sum, n) => sum + (n.analytics?.delivered || 0), 0);
      const totalOpened = sentNotifications.reduce((sum, n) => sum + (n.analytics?.opened || 0), 0);
      const totalClicked = sentNotifications.reduce((sum, n) => sum + (n.analytics?.clicked || 0), 0);
      const totalRecipients = sentNotifications.reduce((sum, n) => sum + (n.analytics?.totalRecipients || 0), 0);

      setAnalytics({
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        avgDeliveryRate: totalRecipients > 0 ? (totalDelivered / totalRecipients) * 100 : 0,
        avgOpenRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
        avgClickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
      });
    }
    setLoading(false);
  };

  // Sample data for charts
  const engagementTrend = [
    { date: '2025-01-01', sent: 120, opened: 85, clicked: 23 },
    { date: '2025-01-02', sent: 98, opened: 72, clicked: 19 },
    { date: '2025-01-03', sent: 156, opened: 112, clicked: 34 },
    { date: '2025-01-04', sent: 134, opened: 95, clicked: 28 },
    { date: '2025-01-05', sent: 178, opened: 134, clicked: 42 },
    { date: '2025-01-06', sent: 145, opened: 108, clicked: 31 },
    { date: '2025-01-07', sent: 167, opened: 125, clicked: 38 },
  ];

  const audienceBreakdown = [
    { name: 'Buyers', value: 45, color: '#22C55E' },
    { name: 'Sellers', value: 30, color: '#3B82F6' },
    { name: 'Agents', value: 20, color: '#8B5CF6' },
    { name: 'All Users', value: 5, color: '#F59E0B' },
  ];

  const templatePerformance = [
    { name: 'Welcome Message', sent: 245, opened: 198, clickRate: 15.2 },
    { name: 'Property Alert', sent: 189, opened: 156, clickRate: 28.4 },
    { name: 'Market Update', sent: 167, opened: 134, clickRate: 12.8 },
    { name: 'Promotional', sent: 134, opened: 89, clickRate: 22.1 },
    { name: 'Appointment', sent: 98, opened: 87, clickRate: 35.6 },
  ];

  const topPerformingNotifications = notifications
    .filter(n => n.analytics)
    .sort((a, b) => {
      const aRate = a.analytics ? (a.analytics.opened / a.analytics.totalRecipients) * 100 : 0;
      const bRate = b.analytics ? (b.analytics.opened / b.analytics.totalRecipients) * 100 : 0;
      return bRate - aRate;
    })
    .slice(0, 5);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#1E3A8A]">
          <h1 className="text-2xl font-bold">Notification Analytics</h1>
          <span className="text-gray-500">/</span>
          <div className="flex items-center gap-2">
            <Home size={18} />
            <span>Analytics</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Sent</p>
              <p className="text-3xl font-bold">{analytics.totalSent}</p>
              <p className="text-blue-200 text-sm">Notifications</p>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Delivery Rate</p>
              <p className="text-3xl font-bold">{analytics.avgDeliveryRate.toFixed(1)}%</p>
              <p className="text-green-200 text-sm">{analytics.totalDelivered} delivered</p>
            </div>
            <Users className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Open Rate</p>
              <p className="text-3xl font-bold">{analytics.avgOpenRate.toFixed(1)}%</p>
              <p className="text-purple-200 text-sm">{analytics.totalOpened} opened</p>
            </div>
            <Eye className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Click Rate</p>
              <p className="text-3xl font-bold">{analytics.avgClickRate.toFixed(1)}%</p>
              <p className="text-orange-200 text-sm">{analytics.totalClicked} clicked</p>
            </div>
            <MousePointer className="h-12 w-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Trend */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Engagement Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sent" stroke="#3B82F6" strokeWidth={2} name="Sent" />
                <Line type="monotone" dataKey="opened" stroke="#22C55E" strokeWidth={2} name="Opened" />
                <Line type="monotone" dataKey="clicked" stroke="#8B5CF6" strokeWidth={2} name="Clicked" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audience Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Audience Breakdown</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={audienceBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {audienceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Performance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Template Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={templatePerformance} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="clickRate" fill="#22C55E" name="Click Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Notifications */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Top Performing Notifications</h3>
          <div className="space-y-4">
            {topPerformingNotifications.map((notification, index) => {
              const openRate = notification.analytics 
                ? (notification.analytics.opened / notification.analytics.totalRecipients) * 100 
                : 0;
              
              return (
                <div key={notification.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 truncate">{notification.title}</h4>
                    <p className="text-sm text-gray-600">
                      {notification.analytics?.totalRecipients} recipients
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      {openRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">open rate</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-[#1E3A8A] p-6">
          <h3 className="text-xl font-semibold text-white">Detailed Performance</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#EEF2FF]">
                <tr>
                  <th className="px-4 py-3 text-left">Notification</th>
                  <th className="px-4 py-3 text-left">Sent Date</th>
                  <th className="px-4 py-3 text-left">Recipients</th>
                  <th className="px-4 py-3 text-left">Delivered</th>
                  <th className="px-4 py-3 text-left">Opened</th>
                  <th className="px-4 py-3 text-left">Clicked</th>
                  <th className="px-4 py-3 text-left">Open Rate</th>
                  <th className="px-4 py-3 text-left">Click Rate</th>
                </tr>
              </thead>
              <tbody>
                {notifications.slice(0, 10).map((notification) => {
                  const analytics = notification.analytics;
                  const openRate = analytics && analytics.totalRecipients > 0 
                    ? (analytics.opened / analytics.totalRecipients) * 100 
                    : 0;
                  const clickRate = analytics && analytics.opened > 0 
                    ? (analytics.clicked / analytics.opened) * 100 
                    : 0;

                  return (
                    <tr key={notification.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 truncate max-w-xs">
                          {notification.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {notification.sentAt ? new Date(notification.sentAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3">{analytics?.totalRecipients || 0}</td>
                      <td className="px-4 py-3">{analytics?.delivered || 0}</td>
                      <td className="px-4 py-3">{analytics?.opened || 0}</td>
                      <td className="px-4 py-3">{analytics?.clicked || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${openRate > 20 ? 'text-green-600' : openRate > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {openRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${clickRate > 5 ? 'text-green-600' : clickRate > 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {clickRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationAnalytics;