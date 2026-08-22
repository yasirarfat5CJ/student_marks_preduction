import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ReChartsTooltip, Legend } from 'recharts';
import { predictionApi } from '../services/predictionApi';
import { HelpCircle, Trophy, Scale, Cpu, Image as ImageIcon } from 'lucide-react';

export const Analytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [visualizations, setVisualizations] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Fallback defaults in case backend is loading/unavailable
  const defaultModels = [
    { model: 'Dummy Regressor', mae: 14.96, rmse: 18.79, r2: -0.002, mse: 353.14 },
    { model: 'Decision Tree', mae: 8.86, rmse: 11.42, r2: 0.630, mse: 130.34 },
    { model: 'Random Forest', mae: 6.45, rmse: 8.21, r2: 0.809, mse: 67.41 },
    { model: 'Linear Regression', mae: 6.36, rmse: 8.10, r2: 0.814, mse: 65.66 },
    { model: 'Gradient Boosting', mae: 6.25, rmse: 7.95, r2: 0.821, mse: 63.13 }
  ];

  useEffect(() => {
    const fetchMetrics = async () => {
      const result = await predictionApi.getAdminModelMetrics();
      if (result.success) {
        setMetrics(result.data);
      } else {
        setErrorMsg(result.error?.message || 'Could not fetch admin model metrics.');
      }

      const plotsResult = await predictionApi.getVisualizations();
      if (plotsResult.success) {
        setVisualizations(plotsResult.data.plots || []);
      }
    };
    fetchMetrics();
  }, []);

  const modelsData = metrics?.models || defaultModels;
  const selectedModelName = metrics?.selected_model || 'Gradient Boosting';

  // Process data for charts: sort by R2 for aesthetic rendering
  const sortedChartData = [...modelsData].sort((a, b) => a.r2 - b.r2);

  // Find detailed stats for the selected model
  const selectedModelStats = modelsData.find(
    m => m.model.replace(' Tuned', '') === selectedModelName.replace(' Tuned', '')
  ) || modelsData[modelsData.length - 1]; // Fallback to last one

  return (
    <div className="space-y-10 py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Model Performance Analytics
          </h1>
          <p className="mt-1.5 text-sm text-slate-400 max-w-2xl leading-relaxed">
            Inspect validation metrics, error margins, and goodness-of-fit indicators for the candidate predictors.
          </p>
        </div>
        
        {/* Selected Model Glow Tag */}
        <div className="inline-flex items-center gap-2 self-start rounded-xl border border-blue-500/20 bg-blue-600/10 px-4 py-2 text-xs font-semibold text-blue-400 shadow-lg shadow-blue-500/5">
          <Cpu className="h-4 w-4" />
          Active Model: {selectedModelName}
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
          {errorMsg}
        </div>
      )}

      {/* Row 1: Selected Model Info Card & Model Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Active Model Stats Card (Takes 5 columns) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-5">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h3 className="font-display font-bold text-white text-base">Selected Model Details</h3>
          </div>

          <div className="space-y-5">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Model Family Name
              </span>
              <span className="text-xl font-extrabold text-white mt-0.5 block font-display">
                {selectedModelStats.model} Regressor
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900/60 border border-slate-800/40 rounded-xl p-3 text-center">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  R² Score
                </span>
                <span className="text-lg font-bold text-emerald-400 mt-1 block">
                  {parseFloat(selectedModelStats.r2).toFixed(3)}
                </span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/40 rounded-xl p-3 text-center">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  MAE Error
                </span>
                <span className="text-lg font-bold text-blue-400 mt-1 block">
                  {parseFloat(selectedModelStats.mae).toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/40 rounded-xl p-3 text-center">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  RMSE Error
                </span>
                <span className="text-lg font-bold text-indigo-400 mt-1 block">
                  {parseFloat(selectedModelStats.rmse).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Metrics Definition Tooltip */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex gap-2.5">
                <HelpCircle className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 leading-relaxed space-y-1">
                  <p>
                    <span className="font-semibold text-slate-300">R² (Coefficient of Determination)</span>: Measures explained variance. Higher is better, but it is not class accuracy.
                  </p>
                  <p>
                    <span className="font-semibold text-slate-300">MAE (Mean Absolute Error)</span>: Represents the average absolute difference between predicted and actual marks.
                  </p>
                  <p>
                    <span className="font-semibold text-slate-300">RMSE (Root Mean Squared Error)</span>: Penalizes larger prediction mistakes more heavily. Lower is better.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Model Evaluation Table (Takes 7 columns) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
            <Scale className="h-5 w-5 text-blue-500" />
            <h3 className="font-display font-bold text-white text-base">Model Candidate Comparison</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Predictor Model</th>
                  <th className="py-3 px-4 text-right">MAE</th>
                  <th className="py-3 px-4 text-right">RMSE</th>
                  <th className="py-3 px-4 text-right">R² Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {modelsData.map((row, idx) => {
                  const isActive = row.model.replace(' Tuned', '') === selectedModelName.replace(' Tuned', '');
                  return (
                    <tr 
                      key={idx} 
                      className={`transition-colors ${
                        isActive 
                          ? 'bg-blue-600/5 text-blue-400 font-semibold border-l-2 border-l-blue-500' 
                          : 'hover:bg-slate-900/30'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                        {row.model}
                        {isActive && (
                          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-400 border border-blue-500/25">
                            Selected
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">{parseFloat(row.mae).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right">{parseFloat(row.rmse).toFixed(2)}</td>
                      <td className={`py-3.5 px-4 text-right font-semibold ${row.r2 >= 0.8 ? 'text-emerald-400' : ''}`}>
                        {parseFloat(row.r2).toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 2: Recharts Comparison Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* R² Chart (Higher is better) */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="font-display font-bold text-white text-base">
              R² Score comparison (Higher is Better)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Measures the model's ability to explain changes in final student marks.
            </p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedChartData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="model" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} domain={[0, 1.0]} />
                <ReChartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Bar dataKey="r2" name="R² Value" radius={[4, 4, 0, 0]}>
                  {sortedChartData.map((entry, index) => {
                    const isSelected = entry.model.replace(' Tuned', '') === selectedModelName.replace(' Tuned', '');
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isSelected ? '#3b82f6' : '#1e293b'} 
                        stroke={isSelected ? '#60a5fa' : '#334155'}
                        strokeWidth={1}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MAE & RMSE Chart (Lower is better) */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="font-display font-bold text-white text-base">
              Error Metrics comparison (Lower is Better)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visual comparisons of absolute and squared error ranges.
            </p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedChartData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="model" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} />
                <ReChartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="mae" name="MAE (Mean Absolute Error)" fill="#4f46e5" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                <Bar dataKey="rmse" name="RMSE (Root Mean Squared Error)" fill="#818cf8" radius={[4, 4, 0, 0]} fillOpacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {visualizations.length > 0 && (
        <section className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-5">
            <ImageIcon className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="font-display font-bold text-white text-base">
                Matplotlib EDA Visualizations
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Static charts generated by the Python ML pipeline and saved in artifacts/plots.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visualizations.slice(0, 9).map((plot) => (
              <figure key={plot.url} className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                <img
                  src={plot.url}
                  alt={plot.name}
                  loading="lazy"
                  className="h-52 w-full object-contain bg-white"
                />
                <figcaption className="border-t border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300">
                  {plot.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
export default Analytics;
