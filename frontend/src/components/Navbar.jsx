import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { GraduationCap, LogOut, Menu, UserPlus, X } from 'lucide-react';
import { authTokenStore } from '../services/predictionApi';
import { getCurrentAuth } from '../utils/auth';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [auth, setAuth] = useState(getCurrentAuth());

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Predict', path: '/predict' },
    { name: 'What-If Simulator', path: '/what-if' },
    { name: 'Admin Dashboard', path: '/admin', role: 'admin' },
    { name: 'Analytics', path: '/analytics', role: 'admin' },
    { name: 'About', path: '/about' },
  ].filter((item) => !item.role || item.role === auth.role);

  useEffect(() => {
    const syncAuth = () => setAuth(getCurrentAuth());
    window.addEventListener('edupredict-auth-change', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('edupredict-auth-change', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const handleLogout = () => {
    authTokenStore.clear();
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand Name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-white sm:text-xl">
                EduPredict <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">AI</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 tracking-wider font-medium">
                STUDENT PERFORMANCE INTELLIGENCE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
            {auth.isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="ml-2 inline-flex items-center gap-2 rounded-lg border border-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <div className="ml-2 flex items-center gap-2">
                <NavLink
                  to="/login"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/60 hover:text-white"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  <UserPlus className="h-4 w-4" />
                  Register
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden glass-panel border-b border-slate-800 bg-slate-950/95" id="mobile-menu">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
            {auth.isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-base font-semibold text-blue-300 hover:bg-blue-600/10 hover:text-blue-200"
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
export default Navbar;
