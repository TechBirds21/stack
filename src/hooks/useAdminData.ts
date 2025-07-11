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

      // Fetch counts individually to avoid Promise.all failing if one query fails
      let usersCount = { count: 0 };
      let propertiesCount = { count: 0 };
      let bookingsCount = { count: 0 };
      let inquiriesCount = { count: 0 };
      let approvalsCount = { count: 0 };
      let dailyUsers = { count: 0 };
      let dailyProperties = { count: 0 };
      let dailyBookings = { count: 0 };
      let dailyInquiries = { count: 0 };
      let weeklyUsers = { count: 0 };
      let weeklyProperties = { count: 0 };
      let weeklyBookings = { count: 0 };
      let weeklyInquiries = { count: 0 };
      let saleProperties = { data: [] };
      let rentProperties = { data: [] };
      let unassignedProps = { count: 0 };
      
      try {
        usersCount = await supabase.from('users').select('*', { count: 'exact', head: true });
      } catch (error) {
        console.error('Error fetching users count:', error);
      }
      
      try {
        propertiesCount = await supabase.from('properties').select('*', { count: 'exact', head: true });
      } catch (error) {
        console.error('Error fetching properties count:', error);
      }
      
      try {
        bookingsCount = await supabase.from('bookings').select('*', { count: 'exact', head: true });
      } catch (error) {
        console.error('Error fetching bookings count:', error);
      }
      
      try {
        inquiriesCount = await supabase.from('inquiries').select('*', { count: 'exact', head: true });
      } catch (error) {
        console.error('Error fetching inquiries count:', error);
      }
      
      try {
        approvalsCount = await supabase.from('seller_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending');
      } catch (error) {
        console.error('Error fetching approvals count:', error);
      }
      
      // Daily stats
      try {
        dailyUsers = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', today);
      } catch (error) {
        console.error('Error fetching daily users:', error);
      }
      
      try {
        dailyProperties = await supabase.from('properties').select('*', { count: 'exact', head: true }).gte('created_at', today);
      } catch (error) {
        console.error('Error fetching daily properties:', error);
      }
      
      try {
        dailyBookings = await supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', today);
      } catch (error) {
        console.error('Error fetching daily bookings:', error);
      }
      
      try {
        dailyInquiries = await supabase.from('inquiries').select('*', { count: 'exact', head: true }).gte('created_at', today);
      } catch (error) {
        console.error('Error fetching daily inquiries:', error);
      }
      
      // Weekly stats
      try {
        weeklyUsers = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);
      } catch (error) {
        console.error('Error fetching weekly users:', error);
      }
      
      try {
        weeklyProperties = await supabase.from('properties').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);
      } catch (error) {
        console.error('Error fetching weekly properties:', error);
      }
      
      try {
        weeklyBookings = await supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);
      } catch (error) {
        console.error('Error fetching weekly bookings:', error);
      }
      
      try {
        weeklyInquiries = await supabase.from('inquiries').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);
      } catch (error) {
        console.error('Error fetching weekly inquiries:', error);
      }
      
      // Property values
      try {
        saleProperties = await supabase.from('properties').select('price').eq('listing_type', 'SALE').not('price', 'is', null);
      } catch (error) {
        console.error('Error fetching sale properties:', error);
      }
      
      try {
        rentProperties = await supabase.from('properties').select('monthly_rent').eq('listing_type', 'RENT').not('monthly_rent', 'is', null);
      } catch (error) {
        console.error('Error fetching rent properties:', error);
      }
      
      try {
        unassignedProps = await supabase.from('properties').select('*', { count: 'exact', head: true }).is('owner_id', null);
      } catch (error) {
        console.error('Error fetching unassigned properties:', error);
      }

      // Calculate property values
      const totalSaleValue = saleProperties.data?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
      const totalRentValue = rentProperties.data?.reduce((sum, p) => sum + (p.monthly_rent || 0), 0) || 0;
      const averagePrice = saleProperties.data?.length ? totalSaleValue / saleProperties.data.length : 0;
      const averageRent = rentProperties.data?.length ? totalRentValue / rentProperties.data.length : 0;

      setStats(prev => ({
        ...prev,
        totalUsers: usersCount.count || 0,
        totalProperties: propertiesCount.count || 0,
        totalBookings: bookingsCount.count || 0,
        totalInquiries: inquiriesCount.count || 0,
        pendingApprovals: approvalsCount.count || 0,
        dailyStats: {
          newUsers: dailyUsers.count || 0,
          newProperties: dailyProperties.count || 0,
          newBookings: dailyBookings.count || 0,
          newInquiries: dailyInquiries.count || 0,
        },
        weeklyStats: {
          users: weeklyUsers.count || 0,
          properties: weeklyProperties.count || 0,
          bookings: weeklyBookings.count || 0,
          inquiries: weeklyInquiries.count || 0,
        },
        propertyValues: {
          totalSaleValue,
          totalRentValue,
          averagePrice,
          averageRent,
        },
        unassignedProperties: unassignedProps.count || 0
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, custom_id, first_name, last_name, email, phone_number, user_type, status, verification_status, created_at, agent_license_number, city, state')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
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
        .select(`
          *,
          users:owner_id (
            first_name,
            last_name,
            custom_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
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
        .select(`
          *,
          properties (
            title,
            custom_id
          ),
          users:user_id (
            first_name,
            last_name,
            custom_id
          ),
          agent:agent_id (
            first_name,
            last_name,
            agent_license_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
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
        .select(`
          *,
          properties (
            title,
            custom_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
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
    
    console.log('Fetching all admin data from Supabase...');
    
    console.log('Fetching property counts...');
    try {
      // Fetch each data type separately to avoid Promise.all failures
      console.log('Properties count:', propertiesCount.count);
      await fetchStats();
      await fetchUsers();
      await fetchProperties();
      await fetchBookings();
      await fetchInquiries();
      await fetchNotifications();
      
      console.log('All data fetched successfully');
      
      if (showToast) {
        toast.success('Data refreshed successfully from Supabase');
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Error loading dashboard data. Using mock data instead.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
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