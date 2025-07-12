import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardStats, User, Property, Booking, Inquiry } from '@/types/admin';
import toast from 'react-hot-toast';

export const useAdminData = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalInquiries: 0,
    pendingApprovals: 0,
    notifications: [],
    dailyStats: { newUsers: 0, newProperties: 0, newBookings: 0, newInquiries: 0 },
    weeklyStats: { users: 0, properties: 0, bookings: 0, inquiries: 0 },
    propertyValues: { totalSaleValue: 0, totalRentValue: 0, averagePrice: 0, averageRent: 0 },
    unassignedProperties: 0
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Function to generate mock data for testing
  const generateMockData = () => {
    // Mock users
    const mockUsers = [
      {
        id: '1',
        custom_id: 'ADMIN001',
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@example.com',
        phone_number: '+91 9876543210',
        user_type: 'admin',
        status: 'active',
        verification_status: 'verified',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        custom_id: 'BUYER001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '+91 9876543211',
        user_type: 'buyer',
        status: 'active',
        verification_status: 'verified',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        custom_id: 'SELLER001',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone_number: '+91 9876543212',
        user_type: 'seller',
        status: 'active',
        verification_status: 'pending',
        created_at: new Date().toISOString()
      }
    ];
    
    // Mock properties
    const mockProperties = [
      {
        id: '1',
        custom_id: 'PROP001',
        title: 'Luxury Villa with Garden',
        property_type: 'villa',
        city: 'Visakhapatnam',
        listing_type: 'SALE',
        price: 8500000,
        monthly_rent: null,
        status: 'active',
        featured: true,
        verified: true,
        created_at: new Date().toISOString(),
        users: {
          first_name: 'Jane',
          last_name: 'Smith',
          custom_id: 'SELLER001'
        }
      },
      {
        id: '2',
        custom_id: 'PROP002',
        title: 'Modern 2BHK Apartment',
        property_type: 'apartment',
        city: 'Hyderabad',
        listing_type: 'RENT',
        price: null,
        monthly_rent: 25000,
        status: 'active',
        featured: false,
        verified: true,
        created_at: new Date().toISOString(),
        users: {
          first_name: 'Jane',
          last_name: 'Smith',
          custom_id: 'SELLER001'
        }
      }
    ];
    
    // Mock bookings
    const mockBookings = [
      {
        id: '1',
        booking_date: new Date().toISOString().split('T')[0],
        booking_time: '10:00:00',
        status: 'pending',
        created_at: new Date().toISOString(),
        properties: {
          title: 'Luxury Villa with Garden',
          custom_id: 'PROP001'
        },
        users: {
          first_name: 'John',
          last_name: 'Doe',
          custom_id: 'BUYER001'
        },
        agent: null
      }
    ];
    
    // Mock inquiries
    const mockInquiries = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+91 9876543210',
        message: 'I am interested in this property. Please contact me.',
        status: 'new',
        created_at: new Date().toISOString(),
        properties: {
          title: 'Luxury Villa with Garden',
          custom_id: 'PROP001'
        }
      }
    ];
    
    // Mock notifications
    const mockNotifications = [
      {
        id: '1',
        title: 'New User Registration',
        message: 'A new user has registered on the platform',
        type: 'user_registration',
        created_at: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        title: 'New Property Inquiry',
        message: 'Someone inquired about Luxury Villa with Garden',
        type: 'inquiry',
        created_at: new Date().toISOString(),
        read: false
      }
    ];
    
    return {
      mockUsers,
      mockProperties,
      mockBookings,
      mockInquiries,
      mockNotifications
    };
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; 

      // Initialize count objects
      const counts = {
        usersCount: { count: 0 },
        propertiesCount: { count: 0 },
        bookingsCount: { count: 0 },
        inquiriesCount: { count: 0 },
        approvalsCount: { count: 0 },
        dailyUsers: { count: 0 },
        dailyProperties: { count: 0 },
        dailyBookings: { count: 0 },
        dailyInquiries: { count: 0 },
        weeklyUsers: { count: 0 },
        weeklyProperties: { count: 0 },
        weeklyBookings: { count: 0 },
        weeklyInquiries: { count: 0 },
        saleProperties: { data: [] as any[] },
        rentProperties: { data: [] as any[] },
        unassignedProps: { count: 0 }
      };
      
      try {
        counts.usersCount = await supabase.from('users').select('*', { count: 'exact', head: true });
      } catch (error) {
        console.error('Error fetching users count, using default value:', error);
        counts.usersCount = { count: 0 };
      }
      
      try {
        counts.propertiesCount = await supabase.from('properties').select('*', { count: 'exact', head: true });
      } catch (error) {
        console.error('Error fetching properties count, using default value:', error);
        counts.propertiesCount = { count: 0 };
      }
      
      try {
        counts.bookingsCount = await supabase.from('bookings').select('*', { count: 'exact', head: true });
      } catch (error) {
        console.error('Error fetching bookings count, using default value:', error);
        counts.bookingsCount = { count: 0 };
      }
      
      try {
        counts.inquiriesCount = await supabase.from('inquiries').select('*', { count: 'exact', head: true });
      } catch (error) {
        console.error('Error fetching inquiries count, using default value:', error);
        counts.inquiriesCount = { count: 0 };
      }
      
      try {
        counts.approvalsCount = await supabase.from('seller_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending');
      } catch (error) {
        console.error('Error fetching approvals count, using default value:', error);
        counts.approvalsCount = { count: 0 };
      }
      
      // Daily stats
      try {
        counts.dailyUsers = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', today);
      } catch (error) {
        console.error('Error fetching daily users:', error);
      }
      
      try {
        counts.dailyProperties = await supabase.from('properties').select('*', { count: 'exact', head: true }).gte('created_at', today);
      } catch (error) {
        console.error('Error fetching daily properties:', error);
      }
      
      try {
        counts.dailyBookings = await supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', today);
      } catch (error) {
        console.error('Error fetching daily bookings:', error);
      }
      
      try {
        counts.dailyInquiries = await supabase.from('inquiries').select('*', { count: 'exact', head: true }).gte('created_at', today);
      } catch (error) {
        console.error('Error fetching daily inquiries:', error);
      }
      
      // Weekly stats
      try {
        counts.weeklyUsers = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);
      } catch (error) {
        console.error('Error fetching weekly users:', error);
      }
      
      try {
        counts.weeklyProperties = await supabase.from('properties').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);
      } catch (error) {
        console.error('Error fetching weekly properties:', error);
      }
      
      try {
        counts.weeklyBookings = await supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);
      } catch (error) {
        console.error('Error fetching weekly bookings:', error);
      }
      
      try {
        counts.weeklyInquiries = await supabase.from('inquiries').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);
      } catch (error) {
        console.error('Error fetching weekly inquiries:', error);
      }
      
      // Property values
      try {
        counts.saleProperties = await supabase.from('properties').select('price').eq('listing_type', 'SALE').not('price', 'is', null);
      } catch (error) {
        console.error('Error fetching sale properties:', error);
      }
      
      try {
        counts.rentProperties = await supabase.from('properties').select('monthly_rent').eq('listing_type', 'RENT').not('monthly_rent', 'is', null);
      } catch (error) {
        console.error('Error fetching rent properties:', error);
      }
      
      try {
        counts.unassignedProps = await supabase.from('properties').select('*', { count: 'exact', head: true }).is('owner_id', null);
      } catch (error) {
        console.error('Error fetching unassigned properties:', error);
      }

      // Calculate property values
      const totalSaleValue = counts.saleProperties.data?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
      const totalRentValue = counts.rentProperties.data?.reduce((sum, p) => sum + (p.monthly_rent || 0), 0) || 0;
      const averagePrice = counts.saleProperties.data?.length ? totalSaleValue / counts.saleProperties.data.length : 0;
      const averageRent = counts.rentProperties.data?.length ? totalRentValue / counts.rentProperties.data.length : 0;

      setStats(prev => ({
        ...prev,
        totalUsers: counts.usersCount.count || 0,
        totalProperties: counts.propertiesCount.count || 0,
        totalBookings: counts.bookingsCount.count || 0,
        totalInquiries: counts.inquiriesCount.count || 0,
        pendingApprovals: counts.approvalsCount.count || 0,
        dailyStats: {
          newUsers: counts.dailyUsers.count || 0,
          newProperties: counts.dailyProperties.count || 0,
          newBookings: counts.dailyBookings.count || 0,
          newInquiries: counts.dailyInquiries.count || 0,
        },
        weeklyStats: {
          users: counts.weeklyUsers.count || 0,
          properties: counts.weeklyProperties.count || 0,
          bookings: counts.weeklyBookings.count || 0,
          inquiries: counts.weeklyInquiries.count || 0,
        },
        propertyValues: {
          totalSaleValue,
          totalRentValue,
          averagePrice,
          averageRent,
        },
        unassignedProperties: counts.unassignedProps.count || 0
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone_number, user_type, status, verification_status, created_at, agent_license_number, city, state')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add custom_id if it doesn't exist in the database
      const usersWithCustomId = (data || []).map((user, index) => ({
        ...user,
        custom_id: user.custom_id || `${user.user_type?.toUpperCase() || 'USER'}${String(index + 1).padStart(3, '0')}`
      }));
      
      setUsers(usersWithCustomId);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      // Use mock data if no real data is available
      const { mockUsers } = generateMockData();
      setUsers(mockUsers);
      toast.error('Error loading users. Using mock data.');
    }
  };

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*, users:owner_id(first_name, last_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add custom_id if it doesn't exist in the database
      const propertiesWithCustomId = (data || []).map((property, index) => ({
        ...property,
        custom_id: property.custom_id || `PROP${String(index + 1).padStart(3, '0')}`,
        users: property.users ? {
          ...property.users,
          custom_id: `USER${String(index + 1).padStart(3, '0')}`
        } : null
      }));
      
      setProperties(propertiesWithCustomId);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      // Use mock data if no real data is available
      const { mockProperties } = generateMockData();
      setProperties(mockProperties);
      toast.error('Error loading properties. Using mock data.');
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, properties(title), users:user_id(first_name, last_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add missing fields for UI compatibility
      const enhancedBookings = (data || []).map((booking, index) => ({
        ...booking,
        properties: booking.properties ? {
          ...booking.properties,
          custom_id: `PROP${String(index + 1).padStart(3, '0')}`
        } : null,
        users: booking.users ? {
          ...booking.users,
          custom_id: `USER${String(index + 1).padStart(3, '0')}`
        } : null,
        agent: null // We'll handle this separately if needed
      }));
      
      setBookings(enhancedBookings);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      // Use mock data if no real data is available
      const { mockBookings } = generateMockData();
      setBookings(mockBookings);
      toast.error('Error loading bookings. Using mock data.');
    }
  };

  const fetchInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*, properties(title)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add missing fields for UI compatibility
      const enhancedInquiries = (data || []).map((inquiry, index) => ({
        ...inquiry,
        properties: inquiry.properties ? {
          ...inquiry.properties,
          custom_id: `PROP${String(index + 1).padStart(3, '0')}`
        } : null
      }));
      
      setInquiries(enhancedInquiries);
    } catch (error: any) {
      console.error('Error fetching inquiries:', error);
      // Use mock data if no real data is available
      const { mockInquiries } = generateMockData();
      setInquiries(mockInquiries);
      toast.error('Error loading inquiries. Using mock data.');
    }
  };

  const fetchNotifications = async () => {
    try {
      // First check if the notifications table exists
      const { error: tableCheckError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
        
      if (tableCheckError) {
        if (tableCheckError.code === '42P01' || tableCheckError.message?.includes('does not exist')) {
          console.warn('Notifications table does not exist yet');
          setStats(prev => ({ ...prev, notifications: [] }));
          return;
        }
        throw tableCheckError;
      }
      
      // If table exists, fetch notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setStats(prev => ({
        ...prev,
        notifications: data || []
      }));
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      // Use mock notifications if no real data is available
      const { mockNotifications } = generateMockData();
      setStats(prev => ({ ...prev, notifications: mockNotifications }));
      toast.error('Error loading notifications. Using mock data.');
    }
  };

  const fetchAllData = async (showToast = false) => {
    setLoading(true);
    setIsRefreshing(true);

    // Fetch each data type separately to avoid Promise.all failures
    await fetchStats().catch(err => console.error('Error fetching stats:', err));
    await fetchUsers().catch(err => console.error('Error fetching users:', err));
    await fetchProperties().catch(err => console.error('Error fetching properties:', err));
    await fetchBookings().catch(err => console.error('Error fetching bookings:', err));
    await fetchInquiries().catch(err => console.error('Error fetching inquiries:', err));
    await fetchNotifications().catch(err => console.error('Error fetching notifications:', err));

    if (showToast) {
      toast.success('Data refreshed successfully');
    }
    
    setLoading(false);
    setIsRefreshing(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    console.log('Deleting user with ID from Supabase:', userId);
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      fetchAllData();
      toast.success('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user. Please try again.');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    console.log('Deleting property with ID from Supabase:', propertyId);
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
      
      fetchAllData();
      toast.success('Property deleted successfully!');
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property. Please try again.');
    }
  };

  return {
    stats,
    users,
    properties,
    bookings,
    isRefreshing,
    inquiries,
    loading,
    fetchAllData,
    handleDeleteUser,
    handleDeleteProperty
  };
};