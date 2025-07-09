import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('verify_email_token', {
        token_param: token
      });

      if (error) throw error;

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setStatus('error');
      setMessage('Failed to verify email. Please try again or contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-[90px] pb-16">
      <main className="pt-[140px] pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              {status === 'loading' && (
                <>
                  <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Verifying Email...
                  </h1>
                  <p className="text-gray-600">
                    Please wait while we verify your email address.
                  </p>
                </>
              )}

              {status === 'success' && (
                <>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-green-800 mb-2">
                    Email Verified!
                  </h1>
                  <p className="text-gray-600 mb-4">
                    {message}
                  </p>
                  <p className="text-sm text-gray-500">
                    Redirecting you to the homepage...
                  </p>
                </>
              )}

              {status === 'error' && (
                <>
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-red-800 mb-2">
                    Verification Failed
                  </h1>
                  <p className="text-gray-600 mb-6">
                    {message}
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/')}
                      className="w-full bg-[#90C641] text-white py-3 rounded-lg hover:bg-[#7DAF35] transition-colors"
                    >
                      Go to Homepage
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EmailVerification;