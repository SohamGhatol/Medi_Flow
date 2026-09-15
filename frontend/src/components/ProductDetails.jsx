import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { products, cart } from '../services/customerApi';
import { useAlert } from '../context/AlertContext';
import CustomerNavbar from './common/CustomerNavbar';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const response = await products.getById(id);
      setProduct(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      showAlert({ type: 'error', message: 'Failed to load product details' });
      navigate('/shop');
    }
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem('customerToken');
    
    if (!token) {
      showAlert({ type: 'warning', message: 'Please login to add items to cart' });
      navigate('/customer/login');
      return;
    }

    if (quantity > product.available_quantity) {
      showAlert({ type: 'error', message: 'Requested quantity exceeds available stock' });
      return;
    }

    setIsAdding(true);
    try {
      await cart.add({
        medicine_id: product.medicine_id,
        quantity: quantity
      });
      
      setAdded(true);
      showAlert({ type: 'success', message: `${product.name} added to cart.` });
      
      setTimeout(() => {
        setAdded(false);
        setIsAdding(false);
      }, 2000);
      
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error adding to cart:', error);
      showAlert({ type: 'error', message: error.response?.data?.message || 'Failed to add item to cart' });
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col pt-16">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse flex flex-col md:flex-row gap-12">
            <div className="w-full md:w-1/2 lg:w-5/12 bg-slate-200 rounded-3xl aspect-square"></div>
            <div className="w-full md:w-1/2 lg:w-7/12 space-y-6 pt-4">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-10 bg-slate-200 rounded w-3/4"></div>
              <div className="h-6 bg-slate-200 rounded w-1/3"></div>
              <div className="h-12 bg-slate-200 rounded w-1/4 mt-8"></div>
              <div className="h-24 bg-slate-200 rounded w-full mt-8"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <CustomerNavbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto">
          
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-primary-900/5 ring-1 ring-slate-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-gradient-to-br from-primary-100/50 to-primary-50/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-gradient-to-tr from-blue-100/40 to-transparent rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row relative z-10">
              
              {/* Left Column: Product Image */}
              <div className="w-full md:w-1/2 lg:w-5/12 p-8 md:p-12 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100/60 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 to-white pointer-events-none"></div>
                <div className="relative w-full aspect-square max-w-sm mx-auto group">
                  {(!product.image_url || imageError) ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 group-hover:bg-slate-100/80 transition-colors">
                      <svg className="h-24 w-24 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      <span className="font-medium">Image Unavailable</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden flex items-center justify-center p-6 group-hover:shadow-md transition-all duration-300">
                      <img 
                        src={product.image_url?.startsWith('/uploads') ? `http://localhost:5000${product.image_url}` : product.image_url} 
                        alt={`${product.name} product`}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out cursor-zoom-in drop-shadow-xl"
                        onError={() => setImageError(true)}
                        onClick={() => setIsZoomed(true)}
                      />
                    </div>
                  )}
                  {/* Badges */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    {product.requires_prescription ? (
                      <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30">
                        Rx Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
                        OTC
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Product Metadata */}
              <div className="w-full md:w-1/2 lg:w-7/12 p-8 md:p-12 flex flex-col">
                <div className="flex-grow">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">{product.category || 'Medicine'}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm text-slate-500">{product.company}</span>
                  </div>
                  
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
                    {product.name}
                  </h1>
                  
                  {product.generic_name && (
                    <p className="text-lg text-slate-500 mb-6 font-medium">
                      Generic: {product.generic_name}
                    </p>
                  )}

                  <div className="flex items-end mb-8">
                    <span className="text-4xl font-black text-slate-900">₹{product.price.toFixed(2)}</span>
                    <span className="text-sm text-slate-500 ml-2 mb-1">/ unit</span>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300">
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1.5 flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Dosage Form
                      </p>
                      <p className="font-semibold text-slate-800 text-lg">{product.dosage_form || 'Tablet'}</p>
                    </div>
                    <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300">
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1.5 flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Strength
                      </p>
                      <p className="font-semibold text-slate-800 text-lg">{product.strength || 'Standard'}</p>
                    </div>
                    <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300">
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1.5 flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Availability
                      </p>
                      {product.in_stock ? (
                        <p className="font-semibold text-emerald-600 text-lg flex items-center">
                          In Stock 
                          <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                            {product.available_quantity > 99 ? '100+' : product.available_quantity} left
                          </span>
                        </p>
                      ) : (
                        <p className="font-semibold text-red-600 text-lg flex items-center">
                          Out of Stock
                        </p>
                      )}
                    </div>
                    <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300">
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1.5 flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Manufacturer
                      </p>
                      <p className="font-semibold text-slate-800 text-lg truncate" title={product.company}>{product.company}</p>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Section */}
                <div className="pt-6 border-t border-slate-100 mt-auto">
                  {product.requires_prescription && (
                    <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-start">
                      <svg className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-sm text-purple-800">
                        <strong className="font-semibold block mb-1">Valid Prescription Required</strong>
                        You will need to upload a valid doctor's prescription during checkout for this medication.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-slate-200 rounded-2xl bg-slate-50 shadow-inner h-14 w-full sm:w-32 flex-shrink-0 relative z-0">
                      <button 
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={!product.in_stock || quantity <= 1}
                        className="flex-1 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-white disabled:opacity-50 transition-colors h-full rounded-l-2xl"
                        aria-label="Decrease quantity"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                        </svg>
                      </button>
                      
                      <div className="w-12 font-bold text-slate-900 border-x border-slate-200 h-full flex items-center justify-center bg-white text-lg">
                        {quantity}
                      </div>

                      <button 
                        type="button"
                        onClick={() => setQuantity(Math.min(product.available_quantity, quantity + 1))}
                        disabled={!product.in_stock || quantity >= product.available_quantity}
                        className="flex-1 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-white disabled:opacity-50 transition-colors h-full rounded-r-2xl"
                        aria-label="Increase quantity"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={handleAddToCart}
                      disabled={!product.in_stock || isAdding}
                      className={`h-14 flex-grow flex items-center justify-center px-8 rounded-2xl text-base font-bold text-white transition-all duration-300 shadow-xl ${
                        !product.in_stock 
                          ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                          : added 
                            ? 'bg-emerald-500 shadow-emerald-500/40 hover:bg-emerald-600'
                            : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-primary-500/40 hover:shadow-primary-500/60 transform hover:-translate-y-0.5 active:translate-y-0'
                      }`}
                    >
                      {isAdding ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding to Cart...
                        </>
                      ) : added ? (
                        <>
                          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Added Successfully
                        </>
                      ) : (
                        <>
                          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion / Tabs Section */}
            <div className="border-t border-slate-100 bg-white">
              <div className="flex border-b border-slate-100 relative">
                <button
                  className={`relative px-8 py-6 text-sm font-black uppercase tracking-widest transition-colors z-10 ${activeTab === 'description' ? 'text-primary-600' : 'text-slate-400 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('description')}
                >
                  Product Description
                  {activeTab === 'description' && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-primary-400 rounded-t-full"></span>
                  )}
                </button>
                <button
                  className={`relative px-8 py-6 text-sm font-black uppercase tracking-widest transition-colors z-10 ${activeTab === 'info' ? 'text-primary-600' : 'text-slate-400 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('info')}
                >
                  Usage & Warnings
                  {activeTab === 'info' && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-primary-400 rounded-t-full"></span>
                  )}
                </button>
              </div>
              
              <div className="p-8 md:p-12">
                {activeTab === 'description' && (
                  <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-p:text-slate-600">
                    <p>{product.description || 'No detailed description available for this product.'}</p>
                  </div>
                )}
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 mb-2">General Guidance</h4>
                      <p className="text-slate-600 text-sm leading-relaxed">Always follow the dosage instructions provided by your healthcare professional or the product packaging. Do not exceed the recommended dose.</p>
                    </div>
                    {product.requires_prescription && (
                      <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-100">
                        <h4 className="text-sm font-bold mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Prescription Medication
                        </h4>
                        <p className="text-xs leading-relaxed">This medication may have serious side effects if used incorrectly. Consult your doctor immediately if you experience adverse reactions. Store in a cool, dry place out of reach of children.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Image Zoom Modal */}
      {isZoomed && product.image_url && !imageError && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur-md transition-all"
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(false);
            }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <img 
            src={product.image_url?.startsWith('/uploads') ? `http://localhost:5000${product.image_url}` : product.image_url} 
            alt={product.name} 
            className="max-w-full max-h-full object-contain select-none shadow-2xl rounded-xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
