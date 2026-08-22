import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Predict } from './pages/Predict';
import { Analytics } from './pages/Analytics';
import { AdminDashboard } from './pages/AdminDashboard';
import { About } from './pages/About';
import { WhatIf } from './pages/WhatIf';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// --- REACT ERROR BOUNDARY COMPONENT ---
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled component crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-panel max-w-md rounded-2xl p-8 space-y-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-display text-xl font-bold">Something went wrong</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected component error occurred in the dashboard UI. Please refresh the browser session and try again.
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white px-5 py-2.5 text-xs font-bold transition-all mx-auto active:scale-95"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col relative">
          {/* Global Ambient Gradients */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[140px] pointer-events-none" />

          {/* Navigation Bar */}
          <Navbar />

          {/* Main Application Body */}
          <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/predict" element={<ProtectedRoute><Predict /></ProtectedRoute>} />
              <Route path="/what-if" element={<ProtectedRoute><WhatIf /></ProtectedRoute>} />
              <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute requiredRole="admin"><Analytics /></ProtectedRoute>} />
              {/* Fallback routing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer Component */}
          <Footer />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
