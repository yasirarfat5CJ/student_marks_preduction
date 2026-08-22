import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ReChartsTooltip, Cell } from 'recharts';
import { predictionApi } from '../services/predictionApi';
import { validateInputs } from '../utils/validation';
import { lastPredictionStore } from '../utils/predictionState';
import { 
  Sliders, RefreshCw, Save, Trash2, ArrowUpRight, ArrowDownRight,
  Info, ArrowRight, BookOpen, AlertTriangle, Download, Lightbulb
} from 'lucide-react';
import { generatePDFReport } from '../utils/pdfGenerator';

const DEFAULT_BASELINE = {
  attendance_pct: '70',
  study_hours_week: '2',
  assignment_score: '65',
  internal_marks: '60',
  prev_sem_cgpa: '6.2',
  activity_score: '50'
};

const toSliderData = (data) => ({
  attendance_pct: parseFloat(data.attendance_pct),
  study_hours_week: parseFloat(data.study_hours_week),
  assignment_score: parseFloat(data.assignment_score),
  internal_marks: parseFloat(data.internal_marks),
  prev_sem_cgpa: parseFloat(data.prev_sem_cgpa),
  activity_score: parseFloat(data.activity_score)
});

const toFormData = (data) => ({
  attendance_pct: String(data.attendance_pct),
  study_hours_week: String(data.study_hours_week),
  assignment_score: String(data.assignment_score),
  internal_marks: String(data.internal_marks),
  prev_sem_cgpa: String(data.prev_sem_cgpa),
  activity_score: String(data.activity_score)
});

