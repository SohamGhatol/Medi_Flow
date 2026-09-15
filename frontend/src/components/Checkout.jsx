import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cart, orders } from '../services/customerApi';

const Checkout = () => {
  const [step, setStep] = useState(1);
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartAndValidate();
    loadCustomerAddress();
  }, []);

  const fetchCartAndValidate = async () => {
    try {
      setLoading(true);
      const cartResponse = await cart.get();
      
      if (cartResponse.data.item_count === 0) {
        navigate('/cart');
        return;
      }
      
      setCartData(cartResponse.data);
    } catch (error) {
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerAddress = () => {
    const customer = JSON.parse(localStorage.getItem('customer') || '{}');
    if (customer.address) {
      setShippingAddress({
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || ''
      });
    }
  };

  const handleAddressChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload PNG, JPG, or PDF');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum size is 5MB');
        return;
      }
      
      setPrescriptionFile(file);
      setError('');
    }
  };

  const handlePlaceOrder = async () => {
    // CRITICAL: Validate prescription upload if Rx items present
    if (cartData.requires_prescription && !prescriptionFile) {
      setError('Prescription upload is required for prescription medicines');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('shipping_address', shippingAddress.address);
      formData.append('shipping_city', shippingAddress.city);
      formData.append('shipping_state', shippingAddress.state);
      formData.append('shipping_pincode', shippingAddress.pincode);
      
      if (prescriptionFile) {
        formData.append('prescription', prescriptionFile);
      }

      const response = await orders.place(formData);
      
      // Navigate to order confirmation
      navigate('/order-confirmation', { 
        state: { 
          orderId: response.data.order_id,
          total: response.data.total,
          requiresReview: response.data.requires_prescription_review
        } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-primary-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600">Review Cart</span>
            <span className="text-xs text-gray-600">Shipping</span>
            <span className="text-xs text-gray-600">Confirm</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Review Cart */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Review Your Order</h2>
            
            {cartData.cart_items.map((item) => (
              <div key={item.cart_item_id} className="flex items-center justify-between py-4 border-b">
                <div className="flex items-center space-x-4">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-16 w-16 object-cover rounded"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/64'}
                  />
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.company}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    {item.product_type === 'Rx' && (
                      <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        Rx Required
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{item.subtotal.toFixed(2)}</p>
                </div>
              </div>
            ))}

            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary-600">₹{cartData.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-6 w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700"
            >
              Continue to Shipping
            </button>
          </div>
        )}

        {/* Step 2: Shipping Address */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  required
                  rows="3"
                  value={shippingAddress.address}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Street address, apartment, suite, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={shippingAddress.city}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    name="state"
                    value={shippingAddress.state}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={shippingAddress.pincode}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="mt-6 flex space-x-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!shippingAddress.address}
                className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Prescription Upload (Conditional) & Confirm */}
        {step === 3 && (
          <div className="space-y-6">
            {/* CONDITIONAL PRESCRIPTION UPLOAD */}
            {cartData.requires_prescription && (
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
                <div className="flex items-start mb-4">
                  <svg className="h-6 w-6 text-red-500 mr-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h2 className="text-xl font-bold text-red-800 mb-2">Prescription Required</h2>
                    <p className="text-sm text-red-700">
                      Your cart contains prescription medicines. Please upload a valid prescription to proceed.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Prescription <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-500 transition">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
                    </div>
                  </div>
                  
                  {prescriptionFile && (
                    <div className="mt-3 flex items-center justify-between bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-green-800">{prescriptionFile.name}</span>
                      </div>
                      <button
                        onClick={() => setPrescriptionFile(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₹{cartData.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery:</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary-600">₹{cartData.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Shipping to:</strong><br/>
                  {shippingAddress.address}<br/>
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}
                </p>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Payment Method:</strong> Cash on Delivery
                </p>
              </div>

              {cartData.requires_prescription && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Your order will be reviewed by our pharmacist before processing.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setStep(2)}
                disabled={submitting}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={submitting || (cartData.requires_prescription && !prescriptionFile)}
                className="flex-1 bg-accent-600 text-white py-3 rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin inline h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Placing Order...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
