import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"
import { motion } from "framer-motion"

export default function ScansChart({ data }) {
  const chartData = data && data.length > 0
    ? data
    : [
        { name: "Semgrep", value: 0 },
        { name: "OWASP ZAP", value: 0 }
      ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/95 border border-green-500/50 rounded-xl p-3 shadow-xl backdrop-blur-xl">
          <p className="text-green-300 text-sm mb-1">{label}</p>
          <p className="text-green-200 font-medium text-sm">{payload[0].value} scans</p>
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
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-green-200">Scans executados por tipo</h3>
        <p className="text-green-700 text-sm">Histórico recente da fila</p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 6" stroke="#00ff4133" />
            <XAxis dataKey="name" stroke="#00ff41" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#00ff41" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0, 255, 65, 0.08)" }} />
            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              activeBar={{ fill: "#00ff41", stroke: "#00ff41", strokeWidth: 1 }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#22c55e" : "#38bdf8"} />
              ))}
              <LabelList dataKey="value" position="top" fill="#00ff41" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
