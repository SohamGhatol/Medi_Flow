import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orders } from '../services/customerApi';
import { RefreshCw } from 'lucide-react';

const OrderTracking = () => {
  const { orderId } = useParams();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTracking();
  }, [orderId]);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const response = await orders.track(orderId);
      setTrackingData(response.data);
    } catch (error) {
      console.error('Error fetching tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
          <Link to="/customer/orders" className="mt-4 text-primary-600 hover:text-primary-800">
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Track Your Order
          </h1>
          <p className="text-gray-600">Order #{trackingData.order_id}</p>
        </div>

        {/* Current Status Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-4">
              <svg className="h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {trackingData.current_status}
            </h2>
            <p className="text-gray-600">
              Last updated: {new Date(trackingData.last_updated).toLocaleString()}
            </p>
            {trackingData.delivery_otp && !['Delivered', 'Cancelled', 'Rejected'].includes(trackingData.current_status) && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl inline-block">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-yellow-800 font-medium">Delivery OTP</p>
                  <button 
                    onClick={() => fetchTracking()}
                    className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-full transition-colors"
                    title="Refresh PIN"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                <p className="text-3xl font-black text-yellow-600 tracking-widest">{trackingData.delivery_otp}</p>
                <p className="text-xs text-yellow-600 mt-2">Share this with the delivery executive.</p>
              </div>
            )}
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Order Progress</h3>
          
          <div className="relative">
            {trackingData.tracking_stages.map((stage, index) => (
              <div key={index} className="flex items-start mb-8 last:mb-0">
                {/* Timeline Line */}
                {index < trackingData.tracking_stages.length - 1 && (
                  <div className={`absolute left-5 top-12 w-0.5 h-16 ${
                    stage.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} style={{ marginLeft: '0.125rem' }}></div>
                )}

                {/* Status Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  stage.completed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {stage.completed ? (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                  )}
                </div>

                {/* Status Details */}
                <div className="ml-4 flex-1">
                  <h4 className={`text-lg font-semibold ${
                    stage.completed ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {stage.stage}
                  </h4>
                  <p className={`text-sm ${
                    stage.completed ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {stage.completed ? 'Completed' : 'Pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            to={`/customer/orders/${orderId}`}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-150 font-medium"
          >
            View Order Details
          </Link>
          <Link
            to="/customer/orders"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-150 font-medium"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
