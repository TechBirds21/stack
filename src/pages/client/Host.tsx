import React from 'react';
import { Link } from 'react-router-dom';
import { Home, DollarSign, Shield, CheckCircle, Clock, Users, Star, FileText } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';

const Host: React.FC = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-[140px] pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="relative rounded-xl overflow-hidden mb-16">
            <img 
              src="https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg" 
              alt="Host your property" 
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#061D58]/80 to-transparent flex items-center">
              <div className="max-w-2xl p-8">
                <h1 className="text-4xl font-bold text-white mb-4">Become a Host</h1>
                <p className="text-xl text-white/90 mb-6">
                  List your property on Home & Own and connect with thousands of potential buyers and renters.
                </p>
                <button 
                  onClick={() => user ? navigate('/sell') : setShowAuthModal(true)}
                  className="bg-[#90C641] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#7DAF35] transition-colors shadow-lg"
                >
                  Start Hosting Today
                </button>
              </div>
            </div>
          </div>

          {/* Why Host Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-[#061D58] mb-8 text-center">Why Host with Home & Own?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-[#90C641] rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Maximize Your Returns</h3>
                <p className="text-gray-600">
                  Our platform helps you get the best price for your property with market insights and pricing recommendations.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-[#90C641] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Reach More Buyers</h3>
                <p className="text-gray-600">
                  Connect with thousands of verified buyers and renters actively looking for properties like yours.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-[#90C641] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Safe & Secure</h3>
                <p className="text-gray-600">
                  Our verification process ensures you deal only with genuine buyers, reducing fraud and time-wasters.
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-[#061D58] mb-8 text-center">How Hosting Works</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-[#90C641] rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Create Your Listing</h3>
                    <p className="text-gray-600">
                      Sign up as a seller, complete your verification, and list your property with photos, details, and pricing.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-[#90C641] rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Connect with Buyers</h3>
                    <p className="text-gray-600">
                      Receive inquiries and booking requests from interested buyers and renters through our platform.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-[#90C641] rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Schedule Viewings</h3>
                    <p className="text-gray-600">
                      Arrange property tours with interested parties at times that work for you.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-[#90C641] rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Close the Deal</h3>
                    <p className="text-gray-600">
                      Finalize the sale or rental agreement with your chosen buyer or tenant.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Responsible Hosting */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-[#061D58] mb-8 text-center">Responsible Hosting</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <p className="text-gray-700 mb-6">
                At Home & Own, we believe in promoting responsible hosting practices that benefit both property owners and buyers/renters. Here are some guidelines to follow:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#90C641] mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Accurate Listings</h3>
                    <p className="text-gray-600 text-sm">
                      Provide accurate and honest information about your property, including any issues or limitations.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#90C641] mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Legal Compliance</h3>
                    <p className="text-gray-600 text-sm">
                      Ensure your property meets all legal requirements and regulations for sale or rental.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#90C641] mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Transparent Communication</h3>
                    <p className="text-gray-600 text-sm">
                      Respond promptly to inquiries and be transparent about terms and conditions.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#90C641] mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Fair Pricing</h3>
                    <p className="text-gray-600 text-sm">
                      Set reasonable prices based on market conditions and property value.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#90C641] mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Respect Privacy</h3>
                    <p className="text-gray-600 text-sm">
                      Respect the privacy and personal information of potential buyers and renters.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust and Safety */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-[#061D58] mb-8 text-center">Trust and Safety</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <p className="text-gray-700 mb-6">
                Your safety and security are our top priorities. Here's how we ensure a safe environment for all users:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">For Hosts</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-blue-600 mr-2 mt-1" />
                      <span>Verified buyer profiles</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-blue-600 mr-2 mt-1" />
                      <span>Secure messaging system</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-blue-600 mr-2 mt-1" />
                      <span>Screening of potential buyers</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-blue-600 mr-2 mt-1" />
                      <span>Support for legal documentation</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">For Buyers/Renters</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-green-600 mr-2 mt-1" />
                      <span>Verified property listings</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-green-600 mr-2 mt-1" />
                      <span>Secure payment options</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-green-600 mr-2 mt-1" />
                      <span>Property inspection assistance</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-green-600 mr-2 mt-1" />
                      <span>Fraud prevention measures</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-yellow-600 mr-3 mt-1" />
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> While we take extensive measures to ensure safety, we recommend conducting your own due diligence before finalizing any property transaction. For more information, please review our <Link to="/safety-guidelines" className=\"text-[#90C641] hover:underline">Safety Guidelines</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Host Testimonials */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-[#061D58] mb-8 text-center">What Our Hosts Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#3B5998] rounded-full flex items-center justify-center text-white font-bold mr-4">
                    RS
                  </div>
                  <div>
                    <h3 className="font-semibold">Rajesh Sharma</h3>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "I sold my apartment within 3 weeks of listing on Home & Own. The verification process gave buyers confidence, and the platform made it easy to manage inquiries."
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#3B5998] rounded-full flex items-center justify-center text-white font-bold mr-4">
                    AP
                  </div>
                  <div>
                    <h3 className="font-semibold">Anita Patel</h3>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "As a property owner with multiple rentals, Home & Own has simplified my life. The tenant screening process is thorough, and I've found reliable tenants every time."
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#3B5998] rounded-full flex items-center justify-center text-white font-bold mr-4">
                    VK
                  </div>
                  <div>
                    <h3 className="font-semibold">Vikram Kumar</h3>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <Star className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "The support team at Home & Own is exceptional. When I had questions about pricing my property, they provided market insights that helped me set the right price."
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[#3B5998] to-[#061D58] rounded-xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Hosting?</h2>
            <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">
              Join thousands of successful hosts on Home & Own and start earning from your property today.
            </p>
            <button 
              onClick={() => user ? navigate('/sell') : setShowAuthModal(true)}
              className="bg-[#90C641] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#7DAF35] transition-colors shadow-lg"
            >
              List Your Property
            </button>
          </div>
        </div>
      </main>

      <Footer />
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
        userType="seller"
      />
    </div>
  );
};

export default Host;