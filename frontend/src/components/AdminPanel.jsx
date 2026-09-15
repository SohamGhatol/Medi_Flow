import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import StaffNavbar from './common/StaffNavbar';

const AdminPanel = () => {
  const { showAlert, showConfirm } = useAlert();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);
  
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Form states
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role_id: ''
  });
  
  const [companyForm, setCompanyForm] = useState({
    name: '',
    contact: '',
    address: ''
  });

  useEffect(() => {
    // Wait for auth context to finish checking localStorage
    if (authLoading) return;
    
    // Redirect if not logged in or not Admin
    if (!user || user.role !== 'Admin') {
      navigate('/dashboard');
      return;
    }
    
    fetchData();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      const [usersRes, companiesRes, rolesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/companies'),
        api.get('/admin/roles')
      ]);
      
      setUsers(usersRes.data);
      setCompanies(companiesRes.data);
      setRoles(rolesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update existing user
        await api.put(`/admin/users/${editingUser.user_id}`, userForm);
      } else {
        // Create new user
        await api.post('/admin/users', userForm);
      }
      
      // Reset form and refresh data
      setUserForm({ username: '', password: '', role_id: '' });
      setEditingUser(null);
      setShowUserModal(false);
      showAlert({ type: 'success', message: 'User saved successfully' });
      fetchData();
    } catch (error) {
      console.error('Error saving user:', error);
      showAlert({ type: 'error', message: 'Failed to save user', title: 'Error' });
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCompany) {
        // Update existing company
        await api.put(`/admin/companies/${editingCompany.company_id}`, companyForm);
      } else {
        // Create new company
        await api.post('/admin/companies', companyForm);
      }
      
      // Reset form and refresh data
      setCompanyForm({ name: '', contact: '', address: '' });
      setEditingCompany(null);
      setShowCompanyModal(false);
      showAlert({ type: 'success', message: 'Company saved successfully' });
      fetchData();
    } catch (error) {
      console.error('Error saving company:', error);
      showAlert({ type: 'error', message: 'Failed to save company', title: 'Error' });
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      password: '',
      role_id: user.role_id
    });
    setShowUserModal(true);
  };

  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setCompanyForm({
      name: company.name,
      contact: company.contact,
      address: company.address
    });
    setShowCompanyModal(true);
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = await showConfirm('Are you sure you want to delete this user?', 'Delete User');
    if (confirmed) {
      try {
        await api.delete(`/admin/users/${userId}`);
        showAlert({ type: 'success', message: 'User deleted successfully' });
        fetchData();
      } catch (error) {
        console.error('Error deleting user:', error);
        showAlert({ type: 'error', message: 'Failed to delete user', title: 'Error' });
      }
    }
  };

  const handleDeleteCompany = async (companyId) => {
    const confirmed = await showConfirm('Are you sure you want to delete this company?', 'Delete Company');
    if (confirmed) {
      try {
        await api.delete(`/admin/companies/${companyId}`);
        showAlert({ type: 'success', message: 'Company deleted successfully' });
        fetchData();
      } catch (error) {
        console.error('Error deleting company:', error);
        showAlert({ type: 'error', message: 'Failed to delete company', title: 'Error' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <StaffNavbar activePage="admin" />

      {/* Main content */}
      <div className="py-8 bg-slate-50">
        <header className="mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-lg px-8 py-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
                <p className="mt-2 text-primary-100 max-w-xl text-sm">
                  Manage users, companies, and system configurations from a centralized dashboard.
                </p>
              </div>
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white rounded-full opacity-10 blur-2xl"></div>
              <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-primary-400 rounded-full opacity-20 blur-3xl"></div>
            </div>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-gray-200 bg-slate-50/50 px-6 pt-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`${
                      activeTab === 'users'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Users
                  </button>
                  <button
                    onClick={() => setActiveTab('companies')}
                    className={`${
                      activeTab === 'companies'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Companies
                  </button>
                  <button
                    onClick={() => setActiveTab('chatbot')}
                    className={`${
                      activeTab === 'chatbot'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Chatbot
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`${
                      activeTab === 'analytics'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analytics
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6 sm:p-8">
                {loading ? (
                  <div className="text-center py-10">
                    <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-primary-600 border-t-transparent"></div>
                    <p className="mt-2 text-gray-600">Loading data...</p>
                  </div>
                ) : activeTab === 'users' ? (
                  <div className="animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">User Management</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage system access and roles</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingUser(null);
                          setUserForm({ username: '', password: '', role_id: '' });
                          setShowUserModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add User
                      </button>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <ul className="divide-y divide-slate-100">
                        {users.map((user) => (
                          <li key={user.user_id} className="hover:bg-slate-50 transition-colors">
                            <div className="px-6 py-5 flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-inner">
                                  <span className="text-primary-700 font-bold text-lg">{user.username.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-bold text-slate-900">{user.username}</div>
                                  <div className="text-sm font-medium text-slate-500 mt-0.5">{user.role}</div>
                                </div>
                              </div>
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:text-primary-600 transition-colors focus:outline-none"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.user_id)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors focus:outline-none"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : activeTab === 'companies' ? (
                  <div className="animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">Company Management</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage suppliers and pharmaceutical companies</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingCompany(null);
                          setCompanyForm({ name: '', contact: '', address: '' });
                          setShowCompanyModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Company
                      </button>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <ul className="divide-y divide-slate-100">
                        {companies.map((company) => (
                          <li key={company.company_id} className="hover:bg-slate-50 transition-colors">
                            <div className="px-6 py-5">
                              <div className="flex items-center justify-between">
                                <div className="text-base font-bold text-slate-900 truncate flex items-center">
                                  <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center mr-3 font-bold text-sm">
                                    {company.name.charAt(0).toUpperCase()}
                                  </div>
                                  {company.name}
                                </div>
                                <div className="flex space-x-3">
                                  <button
                                    onClick={() => handleEditCompany(company)}
                                    className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:text-primary-600 transition-colors focus:outline-none"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCompany(company.company_id)}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors focus:outline-none"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 ml-11">
                                <div className="flex items-center text-sm text-slate-500">
                                  <svg className="flex-shrink-0 mr-2 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                  </svg>
                                  <span className="truncate">{company.contact}</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-500">
                                  <svg className="flex-shrink-0 mr-2 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="truncate">{company.address}</span>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : activeTab === 'chatbot' ? (
                  <div className="animate-fade-in space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Chatbot Management</h2>
                      <p className="text-sm text-slate-500 mt-1">Configure automated AI responses and view chat history</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">Knowledge Base</h3>
                          <p className="text-sm text-slate-500 mb-6 min-h-[40px]">
                            Manage the chatbot's knowledge base for medication information and general FAQs.
                          </p>
                          <button
                            onClick={() => showAlert({ type: 'info', message: 'Knowledge Base feature is coming soon!', title: 'Coming Soon' })}
                            className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none transition-colors"
                          >
                            Manage Knowledge Base
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">Chat Logs</h3>
                          <p className="text-sm text-slate-500 mb-6 min-h-[40px]">
                            Review past chatbot interactions and user queries to improve AI accuracy.
                          </p>
                          <button
                            onClick={() => showAlert({ type: 'info', message: 'Chat Logs feature is coming soon!', title: 'Coming Soon' })}
                            className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none transition-colors"
                          >
                            View Chat Logs
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'analytics' ? (
                  <div className="animate-fade-in space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Analytics & Reports</h2>
                      <p className="text-sm text-slate-500 mt-1">Access system intelligence and historical analytics dashboards</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">Demand Analytics</h3>
                          <p className="text-sm text-slate-500 mb-6 min-h-[40px]">
                            Analyze historical medicine demand patterns to support inventory planning.
                          </p>
                          <button
                            onClick={() => navigate('/demand-analytics')}
                            className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-colors"
                          >
                            Open Demand Heatmap
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {editingUser ? 'Edit User' : 'Add User'}
              </h3>
              <form onSubmit={handleUserSubmit} className="mt-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                    {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    {...(!editingUser && { required: true })}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                    Role
                  </label>
                  <select
                    id="role"
                    value={userForm.role_id}
                    onChange={(e) => setUserForm({...userForm, role_id: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.role_id} value={role.role_id}>
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserModal(false);
                      setEditingUser(null);
                      setUserForm({ username: '', password: '', role_id: '' });
                    }}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {editingCompany ? 'Edit Company' : 'Add Company'}
              </h3>
              <form onSubmit={handleCompanySubmit} className="mt-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contact">
                    Contact
                  </label>
                  <input
                    type="text"
                    id="contact"
                    value={companyForm.contact}
                    onChange={(e) => setCompanyForm({...companyForm, contact: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                    Address
                  </label>
                  <textarea
                    id="address"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({...companyForm, address: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows="3"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompanyModal(false);
                      setEditingCompany(null);
                      setCompanyForm({ name: '', contact: '', address: '' });
                    }}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    {editingCompany ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
