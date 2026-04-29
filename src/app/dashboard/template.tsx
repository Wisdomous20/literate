"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, x: 18, scale: 0.985 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
