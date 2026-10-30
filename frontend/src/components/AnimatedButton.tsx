// UI-01: Reusable animated button with spring physics and loading state
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ReactNode, ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'blue';
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-[#1D1D1F] hover:bg-black text-white shadow-sm shadow-black/10',
  secondary: 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] border border-[#E5E5EA] hover:border-[#D2D2D7]',
  danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/20',
  blue: 'bg-[#0071E3] hover:bg-[#005bb5] text-white shadow-sm shadow-blue-500/20',
};

export default function AnimatedButton({
  loading,
  disabled,
  variant = 'primary',
  icon,
  children,
  className = '',
  type = 'button',
  ...rest
}: Props) {
  return (
    <motion.button
      {...(rest as any)}
      type={type}
      disabled={disabled || loading}
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`flex items-center justify-center rounded-xl text-sm font-bold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : icon ? (
        <span className="mr-2 flex items-center">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
}

