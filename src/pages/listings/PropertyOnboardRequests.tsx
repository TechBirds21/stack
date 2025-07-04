import React, { useState, useEffect } from 'react';
import { Home, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

interface OnboardRequest {
  id: number;
  propertyType: string;
  contactName: string;
  contactEmail: string;
  phoneNumber: string;
  onboardStatus: 'In Progress' | 'Create Property' | 'Completed';
}

const PropertyOnboardRequests = () => {
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState('10');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRequests, setFilteredRequests] = useState<OnboardRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const mockRequests: OnboardRequest[] = [
    {
      id: 31,
      propertyType: 'Dammuso (Italy)',
      contactName: 'ajith',
      contactEmail: 'ak@gmail.com',
      phoneNumber: '(+91) 7897897890',
      onboardStatus: 'In Progress'
    },
    {
      id: 30,
      propertyType: 'Dome house',
      contactName: 'suriya',
      contactEmail: 'suriya@gmail.com',
      phoneNumber: '(+91) 9222292222',
      onboardStatus: 'Create Property'
    },
    {
      id: 29,
      propertyType: 'Cottage',
      contactName: 'Nedumaaran Rajangam',
      contactEmail: 'maaran@gmail.com',
      phoneNumber: '(+91) 9111191111',
      onboardStatus: 'In Progress'
    },
    {
      id: 28,
      propertyType: 'House',
      contactName: 'mahesh',
      contactEmail: 'babu@gmail.com',
      phoneNumber: '(+91) 7878787878',
      onboardStatus: 'Create Property'
    },
    {
      id: 27,
      propertyType: 'House',
      contactName: 'Maharishi',
      contactEmail: 'maharishi@gmail.com',
      phoneNumber: '(+91) 9000090000',
      onboardStatus: 'Completed'
    }
  ];

  useEffect(() => {
    const filtered = mockRequests.filter(request => 
      Object.values(request).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredRequests(filtered);
  }, [searchTerm]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRequests);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Onboard Requests');
    XLSX.writeFile(wb, 'onboard_requests.xlsx');
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRequests);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'onboard_requests.csv';
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'text-yellow-500';
      case 'Create Property':
        return 'text-[#1E3A8A]';
      case 'Completed':
        return 'text-[#22C55E]';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="p-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center gap-2 text-[#1E3A8A] mb-6">
        <h1 className="text-2xl font-bold">Listing Management</h1>
        <span className="text-gray-500">/</span>
        <div className="flex items-center gap-2">
          <Home size={18} />
          <span>Property Onboard Requests</span>
        </div>
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
        <div className="bg-[#1E3A8A] p-6">
          <h2 className="text-xl font-semibold text-white">Property Onboard Requests</h2>
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#EEF2FF]">
                <tr>
                  <th className="px-4 py-3 text-left">Id</th>
                  <th className="px-4 py-3 text-left">Property Type</th>
                  <th className="px-4 py-3 text-left">Contact Name</th>
                  <th className="px-4 py-3 text-left">Contact Email</th>
                  <th className="px-4 py-3 text-left">Phone Number</th>
                  <th className="px-4 py-3 text-left">Onboard Property Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{request.id}</td>
                    <td className="px-4 py-3">{request.propertyType}</td>
                    <td className="px-4 py-3">{request.contactName}</td>
                    <td className="px-4 py-3">{request.contactEmail}</td>
                    <td className="px-4 py-3">{request.phoneNumber}</td>
                    <td className="px-4 py-3">
                      {request.onboardStatus === 'Create Property' ? (
                        <button className="text-[#1E3A8A] hover:underline">
                          Create Property
                        </button>
                      ) : (
                        <span className={getStatusColor(request.onboardStatus)}>
                          {request.onboardStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {request.onboardStatus !== 'Create Property' && (
                        <button className="text-[#1E3A8A] hover:text-[#1E40AF]">
                          <Pencil size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <div>
              Showing 1 to {Math.min(parseInt(entriesPerPage), filteredRequests.length)} of {filteredRequests.length} entries
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
              <button 
                className="px-2 py-1 bg-[#1E3A8A] text-white rounded"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage * parseInt(entriesPerPage) >= filteredRequests.length}
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

export default PropertyOnboardRequests;