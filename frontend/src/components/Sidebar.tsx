// UI-07: Spring pill sidebar — animated active indicator with layoutId and glass styling
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, PackageSearch, Server, ScanLine,
  Truck, Box, LogOut, ShieldCheck, X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const navItems: { name: string; path: string; icon: React.ElementType; restrictedTo: UserRole[] }[] = [
  { name: 'Dashboard',          path: '/dashboard',   icon: LayoutDashboard, restrictedTo: ['GLOBAL_ADMIN', 'NODE_MANAGER', 'INVENTORY_AUDITOR'] },
  { name: 'Master Catalog',      path: '/catalog',     icon: PackageSearch,   restrictedTo: ['GLOBAL_ADMIN', 'NODE_MANAGER', 'INVENTORY_AUDITOR'] },
  { name: 'Warehouse Hubs',      path: '/network',     icon: Server,          restrictedTo: ['GLOBAL_ADMIN', 'NODE_MANAGER'] },
  { name: 'Inbound Receiving',   path: '/procurement', icon: Truck,           restrictedTo: ['GLOBAL_ADMIN', 'NODE_MANAGER', 'INBOUND_SPECIALIST'] },
  { name: 'Outbound Dispatch',   path: '/scanner',     icon: ScanLine,        restrictedTo: ['GLOBAL_ADMIN', 'NODE_MANAGER', 'OUTBOUND_SPECIALIST'] },
  { name: 'Access Control',      path: '/iam',         icon: ShieldCheck,     restrictedTo: ['GLOBAL_ADMIN', 'NODE_MANAGER'] },
];

interface SidebarProps {
  onNavigate?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ onNavigate, onClose, isMobile }: SidebarProps) {
  const { user, logout, role } = useAuth();

  return (
    <aside className="w-64 bg-[#F5F5F7]/90 backdrop-blur-2xl border-r border-[#E5E5EA] flex flex-col h-full flex-shrink-0 relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">

      {/* Logo */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-[#E5E5EA]">
        <div className="flex items-center">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center mr-3 shadow-md shadow-black/10">
            <Box className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-[#1D1D1F] font-bold tracking-tight text-base leading-tight font-display">AtomicStock</h1>
            <p className="text-[10px] font-semibold text-[#86868B] uppercase tracking-wider">Inventory Platform</p>
          </div>
        </div>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3.5 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2.5">
          <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Core Modules</p>
        </div>

        {navItems.map((item) => {
          if (!item.restrictedTo.includes(role)) return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => onNavigate?.()}
              className="relative flex items-center px-3.5 py-2.5 sm:py-3 rounded-xl transition-all duration-200 font-medium text-[#1D1D1F] hover:bg-white/80 group"
            >
              {({ isActive }) => (
                <>
                  {/* UI-07: layoutId spring pill — animates between active items */}
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 bg-[#0071E3] rounded-xl shadow-sm shadow-[#0071E3]/25"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon
                    className={`relative z-10 w-4.5 h-4.5 mr-3 transition-colors duration-150 ${
                      isActive ? 'text-white' : 'text-[#86868B] group-hover:text-[#1D1D1F]'
                    }`}
                  />
                  <span className={`relative z-10 text-xs sm:text-sm font-semibold tracking-tight ${isActive ? 'text-white' : ''}`}>
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer with Glass Touch */}
      <div className="p-4 border-t border-[#E5E5EA] flex items-center justify-between bg-white/40 backdrop-blur-md">
        <div className="flex items-center space-x-3 overflow-hidden min-w-0">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-full border border-white shadow-xs object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#E8E8ED] text-[#1D1D1F] font-bold flex items-center justify-center text-xs border border-[#E5E5EA] flex-shrink-0 shadow-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="truncate min-w-0">
            <p className="text-xs font-bold text-[#1D1D1F] truncate">{user?.name}</p>
            <p className="text-[10px] text-[#86868B] truncate mt-0.5 font-semibold uppercase tracking-wider">
              {role.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-white/80 transition-colors flex-shrink-0 shadow-xs"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
