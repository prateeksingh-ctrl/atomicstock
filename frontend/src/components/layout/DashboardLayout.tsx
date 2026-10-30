import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Package, Home, Warehouse, LogOut, Scan, Activity } from 'lucide-react';

type Role = 'ADMIN' | 'WAREHOUSE_OPERATOR' | 'MANAGEMENT';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUserRole = (localStorage.getItem('userRole') as Role) || 'ADMIN';

  // Role-based route definitions
  const navigation = [
    { name: 'Command Center', href: '/dashboard', icon: Home, allowedRoles: ['ADMIN', 'MANAGEMENT'] },
    { name: 'Catalog', href: '/catalog', icon: Package, allowedRoles: ['ADMIN', 'MANAGEMENT'] },
    { name: 'Network', href: '/network', icon: Warehouse, allowedRoles: ['ADMIN'] },
    { name: 'Floor Scanner', href: '/scan', icon: Scan, allowedRoles: ['ADMIN', 'WAREHOUSE_OPERATOR'] },
  ];

  const allowedNavigation = navigation.filter(item => item.allowedRoles.includes(currentUserRole));

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#F7F7F9] font-sans selection:bg-zinc-900 selection:text-white">
      {/* Deep Zinc Sidebar */}
      <div className="w-64 bg-[#09090B] border-r border-zinc-800 flex flex-col justify-between transition-all">
        
        <div>
          {/* Brand Header */}
          <div className="h-20 flex items-center px-6 border-b border-zinc-800/50">
            <Activity className="w-5 h-5 text-white mr-3" />
            <span className="font-bold text-base tracking-tight text-white">Tier-1 WMS</span>
          </div>
          
          {/* Active Role Indicator */}
          <div className="px-6 py-5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Session Active</p>
            <div className="flex items-center">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <p className="text-xs font-semibold text-zinc-300 tracking-wide">{currentUserRole.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 mt-4 space-y-1">
            {allowedNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-black' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800/50">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-zinc-500 rounded-lg hover:text-white hover:bg-zinc-900 transition-all"
          >
            <LogOut className="w-4 h-4 mr-3" />
            End Session
          </button>
        </div>
      </div>

      {/* Main Content Canvas with subtle engineering grid */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 lg:p-10 relative z-10">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}