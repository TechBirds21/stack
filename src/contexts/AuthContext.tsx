import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
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

  // Helper function to validate UUID format
  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Helper function to safely set user with UUID validation
  const setUserSafely = (userData: User | null) => {
    if (userData && !isValidUUID(userData.id)) {
      console.warn('Invalid UUID format for user ID:', userData.id);
      setUser(null);
      localStorage.removeItem('user');
      return;
    }
    setUser(userData);
  };

  // Helper function to validate UUID format
  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Helper function to safely set user with UUID validation
  const setUserSafely = (userData: User | null) => {
    if (userData && !isValidUUID(userData.id)) {
      console.warn('Invalid UUID format for user ID:', userData.id);
      setUser(null);
      localStorage.removeItem('user');
      return;
    }
    setUser(userData);
  };

  useEffect(() => {
    // Check localStorage first
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Validate that the user ID is a proper UUID
        if (parsedUser.id && isValidUUID(parsedUser.id)) {
          setUser(parsedUser);
          setLoading(false);
          return;
        } else {
          // Clear invalid user data from localStorage
          localStorage.removeItem('user');
        }
      } catch (error) {
        localStorage.removeItem('user');
      }
    }

    // Check localStorage first
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Validate that the user ID is a proper UUID
        if (parsedUser.id && isValidUUID(parsedUser.id)) {
          setUser(parsedUser);
          setLoading(false);
          return;
        } else {
          // Clear invalid user data from localStorage
          localStorage.removeItem('user');
        }
      } catch (error) {
        localStorage.removeItem('user');
      }
    }

    // Check for existing Supabase session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, user_type')
            .eq('id', session.user.id)
            .single();
          
          if (userData) {
            setUserSafely(userData);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, user_type')
            .eq('id', session.user.id)
            .single();
          
          if (userData) {
            setUserSafely(userData);
          }
        } else if (event === 'SIGNED_OUT') {
          setUserSafely(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Simple hardcoded login for demo
      if (email === 'abc' && password === '123') {
        const mockUser = {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'abc',
          first_name: 'Test',
          last_name: 'User',
          user_type: 'buyer'
        };
        setUserSafely(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('user', JSON.stringify(mockUser));
        return {};
      }

      // Additional demo accounts for different user types
      if (email === 'seller' && password === '123') {
        const mockSeller = {
          id: '44444444-4444-4444-4444-444444444444',
          email: 'seller',
          first_name: 'Property',
          last_name: 'Owner',
          user_type: 'seller'
        setUserSafely(mockSeller);
        setUserSafely(mockSeller);
        localStorage.setItem('user', JSON.stringify(mockSeller));
        return {};
      }

      if (email === 'agent' && password === '123') {
        const mockAgent = {
          id: '77777777-7777-7777-7777-777777777777',
          email: 'agent',
          first_name: 'Real Estate',
          last_name: 'Agent',
          user_type: 'agent'
        setUserSafely(mockAgent);
        localStorage.setItem('user', JSON.stringify(mockAgent));
        return {};
      }

      // Admin account
      if (email === 'admin' && password === 'admin123') {
        const mockAdmin = {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          email: 'admin',
          first_name: 'System',
          last_name: 'Administrator',
          user_type: 'admin'
        };
        setUserSafely(mockAgent);
        localStorage.setItem('user', JSON.stringify(mockAgent));
        localStorage.setItem('user', JSON.stringify(mockAdmin));
        return {};
      }

      // Real Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
          user_type: 'admin'

      // Fetch user profile data
      if (data.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, user_type')
          .eq('id', data.user.id)
          .single();
        
        if (userData) {
          setUserSafely(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }
      
      return {};
    } catch (error) {
      return { error: 'Invalid credentials. Use "abc" and "123" for demo.' };
    }
  };

  const signUp = async (userData: any) => {
    try {
      // First register the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            user_type: userData.user_type,
          }
        }
      });

        setUserSafely(mockAdmin);
        localStorage.setItem('user', JSON.stringify(mockAdmin));
        return { error: authError.message };
      }

      // Then create a record in the users table
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone_number: userData.country_code + userData.phone_number,
            user_type: userData.user_type,
            status: 'active',
            verification_status: 'pending',
            date_of_birth: `${userData.birth_year}-${userData.birth_month.padStart(2, '0')}-${userData.birth_day.padStart(2, '0')}`,
          });

        if (profileError) {
          return { error: profileError.message };
        }

        // Upload documents if provided
        if (userData.id_document) {
          const { error: idDocError } = await supabase.storage
            .from('documents')
            .upload(`id/${authData.user.id}/${userData.id_document.name}`, userData.id_document);
          
          if (idDocError) {
            console.error('Error uploading ID document:', idDocError);
          }
        }

        if (userData.address_document) {
          const { error: addressDocError } = await supabase.storage
            .from('documents')
            .upload(`address/${authData.user.id}/${userData.address_document.name}`, userData.address_document);
          
          if (addressDocError) {
            console.error('Error uploading address document:', addressDocError);
          }
        }

        // Set the user state
        setUserSafely({
          id: authData.user.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          user_type: userData.user_type,
        });
      }
      
      return {};
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('user');
    setUserSafely(null);
    localStorage.removeItem('user');
    setUserSafely(null);
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