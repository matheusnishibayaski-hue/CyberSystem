import { motion } from "framer-motion";

export default function HackerTable({ data, columns, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-black border-2 border-green-500 p-6 font-mono">
        <div className="text-green-500 text-center">LOADING DATA...</div>
      </div>
    );
  }

  return (
    <div className="bg-black border-2 border-green-500 overflow-hidden font-mono">
      {/* Header */}
      <div className="bg-green-500/10 border-b-2 border-green-500 p-4">
        <div className={`grid gap-4 text-xs text-green-500 uppercase font-bold`} style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map(col => (
            <div key={col.key}>{col.label}</div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="divide-y-2 divide-green-900">
        {data?.map((row, index) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 hover:bg-green-500/5 transition-colors"
          >
            <div className={`grid gap-4 text-sm text-green-400`} style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
              {columns.map(col => (
                <div key={col.key} className="truncate">
                  {col.render ? col.render(row) : row[col.key]}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {(!data || data.length === 0) && (
        <div className="p-8 text-center text-green-700">
          NO DATA FOUND
        </div>
      )}
    </div>
  );
}
