import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const Sell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    experience_years: '',
    license_number: '',
    pan_number: '',
    gst_number: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    bank_account: '',
    ifsc_code: '',
    documents: {
      pan_card: null as File | null,
      business_license: null as File | null,
      address_proof: null as File | null,
      bank_statement: null as File | null,
      gst_certificate: null as File | null,
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [fieldName]: file
        }
      }));
    }
  };

  const uploadDocument = async (file: File, folder: string, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (error) throw error;
    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    try {
      // Upload documents
      const documentUrls: any = {};
      for (const [key, file] of Object.entries(formData.documents)) {
        if (file) {
          documentUrls[key] = await uploadDocument(file, 'seller-documents', user.id);
        }
      }

      // Create seller profile
      const { error } = await supabase
        .from('seller_profiles')
        .insert({
          user_id: user.id,
          business_name: formData.business_name,
          business_type: formData.business_type,
          experience_years: parseInt(formData.experience_years),
          license_number: formData.license_number,
          pan_number: formData.pan_number,
          gst_number: formData.gst_number,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          bank_account: formData.bank_account,
          ifsc_code: formData.ifsc_code,
          documents: documentUrls,
          verification_status: 'pending',
          status: 'pending'
        });

      if (error) throw error;

      // Update user type to seller
      await supabase
        .from('users')
        .update({ user_type: 'seller', verification_status: 'pending' })
        .eq('id', user.id);

      setStep(3); // Success step
    } catch (error) {
      console.error('Error submitting seller application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#061D58] mb-4">Start Selling Properties</h1>
        <p className="text-gray-600 text-lg">Join thousands of property sellers on our platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <Upload className="w-16 h-16 text-[#90C641] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Easy Listing</h3>
          <p className="text-gray-600">Upload your property details and photos in minutes</p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <Shield className="w-16 h-16 text-[#90C641] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Verified Platform</h3>
          <p className="text-gray-600">All sellers are verified for buyer confidence</p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <CheckCircle className="w-16 h-16 text-[#90C641] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Quick Sales</h3>
          <p className="text-gray-600">Connect with serious buyers faster</p>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={() => user ? setStep(2) : setShowAuthModal(true)}
          className="bg-[#90C641] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#7DAF35] transition-colors"
        >
          {user ? 'Start Verification Process' : 'Sign Up to Start Selling'}
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#061D58] mb-4">Seller Verification</h1>
        <p className="text-gray-600">Please provide the following information to verify your account</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
            <select
              name="business_type"
              value={formData.business_type}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
              required
            >
              <option value="">Select Business Type</option>
              <option value="individual">Individual</option>
              <option value="partnership">Partnership</option>
              <option value="company">Company</option>
              <option value="llp">LLP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years) *</label>
            <input
              type="number"
              name="experience_years"
              value={formData.experience_years}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
            <input
              type="text"
              name="license_number"
              value={formData.license_number}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number *</label>
            <input
              type="text"
              name="pan_number"
              value={formData.pan_number}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
            <input
              type="text"
              name="gst_number"
              value={formData.gst_number}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
            />
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                required
              />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Banking Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account Number *</label>
              <input
                type="text"
                name="bank_account"
                value={formData.bank_account}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code *</label>
              <input
                type="text"
                name="ifsc_code"
                value={formData.ifsc_code}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                required
              />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Document Upload</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'pan_card', label: 'PAN Card *', required: true },
              { key: 'business_license', label: 'Business License', required: false },
              { key: 'address_proof', label: 'Address Proof *', required: true },
              { key: 'bank_statement', label: 'Bank Statement *', required: true },
              { key: 'gst_certificate', label: 'GST Certificate', required: false },
            ].map(({ key, label, required }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                <label className="block w-full">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[#90C641] transition-colors">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">
                      {formData.documents[key as keyof typeof formData.documents]?.name || 'Click to upload'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, key)}
                    className="hidden"
                    required={required}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-2xl mx-auto text-center">
      <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-[#061D58] mb-4">Application Submitted!</h1>
      <p className="text-gray-600 text-lg mb-8">
        Your seller verification application has been submitted successfully. 
        Our team will review your documents and get back to you within 2-3 business days.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">What's Next?</h3>
        <ul className="text-left text-blue-700 space-y-2">
          <li className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Document verification (1-2 days)
          </li>
          <li className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Background check (1-2 days)
          </li>
          <li className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Account activation
          </li>
        </ul>
      </div>
      <button
        onClick={() => navigate('/')}
        className="bg-[#90C641] text-white px-8 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors"
      >
        Back to Home
      </button>
    </div>
  );

  return (
    <div className="page-content min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pb-16">
        <div className="container mx-auto px-4">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </main>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
      />
    </div>
  );
};

export default Sell;