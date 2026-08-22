import React, { useEffect, useMemo, useState } from 'react';
import { Users, ShieldAlert, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { predictionApi } from '../services/predictionApi';

const categoryStyles = {
  Low: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  Moderate: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
  High: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
  'No Prediction': 'border-slate-700 bg-slate-900/60 text-slate-300',
};

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({ categories: {}, students: [] });
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      setError('');
      const result = await predictionApi.getAdminStudentCategories();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Unable to load admin student dashboard.');
      }
      setLoading(false);
    };
    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    if (selectedCategory === 'All') return data.students || [];
    return (data.students || []).filter((student) => student.category === selectedCategory);
  }, [data.students, selectedCategory]);

  const categories = data.categories || {};
  const totalStudents = Object.values(categories).reduce((sum, value) => sum + Number(value || 0), 0);

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-300">
            <ShieldAlert className="h-4 w-4" />
            Admin Only
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
            Student Category Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Monitor students by latest prediction risk category. Each row is based on that student&apos;s own latest saved prediction.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => setSelectedCategory('All')}
          className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 ${
            selectedCategory === 'All' ? 'border-blue-500/40 bg-blue-500/10' : 'border-slate-800 bg-slate-950/40'
          }`}
        >
          <Users className="mb-3 h-5 w-5 text-blue-300" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">All Students</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-white">{totalStudents}</p>
        </button>

        {['Low', 'Moderate', 'High', 'No Prediction'].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 ${
              selectedCategory === category ? categoryStyles[category] : 'border-slate-800 bg-slate-950/40 text-slate-300'
            }`}
          >
            <Activity className="mb-3 h-5 w-5" />
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">{category}</p>
            <p className="mt-1 font-display text-2xl font-extrabold">{categories[category] || 0}</p>
          </button>
        ))}
      </section>

      <section className="glass-panel rounded-2xl border border-slate-800 bg-slate-950/40 p-6">
        <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="font-display text-lg font-bold text-white">
            {selectedCategory === 'All' ? 'All Student Records' : `${selectedCategory} Students`}
          </h2>
          <span className="text-xs font-semibold text-slate-500">{filteredStudents.length} record(s)</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading student categories...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No students found for this category.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-center">Category</th>
                  <th className="px-4 py-3 text-right">Latest Marks</th>
                  <th className="px-4 py-3 text-right">Predictions</th>
                  <th className="px-4 py-3">Last Prediction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-900/30">
                    <td className="px-4 py-3.5 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        {student.is_active && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                        {student.name}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">{student.email}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${categoryStyles[student.category]}`}>
                        {student.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-white">
                      {student.latest_prediction === null ? '-' : `${Number(student.latest_prediction).toFixed(2)} / 100`}
                    </td>
                    <td className="px-4 py-3.5 text-right">{student.total_predictions}</td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {student.last_prediction_at ? new Date(student.last_prediction_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
