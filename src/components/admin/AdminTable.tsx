import React, { useState } from 'react';
import { 
  Search,
  Eye,
  Filter, 
  RefreshCw, 
  Plus, 
  Printer, 
  Edit, 
  Trash2 
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdminTableProps {
  data: any[];
  columns: any[];
  title: string;
  onAdd?: () => void;
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
  onRefresh: () => void;
}

const AdminTable: React.FC<AdminTableProps> = ({
  data,
  columns,
  title,
  onAdd,
  onEdit,
  onDelete,
  onRefresh
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUserType, setFilterUserType] = useState('all');
  const [filterListingType, setFilterListingType] = useState('all');

  // Apply filters
  let filteredData = data.filter(item => {
    const matchesSearch = Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    let matchesStatusFilter = true;
    if (filterStatus !== 'all') {
      matchesStatusFilter = item.status === filterStatus || item.verification_status === filterStatus;
    }
    
    let matchesUserTypeFilter = true;
    if (filterUserType !== 'all' && item.user_type) {
      matchesUserTypeFilter = item.user_type === filterUserType;
    }

    let matchesListingTypeFilter = true;
    if (filterListingType !== 'all' && item.listing_type) {
      matchesListingTypeFilter = item.listing_type === filterListingType;
    }
    
    return matchesSearch && matchesStatusFilter && matchesUserTypeFilter && matchesListingTypeFilter;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const exportToExcel = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet format
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, title);
    
    // Write the file
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow print-section">
      {/* Header */}
      <div className="bg-[#3B5998] text-white p-4 rounded-t-lg no-print">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
            {onAdd && (
              <button
                onClick={onAdd}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Add {title.slice(0, -1)}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200 no-print">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600 ml-2">entries</span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => exportToExcel(filteredData, title.toLowerCase())}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                Excel
              </button>
              <button
                onClick={() => exportToCSV(filteredData, title.toLowerCase())}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                CSV
              </button>
              <button
                onClick={() => window.print()}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 flex items-center"
              >
                <Printer size={14} className="mr-1" />
                Print
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
              
              {title === 'Users' && (
                <select
                  value={filterUserType}
                  onChange={(e) => {
                    setFilterUserType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              )}

              {title.includes('Properties') && (
                <select
                  value={filterListingType}
                  onChange={(e) => {
                    setFilterListingType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="SALE">For Sale</option>
                  <option value="RENT">For Rent</option>
                </select>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider no-print">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                  <div className="flex space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => window.open(`/view/${item.id}`, '_blank')}
                      className="text-green-600 hover:text-green-900"
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 border-t border-gray-200 no-print">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border rounded text-sm ${
                    currentPage === page
                      ? 'bg-green-500 text-white border-green-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTable;