import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlert from '../components/common/CustomAlert';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PromptDialog from '../components/common/PromptDialog';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });
  
  const [promptState, setPromptState] = useState({
    isOpen: false,
    title: '',
    message: '',
    defaultValue: '',
    options: null,
    onConfirm: null,
    onCancel: null,
    confirmText: 'Submit',
    cancelText: 'Cancel'
  });

  // showAlert({ type: 'success' | 'error' | 'warning' | 'info', message: '...', title: '...' })
  const showAlert = useCallback((alertConfig) => {
    const id = Date.now() + Math.random().toString();
    setAlerts((prev) => [...prev, { ...alertConfig, id }]);
    
    // Auto-dismiss after a set time (longer for errors)
    const duration = alertConfig.type === 'error' ? 8000 : 5000;
    setTimeout(() => {
      removeAlert(id);
    }, duration);
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  // showConfirm(title, message, confirmText, cancelText) returns Promise<boolean>
  const showConfirm = useCallback((message, title = 'Confirm Action', confirmText = 'Confirm', cancelText = 'Cancel') => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  // showPrompt(title, message, defaultValue, options) returns Promise<string | null>
  const showPrompt = useCallback((message, title = 'Enter Value', defaultValue = '', options = null) => {
    return new Promise((resolve) => {
      setPromptState({
        isOpen: true,
        title,
        message,
        defaultValue,
        options,
        onConfirm: (value) => {
          setPromptState((prev) => ({ ...prev, isOpen: false }));
          resolve(value);
        },
        onCancel: () => {
          setPromptState((prev) => ({ ...prev, isOpen: false }));
          resolve(null);
        }
      });
    });
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      
      {/* Render Alerts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {alerts.map((alert) => (
          <CustomAlert key={alert.id} alert={alert} onClose={() => removeAlert(alert.id)} />
        ))}
      </div>

      {/* Render Confirm Dialog */}
      {confirmState.isOpen && (
        <ConfirmDialog
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          onConfirm={confirmState.onConfirm}
          onCancel={confirmState.onCancel}
        />
      )}

      {/* Render Prompt Dialog */}
      {promptState.isOpen && (
        <PromptDialog
          title={promptState.title}
          message={promptState.message}
          defaultValue={promptState.defaultValue}
          options={promptState.options}
          onConfirm={promptState.onConfirm}
          onCancel={promptState.onCancel}
        />
      )}
    </AlertContext.Provider>
  );
};
