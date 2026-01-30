import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function SkullAnimation({ onComplete }) {
  const [columns, setColumns] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const [hackText, setHackText] = useState("");
  const [currentLine, setCurrentLine] = useState(0);

  const hackMessages = [
    "> INICIALIZANDO PROTOCOLO SEGURO...",
    "> DECIFRANDO CREDENCIAIS...",
    "> ESTABELECENDO CONEXÃO CRIPTOGRAFADA...",
    "> VERIFICANDO PERMISSÕES DE ADMINISTRADOR...",
    "> ACESSO CONCEDIDO - MODO ADMIN ATIVO",
  ];

  useEffect(() => {
    const columnCount = Math.floor(window.innerWidth / 20);
    const newColumns = Array.from({ length: columnCount }, (_, i) => ({
      id: i,
      delay: Math.random() * 1,
      duration: 2 + Math.random() * 2,
    }));
    setColumns(newColumns);

    setTimeout(() => setShowMessage(true), 800);
    setTimeout(() => onComplete(), 4500);
  }, [onComplete]);

  useEffect(() => {
    if (!showMessage || currentLine >= hackMessages.length) return;

    const message = hackMessages[currentLine];
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      if (charIndex <= message.length) {
        setHackText(prev => prev + (message[charIndex] || "\n"));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => setCurrentLine(prev => prev + 1), 300);
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, [showMessage, currentLine]);

  const getRandomChar = () => {
    const chars = '01';
    return chars[Math.floor(Math.random() * chars.length)];
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-black z-[100] overflow-hidden"
    >
      {/* Matrix columns */}
      {columns.map((col) => (
        <motion.div
          key={col.id}
          className="absolute top-0 font-mono text-sm select-none pointer-events-none"
          style={{ left: `${col.id * 20}px` }}
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
                color: `rgba(0, 255, 65, ${Math.max(0.1, 1 - (idx / 20))})`,
                textShadow: '0 0 8px rgba(0, 255, 65, 0.8)',
              }}
            >
              {getRandomChar()}
            </div>
          ))}
        </motion.div>
      ))}

      {/* Central Hacking Message */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="relative">
              {/* Glowing border box */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(255, 0, 0, 0.4), inset 0 0 20px rgba(255, 0, 0, 0.1)',
                    '0 0 50px rgba(255, 0, 0, 0.8), inset 0 0 30px rgba(255, 0, 0, 0.2)',
                    '0 0 30px rgba(255, 0, 0, 0.4), inset 0 0 20px rgba(255, 0, 0, 0.1)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative border-2 border-red-500 bg-black/95 p-10 backdrop-blur-md"
              >
                {/* Animated corner lines */}
                <div className="absolute top-0 left-0 w-8 h-8">
                  <motion.div
                    className="absolute top-0 left-0 border-t-4 border-l-4 border-red-500 w-full h-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div className="absolute top-0 right-0 w-8 h-8">
                  <motion.div
                    className="absolute top-0 right-0 border-t-4 border-r-4 border-red-500 w-full h-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                </div>
                <div className="absolute bottom-0 left-0 w-8 h-8">
                  <motion.div
                    className="absolute bottom-0 left-0 border-b-4 border-l-4 border-red-500 w-full h-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8">
                  <motion.div
                    className="absolute bottom-0 right-0 border-b-4 border-r-4 border-red-500 w-full h-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                  />
                </div>

                {/* Header with lock icon */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <motion.div
                    className="w-1 h-8 bg-red-500"
                    animate={{ scaleY: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <motion.svg
                      width="60"
                      height="60"
                      viewBox="0 0 24 24"
                      fill="none"
                      animate={{ 
                        rotate: [0, 3, -3, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <rect x="5" y="11" width="14" height="10" stroke="#ff0000" strokeWidth="2.5" fill="none" rx="1" />
                      <path d="M7 11V7a5 5 0 0110 0v4" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="12" cy="16" r="2" fill="#ff0000">
                        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <line x1="12" y1="18" x2="12" y2="19.5" stroke="#ff0000" strokeWidth="2" strokeLinecap="round" />
                    </motion.svg>
                  </div>
                  <motion.div
                    className="w-1 h-8 bg-red-500"
                    animate={{ scaleY: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-2xl font-bold text-center mb-6 tracking-wider"
                >
                  ⚠ ÁREA RESTRITA ⚠
                </motion.div>

                <div className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-6" />

                {/* Hacking text */}
                <div className="font-mono text-green-400 text-base space-y-1 min-w-[500px] max-w-[500px]">
                  <div className="whitespace-pre-line leading-relaxed">
                    {hackText}
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="text-green-400 text-xl"
                    >
                      ▋
                    </motion.span>
                  </div>
                </div>

                <div className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent mt-6" />

                {/* Bottom text */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-red-400 text-xs text-center mt-6 tracking-widest"
                >
                  ACESSO MONITORADO E REGISTRADO
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
