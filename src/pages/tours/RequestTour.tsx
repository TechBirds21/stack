import React, { useState, useEffect } from 'react';
import { Home, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { inquiriesAPI } from '../../lib/api';
import * as XLSX from 'xlsx';

interface Inquiry {
  id: string;
  property_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
  properties?: {
    id: string;
    title: string;
    address: string;
    city: string;
  };
}

const RequestTour = () => {
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState('10');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  useEffect(() => {
    filterInquiries();
  }, [searchTerm, filteredInquiries]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const data = await inquiriesAPI.getAll();
      setFilteredInquiries(data);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      setFilteredInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInquiries = () => {
    if (!searchTerm) return;
    
    const filtered = filteredInquiries.filter(inquiry => 
      Object.values(inquiry).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredInquiries(filtered);
  };

  const updateInquiryStatus = async (id: string, status: string) => {
    try {
      await inquiriesAPI.update(id, { status });
      fetchInquiries(); // Refresh the list
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      alert('Error updating inquiry status');
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredInquiries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inquiries');
    XLSX.writeFile(wb, 'inquiries.xlsx');
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(filteredInquiries);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'inquiries.csv';
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center gap-2 text-[#1E3A8A] mb-6">
        <h1 className="text-2xl font-bold">Manage Request Tour</h1>
        <span className="text-gray-500">/</span>
        <div className="flex items-center gap-2">
          <Home size={18} />
          <span>Request Tour</span>
        </div>
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
        <div className="bg-[#1E3A8A] p-6">
          <h2 className="text-xl font-semibold text-white">Property Inquiries</h2>
        </div>

        <div className="p-6">
          {/* Table controls */}
          <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select 
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(e.target.value)}
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
                placeholder="Search..."
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
                      <th className="px-4 py-3 text-left">Id</th>
                      <th className="px-4 py-3 text-left">Property Name</th>
                      <th className="px-4 py-3 text-left">Inquirer Name</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Phone</th>
                      <th className="px-4 py-3 text-left">Message</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInquiries.map((inquiry) => (
                      <tr key={inquiry.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{inquiry.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3">
                          {inquiry.properties?.title || 'N/A'}
                          <div className="text-sm text-gray-500">
                            {inquiry.properties?.city}
                          </div>
                        </td>
                        <td className="px-4 py-3">{inquiry.name}</td>
                        <td className="px-4 py-3">{inquiry.email}</td>
                        <td className="px-4 py-3">{inquiry.phone || 'N/A'}</td>
                        <td className="px-4 py-3 max-w-xs truncate">{inquiry.message}</td>
                        <td className="px-4 py-3">
                          <select
                            value={inquiry.status}
                            onChange={(e) => updateInquiryStatus(inquiry.id, e.target.value)}
                            className={`text-sm px-2 py-1 rounded ${
                              inquiry.status === 'responded' ? 'text-[#22C55E] bg-green-50' : 
                              inquiry.status === 'new' ? 'text-yellow-500 bg-yellow-50' :
                              'text-gray-500 bg-gray-50'
                            }`}
                          >
                            <option value="new">New</option>
                            <option value="responded">Responded</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(inquiry.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-[#1E3A8A] hover:text-[#1E40AF]">
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <div>
              Showing 1 to {Math.min(parseInt(entriesPerPage), filteredInquiries.length)} of {filteredInquiries.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button 
                className="px-2 py-1 bg-[#1E3A8A] text-white rounded"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button className="px-3 py-1 bg-[#22C55E] text-white rounded">1</button>
              <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded">2</button>
              <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded">3</button>
              <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded">4</button>
              <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded">5</button>
              <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded">6</button>
              <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded">7</button>
              <button 
                className="px-2 py-1 bg-[#1E3A8A] text-white rounded"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage * parseInt(entriesPerPage) >= filteredInquiries.length}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestTour;