import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function MatrixIntro({ onComplete }) {
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    const columnCount = Math.floor(window.innerWidth / 20);
    const newColumns = Array.from({ length: columnCount }, (_, i) => ({
      id: i,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 3,
    }));
    setColumns(newColumns);

    const timer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const getRandomChar = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()';
    return chars[Math.floor(Math.random() * chars.length)];
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 bg-black z-[100] overflow-hidden"
    >
      {/* Matrix Rain Background */}
      {columns.map((col) => (
        <motion.div
          key={col.id}
          className="absolute top-0 font-mono text-lg select-none pointer-events-none"
          style={{
            left: `${col.id * 20}px`,
          }}
          initial={{ y: '-100%' }}
          animate={{ y: '100vh' }}
          transition={{
            duration: col.duration,
            delay: col.delay,
            ease: "linear",
          }}
        >
          {Array.from({ length: 50 }).map((_, idx) => (
            <div
              key={idx}
              className="leading-tight"
              style={{
                color: idx === 0 ? '#ffffff' : `rgba(0, 255, 65, ${Math.max(0.1, 1 - (idx / 20))})`,
                textShadow: idx === 0 ? '0 0 10px #ffffff' : '0 0 8px rgba(0, 255, 65, 0.8)',
              }}
            >
              {getRandomChar()}
            </div>
          ))}
        </motion.div>
      ))}

      {/* ASCII Art Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute inset-0 flex items-center justify-center z-10"
      >
        <div className="text-center text-green-500">
          <pre className="inline-block text-left text-xl md:text-2xl lg:text-3xl leading-tight font-mono">
{`
   ▄████▄▓██   ██▓ ▄▄▄▄   ▓█████  ██▀███  
  ▒██▀ ▀█ ▒██  ██▒▓█████▄ ▓█   ▀ ▓██ ▒ ██▒
  ▒▓█    ▄ ▒██ ██░▒██▒ ▄██▒███   ▓██ ░▄█ ▒
  ▒▓▓▄ ▄██▒░ ▐██▓░▒██░█▀  ▒▓█  ▄ ▒██▀▀█▄  
  ▒ ▓███▀ ░░ ██▒▓░░▓█  ▀█▓░▒████▒░██▓ ▒██▒
  ░ ░▒ ▒  ░ ██▒▒▒ ░▒▓███▀▒░░ ▒░ ░░ ▒▓ ░▒▓░
    ░  ▒  ▓██ ░▒░ ▒░▒   ░  ░ ░  ░  ░▒ ░ ▒░
  ░       ▒ ▒ ░░   ░    ░    ░     ░░   ░ 
  ░ ░     ░ ░      ░         ░  ░   ░     
  ░       ░ ░           ░                  
`}
          </pre>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="text-green-400 text-lg md:text-xl mt-4"
          >
            SECURITY SYSTEM v3.7.9
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
