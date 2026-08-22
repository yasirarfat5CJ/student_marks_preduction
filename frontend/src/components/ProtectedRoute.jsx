import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { getCurrentAuth } from '../utils/auth';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const location = useLocation();
  const auth = getCurrentAuth();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requiredRole && auth.role !== requiredRole) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="glass-panel rounded-2xl border border-rose-500/20 bg-slate-950/60 p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Admin access required</h1>
          <p className="mt-2 text-sm text-slate-400">
            This analytics page is restricted to administrator accounts.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
