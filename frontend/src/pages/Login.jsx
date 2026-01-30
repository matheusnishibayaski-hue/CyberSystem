import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";
import TerminalBackground from "@/components/hacker/TerminalBackground";
import MatrixIntro from "@/components/hacker/MatrixIntro";
import AdminLogin from "@/pages/AdminLogin";
import HatGlassesIcon from "@/components/hacker/HatGlassesIcon";
import { useAuth } from "@/lib/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bootSequence, setBootSequence] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [currentField, setCurrentField] = useState("username");
  const [showIntro, setShowIntro] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    const sequence = [
      "INITIALIZING CYBERSYSTEM v3.7.9...",
      "LOADING KERNEL MODULES............[OK]",
      "STARTING NETWORK SERVICES.........[OK]",
      "SYSTEM READY. AWAITING CREDENTIALS.",
    ];

    sequence.forEach((line, i) => {
      setTimeout(() => {
        setBootSequence(prev => [...prev, line]);
        if (i === sequence.length - 1) {
          setTimeout(() => setShowLogin(true), 500);
        }
      }, i * 400);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setBootSequence(prev => [...prev, `> AUTHENTICATING USER: ${username}`]);

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const result = await login(username, password);

      if (result.success) {
        setBootSequence(prev => [
          ...prev,
          "✓ AUTHENTICATION SUCCESSFUL",
          "✓ LOADING USER PROFILE...",
          "✓ ESTABLISHING SECURE SESSION...",
          "> REDIRECTING TO DASHBOARD..."
        ]);
        toast.success("Login realizado com sucesso!");
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1500);
      } else {
        setError("ACCESS_DENIED");
        setBootSequence(prev => [...prev, "! ACCESS DENIED: INVALID_CREDENTIALS"]);
        setIsLoading(false);
      }
    } catch (error) {
      setError("SYSTEM_ERROR");
      setBootSequence(prev => [...prev, "! SYSTEM ERROR: CONNECTION_FAILED"]);
      setIsLoading(false);
    }
  };

  if (showAdminLogin) {
    return <AdminLogin onBack={() => setShowAdminLogin(false)} />;
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden">
      {/* Admin Access Button */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        onClick={() => setShowAdminLogin(true)}
        className="fixed top-6 right-6 z-20 bg-transparent hover:opacity-80 transition-all group cursor-pointer"
        title="Área do Administrador"
      >
        <img 
          src="https://img.icons8.com/?size=100&id=v1JR7fsYAuq2&format=png&color=00FF41" 
          alt="Admin" 
          className="w-8 h-8 group-hover:animate-pulse"
        />
      </motion.button>

      <AnimatePresence mode="wait">
        {showIntro ? (
          <MatrixIntro onComplete={() => setShowIntro(false)} />
        ) : (
          <motion.div
            key="login-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative min-h-screen"
          >
            <TerminalBackground />

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
              <div className="w-full max-w-4xl">
                {/* Terminal Container */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/90 border-2 border-green-500 rounded-lg overflow-hidden shadow-2xl shadow-green-500/20"
                >
                  {/* Terminal Header */}
                  <div className="bg-green-500/10 border-b border-green-500 px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <Terminal className="w-4 h-4 ml-2" />
                    <span className="text-xs">root@cybersystem:~#</span>
                  </div>

                  {/* Terminal Content */}
                  <div className="p-6 space-y-1 text-sm">
                    {bootSequence.map((line, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={line.startsWith('!') ? 'text-red-500' : line.startsWith('✓') ? 'text-green-400' : ''}
                      >
                        {line}
                      </motion.div>
                    ))}

                    <AnimatePresence>
                      {showLogin && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-8 space-y-4"
                        >
                          <div className="text-green-400 mb-3 text-center">
                            <p>[ SECURE AUTHENTICATION REQUIRED ]</p>
                          </div>

                          <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Username */}
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">USER@SYSTEM:~$</span>
                              <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={() => setCurrentField("username")}
                                disabled={isLoading}
                                placeholder="enter username..."
                                className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder:text-green-900"
                                autoFocus
                              />
                              {currentField === "username" && (
                                <motion.span
                                  animate={{ opacity: [1, 0] }}
                                  transition={{ duration: 0.8, repeat: Infinity }}
                                  className="text-green-400"
                                >
                                  ▋
                                </motion.span>
                              )}
                            </div>

                            {/* Password */}
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">PASSWORD:~$</span>
                              <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setCurrentField("password")}
                                disabled={isLoading}
                                placeholder="enter password..."
                                className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder:text-green-900"
                              />
                              {currentField === "password" && (
                                <motion.span
                                  animate={{ opacity: [1, 0] }}
                                  transition={{ duration: 0.8, repeat: Infinity }}
                                  className="text-green-400"
                                >
                                  ▋
                                </motion.span>
                              )}
                            </div>

                            {/* Error */}
                            {error && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-500"
                              >
                                ! {error}
                              </motion.div>
                            )}

                            {/* Submit */}
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="mt-4 px-6 py-2 border border-green-500 bg-green-500/10 hover:bg-green-500/20 transition-all disabled:opacity-50"
                            >
                              {isLoading ? '[ AUTHENTICATING... ]' : '[ LOGIN ]'}
                            </button>
                          </form>

                          <div className="mt-4 pt-3 border-t border-green-900 text-xs text-green-700">
                            <p>→ USE YOUR REGISTERED CREDENTIALS</p>
                            <p>→ ALL ACTIVITIES ARE BEING MONITORED</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
