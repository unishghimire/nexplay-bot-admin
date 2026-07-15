import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

// Admin panel has NO login — it's a private URL known only to the owner.
// We just pass isLoadingAuth=false, no errors, no redirects.
export const AuthProvider = ({ children }) => {
  return (
    <AuthContext.Provider value={{
      isLoadingAuth: false,
      isLoadingPublicSettings: false,
      authError: null,
      navigateToLogin: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
