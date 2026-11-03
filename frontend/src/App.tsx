import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Box, Zap } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import Network from './pages/Network';
import Scanner from './pages/Scanner';
import Procurement from './pages/Procurement';
import Login from './pages/Login';
import PendingApproval from './pages/PendingApproval';
import AccessControl from './pages/AccessControl';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// UI-08: Animated routes — each page exit/enters with PageWrapper motion
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/catalog"     element={<Catalog />} />
        <Route path="/network"     element={<Network />} />
        <Route path="/procurement" element={<Procurement />} />
        <Route path="/scanner"     element={<Scanner />} />
        <Route path="/iam"         element={<AccessControl />} />
        <Route path="*"            element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function ProtectedLayout() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (user.status === 'PENDING') return <PendingApproval />;

  return (
    <div className="flex h-screen bg-[#F5F5F7] text-[#1D1D1F] overflow-hidden font-sans selection:bg-[#0071E3]/20 selection:text-[#0071E3] relative">
      {/* Desktop Sidebar: Visible on Laptop / Desktop (>= 1024px) */}
      <div className="hidden lg:flex h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile & Tablet Slide-Over Drawer (< 1024px) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Slide-in Panel */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-10 h-full"
            >
              <Sidebar
                isMobile
                onClose={() => setMobileMenuOpen(false)}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Mobile & Tablet Top Glass Header (< 1024px) */}
        <header className="lg:hidden h-16 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA] px-4 flex items-center justify-between flex-shrink-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1.5 rounded-xl text-[#1D1D1F] hover:bg-black/5 active:scale-95 transition-all"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center shadow-xs">
                <Box className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight font-display">AtomicStock</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Zap className="w-2.5 h-2.5 mr-1 animate-pulse" /> Live
            </span>
            {user?.avatar ? (
              <img src={user.avatar} className="w-7 h-7 rounded-full border border-[#E5E5EA] object-cover" alt="" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#E8E8ED] text-[11px] font-bold text-[#1D1D1F] flex items-center justify-center border border-[#E5E5EA]">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto min-w-0 scroll-smooth">
          <div className="p-3.5 sm:p-5 lg:p-8 min-h-full max-w-[1560px] mx-auto w-full">
            <AnimatedRoutes />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const content = (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*"     element={<ProtectedLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );

  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
}
