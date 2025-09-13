import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Info, QrCode } from "lucide-react";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    // { path: '/', label: 'Home', icon: Home },
    // { path: '/about', label: 'About', icon: Info },
    // { path: '/check-in', label: 'Check-In', icon: QrCode },
  ];

  return (
    <nav className="bg-card/80 backdrop-blur-sm border-b border-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              GatePass
            </span>
          </motion.div>

          <div className="flex space-x-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-xl
                      transition-all duration-300 bounce-hover
                      ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
