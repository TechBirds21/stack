import React, { useState, useEffect } from 'react';
import { Home, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  agency: string;
  experience: string;
  license_number: string;
  status: string;
  verification_status: string;
  profile_image_url: string;
  created_at: string;
}

const Agents = () => {
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState('10');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    filterAgents();
  }, [searchTerm, allAgents]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      // Fetch agents directly from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_type', 'agent')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAllAgents(data);
      setFilteredAgents(data);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAllAgents([]);
      setFilteredAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAgents = () => {
    if (!searchTerm) {
      setFilteredAgents(allAgents);
      return;
    }

    const filtered = allAgents.filter(agent => 
      Object.values(agent).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredAgents(filtered);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const exportData = filteredAgents.map(agent => ({
      ID: agent.id,
      'First Name': agent.first_name,
      'Last Name': agent.last_name,
      Email: agent.email,
      'Phone Number': agent.phone_number || 'N/A',
      Agency: agent.agency || 'N/A',
      Experience: agent.experience || 'N/A',
      'License Number': agent.license_number || 'N/A',
      Status: agent.status,
      'Verification Status': agent.verification_status,
      'Created At': new Date(agent.created_at).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Agents');
    XLSX.writeFile(wb, 'agents.xlsx');
  };

  const exportToCSV = () => {
    const exportData = filteredAgents.map(agent => ({
      ID: agent.id,
      'First Name': agent.first_name,
      'Last Name': agent.last_name,
      Email: agent.email,
      'Phone Number': agent.phone_number || 'N/A',
      Agency: agent.agency || 'N/A',
      Experience: agent.experience || 'N/A',
      'License Number': agent.license_number || 'N/A',
      Status: agent.status,
      'Verification Status': agent.verification_status,
      'Created At': new Date(agent.created_at).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'agents.csv';
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        await usersAPI.delete(id);
        fetchAgents(); // Refresh the list
        alert('Agent deleted successfully');
      } catch (error) {
        console.error('Error deleting agent:', error);
        alert('Error deleting agent');
      }
    }
  };

  const updateAgentStatus = async (id: string, status: string) => {
    try {
      await usersAPI.update(id, { status });
      fetchAgents(); // Refresh the list
    } catch (error) {
      console.error('Error updating agent status:', error);
      alert('Error updating agent status');
    }
  };

  const updateVerificationStatus = async (id: string, verification_status: string) => {
    try {
      await usersAPI.update(id, { verification_status });
      fetchAgents(); // Refresh the list
    } catch (error) {
      console.error('Error updating verification status:', error);
      alert('Error updating verification status');
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredAgents.length / parseInt(entriesPerPage));
  const startIndex = (currentPage - 1) * parseInt(entriesPerPage);
  const endIndex = startIndex + parseInt(entriesPerPage);
  const currentAgents = filteredAgents.slice(startIndex, endIndex);

  return (
    <div className="p-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center gap-2 text-[#1E3A8A] mb-6">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <span className="text-gray-500">/</span>
        <div className="flex items-center gap-2">
          <Home size={18} />
          <span>Agents</span>
        </div>
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
        <div className="bg-[#1E3A8A] p-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Agents</h2>
          <button 
            onClick={() => navigate('add')}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Add Agent
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
                placeholder="Search agents..."
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
                      <th className="px-4 py-3 text-left">Agency</th>
                      <th className="px-4 py-3 text-left">Image</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Phone Number</th>
                      <th className="px-4 py-3 text-left">License</th>
                      <th className="px-4 py-3 text-left">Experience</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Verification Status</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAgents.map((agent) => (
                      <tr key={agent.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{agent.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3">{agent.first_name}</td>
                        <td className="px-4 py-3">{agent.last_name}</td>
                        <td className="px-4 py-3">{agent.agency || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <img
                              src={agent.profile_image_url || "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg"}
                              alt={`${agent.first_name} ${agent.last_name}`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">{agent.email}</td>
                        <td className="px-4 py-3">{agent.phone_number || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">{agent.license_number || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">{agent.experience || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <select
                            value={agent.status}
                            onChange={(e) => updateAgentStatus(agent.id, e.target.value)}
                            className={`text-sm px-2 py-1 rounded ${
                              agent.status === 'active' ? 'text-[#22C55E] bg-green-50' : 'text-red-500 bg-red-50'
                            }`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={agent.verification_status}
                            onChange={(e) => updateVerificationStatus(agent.id, e.target.value)}
                            className={`text-sm px-2 py-1 rounded ${
                              agent.verification_status === 'verified' ? 'text-[#22C55E] bg-green-50' : 
                              agent.verification_status === 'pending' ? 'text-yellow-500 bg-yellow-50' : 
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
                              title="Edit Agent"
                            >
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(agent.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete Agent"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button 
                              onClick={() => fetchAgents()}
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredAgents.length)} of {filteredAgents.length} entries
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

export default Agents;