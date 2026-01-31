import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
        <div className="bg-black/95 border border-green-500/50 rounded-xl p-4 shadow-xl backdrop-blur-xl">
          <p className="text-green-300 font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-green-700 capitalize">{entry.dataKey}:</span>
              <span className="text-green-200 font-medium">{entry.value}</span>
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
      className="bg-black/70 border border-green-500/40 rounded-2xl p-6 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-green-200">Alertas por Severidade</h3>
          <p className="text-green-700 text-sm">Últimos 30 dias</p>
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
              <span className="text-xs text-green-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.45}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.45}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.45}/>
                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.45}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 6" stroke="#00ff4133" />
            <XAxis dataKey="date" stroke="#00ff41" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#00ff41" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2.2} fillOpacity={1} fill="url(#colorCritical)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2.2} fillOpacity={1} fill="url(#colorHigh)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={2.2} fillOpacity={1} fill="url(#colorMedium)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="low" stroke="#22c55e" strokeWidth={2.2} fillOpacity={1} fill="url(#colorLow)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
