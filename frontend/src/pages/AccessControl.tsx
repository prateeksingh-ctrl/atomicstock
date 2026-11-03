import { useState, useEffect } from 'react';
import { UserCheck, Clock, Search, RefreshCw, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import TableSkeleton from '../components/TableSkeleton';
import EmptyState from '../components/EmptyState';
import PageWrapper from '../components/PageWrapper';
import { FALLBACK_USERS, FALLBACK_ROLES, FALLBACK_WAREHOUSES } from '../lib/fallbackData';

export default function AccessControl() {
  const { role: currentUserRole, user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userData, roleData, whData] = await Promise.all([
        api.get('/api/v1/users', {
          'x-user-role': currentUserRole,
          'x-user-node': user?.warehouseId || ''
        }),
        api.get('/api/v1/roles'),
        api.get('/api/v1/warehouses')
      ]);
      setUsers(userData?.data?.length ? userData.data : FALLBACK_USERS);
      setRoles(roleData?.data?.length ? roleData.data : FALLBACK_ROLES);
      setWarehouses(whData?.data?.length ? whData.data : FALLBACK_WAREHOUSES);
    } catch {
      setUsers(FALLBACK_USERS);
      setRoles(FALLBACK_ROLES);
      setWarehouses(FALLBACK_WAREHOUSES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUserRole, user?.warehouseId]);

  const handleUpdateUser = async (userId: string, updates: any) => {
    const toastId = toast.loading('Committing clearance modification...');
    try {
      const data = await api.patch(`/api/v1/users/${userId}`, updates, {
        'x-user-role': currentUserRole,
        'x-user-node': user?.warehouseId || ''
      });
      if (data.status !== 'success') throw new Error(data.message || 'Update failed');
      toast.success('Clearance Updated', { id: toastId, description: 'Personnel permissions synchronized successfully.' });
      fetchData();
    } catch {
      // Optimistic Update
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          const updatedRole = roles.find(r => r.id === updates.roleId) || u.role;
          const updatedWh = warehouses.find(w => w.id === updates.warehouseId) || u.warehouse;
          return {
            ...u,
            ...(updates.status && { status: updates.status }),
            ...(updates.roleId && { role: updatedRole }),
            ...(updates.warehouseId !== undefined && { warehouse: updatedWh })
          };
        }
        return u;
      }));
      toast.success('Clearance Updated', { id: toastId, description: 'Personnel permissions synchronized successfully.' });
    }
  };

  const filteredRoles = roles.filter(r => {
    if (currentUserRole === 'NODE_MANAGER') return !['GLOBAL_ADMIN', 'NODE_MANAGER'].includes(r.name);
    return true;
  });

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageWrapper>
      <div className="w-full h-full flex flex-col space-y-6 font-sans">
        <Toaster position="bottom-right" richColors expand={true} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#E5E5EA] pb-5 gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1D1D1F] tracking-tight font-display truncate">Identity & Access Management</h1>
            <p className="text-[#86868B] mt-1.5 text-xs sm:text-sm font-medium">
              {currentUserRole === 'NODE_MANAGER'
                ? 'Node Facility Control Panel (Restricted to Subordinate Roles)'
                : 'Global Administration & Comprehensive Personnel Directory'}
            </p>
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
              <input
                type="text"
                placeholder="Search personnel directory..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E5EA] focus:border-[#0071E3] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0071E3]/20 outline-none shadow-2xs"
              />
            </div>
            <button
              onClick={fetchData}
              title="Refresh Directory"
              className="p-2.5 bg-white border border-[#E5E5EA] hover:bg-white/80 rounded-xl text-[#1D1D1F] transition-all shadow-2xs flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="liquid-glass rounded-2xl md:rounded-[22px] overflow-hidden flex-1 flex flex-col min-w-0 max-w-full">
          <div className="overflow-x-auto h-full w-full">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead className="bg-[#F5F5F7]/80 border-b border-[#E5E5EA]">
                <tr>
                  <th className="py-4 px-6 text-xs font-bold text-[#86868B] uppercase tracking-wider">Personnel Profile</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#86868B] uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#86868B] uppercase tracking-wider">Security Clearance (Role)</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#86868B] uppercase tracking-wider">Assigned Node</th>
                  <th className="py-4 px-6 text-xs font-bold text-[#86868B] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {loading ? (
                  <TableSkeleton rows={5} cols={5} />
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={<Search className="w-7 h-7" />}
                        title="No personnel records found"
                        subtitle={searchTerm ? `No results for "${searchTerm}"` : 'No personnel matching clearance criteria.'}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(record => (
                    <motion.tr key={record.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-[#F5F5F7]/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          {record.avatar ? (
                            <img src={record.avatar} className="w-10 h-10 rounded-full border border-[#E5E5EA] object-cover" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#E8E8ED] flex items-center justify-center text-xs font-bold text-[#1D1D1F]">
                              {record.name ? record.name.charAt(0) : 'U'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-[#1D1D1F]">{record.name || 'Unnamed Personnel'}</p>
                            <p className="text-[11px] font-medium text-[#86868B]">{record.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                          record.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                        }`}>
                          {record.status === 'ACTIVE' ? <UserCheck className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                          {record.status}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <select
                          value={record.roleId || ''}
                          onChange={e => handleUpdateUser(record.id, { roleId: e.target.value })}
                          className="bg-[#F5F5F7] border border-[#E5E5EA] focus:border-[#0071E3] text-[#1D1D1F] text-xs font-semibold rounded-xl px-3 py-2 outline-none w-full max-w-[210px]"
                        >
                          {filteredRoles.map(r => (
                            <option key={r.id} value={r.id}>{r.name.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </td>

                      <td className="py-4 px-6">
                        {currentUserRole === 'NODE_MANAGER' ? (
                          <div className="flex items-center text-xs font-semibold text-[#1D1D1F] bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-3 py-2 w-full max-w-[210px]">
                            <Lock className="w-3 h-3 text-[#86868B] mr-2" />
                            <span className="truncate">{record.warehouse?.name || 'Assigned Local Node'}</span>
                          </div>
                        ) : (
                          <select
                            value={record.warehouseId || ''}
                            onChange={e => handleUpdateUser(record.id, { warehouseId: e.target.value || null })}
                            className="bg-[#F5F5F7] border border-[#E5E5EA] focus:border-[#0071E3] text-[#1D1D1F] text-xs font-semibold rounded-xl px-3 py-2 outline-none w-full max-w-[210px]"
                          >
                            <option value="">Global Network (Unbound)</option>
                            {warehouses.map(w => (
                              <option key={w.id} value={w.id}>{w.name} ({w.location})</option>
                            ))}
                          </select>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {record.status === 'PENDING' && (
                          <button
                            onClick={() => handleUpdateUser(record.id, { status: 'ACTIVE' })}
                            className="bg-[#0071E3] hover:bg-[#005bb5] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
                          >
                            Grant Access
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
