import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DetailPageLayout from '../../layouts/DetailPageLayout';

const AddCommunityBanner = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    file: null as File | null,
    status: '',
    translations: [] as { language: string; title: string; description: string }[]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
  };

  const addTranslation = () => {
    setFormData(prev => ({
      ...prev,
      translations: [...prev.translations, { language: '', title: '', description: '' }]
    }));
  };

  const handleTranslationChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newTranslations = [...prev.translations];
      newTranslations[index] = { ...newTranslations[index], [field]: value };
      return { ...prev, translations: newTranslations };
    });
  };

  return (
    <DetailPageLayout
      title="Home Page"
      breadcrumbs={['Community Banners', 'Add Banner']}
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {formData.type === 'video' ? 'Video' : 'Image'} <span className="text-red-500">*</span>
            </label>
            <div className="mt-2">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  {formData.file ? (
                    formData.type === 'video' ? (
                      <video
                        src={URL.createObjectURL(formData.file)}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        src={URL.createObjectURL(formData.file)}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        {formData.type === 'video' ? 'MP4, WebM (MAX. 10MB)' : 'PNG, JPG or JPEG (MAX. 800x400px)'}
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept={formData.type === 'video' ? 'video/*' : 'image/*'}
                    onChange={handleFileChange}
                    required
                  />
                </label>
              </div>
            </div>
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

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-600">
                Translations
              </label>
              <button
                type="button"
                onClick={addTranslation}
                className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] transition-colors"
              >
                Add Translation
              </button>
            </div>
            {formData.translations.map((translation, index) => (
              <div key={index} className="border rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Language
                    </label>
                    <select
                      value={translation.language}
                      onChange={(e) => handleTranslationChange(index, 'language', e.target.value)}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Language</option>
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={translation.title}
                      onChange={(e) => handleTranslationChange(index, 'title', e.target.value)}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Description
                    </label>
                    <textarea
                      value={translation.description}
                      onChange={(e) => handleTranslationChange(index, 'description', e.target.value)}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                    />
                  </div>
                </div>
              </div>
            ))}
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
            className="px-6 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors uppercase"
          >
            Submit
          </button>
        </div>
      </form>
    </DetailPageLayout>
  );
};

export default AddCommunityBanner;