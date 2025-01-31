import React, { createContext, useContext, useState } from 'react';
import { User } from '../types/user';

interface CustomerContextType {
  selectedCustomer: User | null;
  setSelectedCustomer: (customer: User | null) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);

  return (
    <CustomerContext.Provider
      value={{
        selectedCustomer,
        setSelectedCustomer,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}; 