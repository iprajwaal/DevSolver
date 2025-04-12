// /Users/prajwal/Developer/code-helper/frontend/contexts/NotificationContext.js

import React, { createContext, useState, useContext } from 'react';
import Notification, { NOTIFICATION_TYPES } from '../components/Notification';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (type, message, duration = 5000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message, duration }]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showSuccess = (message, duration) => 
    addNotification(NOTIFICATION_TYPES.SUCCESS, message, duration);

  const showError = (message, duration) => 
    addNotification(NOTIFICATION_TYPES.ERROR, message, duration);

  const showInfo = (message, duration) => 
    addNotification(NOTIFICATION_TYPES.INFO, message, duration);

  return (
    <NotificationContext.Provider
      value={{ addNotification, removeNotification, showSuccess, showError, showInfo }}
    >
      {children}
      <div className="notification-container">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            type={notification.type}
            message={notification.message}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationContext;