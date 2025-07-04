import React, { useState, useEffect } from 'react';
import { Home, Eye, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

interface Property {
  id: number;
  name: string;
  mandal: string;
  status: 'In Progress' | 'Listed' | 'Purchased' | 'Unlisted';
  createdAt: string;
  featured: boolean;
  verified: 'Approved' | 'Not Completed';
}

const Properties = () => {
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState('10');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const mockProperties: Property[] = [
    {
      id: 10069,
      name: 'Raju',
      mandal: 'Himayathnagar',
      status: 'In Progress',
      createdAt: '12/03/2025',
      featured: false,
      verified: 'Not Completed'
    },
    {
      id: 10068,
      name: 'Naveen',
      mandal: 'Kothuru',
      status: 'In Progress',
      createdAt: '21/02/2025',
      featured: false,
      verified: 'Not Completed'
    },
    {
      id: 10066,
      name: 'Oscar Promoters',
      mandal: 'Seethammadara',
      status: 'Listed',
      createdAt: '25/01/2025',
      featured: false,
      verified: 'Approved'
    },
    {
      id: 10065,
      name: 'GBU Housing',
      mandal: 'Seethammadara',
      status: 'Purchased',
      createdAt: '25/01/2025',
      featured: false,
      verified: 'Approved'
    },
    {
      id: 10064,
      name: 'Kaala Killa',
      mandal: 'Bagavant Kesari',
      status: 'Purchased',
      createdAt: '25/01/2025',
      featured: false,
      verified: 'Approved'
    }
  ];

  useEffect(() => {
    const filtered = mockProperties.filter(property => 
      Object.values(property).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredProperties(filtered);
  }, [searchTerm]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredProperties);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Properties');
    XLSX.writeFile(wb, 'properties.xlsx');
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(filteredProperties);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'properties.csv';
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'text-yellow-500';
      case 'Listed':
        return 'text-[#22C55E]';
      case 'Purchased':
        return 'text-[#1E3A8A]';
      case 'Unlisted':
        return 'text-red-500';
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
          <span>Properties</span>
        </div>
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
        <div className="bg-[#1E3A8A] p-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Properties</h2>
          <button 
            onClick={() => navigate('add')}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Add Property
          </button>
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
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Mandal</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Created At</th>
                  <th className="px-4 py-3 text-left">Featured</th>
                  <th className="px-4 py-3 text-left">Verified</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((property) => (
                  <tr key={property.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{property.id}</td>
                    <td className="px-4 py-3">{property.name}</td>
                    <td className="px-4 py-3">{property.mandal}</td>
                    <td className="px-4 py-3">
                      <span className={getStatusColor(property.status)}>
                        {property.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{property.createdAt}</td>
                    <td className="px-4 py-3">
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-sm">
                        No
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={property.verified === 'Approved' ? 'text-[#22C55E]' : 'text-red-500'}>
                        {property.verified}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-[#1E3A8A] hover:text-[#1E40AF]">
                          <Eye size={18} />
                        </button>
                        <button className="text-[#1E3A8A] hover:text-[#1E40AF]">
                          <Pencil size={18} />
                        </button>
                        <button className="text-red-600 hover:text-red-700">
                          <Trash2 size={18} />
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
              Showing 1 to {Math.min(parseInt(entriesPerPage), filteredProperties.length)} of {filteredProperties.length} entries
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
              <button 
                className="px-2 py-1 bg-[#1E3A8A] text-white rounded"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage * parseInt(entriesPerPage) >= filteredProperties.length}
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

export default Properties;