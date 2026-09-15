import React from 'react';

const icons = {
  success: (
    <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

const styles = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    title: 'text-green-800',
    text: 'text-green-700',
    close: 'text-green-500 hover:text-green-700'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    title: 'text-red-800',
    text: 'text-red-700',
    close: 'text-red-500 hover:text-red-700'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    title: 'text-yellow-800',
    text: 'text-yellow-700',
    close: 'text-yellow-500 hover:text-yellow-700'
  },
  info: {
    bg: 'bg-primary-50',
    border: 'border-primary-500',
    title: 'text-primary-800',
    text: 'text-primary-700',
    close: 'text-primary-500 hover:text-primary-700'
  }
};

const CustomAlert = ({ alert, onClose }) => {
  const type = alert.type || 'info';
  const style = styles[type] || styles.info;
  const icon = icons[type] || icons.info;

  return (
    <div className={`${style.bg} border-l-4 ${style.border} p-4 rounded-lg shadow-lg animate-fade-in pointer-events-auto min-w-[300px] max-w-md transition-all duration-300 transform scale-100`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="ml-3 flex-1">
          {alert.title && <h3 className={`text-sm font-medium ${style.title}`}>{alert.title}</h3>}
          <div className={`text-sm ${style.text} ${alert.title ? 'mt-1' : ''}`}>
            {alert.message}
          </div>
        </div>
        <button
          onClick={onClose}
          className={`ml-4 flex-shrink-0 focus:outline-none ${style.close}`}
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CustomAlert;
