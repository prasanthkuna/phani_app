import { useState, useEffect } from 'react';
import { getUsers, getEmployeeCustomers } from '../services/api';
import { User } from '../types/user';
import { toast } from '../components/ui/use-toast';

interface UseCustomerSelectProps {
  userRole: string;
  userId: number;
}

export function useCustomerSelect({ userRole, userId }: UseCustomerSelectProps) {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [userRole, userId]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (userRole === 'MANAGER') {
        // Managers can see all customers
        const response = await getUsers('?role=CUSTOMER');
        setCustomers(response.data);
      } else if (userRole === 'EMPLOYEE') {
        // Employees can only see their assigned customers
        const response = await getEmployeeCustomers(userId);
        const assignedCustomers = response.data.map((assignment: any) => ({
          ...assignment.customer
        }));
        setCustomers(assignedCustomers);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to fetch customers');
      toast({
        title: 'Error',
        description: 'Failed to fetch customers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    customers,
    loading,
    error,
    refreshCustomers: fetchCustomers
  };
} 
