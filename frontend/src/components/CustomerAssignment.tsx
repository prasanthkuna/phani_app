import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "../components/ui/use-toast";
import { 
  getUnassignedCustomers, 
  assignCustomersToEmployee, 
  getEmployeeCustomers, 
  unassignCustomerFromEmployee 
} from '../services/api';
import { User } from '../types/user';

interface CustomerAssignmentProps {
  employeeId: number;
}

interface Assignment {
  id: number;
  customer: User;
  employee: User;
  assigned_by: User;
  assigned_at: string;
  employee_username: string;
  customer_username: string;
  assigned_by_username: string;
}

export function CustomerAssignment({ employeeId }: CustomerAssignmentProps) {
  const [availableCustomers, setAvailableCustomers] = useState<User[]>([]);
  const [assignedCustomers, setAssignedCustomers] = useState<Assignment[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Get unassigned customers
      const unassignedResponse = await getUnassignedCustomers();
      setAvailableCustomers(unassignedResponse.data);

      // Get assigned customers
      const assignedResponse = await getEmployeeCustomers(employeeId);
      console.log('Assigned customers response:', JSON.stringify(assignedResponse.data, null, 2));
      setAssignedCustomers(assignedResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch customers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignCustomers = async () => {
    try {
      await assignCustomersToEmployee(employeeId, selectedCustomers);
      toast({
        title: 'Success',
        description: 'Customers assigned successfully.',
      });
      await fetchData();
      setSelectedCustomers([]);
    } catch (error) {
      console.error('Error assigning customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign customers. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUnassignCustomer = async (customerId: number) => {
    try {
      if (!customerId) {
        toast({
          title: 'Error',
          description: 'Invalid customer ID',
          variant: 'destructive',
        });
        return;
      }
      console.log('Unassigning customer with ID:', customerId);
      await unassignCustomerFromEmployee(employeeId, customerId);
      toast({
        title: 'Success',
        description: 'Customer unassigned successfully.',
      });
      await fetchData();
    } catch (error) {
      console.error('Error unassigning customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to unassign customer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Assign New Customers</h3>
          <div className="flex gap-4">
            <Select
              value=""
              onValueChange={(value) => {
                const customerId = parseInt(value);
                if (!selectedCustomers.includes(customerId)) {
                  setSelectedCustomers([...selectedCustomers, customerId]);
                }
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select customers to assign" />
              </SelectTrigger>
              <SelectContent>
                {availableCustomers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.username} ({customer.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAssignCustomers}
              disabled={selectedCustomers.length === 0}
            >
              Assign Selected Customers
            </Button>
          </div>
          {selectedCustomers.length > 0 && (
            <div className="mt-2">
              <h4 className="text-sm font-medium mb-1">Selected customers:</h4>
              <div className="flex gap-2 flex-wrap">
                {selectedCustomers.map((id) => {
                  const customer = availableCustomers.find(c => c.id === id);
                  return customer ? (
                    <div
                      key={id}
                      className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md flex items-center gap-2"
                    >
                      <span>{customer.username}</span>
                      <button
                        onClick={() => setSelectedCustomers(selectedCustomers.filter(cid => cid !== id))}
                        className="text-sm hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Currently Assigned Customers</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned By</TableHead>
                <TableHead>Assigned At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedCustomers.map((assignment) => {
                console.log('Processing assignment:', JSON.stringify(assignment, null, 2));
                return (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.customer_username}</TableCell>
                    <TableCell>{assignment.customer?.email}</TableCell>
                    <TableCell>{assignment.customer?.phone}</TableCell>
                    <TableCell>{assignment.customer?.status}</TableCell>
                    <TableCell>{assignment.assigned_by_username}</TableCell>
                    <TableCell>{new Date(assignment.assigned_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => {
                          // Get the customer ID from the assignment
                          const customerId = assignment.customer;
                          console.log('Full assignment data for unassign:', JSON.stringify(assignment, null, 2));
                          console.log('Customer data for unassign:', JSON.stringify(assignment.customer, null, 2));
                          console.log('Attempting to unassign customer with ID:', customerId);
                          handleUnassignCustomer(customerId);
                        }}
                        variant="destructive"
                        size="sm"
                      >
                        Unassign
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {assignedCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No customers assigned yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 
