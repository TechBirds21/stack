import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardStats, User, Property, Booking, Inquiry } from '@/types/admin';

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
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [
        usersCount, propertiesCount, bookingsCount, inquiriesCount, approvalsCount,
        dailyUsers, dailyProperties, dailyBookings, dailyInquiries,
        weeklyUsers, weeklyProperties, weeklyBookings, weeklyInquiries,
        saleProperties, rentProperties, unassignedProps
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }),
        supabase.from('seller_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        
        // Daily stats
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('properties').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }).gte('created_at', today),
        
        // Weekly stats
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('properties').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        
        // Property values
        supabase.from('properties').select('price').eq('listing_type', 'SALE').not('price', 'is', null),
        supabase.from('properties').select('monthly_rent').eq('listing_type', 'RENT').not('monthly_rent', 'is', null),
        supabase.from('properties').select('*', { count: 'exact', head: true }).is('owner_id', null)
      ]);

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
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
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
    } catch (error) {
      console.error('Error fetching properties:', error);
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
    } catch (error) {
      console.error('Error fetching bookings:', error);
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
    } catch (error) {
      console.error('Error fetching inquiries:', error);
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
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchProperties(),
        fetchBookings(),
        fetchInquiries(),
        fetchNotifications()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      fetchAllData();
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
      
      fetchAllData();
      alert('Property deleted successfully!');
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property. Please try again.');
    }
  };

  return {
    stats,
    users,
    properties,
    bookings,
    inquiries,
    loading,
    fetchAllData,
    handleDeleteUser,
    handleDeleteProperty
  };
};