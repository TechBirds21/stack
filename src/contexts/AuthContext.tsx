import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import apiService from '../lib/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  email_verified?: boolean;
  email_verified_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: any) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('homeown_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        localStorage.removeItem('homeown_user');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Check for existing Supabase session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, user_type, email_verified, email_verified_at')
            .eq('id', session.user.id)
            .single();
          
          if (userData) {
            setUser(userData);
            localStorage.setItem('homeown_user', JSON.stringify(userData));
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };
    
    if (!user) {
      checkSession();
    }
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, user_type, email_verified, email_verified_at')
            .eq('id', session.user.id)
            .single();
          
          if (userData) {
            setUser(userData);
            localStorage.setItem('homeown_user', JSON.stringify(userData));
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('homeown_user');
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      // Simple hardcoded login for demo
      let mockUser = null;
      if (email === 'abc' && password === '123') {
        mockUser = {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'abc',
          first_name: 'Test',
          last_name: 'User',
          user_type: 'buyer'
        };
      } else if (email === 'seller' && password === '123') {
        mockUser = {
          id: '44444444-4444-4444-4444-444444444444',
          email: 'seller',
          first_name: 'Property',
          last_name: 'Owner',
          user_type: 'seller'
        };
      } else if (email === 'agent' && password === '123') {
        mockUser = {
          id: '77777777-7777-7777-7777-777777777777',
          email: 'agent',
          first_name: 'Real Estate',
          last_name: 'Agent',
          user_type: 'agent'
        };
      } else if (email === 'admin' && password === 'admin123') {
        mockUser = {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          email: 'admin',
          first_name: 'System',
          last_name: 'Administrator',
          user_type: 'admin'
        };
      }
      
      if (mockUser) {
        setUser(mockUser);
        // Store in localStorage for persistence
        localStorage.setItem('homeown_user', JSON.stringify(mockUser));
        return {};
      }

      // Real Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      // Fetch user profile data
      if (data.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, user_type, email_verified, email_verified_at')
          .eq('id', data.user.id)
          .single();
        
        if (userData) {
          setUser(userData);
          localStorage.setItem('homeown_user', JSON.stringify(userData));
        }
      }
      
      return {};
    } catch (error) {
      return { error: 'Invalid credentials. Use demo accounts: abc/123, seller/123, agent/123, admin/admin123' };
    }
  };

  const signUp = async (userData: any) => {
    try {
      // Use backend API for user registration
      const registrationData = {
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.country_code + userData.phone_number,
        user_type: userData.user_type,
        date_of_birth: `${userData.birth_year}-${userData.birth_month.padStart(2, '0')}-${userData.birth_day.padStart(2, '0')}`,
      };

      const response = await apiService.authAPI.signUp(registrationData);
      
      if (response.error) {
        return { error: response.error };
      }

      // Set the user state with the response data
      if (response.user) {
        setUser(response.user);
        localStorage.setItem('homeown_user', JSON.stringify(response.user));
      }
      
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error. Please try again.' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('homeown_user');
    setUser(null);
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};