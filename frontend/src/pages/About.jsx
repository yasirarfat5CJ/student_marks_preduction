import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, GraduationCap, ArrowRight, CheckCircle2, Sparkles
} from 'lucide-react';

export const About = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Academic Features Evaluated', value: '6 Metrics', desc: 'Attendance, Study Hours, CGPA & Coursework' },
    { label: 'Machine Learning Engine', value: 'Gradient Boosting', desc: 'Optimized regression for high accuracy' },
    { label: 'Explainability Standard', value: 'SHAP Framework', desc: 'Transparent feature attribution for every score' },
    { label: 'Response Latency', value: '< 100ms', desc: 'Real-time REST API inference via FastAPI' },
  ];

  return (
    <div className="space-y-16 py-6 max-w-6xl mx-auto">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/50 p-8 md:p-12 lg:p-16 text-center space-y-6">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400">
            <Sparkles className="h-4 w-4" />
            Next-Generation Educational Intelligence Platform
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.15]">
            Empowering Academic Excellence via{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              Explainable AI
            </span>
          </h1>

          <p className="text-base text-slate-300 sm:text-lg leading-relaxed max-w-2xl mx-auto">
            EduPredict AI bridges the gap between academic diagnostics and proactive student support. By combining robust machine learning predictions with transparent SHAP explanations, we empower educators and students to turn early insights into measurable success.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/predict')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-violet-500 active:scale-95 transition-all"
            >
              Try Marks Predictor
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/what-if')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              Open What-If Simulator
            </button>
          </div>
        </div>
      </section>

      {/* SYSTEM IMPACT & STATS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((item, idx) => (
          <div key={idx} className="glass-panel rounded-2xl p-6 space-y-2 border border-slate-800/80 hover:border-slate-700 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block">
              {item.label}
            </span>
            <div className="font-display text-2xl font-extrabold text-white">
              {item.value}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </section>

      {/* MISSION & VISION */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel rounded-2xl p-8 space-y-4 border border-slate-800 relative overflow-hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Target className="h-6 w-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white tracking-tight">Our Mission</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Traditional educational evaluations identify student struggle when it is often too late—after final examinations are completed. Our mission is to democratize early academic risk detection by giving students and mentors access to real-time, interpretable predictive models that guide timely course corrections.
          </p>
          <ul className="space-y-2.5 pt-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Early detection of academic risk factors mid-semester</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Transparent, trustworthy AI outputs backed by mathematical explainability</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Actionable, personalized improvement roadmaps for every student</span>
            </li>
          </ul>
        </div>

        <div className="glass-panel rounded-2xl p-8 space-y-4 border border-slate-800 relative overflow-hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white tracking-tight">Pedagogical Vision</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            We envision an educational landscape where data analytics enhance human mentorship rather than replace it. By delivering precise, transparent data insights, EduPredict AI enables faculty advisors to tailor tutoring programs, optimize study strategies, and maximize institutional pass rates.
          </p>
          <ul className="space-y-2.5 pt-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Data-informed decision making for academic counseling</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Interactive goal-oriented simulation for self-directed study</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Scalable architecture built for modern educational institutions</span>
            </li>
          </ul>
        </div>
      </section>

    </div>
  );
};

export default About;


