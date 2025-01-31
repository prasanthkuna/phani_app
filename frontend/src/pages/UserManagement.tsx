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
import { MoreHorizontal, Search, Pencil } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { getUsers, approveUser, updateUserRole, resetUserPassword, updateUserStatus } from '../services/api';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from '../components/ui/use-toast';
import { CustomerAssignment } from '../components/CustomerAssignment';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';

export default function UserManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    role: '',
    status: '',
    phone: '',
    address: '',
    plain_password: ''
  });

  useEffect(() => {
    if (user?.role?.toUpperCase() !== 'MANAGER') {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

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

  const handleResetPassword = async (selectedUser: User) => {
    setSelectedUserForPassword(selectedUser);
    setIsResetPasswordOpen(true);
  };

  const handleResetPasswordSubmit = async () => {
    if (!selectedUserForPassword || !newPassword) return;

    try {
      await resetUserPassword(selectedUserForPassword.id, newPassword);
      toast({
        title: 'Success',
        description: `Password has been updated successfully for user ${selectedUserForPassword.username}.`,
      });
      setIsResetPasswordOpen(false);
      setNewPassword('');
      setSelectedUserForPassword(null);
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

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      email: user.email || '',
      role: user.role,
      status: user.status,
      phone: user.phone || '',
      address: user.address || '',
      plain_password: user.plain_password || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;

    try {
      // Only include plain_password in the request if it has been changed
      const formData = {
        ...editForm,
        plain_password: editForm.plain_password !== selectedUser.plain_password ? editForm.plain_password : undefined
      };

      const response = await api.patch(`/admin/manage/${selectedUser.id}/edit_user/`, formData);
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === selectedUser.id ? response.data : u
        )
      );
      toast({
        title: 'Success',
        description: 'User details updated successfully.',
      });
      setIsEditDialogOpen(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to update user details.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
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
                  <TableHead className="w-[200px]">Password</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {user.plain_password || 'No password set'}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.registration_date)}</TableCell>
                    <TableCell className="space-x-2">
                      {user.status === 'PENDING' && (
                        <Button onClick={() => handleApproveUser(user.id)} variant="outline" size="sm">
                          Approve
                        </Button>
                      )}
                      <Button onClick={() => handleEditUser(user)} variant="outline" size="sm">
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {user.role === 'EMPLOYEE' && (
                        <Button
                          onClick={() => setSelectedEmployee(user.id)}
                          variant="outline"
                          size="sm"
                        >
                          Manage Customers
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isResetPasswordOpen} onOpenChange={(open) => {
        setIsResetPasswordOpen(open);
        if (!open) {
          setNewPassword('');
          setSelectedUserForPassword(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reset Password for {selectedUserForPassword?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" className="text-right">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsResetPasswordOpen(false);
                setNewPassword('');
                setSelectedUserForPassword(null);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleResetPasswordSubmit}>
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User: {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">Username</Label>
              <Input
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Address</Label>
              <Input
                id="address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Password</Label>
              <Input
                id="password"
                value={editForm.plain_password}
                onChange={(e) => setEditForm({ ...editForm, plain_password: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleEditSubmit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedEmployee && (
        <CustomerAssignment employeeId={selectedEmployee} />
      )}
    </div>
  );
} 