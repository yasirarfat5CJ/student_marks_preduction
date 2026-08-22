import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { validateInputs } from '../utils/validation';

export const PredictionForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    attendance_pct: '',
    study_hours_week: '',
    assignment_score: '',
    internal_marks: '',
    prev_sem_cgpa: '',
    activity_score: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    // Validate in real-time if touched
    if (touched[name]) {
      const { errors: validationErrors } = validateInputs(updated);
      setErrors(prev => ({
        ...prev,
        [name]: validationErrors[name] || ''
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const { errors: validationErrors } = validateInputs(formData);
    setErrors(prev => ({
      ...prev,
      [name]: validationErrors[name] || ''
    }));
  };

  const loadDemoData = () => {
    const demoData = {
      attendance_pct: '90',
      study_hours_week: '15',
      assignment_score: '85',
      internal_marks: '80',
      prev_sem_cgpa: '8.2',
      activity_score: '84'
    };
    setFormData(demoData);
    setErrors({});
    setTouched({
      attendance_pct: true,
      study_hours_week: true,
      assignment_score: true,
      internal_marks: true,
      prev_sem_cgpa: true,
      activity_score: true
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mark all as touched
    const allTouched = Object.keys(formData).reduce((acc, curr) => {
      acc[curr] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    const { errors: validationErrors, isValid } = validateInputs(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(formData);
  };

  const fields = [
    {
      id: 'attendance_pct',
      label: 'Attendance Percentage',
      type: 'number',
      unit: '%',
      placeholder: '90',
      description: 'Enter attendance percentage between 0 and 100.',
      tooltip: 'Percentage of class sessions attended in the current semester.'
    },
    {
      id: 'study_hours_week',
      label: 'Study Hours per Week',
      type: 'number',
      unit: 'hrs',
      placeholder: '15',
      description: 'Enter weekly self-study and preparation hours.',
      tooltip: 'Self-study, assignments, and revision time outside of formal lectures.'
    },
    {
      id: 'assignment_score',
      label: 'Assignment Score',
      type: 'number',
      unit: '%',
      placeholder: '85',
      description: 'Enter assignment score between 0 and 100.',
      tooltip: 'Average score across all class assignments, homeworks, and project reports.'
    },
    {
      id: 'internal_marks',
      label: 'Internal Marks',
      type: 'number',
      unit: '%',
      placeholder: '80',
      description: 'Enter internal marks score between 0 and 100.',
      tooltip: 'Average marks obtained in mid-term tests, class quizzes, and lab evaluations.'
    },
    {
      id: 'prev_sem_cgpa',
      label: 'Previous Semester CGPA',
      type: 'number',
      unit: 'CGPA',
      placeholder: '8.2',
      step: '0.01',
      description: 'Enter CGPA on a scale of 0.0 to 10.0.',
      tooltip: 'Cumulative Grade Point Average from the previous academic semesters.'
    },
    {
      id: 'activity_score',
      label: 'Academic Activity Score',
      type: 'number',
      unit: 'Score',
      placeholder: '84',
      description: 'Enter academic engagement score (0–100).',
      tooltip: 'Academic engagement based on activities such as participation, quizzes, labs or learning-platform engagement.'
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Demo Load Panel */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-white">Student Academic Factors</h2>
          <p className="text-xs text-slate-400">Fill in the current metrics or load the test profile.</p>
        </div>
        <button
          type="button"
          onClick={loadDemoData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-600/10 px-3.5 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-600/20 active:scale-95 transition-all"
        >
          <Play className="h-3.5 w-3.5" />
          Load Demo Student
        </button>
      </div>

      {/* Grid Layout Form Fields */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        {fields.map((field) => {
          const hasError = touched[field.id] && errors[field.id];
          const isValid = touched[field.id] && !errors[field.id] && formData[field.id] !== '';

          return (
            <div key={field.id} className="space-y-1.5">
              <label htmlFor={field.id} className="flex items-center justify-between text-sm font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  {field.label}
                  <div className="group relative">
                    <HelpCircle className="h-3.5 w-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 w-64 -translate-x-1/2 pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-xs font-medium text-slate-200 shadow-xl leading-relaxed">
                        {field.tooltip}
                      </div>
                    </div>
                  </div>
                </span>
                
                {/* Validation Status Indicator */}
                {isValid && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Valid
                  </span>
                )}
                {hasError && (
                  <span className="flex items-center gap-1 text-[11px] text-rose-400 font-semibold uppercase tracking-wider">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Error
                  </span>
                )}
              </label>

              <div className="relative rounded-lg shadow-sm">
                <input
                  type="number"
                  name={field.id}
                  id={field.id}
                  value={formData[field.id]}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  step={field.step || 'any'}
                  placeholder={field.placeholder}
                  disabled={isLoading}
                  className={`block w-full rounded-lg border bg-slate-950 py-2.5 pl-4 pr-12 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${
                    hasError
                      ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20'
                      : isValid
                      ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  aria-invalid={hasError ? 'true' : 'false'}
                  aria-describedby={hasError ? `${field.id}-error` : `${field.id}-description`}
                />
                
                {/* Unit Suffix */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    {field.unit}
                  </span>
                </div>
              </div>

              {/* Sub-label descriptions & errors */}
              {hasError ? (
                <p id={`${field.id}-error`} className="text-xs font-semibold text-rose-400">
                  {errors[field.id]}
                </p>
              ) : (
                <p id={`${field.id}-description`} className="text-[11px] text-slate-500 font-medium leading-normal">
                  {field.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Action Block */}
      <div className="border-t border-slate-900 pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full relative flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-violet-500 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none transition-all duration-200"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing student performance...
            </span>
          ) : (
            'Predict Final Exam Marks'
          )}
        </button>
      </div>
    </form>
  );
};
export default PredictionForm;
