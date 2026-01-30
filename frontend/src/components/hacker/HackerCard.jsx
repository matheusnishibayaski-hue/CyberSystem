import { motion } from "framer-motion";

export default function HackerCard({ title, value, icon: Icon, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-black border-2 border-green-500 p-6 font-mono relative overflow-hidden group"
    >
      {/* Scanlines effect */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-scanlines" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.1) 2px, rgba(0, 255, 65, 0.1) 4px)'
      }} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="text-green-700 text-xs uppercase tracking-wider">
            {title}
          </div>
          {Icon && <Icon className="w-5 h-5 text-green-500" />}
        </div>
        
        <div className="text-4xl font-bold text-green-500 mb-2 tracking-wider">
          {value}
        </div>
        
        {subtitle && (
          <div className="text-xs text-green-700">
            {subtitle}
          </div>
        )}
      </div>

      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500" />
    </motion.div>
  );
}
