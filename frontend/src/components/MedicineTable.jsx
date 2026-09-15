import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAlert } from '../context/AlertContext';
import StaffNavbar from './common/StaffNavbar';

const MedicineTable = () => {
  const { showAlert, showConfirm } = useAlert();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines');
      setMedicines(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching medicines:', error);
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

  const handleEdit = (medicine) => {
    navigate(`/medicines/edit/${medicine.medicine_id}`, { state: { medicine } });
  };

  const handleDeleteClick = async (medicine) => {
    const confirmed = await showConfirm(`Are you sure you want to delete ${medicine.name}? This action cannot be undone.`, 'Delete Medicine', 'Delete');
    if (confirmed) {
      try {
        await api.delete(`/medicines/${medicine.medicine_id}`);
        showAlert({ type: 'success', message: 'Medicine deleted successfully!' });
        fetchMedicines();
      } catch (err) {
        showAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete medicine', title: 'Error' });
      }
    }
  };

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.company.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'low_stock') {
      return matchesSearch && medicine.reorder_needed;
    } else if (filter === 'expiring_soon') {
      return matchesSearch && medicine.days_to_expiry <= 30;
    }

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <StaffNavbar activePage="medicines" />

      {/* Main content */}
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">Medicine Inventory</h1>
              <button
                onClick={() => navigate('/medicines/add')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
              >
                Add Medicine
              </button>
            </div>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {/* Search and filter */}
            <div className="px-4 py-6 sm:px-0">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search medicines..."
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <select
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Medicines</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="expiring_soon">Expiring Soon</option>
                  </select>
                </div>
              </div>

              {/* Medicine table */}
              <div className="flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Medicine
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category & Type
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Company
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Batch No
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Expiry Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {loading ? (
                            <tr>
                              <td colSpan="9" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                Loading medicines...
                              </td>
                            </tr>
                          ) : filteredMedicines.length === 0 ? (
                            <tr>
                              <td colSpan="9" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                No medicines found
                              </td>
                            </tr>
                          ) : (
                            filteredMedicines.map((medicine) => (
                              <tr key={medicine.medicine_id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                                  {medicine.generic_name && (
                                    <div className="text-xs text-gray-500">{medicine.generic_name}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{medicine.category || 'Uncategorized'}</div>
                                  <div className="text-xs text-gray-500">{medicine.product_type}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{medicine.company}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {medicine.batch_no}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {new Date(medicine.exp_date).toLocaleDateString()}
                                  </div>
                                  <div className={`text-xs ${medicine.days_to_expiry <= 30 ? 'text-red-600' : 'text-gray-500'}`}>
                                    {medicine.days_to_expiry > 0 
                                      ? `${medicine.days_to_expiry} days left` 
                                      : 'Expired'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{medicine.quantity}</div>
                                  {medicine.quantity <= medicine.min_stock && (
                                    <div className="text-xs text-red-600">Low stock</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  ₹{medicine.price.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {medicine.days_to_expiry <= 30 ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                      Expiring Soon
                                    </span>
                                  ) : medicine.quantity <= medicine.min_stock ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                      Low Stock
                                    </span>
                                  ) : (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      In Stock
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={() => handleEdit(medicine)}
                                    className="text-primary-600 hover:text-primary-900 mr-4"
                                  >
                                    <svg className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(medicine)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <svg className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

    </div>
  );
};

export default MedicineTable;
