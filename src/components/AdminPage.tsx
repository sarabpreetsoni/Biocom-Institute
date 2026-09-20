import React, { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminPortal } from './AdminPortal';

const SESSION_KEY = 'biocom_admin_auth';

export const AdminPage: React.FC = () => {
  // Persist admin session in sessionStorage (clears when tab/browser closes)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  });

  const handleLoginSuccess = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  };

  // Expose logout handler globally so AdminPortal can call it
  useEffect(() => {
    (window as any).__biocomAdminLogout = handleLogout;
    return () => {
      delete (window as any).__biocomAdminLogout;
    };
  }, []);

  if (!isAuthenticated) {
    return <AdminLogin onSuccess={handleLoginSuccess} />;
  }

  return <AdminPortal />;
};
