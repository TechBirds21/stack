import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Download,
  User,
  Building,
  CreditCard,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SellerProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  experience_years: number;
  license_number: string;
  pan_number: string;
  gst_number: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bank_account: string;
  ifsc_code: string;
  documents: any;
  verification_status: 'pending' | 'approved' | 'rejected';
  status: string;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
}

const SellerApprovals: React.FC = () => {
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchSellers();
  }, [filter]);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('seller_profiles')
        .select(`
          *,
          users (
            first_name,
            last_name,
            email,
            phone_number
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('verification_status', filter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setSellers(data || []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSellerStatus = async (sellerId: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      const { error } = await supabase
        .from('seller_profiles')
        .update({ 
          verification_status: status,
          verification_reason: reason,
          verified_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', sellerId);

      if (error) throw error;

      // Update user verification status
      const seller = sellers.find(s => s.id === sellerId);
      if (seller) {
        await supabase
          .from('users')
          .update({ 
            verification_status: status === 'approved' ? 'verified' : 'rejected'
          })
          .eq('id', seller.user_id);
      }

      fetchSellers();
      setSelectedSeller(null);
      alert(`Seller ${status} successfully!`);
    } catch (error) {
      console.error('Error updating seller status:', error);
      alert('Failed to update seller status');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    
    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const downloadDocument = async (documentPath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(documentPath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seller Approvals</h1>
        <div className="flex space-x-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === status
                  ? 'bg-[#90C641] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seller Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applied Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sellers.map((seller) => (
              <tr key={seller.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-[#90C641] flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {seller.users.first_name} {seller.users.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{seller.users.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{seller.business_name}</div>
                  <div className="text-sm text-gray-500">{seller.business_type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(seller.verification_status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(seller.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setSelectedSeller(seller)}
                    className="text-[#90C641] hover:text-[#7DAF35] mr-4"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {seller.verification_status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateSellerStatus(seller.id, 'approved')}
                        className="text-green-600 hover:text-green-900 mr-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateSellerStatus(seller.id, 'rejected')}
                        className="text-red-600 hover:text-red-900"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Seller Details Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Seller Details</h2>
                <button
                  onClick={() => setSelectedSeller(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {selectedSeller.users.first_name} {selectedSeller.users.last_name}</p>
                    <p><strong>Email:</strong> {selectedSeller.users.email}</p>
                    <p><strong>Phone:</strong> {selectedSeller.users.phone_number}</p>
                  </div>
                </div>

                {/* Business Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Business Information
                  </h3>
                  <div className="space-y-2">
                    <p><strong>Business Name:</strong> {selectedSeller.business_name}</p>
                    <p><strong>Business Type:</strong> {selectedSeller.business_type}</p>
                    <p><strong>Experience:</strong> {selectedSeller.experience_years} years</p>
                    <p><strong>License Number:</strong> {selectedSeller.license_number || 'N/A'}</p>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Financial Information
                  </h3>
                  <div className="space-y-2">
                    <p><strong>PAN Number:</strong> {selectedSeller.pan_number}</p>
                    <p><strong>GST Number:</strong> {selectedSeller.gst_number || 'N/A'}</p>
                    <p><strong>Bank Account:</strong> {selectedSeller.bank_account}</p>
                    <p><strong>IFSC Code:</strong> {selectedSeller.ifsc_code}</p>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Address Information
                  </h3>
                  <div className="space-y-2">
                    <p><strong>Address:</strong> {selectedSeller.address}</p>
                    <p><strong>City:</strong> {selectedSeller.city}</p>
                    <p><strong>State:</strong> {selectedSeller.state}</p>
                    <p><strong>Pincode:</strong> {selectedSeller.pincode}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(selectedSeller.documents || {}).map(([key, path]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {key.replace('_', ' ').toUpperCase()}
                        </span>
                        <button
                          onClick={() => downloadDocument(path as string, `${key}.pdf`)}
                          className="text-[#90C641] hover:text-[#7DAF35]"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selectedSeller.verification_status === 'pending' && (
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={() => updateSellerStatus(selectedSeller.id, 'rejected')}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => updateSellerStatus(selectedSeller.id, 'approved')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerApprovals;