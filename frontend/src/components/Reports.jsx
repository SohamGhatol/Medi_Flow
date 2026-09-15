import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import api from '../services/api';
import { useAlert } from '../context/AlertContext';
import StaffNavbar from './common/StaffNavbar';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Reports = () => {
  const { showAlert, showConfirm } = useAlert();
  const [salesData, setSalesData] = useState([]);
  const [topMedicines, setTopMedicines] = useState([]);
  const [expiryData, setExpiryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    try {
      // Fetch sales summary
      const salesResponse = await api.get(`/reports/sales-summary?period=${period}`);
      setSalesData(salesResponse.data);
      
      // Fetch top medicines
      const topMedResponse = await api.get('/reports/top-medicines');
      setTopMedicines(topMedResponse.data);
      
      // Fetch expiry list
      const expiryResponse = await api.get('/reports/expiry-list');
      setExpiryData(expiryResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
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

  const totalPosSales = salesData.reduce((acc, curr) => acc + (curr.pos_sales || 0), 0);
  const totalOnlineSales = salesData.reduce((acc, curr) => acc + (curr.online_sales || 0), 0);
  const combinedTotal = totalPosSales + totalOnlineSales;

  // Chart data for sales
  const salesChartData = {
    labels: salesData.map(item => item.period),
    datasets: [
      {
        label: 'In-Store POS (₹)',
        data: salesData.map(item => item.pos_sales),
        backgroundColor: 'rgba(79, 70, 229, 0.7)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
      },
      {
        label: 'Online Orders (₹)',
        data: salesData.map(item => item.online_sales),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      x: { stacked: true },
      y: { stacked: true }
    }
  };

  // Chart data for top medicines
  const topMedicinesChartData = {
    labels: topMedicines.map(item => item.medicine_name),
    datasets: [
      {
        label: 'Quantity Sold',
        data: topMedicines.map(item => item.total_quantity),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const handleExport = async (table) => {
    try {
      const response = await api.get(`/reports/export/${table}`);
      // Create a Blob from the CSV data
      const blob = new Blob([response.data.data], { type: 'text/csv' });
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      showAlert({ type: 'error', message: 'Failed to export data', title: 'Error' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <StaffNavbar activePage="reports" />

      {/* Main content */}
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">Reports & Analytics</h1>
              <div className="flex space-x-2">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <button
                  onClick={() => handleExport('sales')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Export Sales
                </button>
                <button
                  onClick={() => handleExport('medicines')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Export Medicines
                </button>
              </div>
            </div>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {loading ? (
                <div className="text-center py-10">
                  <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-primary-600 border-t-transparent"></div>
                  <p className="mt-2 text-gray-600">Loading reports...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow p-6 border border-slate-100">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">In-Store Revenue</p>
                      <h3 className="text-2xl font-black text-indigo-600 mt-2">₹{totalPosSales.toFixed(2)}</h3>
                    </div>
                    <div className="bg-white rounded-xl shadow p-6 border border-slate-100">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Online Revenue</p>
                      <h3 className="text-2xl font-black text-emerald-600 mt-2">₹{totalOnlineSales.toFixed(2)}</h3>
                    </div>
                    <div className="bg-slate-900 rounded-xl shadow p-6 border border-slate-800">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Combined Revenue</p>
                      <h3 className="text-3xl font-black text-white mt-2">₹{combinedTotal.toFixed(2)}</h3>
                    </div>
                  </div>

                  {/* Sales Chart */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Sales Summary</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Sales trends over time</p>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                      <Bar data={salesChartData} options={chartOptions} />
                    </div>
                  </div>

                  {/* Top Medicines Chart */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Top Selling Medicines</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">By quantity sold</p>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                      <Pie data={topMedicinesChartData} />
                    </div>
                  </div>

                  {/* Expiry List */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Expiring Soon</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Medicines expiring within 90 days</p>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Medicine
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
                                Days Left
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {expiryData.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                  No medicines expiring soon
                                </td>
                              </tr>
                            ) : (
                              expiryData.map((medicine) => (
                                <tr key={medicine.medicine_id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {medicine.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {medicine.company}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {medicine.batch_no}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(medicine.exp_date).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      medicine.days_to_expiry <= 30 
                                        ? 'bg-red-100 text-red-800' 
                                        : medicine.days_to_expiry <= 60 
                                          ? 'bg-yellow-100 text-yellow-800' 
                                          : 'bg-green-100 text-green-800'
                                    }`}>
                                      {medicine.days_to_expiry} days
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {medicine.quantity}
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
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
