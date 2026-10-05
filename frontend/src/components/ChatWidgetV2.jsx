import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAlert } from '../context/AlertContext';

const API_URL = 'http://localhost:5000/api';

const ChatWidgetV2 = () => {
  const { showAlert } = useAlert();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! 👋 I'm your shopping assistant. How can I help you today?",
      sender: 'bot',
      quickActions: [
        { label: '⭐ Recommend Products', query: 'recommend products' },
        { label: '🔍 Search Medicines', query: 'search for medicine' },
        { label: '🛒 View My Cart', query: 'show my cart' },
        { label: '🔄 Reorder Last Order', query: 'reorder from last order' },
        { label: '📦 Track Order', query: 'track my order' },
        { label: '💊 Order with Prescription', query: 'order with prescription' }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0, originX: 0, originY: 0 });
  const wasDragged = useRef(false);

  // Get customer token and ID from localStorage
  const getCustomerAuth = () => {
    const token = localStorage.getItem('customerToken');
    const user = localStorage.getItem('customer'); // Changed from 'customerUser' to 'customer'
    const customer_id = user ? JSON.parse(user).customer_id : null;
    return { token, customer_id };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      wasDragged.current = true;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPosition({
        x: dragStart.current.originX + dx,
        y: dragStart.current.originY + dy
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const formatBotResponse = (text) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          // Check if line is a header (starts with **)
          if (line.includes('**')) {
            const cleanLine = line.replace(/\*\*/g, '');
            return (
              <div key={index} className="font-semibold text-primary-700 text-sm">
                {cleanLine}
              </div>
            );
          }
          // Check if line is a bullet point
          else if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <div key={index} className="flex items-start text-sm">
                <span className="text-primary-500 mr-2">•</span>
                <span className="text-gray-700">{line.replace(/^[•\-]\s*/, '')}</span>
              </div>
            );
          }
          // Regular text
          else if (line.trim()) {
            return (
              <div key={index} className="text-sm text-gray-700">
                {line}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  const renderProductCard = (product) => {
    const { customer_id } = getCustomerAuth();
    
    return (
      <div key={product.medicine_id} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm">{product.name}</h4>
            <p className="text-xs text-gray-500">{product.company}</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            product.requires_prescription 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {product.requires_prescription ? 'Rx' : 'OTC'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-primary-600">₹{product.price.toFixed(2)}</span>
          {customer_id && (
            <button
              onClick={() => handleAddToCart(product.medicine_id, product.name)}
              className="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-xs font-medium transition duration-150"
            >
              Add to Cart
            </button>
          )}
        </div>
        {product.quantity === 0 && (
          <p className="text-xs text-red-600 mt-1">Out of stock</p>
        )}
      </div>
    );
  };

  const renderCartSummary = (cart) => {
    return (
      <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
        <h4 className="font-semibold text-gray-900 text-sm mb-2">Cart Summary</h4>
        <div className="space-y-1 mb-2">
          {cart.items.slice(0, 3).map(item => (
            <div key={item.cart_item_id} className="flex justify-between text-xs">
              <span className="text-gray-700">{item.medicine_name} x{item.quantity}</span>
              <span className="font-medium">₹{item.subtotal.toFixed(2)}</span>
            </div>
          ))}
          {cart.items.length > 3 && (
            <p className="text-xs text-gray-500">...and {cart.items.length - 3} more items</p>
          )}
        </div>
        <div className="border-t pt-2 flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total:</span>
          <span className="text-lg font-bold text-primary-600">₹{cart.total.toFixed(2)}</span>
        </div>
        <button
          onClick={() => window.location.href = '/checkout'}
          className="w-full mt-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition duration-150"
        >
          Proceed to Checkout
        </button>
      </div>
    );
  };

  const renderOrderTracking = (tracking) => {
    return (
      <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
        <h4 className="font-semibold text-gray-900 text-sm mb-2">Order #{tracking.order_id}</h4>
        <div className="space-y-2">
          {tracking.tracking_stages.map((stage, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                stage.completed ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {stage.completed && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`ml-2 text-xs ${stage.completed ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {stage.stage}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => window.location.href = `/customer/orders/${tracking.order_id}/track`}
          className="w-full mt-3 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-xs font-medium transition duration-150"
        >
          View Full Details
        </button>
      </div>
    );
  };

  const renderFileUpload = (component) => {
    return (
      <div className="border-2 border-dashed border-primary-300 rounded-lg p-4 bg-primary-50">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mt-2 text-sm text-gray-700 font-medium">Upload Prescription</p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, or PDF (max 5MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept={component.accept}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition duration-150 disabled:opacity-50"
          >
            {uploadingFile ? 'Uploading...' : 'Choose File'}
          </button>
        </div>
      </div>
    );
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5242880) {
      showAlert({ type: 'warning', message: 'File size must be less than 5MB' });
      return;
    }

    const { token, customer_id } = getCustomerAuth();
    if (!customer_id) {
      showAlert({ type: 'warning', message: 'Please login to upload prescription' });
      return;
    }

    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append('prescription', file);

      const response = await axios.post(
        `${API_URL}/customer/orders/place`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const botMessage = {
        id: messages.length + 1,
        text: `✅ Prescription uploaded successfully! Order #${response.data.order_id} has been created and is pending pharmacist review. You'll be notified once it's approved.`,
        sender: 'bot',
        formatted: true
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: messages.length + 1,
        text: `❌ Error uploading prescription: ${error.response?.data?.message || error.message}`,
        sender: 'bot'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddToCart = async (productId, productName) => {
    const { token, customer_id } = getCustomerAuth();
    
    if (!customer_id) {
      showAlert({ type: 'warning', message: 'Please login to add items to cart' });
      return;
    }

    try {
      await axios.post(
        `${API_URL}/customer/cart/add`,
        { medicine_id: productId, quantity: 1 },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const botMessage = {
        id: messages.length + 1,
        text: `✅ Added ${productName} to your cart!`,
        sender: 'bot'
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: messages.length + 1,
        text: `❌ Error adding to cart: ${error.response?.data?.message || error.message}`,
        sender: 'bot'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSend = async (query = null) => {
    const messageText = query || inputValue;
    if (!messageText.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: messageText,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const { token, customer_id } = getCustomerAuth();
      
      // Debug logging
      console.log('Chatbot Auth:', { customer_id, hasToken: !!token });

      // Call new chatbot API
      const response = await axios.post(
        `${API_URL}/chat/query`,
        {
          query: messageText,
          customer_id: customer_id,
          token: token
        }
      );

      const data = response.data;

      const botMessage = {
        id: messages.length + 2,
        text: data.answer,
        sender: 'bot',
        formatted: true,
        interactive_components: data.interactive_components || [],
        products: data.products || [],
        cart: data.cart,
        tracking: data.tracking,
        requires_auth: data.requires_auth
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        text: "Sorry, I'm having trouble processing your request. Please try again.",
        sender: 'bot'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onMouseDown={(e) => {
            setIsDragging(true);
            wasDragged.current = false;
            dragStart.current = {
              x: e.clientX,
              y: e.clientY,
              originX: position.x,
              originY: position.y
            };
          }}
          onClick={(e) => {
            if (wasDragged.current) {
              e.preventDefault();
              return;
            }
            setIsOpen(true);
          }}
          style={{ transform: `translate(${position.x}px, ${position.y}px)`, cursor: isDragging ? 'grabbing' : 'pointer' }}
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary-600 rounded-full shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group select-none"
        >
          <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 w-full h-full sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px] bg-white sm:rounded-2xl shadow-2xl flex flex-col z-50 animate-slideUp">
          {/* Header */}
          <div className="bg-primary-600 text-white p-4 sm:rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Shopping Assistant</h3>
                <p className="text-xs text-primary-100">Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.sender === 'user' ? 'bg-primary-600 text-white' : 'bg-white text-gray-800'} rounded-2xl p-3 shadow-sm`}>
                  {message.formatted ? formatBotResponse(message.text) : <p className="text-sm">{message.text}</p>}
                  
                  {/* Render interactive components */}
                  {message.interactive_components && message.interactive_components.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.interactive_components.map((component, index) => (
                        <div key={index}>
                          {component.type === 'product_card' && component.products && (
                            <div className="space-y-2">
                              {component.products.map(product => renderProductCard(product))}
                            </div>
                          )}
                          {component.type === 'cart_summary' && component.cart && renderCartSummary(component.cart)}
                          {component.type === 'order_tracking' && component.tracking_data && renderOrderTracking(component.tracking_data)}
                          {component.type === 'file_upload' && renderFileUpload(component)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Actions */}
                  {message.quickActions && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.quickActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleSend(action.query)}
                          className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium hover:bg-primary-200 transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl p-3 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim()}
                className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidgetV2;
