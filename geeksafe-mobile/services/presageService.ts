/**
 * Presage rPPG Simulation Service
 * 
 * Simulates the Presage SmartSpectra SDK's camera-based vital sign extraction.
 * The real SDK uses remote photoplethysmography (rPPG) to detect:
 *   - Heart rate (HR) from subtle facial color changes
 *   - Breathing rate (BR) from chest/face micro-movements
 *   - Heart Rate Variability (HRV SDNN) from pulse intervals
 *   - Stress index from HRV analysis
 * 
 * This service generates realistic physiological values with slight randomization
 * to simulate real-time monitoring. Swap this for native Presage SDK calls when available.
 */

// Baseline ranges for a healthy adult
const BASELINES = {
  heart_rate: { min: 62, max: 88 },
  breathing_rate: { min: 14, max: 20 },
  hrv_sdnn: { min: 35, max: 75 },
  stress_index: { min: 10, max: 40 },
};

// Shift ranges when intoxication is active (simulates substance effects)
const INTOXICATED_SHIFT = {
  heart_rate: { delta: 15, variance: 10 },     // HR rises
  breathing_rate: { delta: -3, variance: 2 },   // BR drops
  hrv_sdnn: { delta: -15, variance: 8 },        // HRV drops
  stress_index: { delta: 20, variance: 12 },    // Stress rises
};

export interface PresageVitals {
  heart_rate: number;
  breathing_rate: number;
  hrv_sdnn: number;
  stress_index: number;
}

let intoxicationActive = false;

/**
 * Enable/disable intoxication simulation.
 * When active, vitals shift to reflect impaired physiological state.
 */
export function setIntoxicationLevel(active: boolean): void {
  intoxicationActive = active;
}

/**
 * Generate a random value within a range.
 */
function randomInRange(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

/**
 * Simulate a single frame analysis from the Presage rPPG engine.
 * In production, this would process a camera frame and return extracted vitals.
 */
export function analyzeFrame(): PresageVitals {
  const base = BASELINES;

  let hr = randomInRange(base.heart_rate.min, base.heart_rate.max);
  let br = randomInRange(base.breathing_rate.min, base.breathing_rate.max);
  let hrv = randomInRange(base.hrv_sdnn.min, base.hrv_sdnn.max);
  let stress = randomInRange(base.stress_index.min, base.stress_index.max);

  if (intoxicationActive) {
    const shift = INTOXICATED_SHIFT;
    hr += shift.heart_rate.delta + randomInRange(-shift.heart_rate.variance, shift.heart_rate.variance);
    br += shift.breathing_rate.delta + randomInRange(-shift.breathing_rate.variance, shift.breathing_rate.variance);
    hrv += shift.hrv_sdnn.delta + randomInRange(-shift.hrv_sdnn.variance, shift.hrv_sdnn.variance);
    stress += shift.stress_index.delta + randomInRange(-shift.stress_index.variance, shift.stress_index.variance);
  }

  // Clamp to physiological limits
  hr = Math.max(40, Math.min(200, hr));
  br = Math.max(6, Math.min(40, br));
  hrv = Math.max(5, Math.min(150, Math.round(hrv * 10) / 10));
  stress = Math.max(0, Math.min(100, stress));

  return { heart_rate: hr, breathing_rate: br, hrv_sdnn: hrv, stress_index: stress };
}
