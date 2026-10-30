// UI-08: Consistent page entry animation wrapper
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export default function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

