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

  useEffect(() => {
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
            setUser(userData);
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
            setUser(userData);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
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
          .select('id, email, first_name, last_name, user_type')
          .eq('id', data.user.id)
          .single();
        
        if (userData) {
          setUser(userData);
          localStorage.setItem('homeown_user', JSON.stringify(userData));
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

      if (authError) {
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
        setUser({
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
    localStorage.removeItem('homeown_user');
    setUser(null);
    await supabase.auth.signOut();
  };

  // Check localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('homeown_user');
    if (savedUser && !user) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('homeown_user');
      }
    }
  }, []);

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};