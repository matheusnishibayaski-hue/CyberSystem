import { motion } from "framer-motion"

export default function StatsCard({ title, value, icon: Icon, color = "blue", trend }) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400",
    green: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400",
    red: "from-red-500/20 to-red-600/5 border-red-500/30 text-red-400",
    cyan: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 text-cyan-400"
  }

  const glowClasses = {
    blue: "shadow-blue-500/20",
    green: "shadow-emerald-500/20",
    red: "shadow-red-500/20",
    cyan: "shadow-cyan-500/20"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`
        relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6
        backdrop-blur-xl transition-all duration-300 hover:shadow-xl
        ${colorClasses[color]} ${glowClasses[color]}
      `}
    >
      {/* Glow effect */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 ${
        color === 'blue' ? 'bg-blue-500' : 
        color === 'green' ? 'bg-emerald-500' : 
        color === 'red' ? 'bg-red-500' : 
        'bg-cyan-500'
      }`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} border`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend !== undefined && (
            <span className={`text-xs px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        
        <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      </div>
    </motion.div>
  )
}
