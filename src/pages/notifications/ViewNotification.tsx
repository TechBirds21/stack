import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Edit, Copy, Calendar, Users, Eye, MousePointer, Send, Trash2 } from 'lucide-react';
import { Notification } from '../../types';
import { apiService } from '../../services/api';

const ViewNotification = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchNotification();
    }
  }, [id]);

  const fetchNotification = async () => {
    if (!id) return;
    
    setLoading(true);
    const response = await apiService.getNotificationById(id);
    
    if (response.success && response.data) {
      setNotification(response.data);
    }
    setLoading(false);
  };

  const handleDuplicate = () => {
    if (notification) {
      navigate('/dashboard/notifications/add', {
        state: {
          template: {
            title: `Copy of ${notification.title}`,
            content: notification.content,
            type: notification.type,
            targetAudience: notification.targetAudience,
          }
        }
      });
    }
  };

  const handleDelete = async () => {
    if (!notification || !window.confirm('Are you sure you want to delete this notification?')) return;
    
    const response = await apiService.deleteNotification(notification.id);
    if (response.success) {
      navigate('/dashboard/notifications');
    }
  };

  const handleSend = async () => {
    if (!notification || !window.confirm('Are you sure you want to send this notification now?')) return;
    
    const response = await apiService.sendNotification(notification.id);
    if (response.success) {
      fetchNotification(); // Refresh to get updated status
    }
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Notification Not Found</h2>
          <button
            onClick={() => navigate('/dashboard/notifications')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Back to Notifications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/notifications')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            Back to Notifications
          </button>
          <div className="flex items-center gap-2 text-[#1E3A8A]">
            <Home size={18} />
            <span>Notifications</span>
            <span className="text-gray-500">/</span>
            <span>View</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {notification.status === 'draft' && (
            <button
              onClick={() => navigate(`/dashboard/notifications/${notification.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit size={18} />
              Edit
            </button>
          )}
          
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Copy size={18} />
            Duplicate
          </button>

          {(notification.status === 'draft' || notification.status === 'scheduled') && (
            <button
              onClick={handleSend}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Send size={18} />
              Send Now
            </button>
          )}

          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notification Preview */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#1E3A8A] p-6">
              <h2 className="text-xl font-semibold text-white">Notification Preview</h2>
            </div>
            <div className="p-6">
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{notification.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                    {notification.type.toUpperCase()}
                  </span>
                </div>
                <div className="prose max-w-none">
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {notification.content}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Analytics */}
          {notification.analytics && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-[#1E3A8A] p-6">
                <h2 className="text-xl font-semibold text-white">Performance Analytics</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Users className="mx-auto mb-2 text-blue-600" size={24} />
                    <div className="text-2xl font-bold text-blue-600">
                      {notification.analytics.totalRecipients}
                    </div>
                    <div className="text-sm text-gray-600">Recipients</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Send className="mx-auto mb-2 text-green-600" size={24} />
                    <div className="text-2xl font-bold text-green-600">
                      {notification.analytics.delivered}
                    </div>
                    <div className="text-sm text-gray-600">Delivered</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Eye className="mx-auto mb-2 text-purple-600" size={24} />
                    <div className="text-2xl font-bold text-purple-600">
                      {notification.analytics.opened}
                    </div>
                    <div className="text-sm text-gray-600">Opened</div>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <MousePointer className="mx-auto mb-2 text-orange-600" size={24} />
                    <div className="text-2xl font-bold text-orange-600">
                      {notification.analytics.clicked}
                    </div>
                    <div className="text-sm text-gray-600">Clicked</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border border-gray-200 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">
                      {((notification.analytics.delivered / notification.analytics.totalRecipients) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Delivery Rate</div>
                  </div>
                  
                  <div className="text-center p-4 border border-gray-200 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">
                      {notification.analytics.delivered > 0 
                        ? ((notification.analytics.opened / notification.analytics.delivered) * 100).toFixed(1)
                        : '0'
                      }%
                    </div>
                    <div className="text-sm text-gray-600">Open Rate</div>
                  </div>
                  
                  <div className="text-center p-4 border border-gray-200 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">
                      {notification.analytics.opened > 0 
                        ? ((notification.analytics.clicked / notification.analytics.opened) * 100).toFixed(1)
                        : '0'
                      }%
                    </div>
                    <div className="text-sm text-gray-600">Click Rate</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Notification Details */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#1E3A8A] p-4">
              <h3 className="text-lg font-semibold text-white">Details</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(notification.status)}`}>
                    {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Type</label>
                <div className="mt-1">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(notification.type)}`}>
                    {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Target Audience</label>
                <div className="mt-1 text-gray-900 capitalize">
                  {notification.targetAudience}
                </div>
              </div>

              {notification.targetUsers && notification.targetUsers.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Specific Users</label>
                  <div className="mt-1 text-gray-900">
                    {notification.targetUsers.length} users
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <div className="mt-1 text-gray-900">
                  {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                  {new Date(notification.createdAt).toLocaleTimeString()}
                </div>
              </div>

              {notification.scheduledAt && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Scheduled For</label>
                  <div className="mt-1 text-gray-900 flex items-center gap-2">
                    <Calendar size={16} />
                    {new Date(notification.scheduledAt).toLocaleDateString()} at{' '}
                    {new Date(notification.scheduledAt).toLocaleTimeString()}
                  </div>
                </div>
              )}

              {notification.sentAt && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Sent At</label>
                  <div className="mt-1 text-gray-900">
                    {new Date(notification.sentAt).toLocaleDateString()} at{' '}
                    {new Date(notification.sentAt).toLocaleTimeString()}
                  </div>
                </div>
              )}

              {notification.template && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Template</label>
                  <div className="mt-1 text-gray-900 capitalize">
                    {notification.template.replace('_', ' ')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#1E3A8A] p-4">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
            </div>
            <div className="p-4 space-y-3">
              <button
                onClick={() => navigate('/dashboard/notifications/analytics')}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Eye className="text-blue-600" size={20} />
                <span>View Analytics</span>
              </button>

              <button
                onClick={() => navigate('/dashboard/notifications')}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Users className="text-green-600" size={20} />
                <span>View Recipients</span>
              </button>

              {notification.status === 'scheduled' && (
                <button
                  onClick={() => navigate(`/dashboard/notifications/${notification.id}/edit`)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Calendar className="text-purple-600" size={20} />
                  <span>Reschedule</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewNotification;