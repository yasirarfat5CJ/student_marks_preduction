const LAST_PREDICTION_KEY = 'edupredict_last_prediction';

export const lastPredictionStore = {
  get: () => {
    try {
      const raw = localStorage.getItem(LAST_PREDICTION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set: (inputs, prediction) => {
    localStorage.setItem(
      LAST_PREDICTION_KEY,
      JSON.stringify({
        inputs,
        prediction,
        savedAt: new Date().toISOString()
      })
    );
    window.dispatchEvent(new Event('edupredict-last-prediction-change'));
  },
  clear: () => {
    localStorage.removeItem(LAST_PREDICTION_KEY);
    window.dispatchEvent(new Event('edupredict-last-prediction-change'));
  }
};
