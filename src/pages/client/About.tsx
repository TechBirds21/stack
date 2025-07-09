import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, Users, Phone, Mail, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-[140px] pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-12">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-[#061D58] mb-4">About Home & Own</h1>
              <p className="text-lg text-gray-600">
                We're on a mission to make property buying, selling, and renting simple, transparent, and accessible for everyone.
              </p>
            </div>
          </div>

          {/* Our Story */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-[#061D58] mb-6">Our Story</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <p className="text-gray-700 mb-4">
                Home & Own was founded in 2023 with a simple vision: to transform India's real estate market by connecting property owners directly with buyers and renters, eliminating unnecessary intermediaries and making the process more transparent.
              </p>
              <p className="text-gray-700 mb-4">
                Our founder, frustrated by the complexity and opacity of traditional property transactions, set out to build a platform that would empower both property owners and seekers with the tools and information they need to make confident decisions.
              </p>
              <p className="text-gray-700">
                Today, Home & Own is one of India's fastest-growing property platforms, serving thousands of users across major cities with a focus on transparency, trust, and technology.
              </p>
            </div>
          </div>

          {/* Our Values */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-[#061D58] mb-6 text-center">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-[#90C641] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Trust & Transparency</h3>
                <p className="text-gray-600">
                  We verify all listings and users to ensure a safe and trustworthy platform for everyone.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-[#90C641] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Community First</h3>
                <p className="text-gray-600">
                  We build features that serve the needs of our community of property owners, buyers, and renters.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-[#90C641] rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Simplicity</h3>
                <p className="text-gray-600">
                  We make complex processes simple, from property listing to final transaction.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Policy Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-[#061D58] mb-6">Privacy Policy</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <p className="text-gray-700 mb-4">
                At Home & Own, we take your privacy seriously. Our privacy policy outlines how we collect, use, and protect your personal information.
              </p>
              <h3 className="text-lg font-semibold mb-2">Information We Collect</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Personal information such as name, email, and phone number</li>
                <li>Property details when you list a property</li>
                <li>Transaction information when you buy, sell, or rent</li>
                <li>Usage data to improve our services</li>
              </ul>
              <h3 className="text-lg font-semibold mb-2">How We Use Your Information</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>To provide and improve our services</li>
                <li>To connect buyers with sellers and renters with owners</li>
                <li>To verify user identities and prevent fraud</li>
                <li>To communicate important updates and offers</li>
              </ul>
              <p className="text-gray-700">
                For the complete privacy policy, please <Link to="/privacy-policy" className="text-[#90C641] hover:underline">click here</Link>.
              </p>
            </div>
          </div>

          {/* Terms of Service */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-[#061D58] mb-6">Terms Of Services</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <p className="text-gray-700 mb-4">
                By using Home & Own, you agree to our Terms of Service, which govern your use of our platform and services.
              </p>
              <h3 className="text-lg font-semibold mb-2">Key Terms</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>User responsibilities and account security</li>
                <li>Property listing guidelines and requirements</li>
                <li>Transaction processes and payment terms</li>
                <li>Dispute resolution procedures</li>
                <li>Limitation of liability and disclaimers</li>
              </ul>
              <p className="text-gray-700">
                For the complete terms of service, please <Link to="/terms-of-service" className="text-[#90C641] hover:underline">click here</Link>.
              </p>
            </div>
          </div>

          {/* Blogs */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#061D58]">Our Blog</h2>
              <Link to="/blogs" className="text-[#90C641] hover:underline font-medium">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg" 
                  alt="Real Estate Investment Tips" 
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Top 10 Real Estate Investment Tips for 2025</h3>
                  <p className="text-gray-600 mb-4">
                    Learn the best strategies for real estate investment in the current market.
                  </p>
                  <Link to="/blog/investment-tips" className="text-[#90C641] hover:underline font-medium">Read More →</Link>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg" 
                  alt="Home Buying Guide" 
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">First-Time Home Buyer's Complete Guide</h3>
                  <p className="text-gray-600 mb-4">
                    Everything you need to know before purchasing your first property.
                  </p>
                  <Link to="/blog/home-buying-guide" className="text-[#90C641] hover:underline font-medium">Read More →</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Us */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#061D58] mb-6">Contact Us</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Get In Touch</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-[#90C641] mr-3" />
                      <span className="text-gray-700">+91 9876543210</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-[#90C641] mr-3" />
                      <span className="text-gray-700">support@homeandown.com</span>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-[#90C641] mr-3 mt-1" />
                      <span className="text-gray-700">
                        Chandanagar, Hyderabad<br />
                        Telangana-500050
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Send Us a Message</h3>
                  <form className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        placeholder="Your Name" 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                      />
                    </div>
                    <div>
                      <input 
                        type="email" 
                        placeholder="Your Email" 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                      />
                    </div>
                    <div>
                      <textarea 
                        placeholder="Your Message" 
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                      ></textarea>
                    </div>
                    <button 
                      type="submit"
                      className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors font-medium"
                    >
                      Send Message
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;