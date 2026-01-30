import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function TerminalBackground() {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const commands = [
      "$ nmap -sV -p 1-65535 target.com",
      "$ sqlmap -u 'http://site.com?id=1' --dbs",
      "$ hydra -l admin -P pass.txt ssh://192.168.1.1",
      "$ metasploit framework initialized...",
      "$ scanning ports... [OK]",
      "$ exploiting vulnerability CVE-2024-1337",
      "$ access granted. root@system:~#",
      "$ dumping database... 47% complete",
    ];

    const interval = setInterval(() => {
      setLines(prev => {
        const newLine = commands[Math.floor(Math.random() * commands.length)];
        return [...prev.slice(-20), { text: newLine, id: Date.now() }];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base layer */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Matrix rain effect */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-green-500 font-mono text-sm"
            style={{
              left: `${i * 2}%`,
              top: -20,
            }}
            animate={{
              y: ['0vh', '110vh']
            }}
            transition={{
              duration: 10 + Math.random() * 20,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5
            }}
          >
            {String.fromCharCode(Math.random() * 94 + 33)}
          </motion.div>
        ))}
      </div>

      {/* Scanlines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-scanlines" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.1) 2px, rgba(0, 255, 65, 0.1) 4px)'
      }} />

      {/* Terminal lines background */}
      <div className="absolute inset-0 opacity-10 overflow-hidden">
        <div className="font-mono text-sm text-green-500 p-4 space-y-1">
          {lines.map(line => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              {line.text}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Glitch effect */}
      <motion.div
        className="absolute inset-0 bg-green-500/5"
        animate={{
          opacity: [0, 0.1, 0],
        }}
        transition={{
          duration: 0.1,
          repeat: Infinity,
          repeatDelay: Math.random() * 10
        }}
      />

      {/* Grid */}
      <div 
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 65, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 65, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }}
      />
    </div>
  );
}
