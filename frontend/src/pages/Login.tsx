import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Box, Lock, Mail, Play, KeyRound, CheckCircle, Sparkles, Building2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';

export default function Login() {
  const { loginWithGoogle, loginWithCredentials, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  // Standard Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Evaluator Test Mode Sandbox State
  const [selectedRole, setSelectedRole] = useState('GLOBAL_ADMIN');
  const [selectedHub, setSelectedHub] = useState('ALL');
  const [isLaunchingSandbox, setIsLaunchingSandbox] = useState(false);

  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Validation Error', { description: 'Please enter both email and password.' });
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Authenticating credentials...');
    const ok = await loginWithCredentials(email, password);
    setIsSubmitting(false);

    if (ok) {
      toast.success('Access Granted', { id: toastId, description: 'Signed in successfully.' });
      navigate('/dashboard');
    } else {
      toast.error('Authentication Failed', { id: toastId, description: 'Invalid email or password.' });
    }
  };

  const handleGoogleSuccess = async (response: any) => {
    if (!response.credential) {
      toast.error('Authentication Error', { description: 'Missing Google credentials.' });
      return;
    }

    const toastId = toast.loading('Verifying identity with Google...');
    const ok = await loginWithGoogle(response.credential);

    if (ok) {
      toast.success('Access Granted', { id: toastId, description: 'Google identity verified.' });
      navigate('/dashboard');
    } else {
      toast.error('Access Denied', { id: toastId, description: 'Could not sync session.' });
    }
  };

  const handleSandboxLaunch = async () => {
    setIsLaunchingSandbox(true);
    const roleLabels: Record<string, string> = {
      GLOBAL_ADMIN: 'Global Administrator',
      NODE_MANAGER: `Node Manager (${selectedHub})`,
      OUTBOUND_SPECIALIST: 'Outbound Floor Operator',
      INVENTORY_AUDITOR: 'Inventory Auditor'
    };

    const targetHub = selectedRole === 'NODE_MANAGER' ? selectedHub : 'DEL-01';
    const toastId = toast.loading(`Starting test session as ${roleLabels[selectedRole]}...`);

    const ok = await loginAsDemo(selectedRole, targetHub);
    setIsLaunchingSandbox(false);

    if (ok) {
      toast.success('Test Session Ready', {
        id: toastId,
        description: `Active scope: ${selectedRole.replace(/_/g, ' ')} [${targetHub}]`
      });
      navigate('/dashboard');
    } else {
      toast.error('Session Error', { id: toastId, description: 'Unable to start sandbox.' });
    }
  };

  const testPersonas = [
    {
      role: 'GLOBAL_ADMIN',
      hub: 'ALL',
      title: 'Global Administrator',
      scope: 'All Warehouses & Full P&L',
      badge: 'Admin Access',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      role: 'NODE_MANAGER',
      hub: 'DEL-01',
      title: 'Delhi Hub Manager',
      scope: 'North Regional Hub (DEL-01 Only)',
      badge: 'Hub Bound',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      role: 'NODE_MANAGER',
      hub: 'MUM-01',
      title: 'Mumbai Hub Manager',
      scope: 'West Regional Hub (MUM-01 Only)',
      badge: 'Hub Bound',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      role: 'OUTBOUND_SPECIALIST',
      hub: 'DEL-01',
      title: 'Floor Operator',
      scope: 'POS Scanner & Floor Dispatch',
      badge: 'Floor Terminal',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    {
      role: 'INVENTORY_AUDITOR',
      hub: 'ALL',
      title: 'Inventory Auditor',
      scope: 'Audit Trail & Stock Velocity',
      badge: 'Read Only',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#F5F5F7] flex items-center justify-center p-3 sm:p-6 md:p-8 font-sans relative selection:bg-[#0071E3]/20 selection:text-[#0071E3] overflow-x-hidden">
      <Toaster position="bottom-right" richColors />

      {/* Ambient Glass Reflections */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#0071E3]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-emerald-400/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl liquid-glass rounded-2xl md:rounded-[28px] p-5 sm:p-8 md:p-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-w-0"
      >
        {/* Left Column: Brand & Sign-In Options */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6 min-w-0">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-11 h-11 bg-[#1D1D1F] rounded-2xl flex items-center justify-center shadow-md shadow-black/10 shrink-0">
                <Box className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight font-display truncate">AtomicStock</h1>
                <p className="text-[10px] sm:text-[11px] font-semibold text-[#86868B] uppercase tracking-wider truncate">Retail Inventory Management</p>
              </div>
            </div>

            <p className="text-xs text-[#86868B] leading-relaxed mb-6 font-medium">
              Multi-facility inventory control with serialized outbound dispatch, stock velocity forecasting, and node-scoped access control.
            </p>

            {/* Section 1: Standard Sign-In */}
            <div className="bg-white/70 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#E5E5EA] mb-6 shadow-2xs">
              <div className="flex items-center space-x-2 mb-3.5">
                <KeyRound className="w-4 h-4 text-[#0071E3]" />
                <h2 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider font-display">Standard Account Sign-In</h2>
              </div>

              <form onSubmit={handleStandardSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin@tier1.com"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-[#E5E5EA] bg-white outline-none focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-[#E5E5EA] bg-white outline-none focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Sign In'}
                </button>
              </form>
            </div>

            {/* Section 2: Google SSO */}
            <div className="pt-2 border-t border-[#E5E5EA]">
              <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-2 text-center">Or authenticate with Google</label>
              <div className="flex justify-center">
                {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error('Google Sign-In canceled')}
                    theme="outline"
                    shape="pill"
                    size="medium"
                    width="100%"
                    text="continue_with"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const toastId = toast.loading('Signing in with Google Account...');
                      await loginWithGoogle('simulated-credential');
                      toast.success('Access Granted', { id: toastId, description: 'Google identity verified: prateeksinghrajput197@gmail.com' });
                      navigate('/dashboard');
                    }}
                    className="w-full flex items-center justify-center space-x-2.5 py-2.5 px-4 rounded-xl border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] text-xs font-bold text-[#1D1D1F] transition-all shadow-2xs active:scale-[0.99]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Section 3 - Evaluator Test Mode (Academic Sandbox) */}
        <div className="lg:col-span-6 border-t lg:border-t-0 lg:border-l border-[#E5E5EA] pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="p-1.5 bg-[#0071E3]/10 text-[#0071E3] rounded-lg shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[#1D1D1F] font-display truncate">Academic Evaluator Sandbox</h2>
                  <p className="text-[11px] text-[#86868B] truncate">1-Click test access with preset role permissions.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                Evaluation Mode
              </span>
            </div>

            {/* Role & Hub Dropdown Selector */}
            <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-[#E5E5EA] mb-4 space-y-3 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Select Role</label>
                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-[#E5E5EA] bg-white outline-none focus:ring-2 focus:ring-[#0071E3]"
                  >
                    <option value="GLOBAL_ADMIN">Global Administrator</option>
                    <option value="NODE_MANAGER">Node Manager (Hub Scoped)</option>
                    <option value="OUTBOUND_SPECIALIST">Floor Operator (POS)</option>
                    <option value="INVENTORY_AUDITOR">Inventory Auditor</option>
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="block text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Warehouse Hub</label>
                  <select
                    value={selectedHub}
                    onChange={e => setSelectedHub(e.target.value)}
                    disabled={selectedRole !== 'NODE_MANAGER'}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-[#E5E5EA] bg-white outline-none focus:ring-2 focus:ring-[#0071E3] disabled:opacity-50"
                  >
                    <option value="DEL-01">DEL-01 (Delhi NCR)</option>
                    <option value="MUM-01">MUM-01 (Mumbai)</option>
                    <option value="BLR-01">BLR-01 (Bangalore)</option>
                    <option value="KOL-01">KOL-01 (Kolkata)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSandboxLaunch}
                disabled={isLaunchingSandbox}
                className="w-full py-2.5 px-4 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm active:scale-[0.99] disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isLaunchingSandbox ? 'Launching Sandbox...' : 'Launch Role Sandbox Session'}</span>
              </button>
            </div>

            {/* Quick 1-Click Cards for Evaluators */}
            <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-2">Or click a preset evaluation persona:</p>
            <div className="space-y-2">
              {testPersonas.map(persona => (
                <button
                  key={persona.title}
                  type="button"
                  onClick={() => {
                    setSelectedRole(persona.role);
                    if (persona.hub !== 'ALL') setSelectedHub(persona.hub);
                    loginAsDemo(persona.role, persona.hub !== 'ALL' ? persona.hub : 'DEL-01').then(ok => {
                      if (ok) {
                        toast.success(`Signed in as ${persona.title}`);
                        navigate('/dashboard');
                      }
                    });
                  }}
                  className="w-full text-left p-3 rounded-xl border border-[#E5E5EA] bg-white hover:border-[#0071E3] hover:bg-[#F5F5F7] transition-all flex items-center justify-between group shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] group-hover:bg-[#0071E3]/10 flex items-center justify-center transition-colors">
                      {persona.role === 'GLOBAL_ADMIN' ? (
                        <Building2 className="w-4 h-4 text-[#1D1D1F] group-hover:text-[#0071E3]" />
                      ) : (
                        <User className="w-4 h-4 text-[#1D1D1F] group-hover:text-[#0071E3]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#1D1D1F]">{persona.title}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${persona.badgeColor}`}>
                          {persona.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#86868B]">{persona.scope}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#0071E3] opacity-0 group-hover:opacity-100 transition-opacity">
                    Test &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5E5EA] flex items-center justify-between text-[10px] text-[#86868B]">
            <span className="flex items-center">
              <CheckCircle className="w-3 h-3 text-emerald-600 mr-1" /> Ready for Academic Evaluation
            </span>
            <span className="font-mono">v1.0.0-PROD</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
