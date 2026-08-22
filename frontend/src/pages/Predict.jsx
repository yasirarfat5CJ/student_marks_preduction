import React, { useState } from 'react';
import { PredictionForm } from '../components/PredictionForm';
import { PredictionResult } from '../components/PredictionResult';
import { LoadingState } from '../components/LoadingState';
import { predictionApi } from '../services/predictionApi';
import { lastPredictionStore } from '../utils/predictionState';
import { AlertCircle, FileSpreadsheet } from 'lucide-react';

export const Predict = () => {
  const [loading, setLoading] = useState(false);
  const [predictionData, setPredictionData] = useState(null);
  const [inputValues, setInputValues] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePredictSubmit = async (formData) => {
    setLoading(true);
    setErrorMsg('');
    setPredictionData(null);
    setInputValues(formData);

    const result = await predictionApi.predict(formData);
    
    setLoading(false);
    if (result.success) {
      setPredictionData(result.data);
      lastPredictionStore.set(formData, result.data);
    } else {
      setErrorMsg(result.error?.message || 'Failed to connect to the prediction service.');
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Performance Predictor Engine
        </h1>
        <p className="mt-1.5 text-sm text-slate-400 max-w-2xl leading-relaxed">
          Input student marks, attendance levels, and study statistics to run Gradient Boosting regression and project final exam results.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Prediction Form (Takes 5 columns on lg) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6">
          <PredictionForm onSubmit={handlePredictSubmit} isLoading={loading} />
        </div>

        {/* Right Side: Prediction Results & Explanations (Takes 7 columns on lg) */}
        <div className="lg:col-span-7 min-h-[400px] flex flex-col justify-stretch">
          {errorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Prediction Service Error</h4>
                <p className="text-xs text-rose-300 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex-1 glass-panel rounded-2xl flex items-center justify-center p-8">
              <LoadingState message="Analyzing student performance indicators..." />
            </div>
          )}

          {!loading && !predictionData && !errorMsg && (
            <div className="flex-1 glass-panel rounded-2xl border-dashed border-slate-800 flex flex-col items-center justify-center p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-blue-400 mb-5">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-white text-base">
                Ready for Analysis
              </h3>
              <p className="mt-2 text-xs text-slate-500 max-w-xs leading-relaxed">
                Enter the student's academic information in the form to generate a prediction and explainability report.
              </p>
            </div>
          )}

          {!loading && predictionData && (
            <div className="flex-1">
              <PredictionResult prediction={predictionData} inputs={inputValues} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Predict;
