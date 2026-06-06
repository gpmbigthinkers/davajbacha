"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export function TiltedCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn("origin-center", className)}
      whileHover={{ rotateX: 2, rotateY: -3, y: -4 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}
