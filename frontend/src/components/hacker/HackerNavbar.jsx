import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Terminal, Activity } from "lucide-react";

export default function HackerNavbar({ currentPage, onLogout }) {
  const menuItems = [
    { name: "DASHBOARD", page: "Dashboard" },
    { name: "SITES", page: "Sites" },
    { name: "LOGS", page: "Logs" },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black border-b-2 border-green-500 font-mono"
    >
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/Dashboard" className="flex items-center gap-3 group">
            <Terminal className="w-6 h-6 text-green-500" />
            <div>
              <div className="text-green-500 font-bold text-lg tracking-wider">CYBERSYSTEM</div>
              <div className="text-green-700 text-xs flex items-center gap-1">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>ONLINE</span>
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            {menuItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <Link
                  key={item.page}
                  to={`/${item.page}`}
                  className={`
                    px-4 py-2 text-sm transition-all
                    ${isActive 
                      ? 'bg-green-500/20 text-green-400 border border-green-500' 
                      : 'text-green-700 hover:text-green-500 hover:bg-green-500/10'
                    }
                  `}
                >
                  [ {item.name} ]
                </Link>
              );
            })}
          </div>

          {/* Right section */}
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm border border-red-500 text-red-500 hover:bg-red-500/10 transition-all"
          >
            [ LOGOUT ]
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
