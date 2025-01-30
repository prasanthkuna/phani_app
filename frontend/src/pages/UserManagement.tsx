import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, UserFilters } from '../types/user';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { format } from 'date-fns';
import { MoreHorizontal, Search } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { getUsers, approveUser, updateUserRole, resetUserPassword, updateUserStatus } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from '../components/ui/use-toast';

export default function UserManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'MANAGER') {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.registrationDate) queryParams.append('registration_date', filters.registrationDate);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await getUsers(queryParams.toString());
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: number, newStatus: string) => {
    try {
      await updateUserStatus(userId, newStatus);
      toast({
        title: 'Success',
        description: 'User status updated successfully.',
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status.',
        variant: 'destructive',
      });
    }
  };

  const handleApproveUser = async (id: number) => {
    try {
      await approveUser(id);
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === id ? { ...user, status: 'ACTIVE' } : user
        )
      );
      toast({
        title: 'Success',
        description: 'User has been approved.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to approve user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = async (id: number, newRole: string) => {
    try {
      await updateUserRole(id, newRole);
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === id ? { ...user, role: newRole as 'CUSTOMER' | 'EMPLOYEE' | 'MANAGER' } : user
        )
      );
      toast({
        title: 'Success',
        description: 'User role has been updated.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async (id: number) => {
    try {
      const response = await resetUserPassword(id);
      toast({
        title: 'Success',
        description: `Password reset successfully. Temporary password: ${response.data.temp_password}`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'BLOCKED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Input
                placeholder="Search users..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="max-w-sm"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
            <Select
              value={filters.role || 'all'}
              onValueChange={(value) => setFilters({ ...filters, role: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setFilters({});
                fetchUsers();
              }}
            >
              Reset Filters
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select onValueChange={(value) => handleRoleChange(user.id, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={user.role} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CUSTOMER">Customer</SelectItem>
                          <SelectItem value="EMPLOYEE">Employee</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(user.registration_date)}
                    </TableCell>
                    <TableCell>
                      {user.status === 'PENDING' && (
                        <Button onClick={() => handleApproveUser(user.id)} variant="outline" size="sm" className="mr-2">
                          Approve
                        </Button>
                      )}
                      <Button onClick={() => handleResetPassword(user.id)} variant="outline" size="sm">
                        Reset Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 