import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertTriangle } from 'lucide-react';
import { predictionApi } from '../services/predictionApi';

export const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const result = await predictionApi.register(form);
    setLoading(false);
    if (result.success) {
      const loginResult = await predictionApi.login(form.email, form.password);
      if (loginResult.success) {
        navigate('/predict');
        return;
      }
      navigate('/login');
      return;
    }
    setError(result.error?.message || 'Unable to register. Please try again.');
  };

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="glass-panel rounded-2xl border border-slate-800 bg-slate-950/50 p-6 sm:p-8">
        <div className="mb-6">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <UserPlus className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">Create student account</h1>
          <p className="mt-1 text-sm text-slate-400">Registration always creates a student account. Admins are created separately.</p>
        </div>

        {error && (
          <div className="mb-4 flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-semibold text-slate-300">Full name</label>
            <input
              id="name"
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label htmlFor="register-email" className="mb-1 block text-sm font-semibold text-slate-300">Email</label>
            <input
              id="register-email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label htmlFor="register-password" className="mb-1 block text-sm font-semibold text-slate-300">Password</label>
            <input
              id="register-password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Already registered? <Link to="/login" className="font-semibold text-violet-300 hover:text-violet-200">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
