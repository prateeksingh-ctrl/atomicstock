import { useState, useEffect } from 'react';
import { Users, Shield, Trash2, KeyRound } from 'lucide-react';

export default function Settings() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'security'>('users');
  
  // Password State
  const [passwords, setPasswords] = useState({ old: '', new: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Get active user from local storage
  const activeUser = JSON.parse(localStorage.getItem('tier1_user') || '{}');
  const canManageUsers = activeUser?.role?.permissions?.includes('manage_users');

  useEffect(() => {
    if (canManageUsers) {
      fetchData();
    } else {
      setActiveTab('security');
    }
  }, [canManageUsers]);

  const fetchData = async () => {
    const [usersRes, rolesRes] = await Promise.all([
      fetch('http://localhost:3000/api/v1/users'),
      fetch('http://localhost:3000/api/v1/auth/roles')
    ]);
    const usersData = await usersRes.json();
    const rolesData = await rolesRes.json();
    setUsers(usersData.data);
    setRoles(rolesData.data);
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    await fetch(`http://localhost:3000/api/v1/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId })
    });
    fetchData();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await fetch(`http://localhost:3000/api/v1/users/${userId}`, { method: 'DELETE' });
    fetchData();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (passwords.new.length < 6) {
      setMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/v1/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser.id,
          oldPassword: passwords.old,
          newPassword: passwords.new
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message);
      
      setMsg({ type: 'success', text: 'Password updated successfully!' });
      setPasswords({ old: '', new: '' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">System Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-zinc-200">
        {canManageUsers && (
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-2 text-sm font-bold flex items-center transition-colors ${
              activeTab === 'users' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Users className="w-4 h-4 mr-2" /> User Management
          </button>
        )}
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-4 px-2 text-sm font-bold flex items-center transition-colors ${
            activeTab === 'security' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Shield className="w-4 h-4 mr-2" /> Security
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden p-6">
        {activeTab === 'users' && canManageUsers && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 mb-4">Node Personnel Roster</h2>
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Role Access</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-zinc-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-zinc-900">{user.name}</div>
                        <div className="text-sm text-zinc-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.roleId}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={user.id === activeUser.id} // Cannot change your own role
                          className="text-sm font-medium border border-zinc-300 rounded-lg px-3 py-1.5 focus:ring-indigo-500 bg-zinc-50 disabled:opacity-50"
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === activeUser.id} // Cannot delete yourself
                          className="text-red-600 hover:text-red-800 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 className="w-5 h-5 ml-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="max-w-md space-y-4">
            <h2 className="text-lg font-bold text-zinc-900">Update Password</h2>
            
            {msg.text && (
              <div className={`p-3 rounded-lg text-sm font-medium border ${msg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700">Current Password</label>
                <input
                  type="password"
                  required
                  className="mt-1 block w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm focus:ring-indigo-500"
                  value={passwords.old}
                  onChange={e => setPasswords({...passwords, old: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">New Password</label>
                <input
                  type="password"
                  required
                  className="mt-1 block w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm focus:ring-indigo-500"
                  value={passwords.new}
                  onChange={e => setPasswords({...passwords, new: e.target.value})}
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center w-full py-2 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 transition-colors"
              >
                <KeyRound className="w-4 h-4 mr-2" /> Update Security Key
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}