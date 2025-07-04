import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Help from '../../components/Help';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Hardcoded credentials for development
    const validEmail = 'admin@homeandown.com';
    const validPassword = 'Frisco@Homeandown@2025';

    if (email === validEmail && password === validPassword) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col justify-start md:justify-center items-center px-4 py-8 md:py-0 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'url("https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1")', 
          backgroundSize: 'cover',
          filter: 'blur(3px)'
        }}></div>
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8 md:mb-12 w-full max-w-[200px] md:max-w-[280px]">
        <img 
          src="https://qnaixvfssjdwdwhmvnyt.supabase.co/storage/v1/object/sign/Foodlu-Pickles/Home&Own-Logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJGb29kbHUtUGlja2xlcy9Ib21lJk93bi1Mb2dvLnBuZyIsImlhdCI6MTc0NTEzNDI2MiwiZXhwIjoxNzc2NjcwMjYyfQ.5kNyGYdfvAjCj8yNDgBq0hWcPC3GZAOQkixhs5jp-hA"
          alt="Home & Own Logo"
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Login Form */}
      <div className="bg-blue-800 rounded-[2rem] shadow-xl p-6 md:p-8 w-full max-w-[90%] sm:max-w-md z-10 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-blue-700 rounded-b-[8rem] -translate-y-16"></div>
        
        <div className="relative z-10">
          <h2 className="text-xl md:text-2xl font-semibold text-center mb-6 md:mb-8">Sign In To Home & Own</h2>
          
          {error && (
            <div className="bg-red-500 text-white p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-3 md:p-4 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                required
              />
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-3 md:p-4 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 pr-12 text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2 rounded"
              />
              <label htmlFor="remember" className="text-sm">Remember Me</label>
            </div>
            
            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 md:py-4 px-4 rounded-2xl transition duration-200 text-base"
            >
              LOGIN
            </button>
          </form>
          
          <div className="text-center mt-4 md:mt-6">
            <a href="#" className="text-sm hover:underline">Forgotten password?</a>
          </div>
        </div>
      </div>
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
        <Help />
      </div>
    </div>
  );
};

export default Login;