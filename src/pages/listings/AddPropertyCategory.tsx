import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyCategoriesAPI } from '../../lib/api';
import DetailPageLayout from '../../layouts/DetailPageLayout';

const AddPropertyCategory = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await propertyCategoriesAPI.create({
        name: formData.name,
        description: formData.description
      });
      
      alert('Property category added successfully!');
      navigate('/dashboard/listings/categories');
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DetailPageLayout
      title="Listing Management"
      breadcrumbs={['Property Categories', 'Add Property Category']}
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter category description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors uppercase"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors uppercase"
          >
            {loading ? 'Adding...' : 'Submit'}
          </button>
        </div>
      </form>
    </DetailPageLayout>
  );
};

export default AddPropertyCategory;