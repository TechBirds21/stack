import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DollarSign, Shield, CheckCircle, Users, Star, FileText } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';

const Host: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="pt-[140px] pb-16 flex-grow">
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
                  List your property on Home &amp; Own and connect with thousands of potential buyers and renters.
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
            <h2 className="text-3xl font-bold text-[#061D58] mb-8 text-center">Why Host with Home &amp; Own?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-[#90C641] rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Maximize Your Returns</h3>
                <p className="text-gray-600">
                  Our platform helps you get the best price for your property with market insights and pricing recommendations.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-[#90C641] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Reach More Buyers</h3>
                <p className="text-gray-600">
                  Connect with thousands of verified buyers and renters actively looking for properties like yours.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-[#90C641] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Safe &amp; Secure</h3>
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
                {[ 
                  { step: 1, title: 'Create Your Listing', desc: 'Sign up as a seller, complete your verification, and list your property with photos, details, and pricing.' },
                  { step: 2, title: 'Connect with Buyers', desc: 'Receive inquiries and booking requests from interested buyers and renters through our platform.' },
                  { step: 3, title: 'Schedule Viewings', desc: 'Arrange property tours with interested parties at times that work for you.' },
                  { step: 4, title: 'Close the Deal', desc: 'Finalize the sale or rental agreement with your chosen buyer or tenant.' },
                ].map(({ step, title, desc }) => (
                  <div className="flex items-start" key={step}>
                    <div className="w-10 h-10 bg-[#90C641] rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                      {step}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{title}</h3>
                      <p className="text-gray-600">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Responsible Hosting */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-[#061D58] mb-8 text-center">Responsible Hosting</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <p className="text-gray-700 mb-6">
                At Home &amp; Own, we believe in promoting responsible hosting practices that benefit both property owners and buyers/renters. Here are some guidelines to follow:
              </p>
              {[
                { icon: <CheckCircle className="h-5 w-5 text-[#90C641] mr-3 mt-1" />, title: 'Accurate Listings', text: 'Provide accurate and honest information about your property, including any issues or limitations.' },
                { icon: <CheckCircle className="h-5 w-5 text-[#90C641] mr-3 mt-1" />, title: 'Legal Compliance', text: 'Ensure your property meets all legal requirements and regulations for sale or rental.' },
                { icon: <CheckCircle className="h-5 w-5 text-[#90C641] mr-3 mt-1" />, title: 'Transparent Communication', text: 'Respond promptly to inquiries and be transparent about terms and conditions.' },
                { icon: <CheckCircle className="h-5 w-5 text-[#90C641] mr-3 mt-1" />, title: 'Fair Pricing', text: 'Set reasonable prices based on market conditions and property value.' },
                { icon: <CheckCircle className="h-5 w-5 text-[#90C641] mr-3 mt-1" />, title: 'Respect Privacy', text: 'Respect the privacy and personal information of potential buyers and renters.' },
              ].map(({ icon, title, text }, i) => (
                <div className="flex items-start" key={i}>
                  {icon}
                  <div>
                    <h3 className="font-semibold text-gray-800">{title}</h3>
                    <p className="text-gray-600 text-sm">{text}</p>
                  </div>
                </div>
              ))}
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
                    {['Verified buyer profiles','Secure messaging system','Screening of potential buyers','Support for legal documentation']
                      .map((item, idx) => (
                        <li className="flex items-start" key={idx}>
                          <Shield className="h-5 w-5 text-blue-600 mr-2 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">For Buyers/Renters</h3>
                  <ul className="space-y-2 text-gray-700">
                    {['Verified property listings','Secure payment options','Property inspection assistance','Fraud prevention measures']
                      .map((item, idx) => (
                        <li className="flex items-start" key={idx}>
                          <Shield className="h-5 w-5 text-green-600 mr-2 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-yellow-600 mr-3 mt-1" />
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> While we take extensive measures to ensure safety, we recommend conducting your own due diligence before finalizing any property transaction. For more information, please review our{' '}
                    <Link to="/safety-guidelines" className="text-[#90C641] hover:underline">
                      Safety Guidelines
                    </Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Host Testimonials */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-[#061D58] mb-8 text-center">What Our Hosts Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  initials: 'RS',
                  name: 'Rajesh Sharma',
                  rating: 5,
                  text: 'I sold my apartment within 3 weeks of listing on Home & Own. The verification process gave buyers confidence, and the platform made it easy to manage inquiries.',
                },
                {
                  initials: 'AP',
                  name: 'Anita Patel',
                  rating: 5,
                  text: 'As a property owner with multiple rentals, Home & Own has simplified my life. The tenant screening process is thorough, and I’ve found reliable tenants every time.',
                },
                {
                  initials: 'VK',
                  name: 'Vikram Kumar',
                  rating: 4,
                  text: 'The support team at Home & Own is exceptional. When I had questions about pricing my property, they provided market insights that helped me set the right price.',
                },
              ].map(({ initials, name, rating, text }, idx) => (
                <div className="bg-white rounded-lg shadow-lg p-6" key={idx}>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-[#3B5998] rounded-full flex items-center justify-center text-white font-bold mr-4">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-semibold">{name}</h3>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'} fill-current`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[#3B5998] to-[#061D58] rounded-xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Hosting?</h2>
            <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">
              Join thousands of successful hosts on Home &amp; Own and start earning from your property today.
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