export const WhatIf = () => {
  // Current Student Baseline Performance State
  const [currentData, setCurrentData] = useState(DEFAULT_BASELINE);

  // What-If Simulation Performance State
  const [whatIfData, setWhatIfData] = useState(toSliderData(DEFAULT_BASELINE));

  // App loading, prediction, error state
  const [loading, setLoading] = useState(false);
  const [baselineLoading, setBaselineLoading] = useState(false);
  const [baselinePrediction, setBaselinePrediction] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  
  // Custom Saved Scenarios List
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [scenarioNameInput, setScenarioNameInput] = useState('');
  const [scenarioSavedAlert, setScenarioSavedAlert] = useState(false);

  // Pre-load a demo profile into baseline when page mounts
  const handleLoadDemo = () => {
    setCurrentData(DEFAULT_BASELINE);
    setWhatIfData(toSliderData(DEFAULT_BASELINE));
    setBaselinePrediction(null);
    setSimulationResult(null);
    setErrors({});
    setErrorMsg('');
  };

  const loadLastActualPrediction = () => {
    const stored = lastPredictionStore.get();
    if (!stored?.inputs || stored?.prediction?.predicted_final_marks === undefined) {
      return false;
    }

    const baseline = toFormData(stored.inputs);
    setCurrentData(baseline);
    setWhatIfData(toSliderData(baseline));
    setBaselinePrediction(parseFloat(stored.prediction.predicted_final_marks));
    setSimulationResult(null);
    setErrors({});
    setErrorMsg('');
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentData(prev => ({
      ...prev,
      [name]: value
    }));
    setBaselinePrediction(null);
    setSimulationResult(null);
  };

  // Validate and submit baseline values to API
  const handleCalculateBaseline = async (e) => {
    e.preventDefault();
    setBaselineLoading(true);
    setErrorMsg('');
    setBaselinePrediction(null);
    setSimulationResult(null);

    const { errors: validationErrors, isValid } = validateInputs(currentData);
    if (!isValid) {
      setErrors(validationErrors);
      setBaselineLoading(false);
      return;
    }
    setErrors({});

    const result = await predictionApi.predict(currentData);
    setBaselineLoading(false);
    
    if (result.success) {
      const marks = parseFloat(result.data.predicted_final_marks);
      setBaselinePrediction(marks);
      
      // Initialize what-if data state to match current inputs
      setWhatIfData(toSliderData(currentData));
      lastPredictionStore.set(currentData, result.data);
    } else {
      setErrorMsg(result.error?.message || 'Failed to fetch baseline prediction.');
    }
  };

  // Handle updates from slider or numeric inputs in What-If section
  const handleWhatIfChange = (field, val) => {
    let parsedVal = val === '' ? '' : parseFloat(val);
    
    // Bounds clamping for UI inputs
    if (typeof parsedVal === 'number' && !isNaN(parsedVal)) {
      if (field === 'study_hours_week') {
        parsedVal = Math.min(40, Math.max(0, parsedVal));
      } else {
        parsedVal = Math.min(100, Math.max(0, parsedVal));
      }
    }

    setWhatIfData(prev => ({
      ...prev,
      [field]: parsedVal
    }));
  };

  // Run the What-If simulation request
  const handleSimulate = async () => {
    setLoading(true);
    setErrorMsg('');
    setSimulationResult(null);

    // Validate What-If inputs locally
    const checkData = {
      ...whatIfData,
      attendance_pct: whatIfData.attendance_pct.toString(),
      study_hours_week: whatIfData.study_hours_week.toString(),
      assignment_score: whatIfData.assignment_score.toString(),
      internal_marks: whatIfData.internal_marks.toString(),
      prev_sem_cgpa: whatIfData.prev_sem_cgpa.toString(),
      activity_score: whatIfData.activity_score.toString()
    };

    const { isValid, errors: valErrors } = validateInputs(checkData);
    if (!isValid) {
      setErrorMsg(Object.values(valErrors).join(', '));
      setLoading(false);
      return;
    }

    const result = await predictionApi.whatIf(currentData, whatIfData);
    setLoading(false);

    if (result.success) {
      setSimulationResult(result.data);
    } else {
      setErrorMsg(result.error?.message || 'Failed to connect to simulation server.');
    }
  };

  // Restore sliders to original values
  const handleReset = () => {
    setWhatIfData(toSliderData(currentData));
    setSimulationResult(null);
  };

  // Save the current simulation scenario to memory list
  const handleSaveScenario = () => {
    if (!simulationResult) return;
    
    const name = scenarioNameInput.trim() || `Scenario ${savedScenarios.length + 1}`;
    
    const newScenario = {
      id: Date.now(),
      name,
      attendance_pct: whatIfData.attendance_pct,
      study_hours_week: whatIfData.study_hours_week,
      assignment_score: whatIfData.assignment_score,
      internal_marks: whatIfData.internal_marks,
      prediction: simulationResult.what_if_prediction,
      change: simulationResult.predicted_change
    };

    setSavedScenarios(prev => [...prev, newScenario]);
    setScenarioNameInput('');
    setScenarioSavedAlert(true);
    setTimeout(() => setScenarioSavedAlert(false), 3000);
  };

  // Delete a saved scenario
  const handleDeleteScenario = (id) => {
    setSavedScenarios(prev => prev.filter(scen => scen.id !== id));
  };

  // Generate and download a PDF report containing baseline & what-if results
  const handleDownloadReport = () => {
    if (!simulationResult) return;
    
    // We construct a mock prediction response object so pdfGenerator is completely unified
    const mockPrediction = {
      predicted_final_marks: baselinePrediction,
      risk_level: baselinePrediction < 50 ? 'High' : baselinePrediction < 75 ? 'Moderate' : 'Low',
      recommendations: simulationResult.current_detailed_recommendations?.flat_recommendations || [],
      detailed_recommendations: simulationResult.current_detailed_recommendations || null,
      contributions: []
    };

    generatePDFReport({
      studentName: 'Student',
      inputs: {
        attendance_pct: currentData.attendance_pct,
        study_hours_week: currentData.study_hours_week,
        assignment_score: currentData.assignment_score,
        internal_marks: currentData.internal_marks,
        prev_sem_cgpa: currentData.prev_sem_cgpa,
        activity_score: currentData.activity_score
      },
      prediction: mockPrediction,
      whatIf: {
        current_prediction: simulationResult.current_prediction,
        what_if_prediction: simulationResult.what_if_prediction,
        predicted_change: simulationResult.predicted_change
      }
    });
  };

  // Pre-load the latest real prediction if available; otherwise show demo values.
  useEffect(() => {
    if (!loadLastActualPrediction()) {
      handleLoadDemo();
    }

    const syncLastPrediction = () => loadLastActualPrediction();
    window.addEventListener('edupredict-last-prediction-change', syncLastPrediction);
    window.addEventListener('storage', syncLastPrediction);
    return () => {
      window.removeEventListener('edupredict-last-prediction-change', syncLastPrediction);
      window.removeEventListener('storage', syncLastPrediction);
    };
  }, []);

  // Format chart data for Recharts comparison
  const chartData = [
    {
      name: 'Current Prediction',
      score: baselinePrediction ? parseFloat(baselinePrediction.toFixed(2)) : 0,
      fill: '#3b82f6'
    },
    {
      name: 'What-If Prediction',
      score: simulationResult ? parseFloat(simulationResult.what_if_prediction.toFixed(2)) : 0,
      fill: '#8b5cf6'
    }
  ];

  const currentRecommendations = simulationResult?.current_detailed_recommendations || null;
  const whatIfRecommendations = simulationResult?.what_if_detailed_recommendations || null;
  const currentLaggingAreas = currentRecommendations?.lagging_areas || [];
  const whatIfLaggingAreas = whatIfRecommendations?.lagging_areas || [];
  const changedFeatures = simulationResult?.changed_features || {};

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-xs">
          <Sliders className="h-4 w-4" />
          Interactive Simulator
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl mt-1.5">
          What-If Scenario Simulator
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
          Test hypothetical academic adjustments and observe how they affect the predicted exam marks produced by the existing trained Gradient Boosting model.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 flex items-start gap-4 animate-fade-in">
          <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">Simulation Service Error</h4>
            <p className="text-xs text-rose-300 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Left Baseline Formulation, Right/Center Adjustments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Baseline Input Block (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-slate-950/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="font-display font-bold text-white text-base">
                  Current Performance
                </h3>
                <p className="text-xs text-slate-500">Establish the student's baseline marks.</p>
              </div>
              <button
                type="button"
                onClick={handleLoadDemo}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-all"
              >
                <RefreshCw className="h-3 w-3" />
                Reset Baseline
              </button>
            </div>

            <form onSubmit={handleCalculateBaseline} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Attendance (%)</label>
                  <input
                    type="number"
                    name="attendance_pct"
                    value={currentData.attendance_pct}
                    onChange={handleInputChange}
                    placeholder="70"
                    disabled={baselineLoading || loading}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {errors.attendance_pct && <span className="text-[10px] font-medium text-rose-400">{errors.attendance_pct}</span>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Study Hours/Wk</label>
                  <input
                    type="number"
                    name="study_hours_week"
                    value={currentData.study_hours_week}
                    onChange={handleInputChange}
                    placeholder="2"
                    disabled={baselineLoading || loading}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {errors.study_hours_week && <span className="text-[10px] font-medium text-rose-400">{errors.study_hours_week}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Assignment Score</label>
                  <input
                    type="number"
                    name="assignment_score"
                    value={currentData.assignment_score}
                    onChange={handleInputChange}
                    placeholder="65"
                    disabled={baselineLoading || loading}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {errors.assignment_score && <span className="text-[10px] font-medium text-rose-400">{errors.assignment_score}</span>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Internal Marks</label>
                  <input
                    type="number"
                    name="internal_marks"
                    value={currentData.internal_marks}
                    onChange={handleInputChange}
                    placeholder="60"
                    disabled={baselineLoading || loading}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {errors.internal_marks && <span className="text-[10px] font-medium text-rose-400">{errors.internal_marks}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Prev CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    name="prev_sem_cgpa"
                    value={currentData.prev_sem_cgpa}
                    onChange={handleInputChange}
                    placeholder="6.2"
                    disabled={baselineLoading || loading}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {errors.prev_sem_cgpa && <span className="text-[10px] font-medium text-rose-400">{errors.prev_sem_cgpa}</span>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Activity Score</label>
                  <input
                    type="number"
                    name="activity_score"
                    value={currentData.activity_score}
                    onChange={handleInputChange}
                    placeholder="50"
                    disabled={baselineLoading || loading}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {errors.activity_score && <span className="text-[10px] font-medium text-rose-400">{errors.activity_score}</span>}
                </div>
              </div>

              <button
                type="submit"
                disabled={baselineLoading || loading}
                className="w-full relative flex items-center justify-center rounded-xl bg-blue-600/80 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-blue-600 active:scale-95 transition-all mt-2"
              >
                {baselineLoading ? (
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    Set Baseline
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Baseline Output Card */}
          {baselinePrediction !== null && (
            <div className="glass-panel rounded-2xl p-5 border border-blue-500/20 bg-blue-950/10 text-center animate-fade-in">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
                Current Prediction
              </span>
              <div className="text-3xl font-extrabold text-white mt-1.5 font-display">
                {baselinePrediction.toFixed(2)}
                <span className="text-xs text-slate-500 font-semibold block mt-0.5 uppercase">
                  out of 100
                </span>
              </div>
            </div>
          )}
        </div>

        {/* What-If Controllers Panel (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          {baselinePrediction === null ? (
            <div className="glass-panel rounded-2xl border-dashed border-slate-800 flex flex-col items-center justify-center p-12 text-center min-h-[350px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-blue-400 mb-4">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-white text-base">Setup Baseline First</h3>
              <p className="mt-2 text-xs text-slate-500 max-w-sm leading-relaxed">
                Please confirm or input the baseline metrics in the left panel and click <strong>"Set Baseline"</strong> to unlock simulation capabilities.
              </p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-slate-950/40 space-y-6 animate-fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-display font-bold text-white text-base">
                  What-If Scenario Settings
                </h3>
                <p className="text-xs text-slate-500">Drag sliders to adjust student factors and test different scenarios.</p>
              </div>

              {/* Sliders Grid */}
              <div className="space-y-5">
                {/* Attendance */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Attendance Percentage</span>
                    <span className="text-slate-400">Current: {currentData.attendance_pct}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={whatIfData.attendance_pct}
                      onChange={(e) => handleWhatIfChange('attendance_pct', e.target.value)}
                      className="flex-1 accent-blue-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={whatIfData.attendance_pct}
                        onChange={(e) => handleWhatIfChange('attendance_pct', e.target.value)}
                        className="w-16 rounded border border-slate-800 bg-slate-950 py-1 px-2 text-xs text-center font-bold text-white"
                      />
                      <span className="text-slate-500 text-xs font-semibold">%</span>
                    </div>
                  </div>
                </div>

                {/* Study Hours */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Study Hours per Week</span>
                    <span className="text-slate-400">Current: {currentData.study_hours_week} hrs/week</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="0.5"
                      value={whatIfData.study_hours_week}
                      onChange={(e) => handleWhatIfChange('study_hours_week', e.target.value)}
                      className="flex-1 accent-blue-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="40"
                        step="0.5"
                        value={whatIfData.study_hours_week}
                        onChange={(e) => handleWhatIfChange('study_hours_week', e.target.value)}
                        className="w-16 rounded border border-slate-800 bg-slate-950 py-1 px-2 text-xs text-center font-bold text-white"
                      />
                      <span className="text-slate-500 text-xs font-semibold">hrs</span>
                    </div>
                  </div>
                </div>

                {/* Assignment Score */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Assignment Score</span>
                    <span className="text-slate-400">Current: {currentData.assignment_score}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={whatIfData.assignment_score}
                      onChange={(e) => handleWhatIfChange('assignment_score', e.target.value)}
                      className="flex-1 accent-blue-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={whatIfData.assignment_score}
                        onChange={(e) => handleWhatIfChange('assignment_score', e.target.value)}
                        className="w-16 rounded border border-slate-800 bg-slate-950 py-1 px-2 text-xs text-center font-bold text-white"
                      />
                      <span className="text-slate-500 text-xs font-semibold">/100</span>
                    </div>
                  </div>
                </div>

                {/* Internal Marks */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Internal Marks</span>
                    <span className="text-slate-400">Current: {currentData.internal_marks}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={whatIfData.internal_marks}
                      onChange={(e) => handleWhatIfChange('internal_marks', e.target.value)}
                      className="flex-1 accent-blue-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={whatIfData.internal_marks}
                        onChange={(e) => handleWhatIfChange('internal_marks', e.target.value)}
                        className="w-16 rounded border border-slate-800 bg-slate-950 py-1 px-2 text-xs text-center font-bold text-white"
                      />
                      <span className="text-slate-500 text-xs font-semibold">/100</span>
                    </div>
                  </div>
                </div>

                {/* Fixed Features Display */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-4 text-xs">
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 flex justify-between items-center">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Prev Semester CGPA (Fixed)</span>
                    <span className="text-slate-300 font-bold">{whatIfData.prev_sem_cgpa}</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 flex justify-between items-center">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Activity Score (Fixed)</span>
                    <span className="text-slate-300 font-bold">{whatIfData.activity_score}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-900 pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-slate-850 hover:bg-slate-900 text-xs px-4 py-2 font-bold text-slate-400 hover:text-white transition-all"
                >
                  Reset to Current
                </button>
                <button
                  type="button"
                  onClick={handleSimulate}
                  disabled={loading}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-2 text-xs font-bold text-white shadow-lg hover:from-blue-500 hover:to-violet-500 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Simulating...
                    </>
                  ) : (
                    'Simulate Scenario'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Result Block */}
      {simulationResult && (
        <div className="glass-panel rounded-2xl p-6 md:p-8 border border-slate-800 bg-slate-950/40 space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Numeric Result breakdown */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">
                  Simulation Outcome
                </span>
                <h3 className="font-display font-extrabold text-white text-2xl mt-1.5">
                  Result Analysis
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/60 border border-slate-850/60 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Current Prediction
                  </span>
                  <span className="text-xl font-bold mt-1 text-slate-400 block">
                    {simulationResult.current_prediction.toFixed(2)}
                  </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-850/60 rounded-xl p-4 text-center ring-2 ring-violet-500/30">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    What-If Prediction
                  </span>
                  <span className="text-xl font-bold mt-1 text-white block">
                    {simulationResult.what_if_prediction.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Difference Badge block */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Potential Change
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">Based on model output logic</p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold shadow ${
                  simulationResult.predicted_change > 0 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : simulationResult.predicted_change < 0
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {simulationResult.predicted_change > 0 && <ArrowUpRight className="h-4 w-4 shrink-0" />}
                  {simulationResult.predicted_change < 0 && <ArrowDownRight className="h-4 w-4 shrink-0" />}
                  {simulationResult.predicted_change > 0 ? `+${simulationResult.predicted_change.toFixed(2)}` : simulationResult.predicted_change.toFixed(2)} marks
                </div>
              </div>

              {/* Scenario adjustments summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scenario Changes</h4>
                <div className="space-y-2">
                  {Object.keys(changedFeatures).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No variables changed from baseline.</p>
                  ) : (
                    Object.entries(changedFeatures).map(([key, val]) => {
                      const nameMap = {
                        attendance_pct: 'Attendance',
                        study_hours_week: 'Study Hours',
                        assignment_score: 'Assignment Score',
                        internal_marks: 'Internal Marks'
                      };
                      return (
                        <div key={key} className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
                          <span className="text-slate-400 font-medium">{nameMap[key] || key}</span>
                          <span className="font-bold text-slate-200">
                            {val.from} → {val.to}
                            {key === 'attendance_pct' ? '%' : key === 'study_hours_week' ? ' hrs' : ''}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Recharts chart representation (7 columns) */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center">
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                  >
                    <XAxis dataKey="name" stroke="#475569" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#475569" fontSize={11} />
                    <ReChartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 shadow-xl text-xs">
                              <p className="font-semibold text-white">{data.name}</p>
                              <p className="mt-1 font-bold text-blue-400 text-sm">
                                {data.score} / 100
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={60}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Scenario saving controls */}
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg">
                <input
                  type="text"
                  placeholder="Enter scenario name (e.g. Study More)"
                  value={scenarioNameInput}
                  onChange={(e) => setScenarioNameInput(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white placeholder-slate-705 focus:outline-none focus:border-blue-500 transition-all w-full"
                />
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleSaveScenario}
                    className="flex-1 sm:flex-initial rounded-lg bg-slate-900 hover:bg-slate-800 text-xs px-4 py-2.5 border border-slate-800 hover:text-white text-slate-300 font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save Scenario
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadReport}
                    className="flex-1 sm:flex-initial rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs px-4 py-2.5 text-white font-bold transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Report
                  </button>
                </div>
              </div>
              {scenarioSavedAlert && (
                <p className="text-[10px] text-emerald-400 font-semibold mt-2 animate-fade-in">
                  Scenario successfully saved to comparison grid below!
                </p>
              )}
            </div>

          </div>

          {/* Academic Gap Resolution Roadmap */}
          {currentRecommendations && (
            <div className="border-t border-slate-900 pt-6">
              <h4 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="h-4.5 w-4.5 text-amber-400" />
                Academic Gap Resolution Roadmap
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Current Gaps */}
                <div className="space-y-3 bg-slate-950/20 border border-slate-900/60 rounded-2xl p-5">
                  <span className="text-[10px] font-bold text-rose-455 uppercase tracking-widest block">
                    Current Performance Gaps
                  </span>
                  <div className="space-y-3">
                    {currentLaggingAreas.map((area, idx) => (
                      <div key={idx} className="bg-slate-900/20 border border-slate-900 rounded-xl p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-300">{area.label}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                            area.priority === 'Critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            area.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {area.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Value: <strong className="text-slate-200">{area.current_value}</strong> — {area.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Gaps */}
                <div className="space-y-3 bg-slate-950/20 border border-slate-900/60 rounded-2xl p-5">
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block">
                    Simulated Scenario Roadmap
                  </span>
                  <div className="space-y-3">
                    {(() => {
                      const whatIfGaps = whatIfLaggingAreas;
                      const currentGaps = currentLaggingAreas;
                      
                      const currentFeatures = currentGaps.map(g => g.feature).filter(f => f !== 'none');
                      const whatIfFeatures = whatIfGaps.map(g => g.feature).filter(f => f !== 'none');
                      const resolvedFeatures = currentFeatures.filter(f => !whatIfFeatures.includes(f));

                      return (
                        <>
                          {/* Resolved Gaps */}
                          {resolvedFeatures.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">Resolved Bottlenecks</span>
                              {resolvedFeatures.map(feat => {
                                const matched = currentGaps.find(g => g.feature === feat);
                                return (
                                  <div key={feat} className="bg-emerald-950/10 border border-emerald-900/30 rounded-xl p-3 flex items-center justify-between">
                                    <div>
                                      <span className="text-xs font-bold text-emerald-450">{matched?.label}</span>
                                      <span className="text-[10px] text-emerald-500/80 block mt-0.5">Goal successfully achieved in simulation</span>
                                    </div>
                                    <span className="text-[9px] px-2 py-0.5 rounded font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      RESOLVED
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Remaining Gaps */}
                          {whatIfGaps.length > 0 && whatIfGaps[0].feature !== 'none' ? (
                            <div className="space-y-2 pt-2 border-t border-slate-900/40">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Remaining Obstacles</span>
                              {whatIfGaps.map((area, idx) => (
                                <div key={idx} className="bg-slate-900/20 border border-slate-900 rounded-xl p-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-300">{area.label}</span>
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                                      area.priority === 'Critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                      area.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    }`}>
                                      {area.status}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-1">
                                    Simulated: <strong className="text-slate-200">{area.current_value}</strong> — Requires further target adjustment.
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-xl p-5 text-center flex flex-col items-center justify-center min-h-[120px]">
                              <span className="text-xs font-bold text-emerald-450">All Academic Obstacles Cleared!</span>
                              <p className="text-[10px] text-emerald-500/80 mt-1 max-w-xs leading-normal">
                                In this simulated scenario, the student achieves outstanding metrics across all features. No bottleneck areas remain!
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Model Disclaimer box */}
          <div className="rounded-xl border border-slate-850 bg-slate-900/30 p-4 border-l-4 border-l-blue-500 mt-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-300">Simulator Interpretation Guide:</span> Based on the trained model, the predicted score changes by approximately {simulationResult.predicted_change > 0 ? `+${simulationResult.predicted_change.toFixed(2)}` : simulationResult.predicted_change.toFixed(2)} marks under this scenario. <strong>This is a model-based simulation, not a guaranteed exam result.</strong> Predictions represent statistical trends from pre-exam features.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multiple Scenario Comparison Table */}
      {savedScenarios.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-slate-950/40 space-y-4 animate-fade-in">
          <div>
            <h3 className="font-display font-bold text-white text-base">
              Saved Scenarios Comparison
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Compare multiple hypothesis configurations to track potential gains.</p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-900">
            <table className="min-w-full divide-y divide-slate-900 text-xs text-left">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Scenario</th>
                  <th className="py-3 px-4 font-bold text-center">Attendance</th>
                  <th className="py-3 px-4 font-bold text-center">Study Hours</th>
                  <th className="py-3 px-4 font-bold text-center">Assignment</th>
                  <th className="py-3 px-4 font-bold text-center">Internals</th>
                  <th className="py-3 px-4 font-bold text-center">Prediction</th>
                  <th className="py-3 px-4 font-bold text-center">Estimated Change</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300 font-medium">
                {/* Current Baseline Entry */}
                {baselinePrediction !== null && (
                  <tr className="bg-blue-950/5">
                    <td className="py-3.5 px-4 font-semibold text-blue-400">Current baseline</td>
                    <td className="py-3.5 px-4 text-center">{currentData.attendance_pct}%</td>
                    <td className="py-3.5 px-4 text-center">{currentData.study_hours_week} hrs</td>
                    <td className="py-3.5 px-4 text-center">{currentData.assignment_score}</td>
                    <td className="py-3.5 px-4 text-center">{currentData.internal_marks}</td>
                    <td className="py-3.5 px-4 text-center font-bold">{baselinePrediction.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-center text-slate-500">—</td>
                    <td className="py-3.5 px-4 text-right">—</td>
                  </tr>
                )}
                {/* Saved list */}
                {savedScenarios.map((scen) => (
                  <tr key={scen.id} className="hover:bg-slate-900/30">
                    <td className="py-3.5 px-4 font-semibold text-white">{scen.name}</td>
                    <td className="py-3.5 px-4 text-center">{scen.attendance_pct}%</td>
                    <td className="py-3.5 px-4 text-center">{scen.study_hours_week} hrs</td>
                    <td className="py-3.5 px-4 text-center">{scen.assignment_score}</td>
                    <td className="py-3.5 px-4 text-center">{scen.internal_marks}</td>
                    <td className="py-3.5 px-4 text-center font-bold">{scen.prediction.toFixed(2)}</td>
                    <td className={`py-3.5 px-4 text-center font-bold ${
                      scen.change > 0 ? 'text-emerald-400' : scen.change < 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {scen.change > 0 ? `+${scen.change.toFixed(2)}` : scen.change.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteScenario(scen.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-all"
                        title="Delete Scenario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatIf;
