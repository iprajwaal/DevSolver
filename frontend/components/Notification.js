// /Users/prajwal/Developer/code-helper/frontend/components/Notification.js

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

const Notification = ({ type, message, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progressWidth, setProgressWidth] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      // Set up a timer to auto-close the notification
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) setTimeout(onClose, 300); // Allow animation to complete
      }, duration);
      
      // Set up progress bar animation
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration * 100));
        setProgressWidth(remaining);
        
        if (elapsed >= duration) {
          clearInterval(interval);
        }
      }, 30);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) setTimeout(onClose, 300); // Allow animation to complete
  };

  const getIcon = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <FaCheckCircle className="text-white h-5 w-5" />;
      case NOTIFICATION_TYPES.ERROR:
        return <FaExclamationCircle className="text-white h-5 w-5" />;
      case NOTIFICATION_TYPES.WARNING:
        return <FaExclamationTriangle className="text-white h-5 w-5" />;
      case NOTIFICATION_TYPES.INFO:
      default:
        return <FaInfoCircle className="text-white h-5 w-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return {
          background: 'bg-gradient-to-r from-emerald-500 to-green-500',
          progress: 'bg-emerald-300',
          icon: 'bg-emerald-600',
        };
      case NOTIFICATION_TYPES.ERROR:
        return {
          background: 'bg-gradient-to-r from-red-500 to-rose-500',
          progress: 'bg-red-300',
          icon: 'bg-red-600',
        };
      case NOTIFICATION_TYPES.WARNING:
        return {
          background: 'bg-gradient-to-r from-amber-500 to-yellow-500',
          progress: 'bg-amber-300',
          icon: 'bg-amber-600',
        };
      case NOTIFICATION_TYPES.INFO:
      default:
        return {
          background: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          progress: 'bg-blue-300',
          icon: 'bg-blue-600',
        };
    }
  };

  const styles = getStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 right-4 max-w-sm w-full sm:w-96 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          <div className={`${styles.background} p-4 pr-10`}>
            <div className="flex items-center">
              <div className={`${styles.icon} flex-shrink-0 rounded-full p-2 mr-3 shadow-md`}>
                {getIcon()}
              </div>
              <div className="flex-1 pr-2">
                <p className="text-white font-medium">{message}</p>
              </div>
            </div>
            
            <button
              type="button"
              className="absolute top-4 right-4 text-white hover:text-gray-200 focus:outline-none"
              onClick={handleClose}
              aria-label="Close notification"
            >
              <FaTimes />
            </button>
            
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-20">
              <motion.div 
                className={`h-full ${styles.progress}`}
                initial={{ width: "100%" }}
                animate={{ width: `${progressWidth}%` }}
                transition={{ duration: 0 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;