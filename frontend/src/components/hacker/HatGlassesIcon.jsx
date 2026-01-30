import { motion } from "framer-motion";

export default function HatGlassesIcon({ className = "w-6 h-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Chapéu Fedora - parte superior */}
      <motion.path
        d="M6 8C6 6 7 5 8 5H16C17 5 18 6 18 8C18 9 17.5 10 17 10.5V11C17 11.5 17 12 17.5 12.5C18 13 18.5 13.5 19 14H5C5.5 13.5 6 13 6.5 12.5C7 12 7 11.5 7 11V10.5C6.5 10 6 9 6 8Z"
        fill="currentColor"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      />
      {/* Borda do chapéu */}
      <motion.path
        d="M5 8C5 6.5 6 5.5 7 5.5H17C18 5.5 19 6.5 19 8C19 9 18.5 9.5 18 9.5H6C5.5 9.5 5 9 5 8Z"
        fill="currentColor"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      />
      {/* Faixa branca do chapéu */}
      <motion.rect
        x="8"
        y="9"
        width="8"
        height="1.5"
        fill="white"
        rx="0.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />
      {/* Óculos - lente esquerda */}
      <motion.circle
        cx="9"
        cy="16"
        r="3"
        fill="currentColor"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      />
      {/* Óculos - lente direita */}
      <motion.circle
        cx="15"
        cy="16"
        r="3"
        fill="currentColor"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      />
      {/* Ponte dos óculos */}
      <motion.line
        x1="12"
        y1="16"
        x2="12"
        y2="16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.25 }}
      />
      {/* Haste esquerda */}
      <motion.line
        x1="6"
        y1="16"
        x2="5"
        y2="19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.25 }}
      />
      {/* Haste direita */}
      <motion.line
        x1="18"
        y1="16"
        x2="19"
        y2="19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.25 }}
      />
    </svg>
  );
}
