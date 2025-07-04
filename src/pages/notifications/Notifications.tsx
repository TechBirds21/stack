import React, { useState, useEffect } from 'react';
import { Home, Plus, Eye, Edit, Trash2, Send, Calendar, Users, TrendingUp, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Notification } from '../../types';
import { apiService } from '../../services/api';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [entriesPerPage, setEntriesPerPage] = useState('10');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    scheduled: 0,
    avgEngagement: 0,
  });

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, entriesPerPage, statusFilter]);

  const fetchNotifications = async () => {
    setLoading(true);
    const params = {
      page: currentPage,
      limit: parseInt(entriesPerPage),
      ...(statusFilter !== 'all' && { status: statusFilter }),
    };

    const response = await apiService.getNotifications(params);
    
    if (response.success && response.data) {
      setNotifications(response.data.notifications);
      
      // Calculate stats
      const total = response.data.total;
      const sent = response.data.notifications.filter(n => n.status === 'sent').length;
      const scheduled = response.data.notifications.filter(n => n.status === 'scheduled').length;
      const avgEngagement = response.data.notifications
        .filter(n => n.analytics)
        .reduce((acc, n) => {
          if (n.analytics && n.analytics.totalRecipients > 0) {
            return acc + (n.analytics.opened / n.analytics.totalRecipients) * 100;
          }
          return acc;
        }, 0) / response.data.notifications.filter(n => n.analytics).length || 0;

      setStats({ total, sent, scheduled, avgEngagement });
    }
    setLoading(false);
  };

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendNotification = async (id: string) => {
    const response = await apiService.sendNotification(id);
    if (response.success) {
      fetchNotifications();
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      const response = await apiService.deleteNotification(id);
      if (response.success) {
        fetchNotifications();
      }
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredNotifications);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Notifications');
    XLSX.writeFile(wb, 'notifications.xlsx');
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(filteredNotifications);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'notifications.csv';
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-600 bg-green-100';
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send size={16} />;
      case 'scheduled':
        return <Calendar size={16} />;
      case 'draft':
        return <Edit size={16} />;
      case 'failed':
        return <Trash2 size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

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
      <div className="flex items-center gap-2 text-[#1E3A8A]">
        <h1 className="text-2xl font-bold">Notifications Management</h1>
        <span className="text-gray-500">/</span>
        <div className="flex items-center gap-2">
          <Home size={18} />
          <span>Notifications</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Notifications</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <Bell className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Sent</p>
              <p className="text-3xl font-bold">{stats.sent}</p>
            </div>
            <Send className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Scheduled</p>
              <p className="text-3xl font-bold">{stats.scheduled}</p>
            </div>
            <Calendar className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Avg. Engagement</p>
              <p className="text-3xl font-bold">{stats.avgEngagement.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-12 w-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
        <div className="bg-[#1E3A8A] p-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">All Notifications</h2>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard/notifications/analytics')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <TrendingUp size={18} />
              Analytics
            </button>
            <button
              onClick={() => navigate('/dashboard/notifications/add')}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Create Notification
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Controls */}
          <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => setEntriesPerPage(e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span>entries</span>
              </div>

              <div className="flex items-center gap-2">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded px-3 py-1"
                >
                  <option value="all">All</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#1E40AF] transition-colors"
              >
                Excel
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#1E40AF] transition-colors"
              >
                CSV
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span>Search:</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-3 py-1"
                placeholder="Search notifications..."
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#EEF2FF]">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Target Audience</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Scheduled/Sent</th>
                  <th className="px-4 py-3 text-left">Engagement</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map((notification) => (
                  <tr key={notification.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{notification.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {notification.content.substring(0, 100)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="capitalize">{notification.targetAudience}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                        {getStatusIcon(notification.status)}
                        {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {notification.sentAt
                        ? new Date(notification.sentAt).toLocaleDateString()
                        : notification.scheduledAt
                        ? new Date(notification.scheduledAt).toLocaleDateString()
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3">
                      {notification.analytics ? (
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {((notification.analytics.opened / notification.analytics.totalRecipients) * 100).toFixed(1)}% opened
                          </div>
                          <div className="text-gray-500">
                            {notification.analytics.totalRecipients} recipients
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/dashboard/notifications/${notification.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        {notification.status === 'draft' && (
                          <button
                            onClick={() => navigate(`/dashboard/notifications/${notification.id}/edit`)}
                            className="text-green-600 hover:text-green-800"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        {(notification.status === 'draft' || notification.status === 'scheduled') && (
                          <button
                            onClick={() => handleSendNotification(notification.id)}
                            className="text-purple-600 hover:text-purple-800"
                            title="Send Now"
                          >
                            <Send size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <div>
              Showing {Math.min((currentPage - 1) * parseInt(entriesPerPage) + 1, filteredNotifications.length)} to{' '}
              {Math.min(currentPage * parseInt(entriesPerPage), filteredNotifications.length)} of{' '}
              {filteredNotifications.length} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-[#1E3A8A] text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button className="px-3 py-1 bg-[#22C55E] text-white rounded">{currentPage}</button>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage * parseInt(entriesPerPage) >= filteredNotifications.length}
                className="px-3 py-1 bg-[#1E3A8A] text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;