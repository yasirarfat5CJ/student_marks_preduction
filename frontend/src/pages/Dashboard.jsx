import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MetricCard } from '../components/MetricCard';
import { authTokenStore, predictionApi } from '../services/predictionApi';
import { getCurrentAuth } from '../utils/auth';
import { 
  ArrowRight, Award, ShieldAlert, BrainCircuit, History,
  GraduationCap, Target
} from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(authTokenStore.get()));
  const [auth, setAuth] = useState(getCurrentAuth());

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const hasToken = Boolean(authTokenStore.get());
      setIsLoggedIn(hasToken);
      setAuth(getCurrentAuth());

      const metricsRes = await predictionApi.getMetrics();

      if (metricsRes.success) {
        setMetrics(metricsRes.data);
      }

      if (hasToken) {
        const historyRes = await predictionApi.getHistory();
        if (historyRes.success) {
          setHistory(historyRes.data);
        }
      } else {
        setHistory([]);
      }
      
      setLoading(false);
    };

    fetchDashboardData();
    const syncAuth = () => fetchDashboardData();
    window.addEventListener('edupredict-auth-change', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('edupredict-auth-change', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const getGradeLabel = (score) => {
    const val = parseFloat(score);
    if (isNaN(val)) return '—';
    if (val >= 85) return 'Grade A+';
    if (val >= 75) return 'Grade A';
    if (val >= 65) return 'Grade B';
    if (val >= 50) return 'Grade C';
    return 'Grade F';
  };
  
  // Find the latest prediction in history
  const latestPrediction = history.length > 0 ? history[0] : null;

  return (
    <div className="space-y-10 py-6">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/40 p-8 md:p-12 lg:p-16">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400">
            <BrainCircuit className="h-4 w-4" />
            Empowering Early Academic Interventions
          </div>
          
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
            Predict Your Final Exam{' '}
            <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-violet-500 bg-clip-text text-transparent">
              Performance
            </span>
          </h1>
          
          <p className="text-base text-slate-300 sm:text-lg leading-relaxed max-w-2xl">
            Use predictive academic analytics to estimate final examination scores. Identify risk metrics early, explore feature contributions, and act on targeted recommendations.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => navigate('/predict')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-violet-500 active:scale-95 transition-all"
            >
              Start Prediction
              <ArrowRight className="h-4 w-4" />
            </button>
            {auth.role === 'admin' && (
              <Link
                to="/analytics"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              >
                View Model Metrics
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2. STATS CARDS */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-white tracking-tight">
          System Overview & Diagnostics
        </h2>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Predicted Exam Marks"
            value={latestPrediction ? `${parseFloat(latestPrediction.predicted_final_marks).toFixed(2)} / 100` : '—'}
            icon={Award}
            description="Latest generated student final exam prediction score."
            trend={latestPrediction ? `Risk: ${latestPrediction.risk_level}` : null}
            trendType={
              latestPrediction?.risk_level === 'Low' 
                ? 'positive' 
                : latestPrediction?.risk_level === 'Moderate' 
                ? 'warning' 
                : 'negative'
            }
          />
          <MetricCard
            title="Assessed Risk Level"
            value={latestPrediction ? latestPrediction.risk_level : '—'}
            icon={ShieldAlert}
            description="Vulnerability level based on predicted score thresholds."
            trend={latestPrediction ? (latestPrediction.risk_level === 'Low' ? 'Low Risk' : 'Attention Required') : null}
            trendType={latestPrediction?.risk_level === 'Low' ? 'positive' : 'negative'}
          />
          <MetricCard
            title="Academic Preparedness"
            value={latestPrediction ? `${Math.min(100, Math.round(parseFloat(latestPrediction.predicted_final_marks)))}%` : '—'}
            icon={GraduationCap}
            description="Estimated exam readiness based on attendance and coursework."
            trend={latestPrediction ? (parseFloat(latestPrediction.predicted_final_marks) >= 75 ? 'High Readiness' : 'Needs Boost') : 'Pending'}
            trendType={latestPrediction ? (parseFloat(latestPrediction.predicted_final_marks) >= 75 ? 'positive' : 'warning') : 'neutral'}
          />
          <MetricCard
            title="Expected Grade Standing"
            value={latestPrediction ? getGradeLabel(latestPrediction.predicted_final_marks) : '—'}
            icon={Target}
            description="Projected letter grade target for final semester evaluation."
            trend={latestPrediction ? (parseFloat(latestPrediction.predicted_final_marks) >= 50 ? 'On Track' : 'Below Passing') : 'Pending'}
            trendType={latestPrediction ? (parseFloat(latestPrediction.predicted_final_marks) >= 50 ? 'positive' : 'negative') : 'neutral'}
          />
        </div>
      </section>

      {/* 3. HISTORY TABLE SECTION */}
      <section className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            <h2 className="font-display text-lg font-bold text-white">Prediction History Logs</h2>
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            {history.length} record(s) logged
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading history records...</div>
        ) : history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Evaluation Date</th>
                  <th className="py-3 px-4 text-right">Predicted Exam Marks</th>
                  <th className="py-3 px-4 text-center">Assessed Risk Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {history.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-400">
                      {entry.date || new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-display font-bold text-white">
                      {parseFloat(entry.predicted_final_marks).toFixed(2)} / 100
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        entry.risk_level === 'Low'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          : entry.risk_level === 'Moderate'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                      }`}>
                        {entry.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500">
            {isLoggedIn
              ? 'No prediction logs recorded yet. Navigate to the Predict page to generate predictions.'
              : 'Log in to view your personal prediction history.'}
          </div>
        )}
      </section>
    </div>
  );
};
export default Dashboard;
