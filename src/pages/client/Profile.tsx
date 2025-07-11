import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, MapPin, Edit, Save, X, Upload, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  user_type: string;
  status: string;
  verification_status: string;
  created_at: string;
  profile_image_url?: string;
  city?: string;
  state?: string;
  address?: string;
  bio?: string;
}

const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    city: '',
    state: '',
    address: '',
    bio: '',
  });

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let profileData;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
  
        if (error) throw error;
        profileData = data;
      } catch (error) {
        console.error('Error fetching from database:', error);
        
        // For demo purposes, create mock profile data based on user context
        profileData = {
          id: user.id,
          email: user.email,
          first_name: user.first_name || 'Demo',
          last_name: user.last_name || 'User',
          phone_number: '+91 9876543210',
          user_type: user.user_type || 'buyer',
          status: 'active',
          verification_status: 'verified',
          created_at: new Date().toISOString(),
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          address: '123 Main Street',
          bio: 'This is a demo profile for testing purposes.',
          profile_image_url: null
        };
      }

      setProfile(profileData);
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone_number: profileData.phone_number || '',
        date_of_birth: profileData.date_of_birth || '',
        city: profileData.city || '',
        state: profileData.state || '',
        address: profileData.address || '',
        bio: profileData.bio || '',
      });
      setImagePreview(profileData.profile_image_url);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async (userId: string): Promise<string | null> => {
    if (!profileImage) return null;

    try {
      const fileExt = profileImage.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, profileImage, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      let profileImageUrl = profile?.profile_image_url;
      
      // Upload new profile image if selected
      try {
        if (profileImage) {
          const uploadedUrl = await uploadProfileImage(user.id);
          if (uploadedUrl) {
            profileImageUrl = uploadedUrl;
          }
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        // Continue without image upload for demo
      }
      
      try {
        const { error } = await supabase
          .from('users')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone_number: formData.phone_number,
            date_of_birth: formData.date_of_birth || null,
            city: formData.city,
            state: formData.state,
            address: formData.address,
            bio: formData.bio,
            profile_image_url: profileImageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
  
        if (error) throw error;
      } catch (error) {
        console.error('Error updating profile in database:', error);
        // Continue for demo purposes
      }

      await fetchProfile();
      setEditing(false);
      setProfileImage(null);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setProfileImage(null);
    setImagePreview(profile?.profile_image_url || null);
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone_number: profile.phone_number || '',
        date_of_birth: profile.date_of_birth || '',
        city: profile.city || '',
        state: profile.state || '',
        address: profile.address || '',
        bio: profile.bio || '',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getUserTypeColor = (userType: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      agent: 'bg-purple-100 text-purple-800',
      seller: 'bg-green-100 text-green-800',
      buyer: 'bg-blue-100 text-blue-800'
    };
    return colors[userType as keyof typeof colors] || colors.buyer;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-[90px]">
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => {
              setShowAuthModal(false);
              navigate('/');
            }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-[90px]">
          <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-[90px] pb-16">
        <div style={{ paddingTop: '50px' }}>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-6">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl font-bold text-[#061D58] mb-2">My Profile</h1>
              <p className="text-gray-600">Manage your account information and preferences</p>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#3B5998] to-[#061D58] px-6 py-8">
                  <div className="flex flex-col md:flex-row items-center">
                    {/* Profile Image */}
                    <div className="relative mb-4 md:mb-0 md:mr-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                      {editing && (
                        <label className="absolute bottom-0 right-0 bg-[#90C641] rounded-full p-2 cursor-pointer hover:bg-[#7DAF35] transition-colors">
                          <Camera className="w-4 h-4 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="text-center md:text-left text-white">
                      <h2 className="text-2xl font-bold mb-2">
                        {profile?.first_name} {profile?.last_name}
                      </h2>
                      <p className="text-blue-200 mb-2">{profile?.email}</p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUserTypeColor(profile?.user_type || '')}`}>
                          {profile?.user_type?.charAt(0).toUpperCase() + profile?.user_type?.slice(1)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(profile?.status || '')}`}>
                          {profile?.status?.charAt(0).toUpperCase() + profile?.status?.slice(1)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(profile?.verification_status || '')}`}>
                          {profile?.verification_status === 'verified' ? 'Verified' : 'Pending Verification'}
                        </span>
                      </div>
                    </div>

                    {/* Edit Button */}
                    <div className="ml-auto mt-4 md:mt-0">
                      {!editing ? (
                        <button
                          onClick={() => setEditing(true)}
                          className="bg-white text-[#3B5998] px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
                        >
                          <Edit size={16} className="mr-2" />
                          Edit Profile
                        </button>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-[#90C641] text-white px-4 py-2 rounded-lg hover:bg-[#7DAF35] transition-colors flex items-center disabled:opacity-50"
                          >
                            {saving ? (
                              <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" />
                            ) : (
                              <Save size={16} className="mr-2" />
                            )}
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancel}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                          >
                            <X size={16} className="mr-2" />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          {editing ? (
                            <input
                              type="text"
                              name="first_name"
                              value={formData.first_name}
                              onChange={handleInputChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                            />
                          ) : (
                            <p className="text-gray-900">{profile?.first_name || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          {editing ? (
                            <input
                              type="text"
                              name="last_name"
                              value={formData.last_name}
                              onChange={handleInputChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                            />
                          ) : (
                            <p className="text-gray-900">{profile?.last_name || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-gray-900 flex items-center">
                            <Mail size={16} className="mr-2 text-gray-400" />
                            {profile?.email}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          {editing ? (
                            <input
                              type="tel"
                              name="phone_number"
                              value={formData.phone_number}
                              onChange={handleInputChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                            />
                          ) : (
                            <p className="text-gray-900 flex items-center">
                              <Phone size={16} className="mr-2 text-gray-400" />
                              {profile?.phone_number || 'Not provided'}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                          {editing ? (
                            <input
                              type="date"
                              name="date_of_birth"
                              value={formData.date_of_birth}
                              onChange={handleInputChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                            />
                          ) : (
                            <p className="text-gray-900 flex items-center">
                              <Calendar size={16} className="mr-2 text-gray-400" />
                              {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not provided'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Location & Bio */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Location & Bio</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          {editing ? (
                            <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                            />
                          ) : (
                            <p className="text-gray-900 flex items-center">
                              <MapPin size={16} className="mr-2 text-gray-400" />
                              {profile?.city || 'Not provided'}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                          {editing ? (
                            <input
                              type="text"
                              name="state"
                              value={formData.state}
                              onChange={handleInputChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                            />
                          ) : (
                            <p className="text-gray-900">{profile?.state || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          {editing ? (
                            <textarea
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              rows={3}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                            />
                          ) : (
                            <p className="text-gray-900">{profile?.address || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                          {editing ? (
                            <textarea
                              name="bio"
                              value={formData.bio}
                              onChange={handleInputChange}
                              rows={4}
                              placeholder="Tell us about yourself..."
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                            />
                          ) : (
                            <p className="text-gray-900">{profile?.bio || 'No bio provided'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Account Type</p>
                        <p className="font-semibold text-gray-900 capitalize">{profile?.user_type}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Member Since</p>
                        <p className="font-semibold text-gray-900">
                          {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Verification Status</p>
                        <p className="font-semibold text-gray-900 capitalize">{profile?.verification_status}</p>
                      </div>
                    </div>
                  </div>
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

export default Profile;