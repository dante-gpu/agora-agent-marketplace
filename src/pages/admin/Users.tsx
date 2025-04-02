import React, { useEffect, useState } from 'react';
import { Ban, Shield, Trash2, Check } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import Button from '../../components/Button';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';

const Users = () => {
  const { users, loading, error, fetchUsers, banUser, unbanUser, setUserRole } = useAdminStore();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banExpiry, setBanExpiry] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBan = async () => {
    if (!selectedUser || !banReason) return;
    await banUser(
      selectedUser,
      banReason,
      banExpiry ? new Date(banExpiry) : undefined
    );
    setSelectedUser(null);
    setBanReason('');
    setBanExpiry('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search users..."
            className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:border-[#e1ffa6]"
          />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-4 px-4 font-medium text-gray-400">Username</th>
                <th className="text-left py-4 px-4 font-medium text-gray-400">Email</th>
                <th className="text-left py-4 px-4 font-medium text-gray-400">Role</th>
                <th className="text-left py-4 px-4 font-medium text-gray-400">Status</th>
                <th className="text-left py-4 px-4 font-medium text-gray-400">Last Active</th>
                <th className="text-right py-4 px-4 font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-gray-900/50">
                  <td className="py-4 px-4">{user.username}</td>
                  <td className="py-4 px-4">{user.email}</td>
                  <td className="py-4 px-4">
                    <select
                      value={user.role || ''}
                      onChange={(e) => setUserRole(user.id, e.target.value as any)}
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
                    >
                      <option value="">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    {user.banned ? (
                      <span className="text-red-500">Banned</span>
                    ) : (
                      <span className="text-green-500">Active</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {new Date(user.last_sign_in_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.banned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Check}
                          onClick={() => unbanUser(user.id)}
                        >
                          Unban
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Ban}
                          onClick={() => setSelectedUser(user.id)}
                        >
                          Ban
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Trash2}
                        className="text-red-500 border-red-500 hover:bg-red-500/10"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Ban User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Ban User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expiry (Optional)</label>
                <input
                  type="datetime-local"
                  value={banExpiry}
                  onChange={(e) => setBanExpiry(e.target.value)}
                  className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleBan}
                  disabled={!banReason}
                >
                  Ban User
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Users;