import React from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ReChartsTooltip, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { RiskBadge } from './RiskBadge';
import { Lightbulb, Info, TrendingUp, HelpCircle, Download } from 'lucide-react';
import { generatePDFReport } from '../utils/pdfGenerator';

export const PredictionResult = ({ prediction, inputs }) => {
  if (!prediction) return null;

  const handleDownloadReport = () => {
    generatePDFReport({
      studentName: 'Student',
      inputs,
      prediction
    });
  };

  const marks = parseFloat(prediction.predicted_final_marks).toFixed(2);
  const risk = prediction.risk_level;
  const rawContributions = prediction.contributions || [];
  const recommendations = prediction.recommendations || [];

  // Determine performance category
  const getPerformanceLabel = (score) => {
    const val = parseFloat(score);
    if (val >= 90) return { text: 'Outstanding', color: 'text-indigo-400' };
    if (val >= 80) return { text: 'Strong', color: 'text-blue-400' };
    if (val >= 65) return { text: 'Average', color: 'text-emerald-400' };
    if (val >= 50) return { text: 'Passing', color: 'text-amber-400' };
    return { text: 'Critical Support Needed', color: 'text-rose-400' };
  };

  const performance = getPerformanceLabel(marks);

  // 1. Process SHAP contributions for chart
  // We format the label names to be human readable
  const formatFeatureName = (name) => {
    const mapping = {
      attendance_pct: 'Attendance',
      study_hours_week: 'Study Hours/Wk',
      assignment_score: 'Assignment Score',
      internal_marks: 'Internal Marks',
      prev_sem_cgpa: 'Prev Semester CGPA',
      activity_score: 'Activity Score'
    };
    return mapping[name] || name;
  };

  const shapData = rawContributions.map(item => ({
    rawName: item.feature,
    name: formatFeatureName(item.feature),
    value: parseFloat(item.contribution.toFixed(3)),
    direction: item.direction,
    message: `${formatFeatureName(item.feature)} contributed ${item.direction === 'positive' ? 'positively' : 'negatively'} to this model prediction.`
  }));

  // 2. Process Radar chart data: Normalize values (0 to 100)
  const radarData = [
    { subject: 'Attendance', value: parseFloat(inputs.attendance_pct), fullMark: 100 },
    // Normalizing Study Hours: Assuming 20 hours is 100% capacity
    { subject: 'Study Hours', value: Math.min(100, Math.round((parseFloat(inputs.study_hours_week) / 20) * 100)), fullMark: 100 },
    { subject: 'Assignment', value: parseFloat(inputs.assignment_score), fullMark: 100 },
    { subject: 'Internal Marks', value: parseFloat(inputs.internal_marks), fullMark: 100 },
    // Normalizing CGPA: Multiply by 10 (scale 0-10 -> 0-100)
    { subject: 'Prev CGPA', value: Math.round(parseFloat(inputs.prev_sem_cgpa) * 10), fullMark: 100 },
    { subject: 'Academic Activity', value: parseFloat(inputs.activity_score), fullMark: 100 },
  ];

  // 3. Process Trend data
  // Flow: Prev CGPA % -> Internal marks -> Predicted final exam marks
  const trendData = [
    { name: 'Previous CGPA', score: Math.round(parseFloat(inputs.prev_sem_cgpa) * 10), type: 'Historical' },
    { name: 'Current Internals', score: Math.round(parseFloat(inputs.internal_marks)), type: 'Historical' },
    { name: 'Predicted Exam', score: parseFloat(marks), type: 'Prediction' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SECTION 1: Prediction Overview Card */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Circular Progress Gauge */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative h-48 w-48 flex items-center justify-center">
              {/* Glow SVG Ring */}
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  className="stroke-slate-800/80"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  className="stroke-blue-600 transition-all duration-1000 ease-out"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={2 * Math.PI * 80 * (1 - Math.min(100, Math.max(0, marks)) / 100)}
                  strokeLinecap="round"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(37, 99, 235, 0.4))'
                  }}
                />
              </svg>
              {/* Inner score reading */}
              <div className="text-center">
                <div className="font-display text-4xl font-extrabold tracking-tight text-white">
                  {marks}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
                  out of 100
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Predicted Exam Marks
              </span>
              <p className="text-sm font-medium text-slate-500">
                Calculated using Gradient Boosting Regressor
              </p>
            </div>
          </div>

          {/* Details & Performance Indicators */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">
                Academic Diagnostic
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-white tracking-tight font-display">
                Performance Evaluation
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Expected Standing
                </span>
                <span className={`text-xl font-bold mt-1 block ${performance.color}`}>
                  {performance.text}
                </span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-center items-start">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Risk Level
                </span>
                <RiskBadge riskLevel={risk} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-300">Model Statement:</span> This prediction represents the statistical expectation of exam marks based on historical correlations. It is designed to flag risk factors early so students can receive timely coaching.
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadReport}
              className="w-full relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-xs font-bold text-white shadow hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] transition-all"
            >
              <Download className="h-4 w-4" />
              Download Performance Report
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: SHAP Feature Contributions & Radar Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Why this prediction? (Explainable AI SHAP Chart) */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="font-display font-bold text-white text-base">
                Why this prediction?
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Local feature contributions showing how input factors influenced the model.
              </p>
            </div>
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-slate-500 hover:text-slate-300 cursor-pointer" />
              <div className="pointer-events-none absolute bottom-full right-0 z-10 w-64 pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-xs text-slate-200 leading-relaxed shadow-xl">
                  Bars represent feature contributions (SHAP values). Green pushes prediction higher; red pulls it lower.
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={shapData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis type="number" stroke="#475569" fontSize={11} domain={['auto', 'auto']} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#475569"
                  fontSize={11}
                  width={110}
                />
                <ReChartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg bg-slate-900 border border-slate-800 p-2.5 shadow-xl text-xs max-w-[240px] leading-relaxed">
                          <p className="font-semibold text-white">{data.name}</p>
                          <p className="mt-1 text-slate-300">{data.message}</p>
                          <p className="mt-1.5 font-bold text-blue-400">
                            Impact Score: {data.value > 0 ? `+${data.value}` : data.value}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value">
                  {shapData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.value >= 0 ? '#10b981' : '#f43f5e'}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Feature Breakdown */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="font-display font-bold text-white text-base">
              Performance Index Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison of academic metrics normalized to a 100-point scale.
            </p>
          </div>

          <div className="flex-1 min-h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                <Radar
                  name="Student Scores"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 3: Recommendations & Performance Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Action Recommendations */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              Targeted Academic Roadmap & Recommendations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized diagnostics mapping lagging areas and step-by-step improvement actions.
            </p>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto max-h-[400px] pr-1">
            {prediction.detailed_recommendations ? (
              <div className="space-y-5">
                {/* 1. Lagging Areas (Gaps) */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    1. Detected Lagging Areas
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {prediction.detailed_recommendations.lagging_areas.map((area, idx) => (
                      <div key={idx} className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{area.label}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold tracking-wide uppercase ${
                            area.priority === 'Critical' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                            area.priority === 'High' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                            area.priority === 'Medium' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                            'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {area.status}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[11px] text-slate-400 leading-normal">
                          Current status: <strong className="text-slate-350">{area.current_value}</strong>. {area.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Action Steps */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    2. Recommended Action Plan
                  </h4>
                  <div className="space-y-3">
                    {prediction.detailed_recommendations.actionable_steps.map((step, idx) => (
                      <div key={idx} className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-3.5 hover:border-slate-800 hover:bg-slate-900/60 transition-all space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 font-extrabold text-[10px] border border-blue-500/20">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-white">{step.title}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed pl-7">
                          <strong className="text-slate-400 font-semibold">Action:</strong> {step.action}
                        </p>
                        <p className="text-[11px] text-slate-400 italic leading-relaxed pl-7 border-l-2 border-slate-800 ml-2 mt-1">
                          <strong className="text-slate-500 font-semibold not-italic">Tip:</strong> {step.tip}
                        </p>
                        <div className="pl-7 text-[9px] text-blue-500 font-bold tracking-wide uppercase">
                          Expected Impact: {step.impact}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className="flex gap-3 bg-slate-900/40 border border-slate-800/40 rounded-xl p-4 hover:border-slate-800 hover:bg-slate-900/60 transition-all"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 font-semibold text-xs border border-blue-500/20">
                    {index + 1}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300 font-medium">
                    {rec}
                  </p>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No recommendations needed. Performance indicators are fully optimal.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
            <span>Source: Model Recommendation Logic</span>
            <span className="font-medium text-blue-500/80">AI Intervention Engine</span>
          </div>
        </div>

        {/* Performance Path Trend */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Academic Progression Trend
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Trajectory mapping historical marks to the final exam prediction.
            </p>
          </div>

          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#475569" fontSize={11} />
                <ReChartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg bg-slate-900 border border-slate-800 p-2.5 shadow-xl text-xs">
                          <p className="font-semibold text-slate-400">{data.name}</p>
                          <p className="mt-1 font-bold text-white text-sm">{data.score} / 100</p>
                          <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                            data.type === 'Prediction' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {data.type}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const isPred = payload.type === 'Prediction';
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill={isPred ? '#f43f5e' : '#3b82f6'}
                        stroke="#0f172a"
                        strokeWidth={2}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex gap-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Historical Benchmarks (normalized)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Predicted Final Marks
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PredictionResult;
