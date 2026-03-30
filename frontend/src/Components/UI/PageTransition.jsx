import { motion } from "framer-motion";

export default function PageTransition({ children }) {
  return (
    <motion.div
      className="will-change-transform"
      style={{ transformStyle: "preserve-3d" }}
      initial={{ opacity: 0, y: 16, scale: 0.992, rotateX: 2.5, filter: "blur(1px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -12, scale: 0.996, rotateX: -1.5, filter: "blur(1px)" }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

