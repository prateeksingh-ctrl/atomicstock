// UI-04: KPI card with animated countup and spring hover physics
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  value: number | string;
  icon: ReactNode;
  prefix?: string;
  suffix?: string;
  dark?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

export default function KpiCard({
  label, value, icon, prefix = '', suffix = '', dark, onClick, children
}: Props) {
  const numericValue = typeof value === 'number' ? value : 0;
  const animated = useCountUp(numericValue);

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={onClick ? { scale: 0.99 } : {}}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className={`rounded-2xl md:rounded-[22px] p-4 sm:p-5 lg:p-6 flex flex-col justify-between select-none h-full min-w-0 max-w-full overflow-hidden ${
        dark
          ? 'liquid-glass-dark text-white'
          : 'liquid-glass text-[#1D1D1F]'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between w-full min-w-0">
        <div className={`p-3 rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center ${
          dark ? 'bg-white/10 border border-white/10' : 'bg-black/[0.03] border border-black/[0.04]'
        }`}>
          {icon}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          dark
            ? 'bg-white/10 border-white/15 text-white/80'
            : 'bg-black/[0.03] border-black/[0.05] text-[#86868B]'
        }`}>
          Live
        </span>
      </div>

      <div className="mt-4 sm:mt-6 min-w-0 max-w-full">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#86868B] truncate" title={label}>
          {label}
        </p>
        <p className={`text-2xl sm:text-3xl xl:text-4xl font-bold tracking-tight mt-1 tabular-nums truncate block max-w-full font-display ${
          dark ? 'text-white' : 'text-[#1D1D1F]'
        }`}>
          {prefix}{typeof value === 'number' ? animated.toLocaleString() : value}{suffix}
        </p>
      </div>

      <AnimatePresence>
        {children}
      </AnimatePresence>
    </motion.div>
  );
}

