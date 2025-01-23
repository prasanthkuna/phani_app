import React, { useState, useEffect } from 'react';
import { getCustomers } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
}

interface UserSelectProps {
  selectedUserId: number | null;
  onUserSelect: (userId: number | null) => void;
}

const UserSelect: React.FC<UserSelectProps> = ({ selectedUserId, onUserSelect }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) return;
      
      try {
        setLoading(true);
        setError('');
        const response = await getCustomers();
        console.log('Customer response:', response.data);
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

  if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
    return null;
  }

  if (loading) {
    return <div className="text-gray-500">Loading customers...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Customer
      </label>
      <select
        value={selectedUserId || ''}
        onChange={(e) => onUserSelect(e.target.value ? Number(e.target.value) : null)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">Order for myself</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.username} {user.email ? `(${user.email})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

export default UserSelect; 