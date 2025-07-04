import React, { useState, useEffect } from 'react';
import { Home, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingsAPI } from '../../lib/api';
import * as XLSX from 'xlsx';

interface Booking {
  id: string;
  property_id: string;
  user_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes: string;
  created_at: string;
  properties?: {
    id: string;
    title: string;
    address: string;
    city: string;
  };
  users?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  total: number;
}

const Bookings = () => {
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState('10');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [searchTerm, filteredBookings]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingsAPI.getAll();
      setFilteredBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    if (!searchTerm) return;
    
    const filtered = filteredBookings.filter(booking => 
      Object.values(booking).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      await bookingsAPI.update(id, { status });
      fetchBookings(); // Refresh the list
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Error updating booking status');
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredBookings);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
    XLSX.writeFile(wb, 'bookings.xlsx');
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(filteredBookings);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'bookings.csv';
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
          <span>Bookings</span>
        </div>
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
        <div className="bg-[#1E3A8A] p-6">
          <h2 className="text-xl font-semibold text-white">Bookings</h2>
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
                      <th className="px-4 py-3 text-left">Guest Name</th>
                      <th className="px-4 py-3 text-left">Booking Date</th>
                      <th className="px-4 py-3 text-left">Booking Time</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Notes</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{booking.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3">
                          {booking.properties?.title || 'N/A'}
                          <div className="text-sm text-gray-500">
                            {booking.properties?.city}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {booking.users ? `${booking.users.first_name} ${booking.users.last_name}` : 'N/A'}
                          <div className="text-sm text-gray-500">
                            {booking.users?.email}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {new Date(booking.booking_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">{booking.booking_time}</td>
                        <td className="px-4 py-3">
                          <select
                            value={booking.status}
                            onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                            className={`text-sm px-2 py-1 rounded ${
                              booking.status === 'confirmed' ? 'text-[#22C55E] bg-green-50' : 
                              booking.status === 'pending' ? 'text-yellow-500 bg-yellow-50' :
                              booking.status === 'completed' ? 'text-blue-500 bg-blue-50' :
                              'text-red-500 bg-red-50'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm max-w-xs truncate">
                          {booking.notes || 'No notes'}
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
              Showing 1 to {Math.min(parseInt(entriesPerPage), filteredBookings.length)} of {filteredBookings.length} entries
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
                disabled={currentPage * parseInt(entriesPerPage) >= filteredBookings.length}
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

export default Bookings;