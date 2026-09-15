import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cart } from '../services/customerApi';
import { useAlert } from '../context/AlertContext';
import CustomerNavbar from './common/CustomerNavbar';

const ShoppingCart = () => {
  const { showAlert, showConfirm } = useAlert();
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    total: 0,
    item_count: 0,
    requires_prescription: false
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cart.get();
      setCartItems(response.data.cart_items);
      setCartSummary({
        total: response.data.total,
        item_count: response.data.item_count,
        requires_prescription: response.data.requires_prescription
      });
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      setUpdating(true);
      await cart.update(cartItemId, { quantity: newQuantity });
      fetchCart();
    } catch (error) {
      showAlert({ type: 'error', message: error.response?.data?.message || 'Failed to update quantity', title: 'Error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    const confirmed = await showConfirm('Remove this item from cart?', 'Remove Item', 'Remove');
    if (!confirmed) return;
    
    try {
      setUpdating(true);
      await cart.remove(cartItemId);
      showAlert({ type: 'success', message: 'Item removed from cart' });
      fetchCart();
    } catch (error) {
      showAlert({ type: 'error', message: 'Failed to remove item', title: 'Error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleClearCart = async () => {
    const confirmed = await showConfirm('Clear entire cart?', 'Clear Cart', 'Clear');
    if (!confirmed) return;
    
    try {
      setUpdating(true);
      await cart.clear();
      showAlert({ type: 'success', message: 'Cart cleared' });
      fetchCart();
    } catch (error) {
      showAlert({ type: 'error', message: 'Failed to clear cart', title: 'Error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-2 text-gray-500">Start shopping to add items to your cart</p>
            <Link
              to="/shop"
              className="mt-6 inline-block bg-accent-600 text-white px-6 py-3 rounded-lg hover:bg-accent-700 transition duration-150"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Prescription Warning */}
              {cartSummary.requires_prescription && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <div className="flex">
                    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Prescription Required</h3>
                      <p className="mt-1 text-sm text-red-700">
                        Your cart contains prescription medicines. You'll need to upload a valid prescription during checkout.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {cartItems.map((item) => (
                <div key={item.cart_item_id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <img
                      src={item.image_url?.startsWith('/uploads') ? `http://localhost:5000${item.image_url}` : (item.image_url || 'https://via.placeholder.com/100?text=Medicine')}
                      alt={item.name}
                      className="h-24 w-24 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = 'https://via.placeholder.com/100?text=Medicine';
                      }}
                    />

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">{item.company}</p>
                          
                          {/* OTC/Rx Badge */}
                          <div className="mt-2">
                            {item.product_type === 'Rx' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Prescription Required
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                Over-the-Counter
                              </span>
                            )}
                          </div>

                          {/* Stock Warning */}
                          {!item.in_stock && (
                            <p className="mt-2 text-sm text-red-600 font-medium">
                              Out of stock - Please remove from cart
                            </p>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary-600">₹{item.price}</p>
                          <p className="text-sm text-gray-500">per unit</p>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <label className="text-sm font-medium text-gray-700">Quantity:</label>
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity - 1)}
                              disabled={updating || item.quantity <= 1}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            <span className="px-4 py-1 font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity + 1)}
                              disabled={updating || item.quantity >= item.available_quantity}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-sm text-gray-500">
                            (Max: {item.available_quantity})
                          </span>
                        </div>

                        {/* Subtotal and Remove */}
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Subtotal:</p>
                            <p className="text-xl font-bold text-gray-900">₹{item.subtotal.toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.cart_item_id)}
                            disabled={updating}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear Cart Button */}
              <button
                onClick={handleClearCart}
                disabled={updating}
                className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
              >
                Clear entire cart
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Items ({cartSummary.item_count})</span>
                    <span>₹{cartSummary.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="text-green-600 font-medium">FREE</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">₹{cartSummary.total.toFixed(2)}</span>
                  </div>
                </div>

                {cartSummary.requires_prescription && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      <strong>Note:</strong> Prescription upload required during checkout
                    </p>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={updating}
                  className="w-full bg-accent-600 text-white py-3 px-4 rounded-lg hover:bg-accent-700 transition duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Checkout
                </button>

                <Link
                  to="/shop"
                  className="block w-full text-center mt-3 text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  Continue Shopping
                </Link>

                {/* Payment Info */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Payment Method</h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Cash on Delivery
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;
