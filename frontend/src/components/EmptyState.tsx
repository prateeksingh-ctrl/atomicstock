// UI-03: Premium empty state with icon, title, subtitle and optional action
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, subtitle, action }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 bg-[#F5F5F7] border border-[#E8E8ED] rounded-2xl flex items-center justify-center mb-4 shadow-inner">
        <span className="text-[#86868B]">{icon}</span>
      </div>
      <p className="text-sm font-bold text-[#1D1D1F] mb-1">{title}</p>
      {subtitle && (
        <p className="text-xs text-[#86868B] font-medium max-w-xs leading-relaxed mt-0.5">
          {subtitle}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

