import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, AlertTriangle } from 'lucide-react';
import { predictionApi } from '../services/predictionApi';

export const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const result = await predictionApi.login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      navigate('/predict');
      return;
    }
    setError(result.error?.message || 'Unable to log in. Please try again.');
  };

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="glass-panel rounded-2xl border border-slate-800 bg-slate-950/50 p-6 sm:p-8">
        <div className="mb-6">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <LogIn className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">Log in</h1>
          <p className="mt-1 text-sm text-slate-400">Access predictions, saved history, and what-if simulations.</p>
        </div>

        {error && (
          <div className="mb-4 flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-300">Email</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-300">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          New student? <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
