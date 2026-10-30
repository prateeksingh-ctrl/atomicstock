import { useState, useEffect } from 'react';
import { Clock, Send, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import AnimatedButton from '../components/AnimatedButton';
import { toast, Toaster } from 'sonner';

export default function PendingApproval() {
  const { user, logout, refreshUser } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [fullName, setFullName] = useState(user?.name || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/roles'),
      api.get('/api/v1/warehouses')
    ]).then(([roleData, whData]) => {
      // Exclude GLOBAL_ADMIN from self-signup options
      const filtered = (roleData.data || []).filter((r: any) => r.name !== 'GLOBAL_ADMIN');
      setRoles(filtered);
      if (filtered.length > 0) setSelectedRole(filtered[0].id);

      const whList = whData.data || [];
      setWarehouses(whList);
      if (whList.length > 0) setSelectedWarehouse(whList[0].id);
    }).catch(err => {
      console.error('Failed to load roles/warehouses:', err);
    });
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      const data = await api.patch(`/api/v1/users/${user.id}`, {
        name: fullName,
        roleId: selectedRole,
        warehouseId: selectedWarehouse,
        status: 'PENDING'
      });

      if (data.status !== 'success') throw new Error(data.message || 'Failed to submit onboarding request');

      setSubmitted(true);
      toast.success('Clearance Request Submitted', {
        description: 'Your request has been routed to the appropriate Node Manager or Administrator.'
      });
      // BUG-03 FIX: refreshUser properly fetches updated profile from backend
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      toast.error('Submission Failed', { description: err.message || 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4 sm:p-6 font-sans">
      <Toaster position="bottom-right" richColors />
      <div className="max-w-md w-full bg-white rounded-2xl md:rounded-[24px] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#E5E5EA] text-center relative">
        <button
          onClick={logout}
          className="absolute top-5 right-5 text-[#86868B] hover:text-[#1D1D1F] transition-colors p-2 rounded-xl hover:bg-[#F5F5F7]"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Clock className="w-7 h-7 animate-pulse" />
        </div>

        <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">Security Clearance Pending</h1>
        <p className="text-[#86868B] text-sm mt-2 mb-6">
          Submit your personnel profile and requested designation to route clearance to your Node Manager or Administrator.
        </p>

        {submitted ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-emerald-800">Clearance Request Pending Review</p>
            <p className="text-xs text-emerald-600 mt-1">
              Your profile has been routed. Once authorized by your Node Manager, refreshing will launch your operational terminal.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitRequest} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-1.5">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder="e.g. Jane Doe"
                className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-1.5">Requested Role</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-1.5">Assigned Facility Node</label>
              <select
                value={selectedWarehouse}
                onChange={e => setSelectedWarehouse(e.target.value)}
                className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.location})</option>
                ))}
              </select>
            </div>

            <AnimatedButton
              type="submit"
              loading={submitting}
              disabled={submitting}
              variant="blue"
              icon={<Send className="w-4 h-4" />}
              className="w-full mt-4 py-3"
            >
              {submitting ? 'Submitting Application...' : 'Submit Profile Request'}
            </AnimatedButton>
          </form>
        )}
      </div>
    </div>
  );
}
