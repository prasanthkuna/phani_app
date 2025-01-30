import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCustomer } from '../contexts/CustomerContext';
import { useCart } from '../contexts/CartContext';
import UserSelect from './UserSelect';

export default function UserSelectHeader() {
  const { user } = useAuth();
  const { selectedCustomer, setSelectedCustomer } = useCustomer();
  const { setSelectedUserId } = useCart();

  const handleUserSelect = (userId: number | null) => {
    if (userId) {
      // The actual user object will be set by the UserSelect component
      setSelectedUserId(userId);
    } else {
      setSelectedCustomer(null);
      setSelectedUserId(null);
    }
  };

  // Only show for managers and employees, not for customers
  if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role.toUpperCase())) {
    return null;
  }

  return (
    <div className="bg-gray-50 border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-md">
            <UserSelect
              selectedUserId={selectedCustomer?.id || null}
              onUserSelect={handleUserSelect}
            />
          </div>
          {selectedCustomer && (
            <div className="text-sm text-gray-500 ml-4">
              Selected Customer: {selectedCustomer.username}
              {selectedCustomer.email && ` (${selectedCustomer.email})`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
