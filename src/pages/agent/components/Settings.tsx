import React, { useState } from 'react';
import { Settings, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface SettingsProps {
  user: any;
  agentProfile: any;
  setAgentProfile: (profile: any) => void;
  setShowPasswordModal: (show: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  user, 
  agentProfile, 
  setAgentProfile, 
  setShowPasswordModal 
}) => {
  const [saving, setSaving] = useState(false);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Check if agent profile exists
      const { data, error } = await supabase
        .from('agent_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        // Update existing profile
        await supabase
          .from('agent_profiles')
          .update({
            education_background: agentProfile.education_background,
            specialization: agentProfile.specialization,
            bio: agentProfile.bio, 
            bank_account_number: agentProfile.bank_account_number,
            ifsc_code: agentProfile.ifsc_code,
            account_verified: accountVerified,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id);
      } else {
        // Create new profile
        await supabase
          .from('agent_profiles')
          .insert({
            user_id: user?.id,
            education_background: agentProfile.education_background,
            specialization: agentProfile.specialization,
            bio: agentProfile.bio,
            bank_account_number: agentProfile.bank_account_number,
            ifsc_code: agentProfile.ifsc_code,
            account_verified: accountVerified
          });
      }
      
      // Update user table
      await supabase
        .from('users')
        .update({
          phone_number: agentProfile.phone_number,
          city: agentProfile.city,
          state: agentProfile.state,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);
        
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const verifyBankAccount = () => {
    if (!agentProfile.bank_account_number || !confirmAccountNumber || !agentProfile.ifsc_code) {
      toast.error('Please fill in all bank account details');
      return;
    }
    
    if (agentProfile.bank_account_number !== confirmAccountNumber) {
      toast.error('Account numbers do not match');
      return;
    }
    
    setVerifyingAccount(true);
    
    // Simulate verification process
    setTimeout(() => {
      setAccountVerified(true);
      setVerifyingAccount(false);
      toast.success('Bank account verified successfully!');
    }, 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-[#061D58] mb-4 flex items-center">
        <Settings className="mr-2 h-5 w-5" />
        Agent Settings
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Profile Information</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text" 
                value={agentProfile?.first_name || ''}
                className="w-full p-2 border border-gray-300 rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text" 
                value={agentProfile?.last_name || ''}
                className="w-full p-2 border border-gray-300 rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
              <input
                type="text" 
                value={agentProfile?.agent_license_number || 'Not assigned'}
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">License number cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education Background</label>
              <input
                type="text"
                value={agentProfile?.education_background || ''}
                onChange={(e) => setAgentProfile({...agentProfile, education_background: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g., B.Com, MBA in Real Estate"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Contact Information</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email" 
                value={user?.email || ''}
                className="w-full p-2 border border-gray-300 rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel" 
                value={agentProfile?.phone_number || ''}
                onChange={(e) => setAgentProfile({...agentProfile, phone_number: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text" 
                value={agentProfile?.city || ''}
                onChange={(e) => setAgentProfile({...agentProfile, city: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text" 
                value={agentProfile?.state || ''}
                onChange={(e) => setAgentProfile({...agentProfile, state: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Bank Account Details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
              <input
                type="text"
                value={agentProfile?.bank_account_number || ''}
                onChange={(e) => setAgentProfile({...agentProfile, bank_account_number: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter your bank account number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Account Number</label>
              <input
                type="text"
                value={confirmAccountNumber}
                onChange={(e) => setConfirmAccountNumber(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Re-enter your bank account number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={agentProfile?.ifsc_code || ''}
                onChange={(e) => setAgentProfile({...agentProfile, ifsc_code: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter bank IFSC code"
              />
            </div>
            <div>
              <button
                onClick={verifyBankAccount}
                disabled={verifyingAccount || accountVerified}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  accountVerified 
                    ? 'bg-green-100 text-green-800 cursor-default' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {verifyingAccount ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : accountVerified ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verified
                  </>
                ) : (
                  'Verify Account'
                )}
              </button>
              {!accountVerified && !verifyingAccount && (
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Account verification is required for commission payments
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Notification Preferences</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span className="text-sm">Email notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span className="text-sm">SMS notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span className="text-sm">In-app notifications</span>
            </label>
          </div>
          
          <h4 className="font-medium text-gray-800 mb-3">Specialization</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area of Expertise</label>
              <select
                value={agentProfile?.specialization || ''}
                onChange={(e) => setAgentProfile({...agentProfile, specialization: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Specialization</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Luxury">Luxury Properties</option>
                <option value="Investment">Investment Properties</option>
                <option value="Land">Land & Plots</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={agentProfile?.bio || ''}
                onChange={(e) => setAgentProfile({...agentProfile, bio: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Tell clients about yourself and your expertise..."
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h4 className="font-medium text-gray-800 mb-3">Account Security</h4>
        <div className="space-y-4">
          <div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="bg-[#3B5998] text-white px-4 py-2 rounded-lg hover:bg-[#2d4373] transition-colors flex items-center"
            >
              <Settings size={16} className="mr-2" />
              Change Password
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <p>Last password change: Never</p>
            <p>Two-factor authentication: Not enabled</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleSaveChanges}
          disabled={saving}
          className="bg-[#90C641] text-white px-6 py-2 rounded-lg hover:bg-[#7DAF35] transition-colors flex items-center"
        >
          {saving && <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default Settings;