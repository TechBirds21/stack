import React, { useState, useEffect } from 'react';
import { Home, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  user_type: string;
  status: string;
  verification_status: string;
  profile_image_url: string;
  created_at: string;
}

const Users = () => {
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState('10');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, allUsers]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch users directly from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_type', 'buyer')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAllUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAllUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(allUsers);
      return;
    }

    const filtered = allUsers.filter(user => 
      Object.values(user).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const exportData = filteredUsers.map(user => ({
      ID: user.id,
      'First Name': user.first_name,
      'Last Name': user.last_name,
      Email: user.email,
      'Phone Number': user.phone_number || 'N/A',
      'User Type': user.user_type,
      Status: user.status,
      'Verification Status': user.verification_status,
      'Created At': new Date(user.created_at).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'users.xlsx');
  };

  const exportToCSV = () => {
    const exportData = filteredUsers.map(user => ({
      ID: user.id,
      'First Name': user.first_name,
      'Last Name': user.last_name,
      Email: user.email,
      'Phone Number': user.phone_number || 'N/A',
      'User Type': user.user_type,
      Status: user.status,
      'Verification Status': user.verification_status,
      'Created At': new Date(user.created_at).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'users.csv';
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await usersAPI.delete(id);
        fetchUsers(); // Refresh the list
        alert('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
      }
    }
  };

  const updateUserStatus = async (id: string, status: string) => {
    try {
      await usersAPI.update(id, { status });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status');
    }
  };

  const updateVerificationStatus = async (id: string, verification_status: string) => {
    try {
      await usersAPI.update(id, { verification_status });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating verification status:', error);
      alert('Error updating verification status');
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / parseInt(entriesPerPage));
  const startIndex = (currentPage - 1) * parseInt(entriesPerPage);
  const endIndex = startIndex + parseInt(entriesPerPage);
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <div className="p-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center gap-2 text-[#1E3A8A] mb-6">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <span className="text-gray-500">/</span>
        <div className="flex items-center gap-2">
          <Home size={18} />
          <span>Users</span>
        </div>
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
        <div className="bg-[#1E3A8A] p-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Users (Buyers)</h2>
          <button 
            onClick={() => navigate('add')}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Add User
          </button>
        </div>

        <div className="p-6">
          {/* Table controls */}
          <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select 
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded px-2 py-1"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span>entries</span>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={exportToExcel}
                className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#1E40AF] transition-colors"
              >
                Excel
              </button>
              <button 
                onClick={exportToCSV}
                className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#1E40AF] transition-colors"
              >
                CSV
              </button>
              <button 
                onClick={handlePrint}
                className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#1E40AF] transition-colors"
              >
                Print
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span>Search:</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-3 py-1"
                placeholder="Search users..."
              />
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#EEF2FF]">
                    <tr>
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">First Name</th>
                      <th className="px-4 py-3 text-left">Last Name</th>
                      <th className="px-4 py-3 text-left">Image</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Phone Number</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Verification Status</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{user.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3">{user.first_name}</td>
                        <td className="px-4 py-3">{user.last_name}</td>
                        <td className="px-4 py-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <img
                              src={user.profile_image_url || "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg"}
                              alt={`${user.first_name} ${user.last_name}`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3">{user.phone_number || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <select
                            value={user.status}
                            onChange={(e) => updateUserStatus(user.id, e.target.value)}
                            className={`text-sm px-2 py-1 rounded ${
                              user.status === 'active' ? 'text-[#22C55E] bg-green-50' : 'text-red-500 bg-red-50'
                            }`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={user.verification_status}
                            onChange={(e) => updateVerificationStatus(user.id, e.target.value)}
                            className={`text-sm px-2 py-1 rounded ${
                              user.verification_status === 'verified' ? 'text-[#22C55E] bg-green-50' : 
                              user.verification_status === 'pending' ? 'text-yellow-500 bg-yellow-50' : 
                              'text-red-500 bg-red-50'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button 
                              className="text-[#1E3A8A] hover:text-[#1E40AF]"
                              title="Edit User"
                            >
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(user.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete User"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button 
                              onClick={() => fetchUsers()}
                              className="text-[#22C55E] hover:text-[#16A34A]"
                              title="Refresh"
                            >
                              <RefreshCw size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6">
                <div>
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} entries
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    className="px-3 py-1 bg-[#1E3A8A] text-white rounded disabled:opacity-50"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded ${
                          currentPage === pageNum
                            ? 'bg-[#22C55E] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    className="px-3 py-1 bg-[#1E3A8A] text-white rounded disabled:opacity-50"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;