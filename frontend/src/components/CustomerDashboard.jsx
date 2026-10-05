import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { orders } from '../services/customerApi';
import { useAlert } from '../context/AlertContext';
import CustomerNavbar from './common/CustomerNavbar';
import { RefreshCw } from 'lucide-react';

const CustomerDashboard = () => {
  const { showConfirm } = useAlert();
  const { orderId } = useParams();
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const navigate = useNavigate();
  const customer = JSON.parse(localStorage.getItem('customer') || '{}');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId);
    } else {
      setSelectedOrder(null);
    }
  }, [orderId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orders.getAll();
      setOrderList(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (id) => {
    try {
      setLoadingDetails(true);
      const response = await orders.getById(id);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      navigate('/customer/orders'); // redirect back if error
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm('Are you sure you want to logout from Medi-Flow?', 'Confirm Logout', 'Logout');
    if (confirmed) {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customer');
      navigate('/customer/login');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending Review': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-blue-100 text-blue-800',
      'Processing': 'bg-primary-100 text-primary-800',
      'Out for Delivery': 'bg-purple-100 text-purple-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <CustomerNavbar />

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">View and track your order history</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : orderList.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-gray-900">No orders yet</h3>
            <p className="mt-2 text-gray-500">Start shopping to place your first order</p>
            <Link
              to="/shop"
              className="mt-6 inline-block bg-accent-600 text-white px-6 py-3 rounded-lg hover:bg-accent-700 transition duration-150"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orderList.map((order) => (
              <div key={order.order_id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-150">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.order_id}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.order_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      ₹{order.total_amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    
                    {order.requires_prescription && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Rx: {order.prescription_status}
                      </span>
                    )}

                    <span className="text-sm text-gray-600">
                      {order.payment_method}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      to={`/customer/orders/${order.order_id}/track`}
                      className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition duration-150 text-sm font-medium"
                    >
                      Track Order
                    </Link>
                    <Link
                      to={`/customer/orders/${order.order_id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-150 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {orderId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => navigate('/customer/orders')}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-slate-100">
              
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                {loadingDetails || !selectedOrder ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Order #{selectedOrder.order_id}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Placed on {new Date(selectedOrder.order_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {selectedOrder.delivery_otp && !['Delivered', 'Cancelled', 'Rejected'].includes(selectedOrder.status) && (
                          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg">
                            <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider">PIN:</span>
                            <span className="text-lg font-black text-yellow-600 tracking-widest">{selectedOrder.delivery_otp}</span>
                            <button 
                              onClick={() => fetchOrderDetails(selectedOrder.order_id)}
                              className="ml-2 p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-full transition-colors"
                              title="Refresh PIN"
                            >
                              <RefreshCw size={16} className={loadingDetails ? "animate-spin" : ""} />
                            </button>
                          </div>
                        )}
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Shipping Details</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {selectedOrder.shipping_address}<br />
                          {selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_pincode}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Payment Details</h4>
                        <p className="text-sm text-slate-600 mb-1">Method: <span className="font-semibold text-slate-900">{selectedOrder.payment_method}</span></p>
                        <p className="text-sm text-slate-600">Total: <span className="font-bold text-primary-600">₹{selectedOrder.total_amount.toFixed(2)}</span></p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Order Items</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow transition-shadow">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                <p className="text-xs text-slate-500">Qty: {item.quantity} × ₹{item.unit_price.toFixed(2)}</p>
                              </div>
                            </div>
                            <p className="text-sm font-bold text-slate-900">₹{item.subtotal.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-2xl border-t border-slate-200">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-2 bg-slate-900 text-base font-bold text-white hover:bg-slate-800 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  onClick={() => navigate('/customer/orders')}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerDashboard;
