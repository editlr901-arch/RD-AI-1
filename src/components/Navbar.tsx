import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code, 
  Globe,
  Wallet, 
  User, 
  Mail, 
  LogOut, 
  Menu, 
  X, 
  Coins,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userData: any;
  logout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, userData, logout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Code },
    { id: 'hosting', label: 'Hosting', icon: Globe },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'contact', label: 'Support', icon: Mail },
  ];

  if (userData?.role === 'admin') {
    navItems.push({ id: 'settings', label: 'Settings', icon: Settings });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src="https://files.catbox.moe/or780j.png" alt="RD AI Logo" className="h-8 w-8" referrerPolicy="no-referrer" />
            <span className="text-xl font-bold text-primary tracking-tighter">RD AI</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  activeTab === item.id 
                    ? "text-primary bg-primary/10" 
                    : "text-gray-400 hover:text-white hover:bg-surface"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-primary/20 rounded-full border border-primary/30">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">{userData?.coins || 0}</span>
            </div>
            <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          <div className="md:hidden flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full border border-primary/30">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">{userData?.coins || 0}</span>
            </div>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-border"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-3 rounded-md text-base font-medium",
                    activeTab === item.id 
                      ? "text-primary bg-primary/10" 
                      : "text-gray-400 hover:text-white hover:bg-surface"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
              <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-3 text-red-500 font-medium">
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
