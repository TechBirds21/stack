import React, { useState } from 'react';
import { Users, Building2, Calendar, MessageSquare, Plus } from 'lucide-react';
import { DashboardStats } from '@/types/admin';
import AdminTable from './AdminTable';

interface DashboardOverviewProps {
  stats: DashboardStats;
  onCardClick: (cardType: string) => void;
  onAddUser: () => void;
  onAddProperty: () => void;
  users: any[];
  properties: any[];
  bookings: any[];
  inquiries: any[];
  onRefresh: () => void;
  onViewUser?: (user: any) => void;
  onEditUser?: (user: any) => void;
  onDeleteUser?: (id: string) => void;
  onViewProperty?: (property: any) => void;
  onEditProperty?: (property: any) => void;
  onDeleteProperty?: (id: string) => void;
  onViewBooking?: (booking: any) => void;
  onEditBooking?: (booking: any) => void;
  onDeleteBooking?: (id: string) => void;
  onViewInquiry?: (inquiry: any) => void;
  onAssignAgent?: (inquiry: any) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  onCardClick,
  onAddUser,
  onAddProperty,
  users,
  properties,
  bookings,
  inquiries,
  onRefresh,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onViewProperty,
  onEditProperty,
  onDeleteProperty,
  onViewBooking,
  onEditBooking,
  onDeleteBooking,
  onViewInquiry,
  onAssignAgent,
}) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const handleCardClick = (cardType: string) => {
    if (expandedCard === cardType) {
      setExpandedCard(null);
    } else {
      setExpandedCard(cardType);
    }
  };

  const getUserColumns = () => [
    { key: 'custom_id', header: 'ID' },
    { key: 'first_name', header: 'Name', render: (user: any) => `${user.first_name} ${user.last_name}` },
    { key: 'email', header: 'Email' },
    { key: 'user_type', header: 'Type' },
    { key: 'status', header: 'Status' }
  ];

  const getPropertyColumns = () => [
    { key: 'custom_id', header: 'ID' },
    { key: 'title', header: 'Title' },
    { key: 'property_type', header: 'Type' },
    { key: 'city', header: 'City' },
    { key: 'listing_type', header: 'Listing Type' },
    { key: 'status', header: 'Status' }
  ];

  const getBookingColumns = () => [
    { key: 'booking_date', header: 'Date' },
    { key: 'booking_time', header: 'Time' },
    { key: 'property', header: 'Property', render: (booking: any) => 
      booking.properties?.title || 'N/A'
    },
    { key: 'user', header: 'Customer', render: (booking: any) => 
      booking.users ? `${booking.users.first_name} ${booking.users.last_name}` : 'N/A'
    },
    { key: 'status', header: 'Status' }
  ];

  const getInquiryColumns = () => [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'property', header: 'Property', render: (inquiry: any) => 
      inquiry.properties?.title || 'N/A'
    },
    { key: 'status', header: 'Status' }
  ];

  const renderExpandedData = (cardType: string) => {
    switch (cardType) {
      case 'users':
        return <AdminTable data={users.slice(0, 10)} columns={getUserColumns()} title="Recent Users" onRefresh={onRefresh} onView={onViewUser} onEdit={onEditUser} onDelete={onDeleteUser} />;
      case 'properties':
        return <AdminTable data={properties.slice(0, 10)} columns={getPropertyColumns()} title="Recent Properties" onRefresh={onRefresh} onView={onViewProperty} onEdit={onEditProperty} onDelete={onDeleteProperty} />;
      case 'bookings':
        return <AdminTable data={bookings.slice(0, 10)} columns={getBookingColumns()} title="Recent Bookings" onRefresh={onRefresh} onView={onViewBooking} onEdit={onEditBooking} onDelete={onDeleteBooking} />;
      case 'inquiries':
        return <AdminTable data={inquiries.slice(0, 10)} columns={getInquiryColumns()} title="Recent Inquiries" onRefresh={onRefresh} onView={onViewInquiry} onAssignAgent={onAssignAgent} />;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Cards - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleCardClick('users')}
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-xs text-green-600">+{stats.dailyStats.newUsers} today</p>
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleCardClick('properties')}
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
              <p className="text-xs text-green-600">+{stats.dailyStats.newProperties} today</p>
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleCardClick('bookings')}
        >
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              <p className="text-xs text-green-600">+{stats.dailyStats.newBookings} today</p>
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleCardClick('inquiries')}
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInquiries}</p>
              <p className="text-xs text-green-600">+{stats.dailyStats.newInquiries} today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Card Data */}
      {expandedCard && (
        <div className="mt-6">
          {renderExpandedData(expandedCard)}
        </div>
      )}

      {/* Property Values and Weekly Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Values</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.propertyValues.totalSaleValue)}
              </div>
              <div className="text-sm text-gray-600">Total Sale Value</div>
              <div className="text-xs text-gray-500 mt-1">
                Avg: {formatCurrency(stats.propertyValues.averagePrice)}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.propertyValues.totalRentValue)}
              </div>
              <div className="text-sm text-gray-600">Total Rent Value</div>
              <div className="text-xs text-gray-500 mt-1">
                Avg: {formatCurrency(stats.propertyValues.averageRent)}/month
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Users</span>
              <span className="font-semibold">{stats.weeklyStats.users}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Properties</span>
              <span className="font-semibold">{stats.weeklyStats.properties}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Bookings</span>
              <span className="font-semibold">{stats.weeklyStats.bookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Inquiries</span>
              <span className="font-semibold">{stats.weeklyStats.inquiries}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-red-600">Unassigned Properties</span>
              <span className="font-semibold text-red-600">{stats.unassignedProperties}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
          </div>
          <div className="p-6">
            {stats.notifications.length > 0 ? (
              <div className="space-y-4">
                {stats.notifications.slice(0, 5).map((notification, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No notifications</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button
                onClick={onAddUser}
                className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center">
                  <Plus className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-gray-900">Add New User</span>
                </div>
                <span className="text-blue-600">→</span>
              </button>
              
              <button
                onClick={onAddProperty}
                className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center">
                  <Plus className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-900">Add New Property</span>
                </div>
                <span className="text-green-600">→</span>
              </button>
              
              <button
                onClick={() => onCardClick('users')}
                className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-gray-900">Manage Users</span>
                </div>
                <span className="text-purple-600">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;