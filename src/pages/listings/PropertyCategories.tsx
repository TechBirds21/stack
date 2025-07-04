import React, { useState, useEffect } from 'react';
import { Home, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { propertyCategoriesAPI } from '../../lib/api';
import * as XLSX from 'xlsx';

interface PropertyCategory {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

const PropertyCategories = () => {
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState('10');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<PropertyCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [searchTerm, filteredCategories]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await propertyCategoriesAPI.getAll();
      setFilteredCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setFilteredCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    if (!searchTerm) return;
    
    const filtered = filteredCategories.filter(category => 
      Object.values(category).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredCategories(filtered);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await propertyCategoriesAPI.delete(id);
        fetchCategories(); // Refresh the list
        alert('Category deleted successfully');
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category');
      }
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredCategories);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Property Categories');
    XLSX.writeFile(wb, 'property_categories.xlsx');
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(filteredCategories);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'property_categories.csv';
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center gap-2 text-[#1E3A8A] mb-6">
        <h1 className="text-2xl font-bold">Listing Management</h1>
        <span className="text-gray-500">/</span>
        <div className="flex items-center gap-2">
          <Home size={18} />
          <span>Property Categories</span>
        </div>
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
        <div className="bg-[#1E3A8A] p-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Property Categories</h2>
          <button 
            onClick={() => navigate('add')}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Add Property Category
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
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Created At</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr key={category.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{category.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3 font-medium">{category.name}</td>
                        <td className="px-4 py-3 text-sm max-w-xs truncate">{category.description || 'No description'}</td>
                        <td className="px-4 py-3">
                          <span className={`capitalize ${category.status === 'active' ? 'text-[#22C55E]' : 'text-red-500'}`}>
                            {category.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(category.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button className="text-[#1E3A8A] hover:text-[#1E40AF]">
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(category.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
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
              Showing 1 to {filteredCategories.length} of {filteredCategories.length} entries
            </div>
            <div className="flex gap-2">
              <button 
                className="px-3 py-1 bg-[#1E3A8A] text-white rounded disabled:opacity-50"
                disabled
              >
                Previous
              </button>
              <button className="px-3 py-1 bg-[#22C55E] text-white rounded">1</button>
              <button 
                className="px-3 py-1 bg-[#1E3A8A] text-white rounded disabled:opacity-50"
                disabled
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

export default PropertyCategories;