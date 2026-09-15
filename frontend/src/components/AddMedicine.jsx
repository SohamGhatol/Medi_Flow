import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAlert } from '../context/AlertContext';
import StaffNavbar from './common/StaffNavbar';

const AddMedicine = () => {
  const { showAlert, showConfirm } = useAlert();
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    batch_no: '',
    mfg_date: '',
    exp_date: '',
    quantity: '',
    min_stock: '',
    price: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/admin/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert({ type: 'error', message: 'Image must be smaller than 5 MB.' });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        company_name: formData.company_name,
        batch_no: formData.batch_no,
        mfg_date: formData.mfg_date,
        exp_date: formData.exp_date,
        quantity: parseInt(formData.quantity),
        min_stock: parseInt(formData.min_stock),
        price: parseFloat(formData.price)
      };
      console.log('Sending payload:', payload);
      const response = await api.post('/medicines', payload);
      const newMedicineId = response.data.medicine_id;
      
      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', imageFile);
        await api.post(`/medicines/${newMedicineId}/image`, formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      showAlert({ type: 'success', message: 'Medicine added successfully!' });
      setTimeout(() => {
        navigate('/medicines');
      }, 2000);
    } catch (err) {
      console.error('Error adding medicine:', err);
      console.error('Error response:', err.response);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to add medicine';
      showAlert({ type: 'error', message: errorMsg, title: 'Error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm('Are you sure you want to logout from Medi-Flow?', 'Confirm Logout', 'Logout');
    if (confirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <StaffNavbar activePage="medicines" />

      {/* Main content */}
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">Add New Medicine</h1>
              <button
                onClick={() => navigate('/medicines')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to List
              </button>
            </div>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {/* Form */}
              <div className="bg-white shadow rounded-lg">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Medicine Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Medicine Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="e.g., Paracetamol 500mg"
                      />
                    </div>

                    {/* Company */}
                    <div>
                      <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        id="company_name"
                        required
                        value={formData.company_name}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="e.g., PharmaCorp, Sun Pharma, Cipla"
                      />
                    </div>

                    {/* Batch Number */}
                    <div>
                      <label htmlFor="batch_no" className="block text-sm font-medium text-gray-700">
                        Batch Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="batch_no"
                        id="batch_no"
                        required
                        value={formData.batch_no}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="e.g., BATCH001"
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Price (Rs.) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="price"
                        id="price"
                        required
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Quantity */}
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        id="quantity"
                        required
                        min="0"
                        value={formData.quantity}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="0"
                      />
                    </div>

                    {/* Minimum Stock */}
                    <div>
                      <label htmlFor="min_stock" className="block text-sm font-medium text-gray-700">
                        Minimum Stock <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="min_stock"
                        id="min_stock"
                        required
                        min="0"
                        value={formData.min_stock}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="10"
                      />
                    </div>

                    {/* Manufacturing Date */}
                    <div>
                      <label htmlFor="mfg_date" className="block text-sm font-medium text-gray-700">
                        Manufacturing Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="mfg_date"
                        id="mfg_date"
                        required
                        value={formData.mfg_date}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <label htmlFor="exp_date" className="block text-sm font-medium text-gray-700">
                        Expiry Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="exp_date"
                        id="exp_date"
                        required
                        value={formData.exp_date}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Image Upload */}
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Image (Optional)
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        {imagePreview ? (
                          <div className="flex flex-col items-center">
                            <img src={imagePreview} alt="Preview" className="h-48 w-48 object-contain mb-4 rounded-lg bg-gray-50 p-2" />
                            <div className="flex text-sm text-gray-600">
                              <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                <span>Replace image</span>
                                <input id="image-upload" name="image" type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-600 justify-center">
                              <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                <span>Upload a file</span>
                                <input id="image-upload" name="image" type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => navigate('/medicines')}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Medicine
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddMedicine;
