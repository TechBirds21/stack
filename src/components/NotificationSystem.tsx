import React, { useState, useEffect } from 'react';
import { Bell, X, MessageCircle, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  type: 'inquiry' | 'booking' | 'system';
  title: string;
  message: string;
  property_title?: string;
  user_name?: string;
  created_at: string;
  read: boolean;
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
    const inquirySubscription = supabase
      .channel('inquiries')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'inquiries',
          filter: `property_id=in.(${getPropertyIds().join(',')})`
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
          filter: `property_id=in.(${getPropertyIds().join(',')})`
        }, 
        (payload) => {
          if (user.user_type === 'seller' || user.user_type === 'agent') {
            handleNewBooking(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inquirySubscription);
      supabase.removeChannel(bookingSubscription);
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
            id, name, email, message, created_at,
            properties!inner(id, title, owner_id)
          `)
          .eq('properties.owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        // Fetch bookings for seller's properties
        const { data: bookings } = await supabase
          .from('bookings')
          .select(`
            id, booking_date, booking_time, notes, created_at,
            properties!inner(id, title, owner_id),
            users(first_name, last_name)
          `)
          .eq('properties.owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        // Convert to notifications
        const inquiryNotifications: Notification[] = (inquiries || []).map(inquiry => ({
          id: `inquiry-${inquiry.id}`,
          type: 'inquiry' as const,
          title: 'New Property Inquiry',
          message: `${inquiry.name} is interested in ${inquiry.properties.title}`,
          property_title: inquiry.properties.title,
          user_name: inquiry.name,
          created_at: inquiry.created_at,
          read: false
        }));

        const bookingNotifications: Notification[] = (bookings || []).map(booking => ({
          id: `booking-${booking.id}`,
          type: 'booking' as const,
          title: 'New Tour Request',
          message: `${booking.users.first_name} ${booking.users.last_name} wants to tour ${booking.properties.title}`,
          property_title: booking.properties.title,
          user_name: `${booking.users.first_name} ${booking.users.last_name}`,
          created_at: booking.created_at,
          read: false
        }));

        notifications = [...inquiryNotifications, ...bookingNotifications]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);
      }

      setNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNewInquiry = async (inquiry: any) => {
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
      created_at: inquiry.created_at,
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
    setUnreadCount(prev => prev + 1);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification('New Property Inquiry', {
        body: newNotification.message,
        icon: '/favicon.ico'
      });
    }
  };

  const handleNewBooking = async (booking: any) => {
    // Fetch property and user details
    const { data: property } = await supabase
      .from('properties')
      .select('title')
      .eq('id', booking.property_id)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', booking.user_id)
      .single();

    const newNotification: Notification = {
      id: `booking-${booking.id}`,
      type: 'booking',
      title: 'New Tour Request',
      message: `${user?.first_name} ${user?.last_name} wants to tour ${property?.title || 'your property'}`,
      property_title: property?.title,
      user_name: `${user?.first_name} ${user?.last_name}`,
      created_at: booking.created_at,
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
    setUnreadCount(prev => prev + 1);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification('New Tour Request', {
        body: newNotification.message,
        icon: '/favicon.ico'
      });
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
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-[#90C641] hover:text-[#7DAF35]"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {notification.type === 'inquiry' ? (
                        <MessageCircle className="h-5 w-5 text-blue-500" />
                      ) : notification.type === 'booking' ? (
                        <Calendar className="h-5 w-5 text-green-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
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

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setShowDropdown(false)}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;