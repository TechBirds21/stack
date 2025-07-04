/* ----------------------------------------------------------------
   src/pages/admin/Properties.tsx
   ---------------------------------------------------------------- */
import React, { useEffect, useState } from 'react';
import { Home, Eye, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { propertiesAPI } from '../../lib/api';     // ← uses Flask backend
import * as XLSX from 'xlsx';

/* ──────────────── Types ───────────────── */
interface Property {
  id: number;                 // numeric from SQLite/Flask
  title: string;
  city: string;
  state: string;
  status: string;
  created_at: string;
  featured: boolean | number; // 0/1 or true/false – we coerce to boolean later
  verified: boolean | number;
  price: number | null;       // null for RENT listings
  monthly_rent: number | null;
  property_type: string;
  listing_type: 'SALE' | 'RENT';
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  users?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

/* ───────────────────────────────────────── */
const Properties = () => {
  const navigate                       = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState('10');
  const [searchTerm, setSearchTerm]           = useState('');
  const [listingTypeFilter, setListingTypeFilter] = useState<string>('');
  const [allProperties, setAllProperties]     = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading]         = useState(true);

  /* ───── fetch on mount ───── */
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const res: Property[] = await propertiesAPI.list(); // GET /api/properties
        // backend returns 0/1 for booleans – normalise
        const normalised = res.map(p => ({
          ...p,
          featured : !!p.featured,
          verified : !!p.verified,
        }));
        setAllProperties(normalised);
        setFilteredProperties(normalised);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setAllProperties([]);
        setFilteredProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  /* ───── filter whenever criteria change ───── */
  useEffect(() => {
    let list = [...allProperties];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p =>
        Object.values(p).some(val =>
          String(val ?? '').toLowerCase().includes(term)
        )
      );
    }

    if (listingTypeFilter) {
      list = list.filter(p => p.listing_type === listingTypeFilter);
    }
    setFilteredProperties(list);
    setCurrentPage(1);
  }, [searchTerm, listingTypeFilter, allProperties]);

  /* ───── helpers ───── */
  const formatPrice = (p: Property) => {
    const value = p.price ?? p.monthly_rent ?? 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':   return 'text-[#22C55E]';
      case 'sold':     return 'text-[#1E3A8A]';
      case 'pending':  return 'text-yellow-500';
      case 'inactive': return 'text-red-500';
      default:         return 'text-gray-500';
    }
  };

  /* ───── export helpers – unchanged except they now use monthly_rent if price null ───── */
  const mappedForExport = filteredProperties.map(p => ({
    ID            : p.id,
    Title         : p.title,
    City          : p.city,
    State         : p.state,
    Status        : p.status,
    Price         : p.price ?? p.monthly_rent,
    'Property Type': p.property_type,
    Bedrooms      : p.bedrooms,
    Bathrooms     : p.bathrooms,
    'Area (sqft)' : p.area_sqft,
    Featured      : p.featured ? 'Yes' : 'No',
    Verified      : p.verified ? 'Yes' : 'No',
    'Created At'  : new Date(p.created_at).toLocaleDateString(),
    Listing       : p.listing_type,
    Owner         : p.users ? `${p.users.first_name} ${p.users.last_name}` : 'N/A',
  }));

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(mappedForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Properties');
    XLSX.writeFile(wb, 'properties.xlsx');
  };

  const exportToCSV = () => {
    const ws   = XLSX.utils.json_to_sheet(mappedForExport);
    const csv  = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href  = URL.createObjectURL(blob);
    link.download = 'properties.csv';
    link.click();
  };

  /* ───── CRUD helpers ───── */
  const handleDelete   = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    try {
      await propertiesAPI.delete(id);
      setAllProperties(allProperties.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Error deleting property');
    }
  };

  const toggleFeatured = async (id: number, featured: boolean) => {
    try {
      await propertiesAPI.update(id, { featured: !featured });
      setAllProperties(prev =>
        prev.map(p => (p.id === id ? { ...p, featured: !featured } : p))
      );
    } catch (err) {
      console.error(err);
      alert('Error updating property');
    }
  };

  const toggleVerified = async (id: number, verified: boolean) => {
    try {
      await propertiesAPI.update(id, { verified: !verified });
      setAllProperties(prev =>
        prev.map(p => (p.id === id ? { ...p, verified: !verified } : p))
      );
    } catch (err) {
      console.error(err);
      alert('Error updating property');
    }
  };

  /* ───── pagination calc ───── */
  const pageSize   = parseInt(entriesPerPage);
  const totalPages = Math.ceil(filteredProperties.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const pageSlice  = filteredProperties.slice(startIndex, startIndex + pageSize);

  /* ───── render ───── */
  return (
    <div className="p-6">
      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-[#1E3A8A] mb-6">
        <h1 className="text-2xl font-bold">Listing Management</h1>
        <span className="text-gray-500">/</span>
        <div className="flex items-center gap-2"><Home size={18}/> <span>Properties</span></div>
      </div>

      {/* card */}
      <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
        <div className="bg-[#1E3A8A] p-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Properties</h2>
          <button
            onClick={() => navigate('add')}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 py-2 rounded-lg">
            Add Property
          </button>
        </div>

        <div className="p-6">
          {/* controls */}
          <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
            {/* show entries */}
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select value={entriesPerPage}
                      onChange={e => { setEntriesPerPage(e.target.value); setCurrentPage(1);} }
                      className="border rounded px-2 py-1">
                {['10','25','50','100'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <span>entries</span>
            </div>

            {/* export */}
            <div className="flex gap-2">
              <button onClick={exportToExcel} className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#1E40AF]">Excel</button>
              <button onClick={exportToCSV}   className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#1E40AF]">CSV</button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#1E40AF]">Print</button>
            </div>

            {/* listing filter */}
            <div className="flex items-center gap-2">
              <span>Listing Type:</span>
              <select value={listingTypeFilter}
                      onChange={e => setListingTypeFilter(e.target.value)}
                      className="border rounded px-3 py-1">
                <option value="">All</option>
                <option value="SALE">For Sale</option>
                <option value="RENT">For Rent</option>
              </select>
            </div>

            {/* search */}
            <div className="flex items-center gap-2">
              <span>Search:</span>
              <input value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="border rounded px-3 py-1"
                     placeholder="Search properties..." />
            </div>
          </div>

          {/* loader / table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#EEF2FF]">
                    <tr>
                      {['ID','Title','Location','Price','Type','Bed/Bath','Status','Listing','Created At','Featured','Verified','Owner','Action']
                        .map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {pageSlice.map(p => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{String(p.id).slice(0,8)}…</td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs">
                            <p className="font-medium truncate">{p.title}</p>
                            <p className="text-sm text-gray-500">{p.area_sqft} sqft</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm"><p>{p.city}</p><p className="text-gray-500">{p.state}</p></div>
                        </td>
                        <td className="px-4 py-3 font-medium">{formatPrice(p)}</td>
                        <td className="px-4 py-3 capitalize">{p.property_type}</td>
                        <td className="px-4 py-3 text-sm">{p.bedrooms}B/{p.bathrooms}B</td>
                        <td className="px-4 py-3"><span className={`capitalize ${getStatusColor(p.status)}`}>{p.status}</span></td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            p.listing_type === 'RENT' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {p.listing_type === 'RENT' ? 'Rent' : 'Sale'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleFeatured(p.id, !!p.featured)}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    p.featured ? 'bg-[#22C55E] text-white' : 'bg-gray-200 text-gray-700'
                                  }`}>
                            {p.featured ? 'Yes' : 'No'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleVerified(p.id, !!p.verified)}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    p.verified ? 'bg-[#22C55E] text-white' : 'bg-red-500 text-white'
                                  }`}>
                            {p.verified ? 'Approved' : 'Pending'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {p.users ? `${p.users.first_name} ${p.users.last_name}` : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <a href={`/property/${p.id}`} target="_blank" rel="noopener" className="text-[#1E3A8A] hover:text-[#1E40AF]" title="View"><Eye size={18}/></a>
                            <button className="text-[#1E3A8A] hover:text-[#1E40AF]" title="Edit"><Pencil size={18}/></button>
                            <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-700" title="Delete"><Trash2 size={18}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="flex justify-between items-center mt-6">
                <div>Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredProperties.length)} of {filteredProperties.length} entries</div>
                <div className="flex items-center gap-1">
                  <button className="px-3 py-1 bg-[#1E3A8A] text-white rounded disabled:opacity-50"
                          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}>Prev</button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0,5).map(n => (
                    <button key={n}
                            onClick={() => setCurrentPage(n)}
                            className={`px-3 py-1 rounded ${currentPage === n ? 'bg-[#22C55E] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                      {n}
                    </button>
                  ))}

                  <button className="px-3 py-1 bg-[#1E3A8A] text-white rounded disabled:opacity-50"
                          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}>Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Properties;
