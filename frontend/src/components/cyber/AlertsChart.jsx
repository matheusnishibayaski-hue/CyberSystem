import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { motion } from "framer-motion"

export default function AlertsChart({ data }) {
  // Se não houver dados, mostrar gráfico vazio
  const chartData = data && data.length > 0 ? data : [
    { date: 'Jan', critical: 0, high: 0, medium: 0, low: 0 },
    { date: 'Feb', critical: 0, high: 0, medium: 0, low: 0 },
    { date: 'Mar', critical: 0, high: 0, medium: 0, low: 0 },
    { date: 'Apr', critical: 0, high: 0, medium: 0, low: 0 },
    { date: 'Mai', critical: 0, high: 0, medium: 0, low: 0 },
    { date: 'Jun', critical: 0, high: 0, medium: 0, low: 0 },
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-4 shadow-xl backdrop-blur-xl">
          <p className="text-gray-300 font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-400 capitalize">{entry.dataKey}:</span>
              <span className="text-white font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Alertas por Severidade</h3>
          <p className="text-gray-400 text-sm">Últimos 6 meses</p>
        </div>
        <div className="flex gap-4">
          {[
            { label: 'Crítico', color: '#ef4444' },
            { label: 'Alto', color: '#f97316' },
            { label: 'Médio', color: '#eab308' },
            { label: 'Baixo', color: '#22c55e' }
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.5} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCritical)" />
            <Area type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorHigh)" />
            <Area type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#colorMedium)" />
            <Area type="monotone" dataKey="low" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorLow)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
