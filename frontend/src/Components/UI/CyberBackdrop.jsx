import { motion } from "framer-motion";

const nodes = [
  { top: "14%", left: "12%", size: 12, delay: 0.2, duration: 6.5 },
  { top: "26%", left: "78%", size: 10, delay: 0.8, duration: 5.8 },
  { top: "52%", left: "24%", size: 14, delay: 0.3, duration: 6.2 },
  { top: "62%", left: "66%", size: 9, delay: 1.1, duration: 5.3 },
  { top: "78%", left: "34%", size: 11, delay: 0.6, duration: 6.9 },
  { top: "84%", left: "84%", size: 8, delay: 0.9, duration: 5.6 }
];

export default function CyberBackdrop({ mode = "login" }) {
  const isHero = mode === "hero";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none [perspective:1200px]">
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(119,90,25,0.22), transparent 42%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.18), transparent 55%)"
        }}
        animate={{ opacity: [0.78, 0.95, 0.78] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute -inset-24"
        style={{
          backgroundImage:
            "linear-gradient(rgba(119,90,25,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(119,90,25,0.18) 1px, transparent 1px)",
          backgroundSize: isHero ? "42px 42px" : "34px 34px"
        }}
        animate={{
          backgroundPosition: ["0px 0px", "0px 40px", "40px 40px"]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="absolute left-1/2 top-[58%] h-[75%] w-[135%] border border-secondary/30"
        style={{ translateX: "-50%", translateY: "-50%" }}
        initial={{ rotateX: 62, rotateZ: -10 }}
        animate={{ rotateX: [62, 66, 62], rotateZ: [-10, -8, -10], y: [0, 10, 0] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute right-10 top-8 h-24 w-24 rounded-full border border-secondary/40"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="absolute right-14 top-12 h-16 w-16 rounded-full border border-secondary/35"
        animate={{ rotate: [360, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      {nodes.map((node, index) => (
        <motion.div
          key={`${node.top}-${node.left}`}
          className="absolute rounded-sm bg-secondary/75 shadow-[0_0_10px_rgba(233,193,118,0.65)]"
          style={{ top: node.top, left: node.left, width: node.size, height: node.size }}
          animate={{
            y: [0, -8, 0],
            opacity: [0.35, 0.95, 0.35],
            rotate: [0, index % 2 === 0 ? 45 : -45, 0]
          }}
          transition={{
            duration: node.duration,
            delay: node.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

