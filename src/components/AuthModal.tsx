import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  userType?: 'buyer' | 'seller' | 'agent';
  redirectTo?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'signin',
  userType = 'buyer',
  redirectTo
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    user_type: userType,
    phone_number: '',
    country_code: '+91',
    birth_month: '',
    birth_day: '',
    birth_year: '',
    city: '',
    state: '',
    id_document: null as File | null,
    address_document: null as File | null,
    terms_accepted: false,
    // Agent specific fields
    agency_name: '',
    license_number: '',
    experience_years: '',
    specialization: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: file
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (mode === 'signin') {
        result = await signIn(formData.email, formData.password);
      } else {
        // Validate signup form
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        
        if (!formData.terms_accepted) {
          setError('Please accept the terms of service');
          setLoading(false);
          return;
        }

        // Prepare user data for signup
        const userData = {
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.country_code + formData.phone_number,
          user_type: userType,
          birth_month: formData.birth_month,
          birth_day: formData.birth_day,
          birth_year: formData.birth_year,
          city: formData.city,
          state: formData.state,
          agency_name: formData.agency_name,
          license_number: formData.license_number,
          experience_years: formData.experience_years,
          specialization: formData.specialization,
        };

        result = await signUp(userData);
        
        // Handle document uploads if signup was successful
        if (!result.error && formData.id_document) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
              const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(`id/${user.id}/${formData.id_document.name}`, formData.id_document);
                
              if (uploadError) {
                console.error('Error uploading ID document:', uploadError);
              }
              
              if (formData.address_document) {
                const { error: addressError } = await supabase.storage
                  .from('documents')
                  .upload(`address/${user.id}/${formData.address_document.name}`, formData.address_document);
                  
                if (addressError) {
                  console.error('Error uploading address document:', addressError);
                }
              }
            }
          } catch (error) {
            console.error('Error handling document uploads:', error);
          }
        }
      }

      if (result.error) {
        setError(result.error);
      } else {
        onClose();
        // Redirect if specified
        if (redirectTo) {
          setTimeout(() => {
            window.location.href = redirectTo;
          }, 100);
            window.location.href = redirectTo;
          }, 100);
        }
        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          first_name: '',
          last_name: '',
          user_type: userType,
          phone_number: '',
          country_code: '+91',
          birth_month: '',
          birth_day: '',
          birth_year: '',
          city: '',
          state: '',
          id_document: null,
          address_document: null,
          terms_accepted: false,
          agency_name: '',
          license_number: '',
          experience_years: '',
          specialization: '',
        });
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    if (mode === 'signin') return 'SIGN IN';
    
    switch (userType) {
      case 'buyer': return 'BUYER SIGN UP';
      case 'seller': return 'SELLER SIGN UP';
      case 'agent': return 'AGENT SIGN UP';
      default: return 'SIGN UP';
    }
  };

  const getPlaceholderCredentials = () => {
    switch (userType) {
      case 'buyer': return 'abc=buyer';
      case 'seller': return 'seller=seller';
      case 'agent': return 'agent=agent';
      default: return 'abc=buyer';
    }
  };

  const getModalColors = () => {
    switch (userType) {
      case 'buyer': return {
        header: 'bg-[#1E3A8A]',
        button: 'bg-[#90C641] hover:bg-[#7DAF35]',
        focus: 'focus:ring-[#90C641]'
      };
      case 'seller': return {
        header: 'bg-[#059669]',
        button: 'bg-[#059669] hover:bg-[#047857]',
        focus: 'focus:ring-[#059669]'
      };
      case 'agent': return {
        header: 'bg-[#7C3AED]',
        button: 'bg-[#7C3AED] hover:bg-[#6D28D9]',
        focus: 'focus:ring-[#7C3AED]'
      };
      default: return {
        header: 'bg-[#1E3A8A]',
        button: 'bg-[#90C641] hover:bg-[#7DAF35]',
        focus: 'focus:ring-[#90C641]'
      };
    }
  };

  const colors = getModalColors();
  const countryCodes = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'United States' },
    { code: '+44', country: 'United Kingdom' },
    { code: '+86', country: 'China' },
    { code: '+81', country: 'Japan' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+39', country: 'Italy' },
    { code: '+34', country: 'Spain' },
    { code: '+7', country: 'Russia' },
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - i);

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className={`${colors.header} text-white p-6 text-center relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200"
          >
            <X size={24} />
          </button>
          <div className="flex items-center justify-center mb-2">
            <img
              src="https://qnaixvfssjdwdwhmvnyt.supabase.co/storage/v1/object/sign/Foodlu-Pickles/HomeandOwn-Logo-white.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJGb29kbHUtUGlja2xlcy9Ib21lYW5kT3duLUxvZ28td2hpdGUucG5nIiwiaWF0IjoxNzQ1MTM1MjIzLCJleHAiOjE3OTY5NzUyMjN9.UHJ1y1O95ZdO26aduzYKkFSlWOw0_PtMpNajPL8Lj1M"
              alt="Home & Own"
              className="h-8 w-auto"
            />
          </div>
          <h2 className="text-xl font-bold">
            {getModalTitle()}
          </h2>
          <p className="text-sm opacity-90 mt-1">
            {mode === 'signin' 
              ? `Welcome back! Sign in to your ${userType} account`
              : `Join as a ${userType} and start your journey with us`
            }
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signin' ? (
              <>
                <input
                  type="text"
                  name="email"
                  placeholder={`Username (${getPlaceholderCredentials()})`}
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus}`}
                  required
                />

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password (use: 123)"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus} pr-12`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Demo Account Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Demo Accounts:</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>Buyer:</strong> abc / 123</p>
                    <p><strong>Seller:</strong> seller / 123</p>
                    <p><strong>Agent:</strong> agent / 123</p>
                    <p><strong>Admin:</strong> admin / admin123</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus}`}
                    required
                  />
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus}`}
                    required
                  />
                </div>

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus}`}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <select
                    name="country_code"
                    value={formData.country_code}
                    onChange={handleInputChange}
                    className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus}`}
                    required
                  >
                    {countryCodes.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.code} {country.country}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="phone_number"
                    placeholder="Phone Number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus}`}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus}`}
                    required
                  >
                    <option value="">Select City</option>
                    <option value="Visakhapatnam">Visakhapatnam</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Pune">Pune</option>
                    <option value="Kolkata">Kolkata</option>
                  </select>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus}`}
                    required
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus} pr-12`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus} pr-12`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Agent-specific fields */}
                {userType === 'agent' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="agency_name"
                        placeholder="Agency Name"
                        value={formData.agency_name}
                        onChange={handleInputChange}
                        className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus}`}
                      />
                      <input
                        type="text"
                        name="license_number"
                        placeholder="License Number"
                        value={formData.license_number}
                        onChange={handleInputChange}
                        className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus}`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        name="experience_years"
                        placeholder="Experience (Years)"
                        value={formData.experience_years}
                        onChange={handleInputChange}
                        className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus}`}
                      />
                      <select
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus}`}
                      >
                        <option value="">Specialization</option>
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="industrial">Industrial</option>
                        <option value="luxury">Luxury Properties</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Birthday Section */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Birthday</strong><br />
                    To sign up, you need to be at least 18. Other people who use Home & Own won't see your birthday.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <select
                      name="birth_month"
                      value={formData.birth_month}
                      onChange={handleInputChange}
                      className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus}`}
                      required
                    >
                      <option value="">Month</option>
                      {months.map((month, index) => (
                        <option key={month} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <select
                      name="birth_day"
                      value={formData.birth_day}
                      onChange={handleInputChange}
                      className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus}`}
                      required
                    >
                      <option value="">Day</option>
                      {days.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <select
                      name="birth_year"
                      value={formData.birth_year}
                      onChange={handleInputChange}
                      className={`w-full p-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 ${colors.focus}`}
                      required
                    >
                      <option value="">Year</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Document Upload Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block w-full">
                      <div className={`${colors.header} text-white p-3 rounded-lg text-center cursor-pointer hover:opacity-90 transition-colors`}>
                        <Upload className="inline mr-2" size={16} />
                        ID Document *
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'id_document')}
                        className="hidden"
                        required
                      />
                    </label>
                    {formData.id_document && (
                      <p className="text-xs text-green-600 mt-1">
                        {formData.id_document.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block w-full">
                      <div className={`${colors.header} text-white p-3 rounded-lg text-center cursor-pointer hover:opacity-90 transition-colors`}>
                        <Upload className="inline mr-2" size={16} />
                        Address Document
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'address_document')}
                        className="hidden"
                      />
                    </label>
                    {formData.address_document && (
                      <p className="text-xs text-green-600 mt-1">
                        {formData.address_document.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="terms_accepted"
                    checked={formData.terms_accepted}
                    onChange={handleInputChange}
                    className="mt-1 mr-3"
                    required
                  />
                  <p className="text-sm text-gray-600">
                    By Clicking Signup, I agree to Home & Own's{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Terms Of Services
                    </a>
                  </p>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${colors.button} text-white py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center font-bold`}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={20} />
              ) : null}
              {mode === 'signin' ? 'SIGN IN' : 'SIGN UP'}
            </button>
          </form>

          {mode === 'signup' && (
            <>
              <div className="my-6 text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="flex justify-center space-x-4 mb-6">
                <button className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors">
                  <span className="text-lg font-bold">G</span>
                </button>
                <button className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                  <span className="text-lg font-bold">f</span>
                </button>
                <button className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 transition-colors">
                  <span className="text-lg font-bold">G</span>
                </button>
                <button className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors">
                  <span className="text-lg font-bold">W</span>
                </button>
              </div>
            </>
          )}

          <div className="text-center">
            <p className={`text-white ${colors.header} p-2 rounded`}>
              {mode === 'signin' ? "Don't have an account? " : "Already Have An Account? "}
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-yellow-300 hover:underline font-medium"
              >
                {mode === 'signin' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;