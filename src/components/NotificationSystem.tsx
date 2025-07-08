import React, { useState, useEffect } from 'react';
import { Bell, X, MessageCircle, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  type: 'inquiry' | 'booking' | 'system';
  title: string;
  message: string;
  property_title?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  created_at: string;
  read: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const NotificationSystem: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    
    // Set up real-time subscriptions for new inquiries and bookings
    const setupRealtimeSubscriptions = async () => {
      try {
        const propertyIds = await getPropertyIds();
        const filter = propertyIds && propertyIds.length > 0 
          ? `property_id=in.(${propertyIds.join(',')})`
          : `property_id=eq.(-1)`; // No properties, use impossible filter

        const inquirySubscription = supabase
          .channel('inquiries')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'inquiries',
              filter: filter
            }, 
            (payload) => {
              if (user.user_type === 'seller' || user.user_type === 'agent') {
                handleNewInquiry(payload.new);
              }
            }
          )
          .subscribe();

        const bookingSubscription = supabase
          .channel('bookings')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'bookings',
              filter: filter
            }, 
            (payload) => {
              if (user.user_type === 'seller' || user.user_type === 'agent') {
                handleNewBooking(payload.new);
              }
            }
          )
          .subscribe();

        return { inquirySubscription, bookingSubscription };
      } catch (error) {
        console.error('Error setting up subscriptions:', error);
        return null;
      }
    };

    let subscriptions: { inquirySubscription: any; bookingSubscription: any } | null = null;

    setupRealtimeSubscriptions().then((subs) => {
      subscriptions = subs;
    });

    return () => {
      if (subscriptions) {
        supabase.removeChannel(subscriptions.inquirySubscription);
        supabase.removeChannel(subscriptions.bookingSubscription);
      }
    };
  }, [user]);

  const getPropertyIds = async (): Promise<string[]> => {
    if (!user || (user.user_type !== 'seller' && user.user_type !== 'agent')) return [];
    
    try {
      const { data } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);
      
      return data?.map(p => p.id) || [];
    } catch (error) {
      console.error('Error fetching property IDs:', error);
      return [];
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      let notifications: Notification[] = [];

      if (user.user_type === 'seller' || user.user_type === 'agent') {
        // Fetch inquiries for seller's properties
        const { data: inquiries } = await supabase
          .from('inquiries')
          .select(`
            id, name, email, phone, message, created_at,
            properties!inner(id, title, owner_id)
          `)
          .eq('properties.owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(15);

        // Fetch bookings for seller's properties
        const { data: bookings } = await supabase
          .from('bookings')
          .select(`
            id, booking_date, booking_time, notes, created_at,
            properties!inner(id, title, owner_id),
            users(first_name, last_name, email, phone_number)
          `)
          .eq('properties.owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(15);

        // Convert to notifications with enhanced information
        const inquiryNotifications: Notification[] = (inquiries || []).map(inquiry => ({
          id: `inquiry-${inquiry.id}`,
          type: 'inquiry' as const,
          title: 'New Property Inquiry',
          message: `${inquiry.name} is interested in ${inquiry.properties.title}`,
          property_title: inquiry.properties.title,
          user_name: inquiry.name,
          user_email: inquiry.email,
          user_phone: inquiry.phone,
          created_at: inquiry.created_at,
          read: false,
          priority: 'high'
        }));

        const bookingNotifications: Notification[] = (bookings || []).map(booking => ({
          id: `booking-${booking.id}`,
          type: 'booking' as const,
          title: 'New Tour Request',
          message: `${booking.users?.first_name || 'User'} ${booking.users?.last_name || ''} wants to tour ${booking.properties.title}`.trim(),
          property_title: booking.properties.title,
          user_name: `${booking.users?.first_name || 'User'} ${booking.users?.last_name || ''}`.trim(),
          user_email: booking.users?.email || '',
          user_phone: booking.users?.phone_number || '',
          created_at: booking.created_at,
          read: false,
          priority: 'high'
        }));

        notifications = [...inquiryNotifications, ...bookingNotifications]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 15);
      }

      setNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNewInquiry = async (inquiry: any) => {
    try {
      // Fetch property details
      const { data: property } = await supabase
        .from('properties')
        .select('title')
        .eq('id', inquiry.property_id)
        .single();

      const newNotification: Notification = {
        id: `inquiry-${inquiry.id}`,
        type: 'inquiry',
        title: 'New Property Inquiry',
        message: `${inquiry.name} is interested in ${property?.title || 'your property'}`,
        property_title: property?.title,
        user_name: inquiry.name,
        user_email: inquiry.email,
        user_phone: inquiry.phone,
        created_at: inquiry.created_at,
        read: false,
        priority: 'high'
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 14)]);
      setUnreadCount(prev => prev + 1);

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('New Property Inquiry', {
          body: newNotification.message,
          icon: '/favicon.ico',
          tag: 'inquiry'
        });
      }
    } catch (error) {
      console.error('Error handling new inquiry:', error);
    }
  };

  const handleNewBooking = async (booking: any) => {
    try {
      // Fetch property and user details
      const { data: property } = await supabase
        .from('properties')
        .select('title')
        .eq('id', booking.property_id)
        .single();

      const { data: user } = await supabase
        .from('users')
        .select('first_name, last_name, email, phone_number')
        .eq('id', booking.user_id)
        .single();

      const newNotification: Notification = {
        id: `booking-${booking.id}`,
        type: 'booking',
        title: 'New Tour Request',
        message: `${user?.first_name} ${user?.last_name} wants to tour ${property?.title || 'your property'}`,
        property_title: property?.title,
        user_name: `${user?.first_name} ${user?.last_name}`,
        user_email: user?.email,
        user_phone: user?.phone_number,
        created_at: booking.created_at,
        read: false,
        priority: 'high'
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 14)]);
      setUnreadCount(prev => prev + 1);

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('New Tour Request', {
          body: newNotification.message,
          icon: '/favicon.ico',
          tag: 'booking'
        });
      }
    } catch (error) {
      console.error('Error handling new booking:', error);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <MessageCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (!user || (user.user_type !== 'seller' && user.user_type !== 'agent')) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-full hover:bg-gray-100 z-50"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div 
          className="navbar-dropdown absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border max-h-[80vh] overflow-hidden"
          style={{ zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">Stay updated with your property inquiries</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-[#90C641] hover:text-[#7DAF35] font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium">No notifications yet</p>
                <p className="text-sm">You'll see inquiries and tour requests here</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-1">
                      {notification.type === 'inquiry' ? (
                        <MessageCircle className="h-5 w-5 text-blue-500" />
                      ) : notification.type === 'booking' ? (
                        <Calendar className="h-5 w-5 text-green-500" />
                      ) : (
                        getPriorityIcon(notification.priority)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        {notification.priority === 'high' && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            High
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      
                      {/* Contact Information */}
                      {notification.user_email && (
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>📧 {notification.user_email}</p>
                          {notification.user_phone && (
                            <p>📱 {notification.user_phone}</p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {notification.property_title && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {notification.property_title.length > 20 
                              ? `${notification.property_title.substring(0, 20)}...`
                              : notification.property_title
                            }
                          </span>
                        )}
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0 ml-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;