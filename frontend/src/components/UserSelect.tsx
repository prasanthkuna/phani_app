import React, { useState, useEffect } from 'react';
import { getCustomers } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCustomer } from '../contexts/CustomerContext';
import { User } from '../types/user';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface UserSelectProps {
  selectedUserId: number | null;
  onUserSelect: (userId: number | null) => void;
}

const UserSelect: React.FC<UserSelectProps> = ({ selectedUserId, onUserSelect }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { setSelectedCustomer } = useCustomer();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role?.toUpperCase())) return;
      
      try {
        setLoading(true);
        setError('');
        const response = await getCustomers();
        setUsers(response.data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const handleUserChange = (value: string) => {
    if (value === 'all') {
      onUserSelect(null);
      setSelectedCustomer(null);
    } else {
      const userId = parseInt(value, 10);
      const selectedUser = users.find(u => u.id === userId);
      onUserSelect(userId);
      if (selectedUser) {
        setSelectedCustomer(selectedUser);
      }
    }
  };

  if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role?.toUpperCase())) {
    return null;
  }

  if (loading) {
    return <div className="text-gray-500">Loading customers...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <Select
      value={selectedUserId?.toString() || 'all'}
      onValueChange={handleUserChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a customer" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Customers</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id.toString()}>
            {user.username} {user.email && `(${user.email})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default UserSelect; 