// demo/iot-monitoring.js
// Real-world scenario: Industrial IoT sensor anomaly detection
// Monitors temperature, pressure, and vibration from factory equipment

import { AnomalyMonitor } from '../src/index.js';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

console.log(`${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║     Industrial IoT Sensor Anomaly Detection Demo          ║
║     Monitoring: Temperature, Pressure, Vibration          ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}\n`);

// Initialize the anomaly detector
const monitor = new AnomalyMonitor({
  featureCount: 3,
  snapshotLength: 5,
  learningRule: 'storkey',
  adaptiveThreshold: true,
  unsupervisedAdaptive: true,
  scoreWeights: {
    energy: 0.3,    // Emphasize overall pattern deviation
    drop: 0.2,      // Failed energy descent (stuck in wrong state)
    hamming: 0.3,   // Pattern distance
    margin: 0.2     // Confidence in current state
  },
  seed: 42 // Reproducible results
});

// Define normal operating thresholds for industrial equipment
monitor.setThresholds({
  temperature: { mode: 'range', min: 60, max: 80 },  // °F
  pressure: { mode: 'range', min: 95, max: 105 },    // PSI
  vibration: { mode: 'below', value: 50 }            // Hz
}, ['temperature', 'pressure', 'vibration']);

// Train with default patterns (normal vs anomaly)
console.log(`${colors.blue}[TRAINING]${colors.reset} Training Hopfield network...`);
monitor.trainWithDefaults();
console.log(`${colors.green}✓ Training complete${colors.reset}\n`);

// Statistics tracking
let totalReadings = 0;
let normalReadings = 0;
let anomalyCount = 0;

// Event handlers
monitor.on('onAnomaly', (result, features) => {
  anomalyCount++;
  console.log(`${colors.red}${colors.bold}⚠ ANOMALY DETECTED!${colors.reset}`);
  console.log(`${colors.red}  Timestamp: ${result.timestamp}${colors.reset}`);
  console.log(`${colors.red}  Score: ${result.anomalyScore.toFixed(3)} (threshold: ${result.confidence.toFixed(3)})${colors.reset}`);
  console.log(`${colors.yellow}  Root Cause: ${result.featureImpact[0].name} (ΔE: ${result.featureImpact[0].energyDelta.toFixed(3)})${colors.reset}`);
  console.log(`${colors.yellow}  Readings: T=${features.temperature}°F, P=${features.pressure}PSI, V=${features.vibration}Hz${colors.reset}`);
  console.log(`${colors.magenta}  Energy: ${result.energy.toFixed(2)} | Converged: ${result.convergence.converged} (${result.convergence.iterations} iter)${colors.reset}\n`);
});

monitor.on('onNormal', (result, features) => {
  normalReadings++;
  console.log(`${colors.green}✓ Normal operation${colors.reset} - Score: ${result.anomalyScore.toFixed(3)}`);
});

// Simulate real-time sensor data
console.log(`${colors.cyan}[SIMULATION]${colors.reset} Starting real-time monitoring...\n`);

const scenarios = [
  // Phase 1: Normal operation
  { phase: 'Normal Operation', duration: 10, generator: generateNormalData },
  
  // Phase 2: Temperature spike (gradual failure)
  { phase: 'Temperature Spike', duration: 8, generator: generateTempSpike },
  
  // Phase 3: Return to normal
  { phase: 'Recovery', duration: 5, generator: generateNormalData },
  
  // Phase 4: Pressure drop (sudden failure)
  { phase: 'Pressure Drop', duration: 5, generator: generatePressureDrop },
  
  // Phase 5: Normal again
  { phase: 'Normal Operation', duration: 5, generator: generateNormalData },
  
  // Phase 6: Excessive vibration (mechanical issue)
  { phase: 'Excessive Vibration', duration: 8, generator: generateVibrationSpike },
  
  // Phase 7: Final normal
  { phase: 'Final Check', duration: 5, generator: generateNormalData }
];

let currentScenario = 0;
let scenarioStep = 0;

const interval = setInterval(() => {
  if (currentScenario >= scenarios.length) {
    clearInterval(interval);
    printSummary();
    return;
  }
  
  const scenario = scenarios[currentScenario];
  
  // Print phase header
  if (scenarioStep === 0) {
    console.log(`\n${colors.bold}${colors.cyan}═══ Phase ${currentScenario + 1}: ${scenario.phase} ═══${colors.reset}\n`);
  }
  
  // Generate sensor reading
  const reading = scenario.generator(scenarioStep, scenario.duration);
  totalReadings++;
  
  // Process through anomaly detector
  const result = monitor.process(reading);
  
  scenarioStep++;
  
  // Move to next scenario
  if (scenarioStep >= scenario.duration) {
    scenarioStep = 0;
    currentScenario++;
  }
}, 500); // 500ms between readings (2 readings/sec)

// Data generators for different scenarios
function generateNormalData() {
  return {
    temperature: 70 + (Math.random() - 0.5) * 4,  // 68-72°F
    pressure: 100 + (Math.random() - 0.5) * 4,    // 98-102 PSI
    vibration: 20 + (Math.random() - 0.5) * 6     // 17-23 Hz
  };
}

function generateTempSpike(step, duration) {
  const base = generateNormalData();
  // Gradual temperature increase
  const tempIncrease = (step / duration) * 25; // Rise to 95°F
  base.temperature = 70 + tempIncrease;
  return base;
}

function generatePressureDrop(step, duration) {
  const base = generateNormalData();
  // Sudden pressure drop
  if (step > 2) {
    base.pressure = 85 + Math.random() * 5; // Drop to 85-90 PSI
  }
  return base;
}

function generateVibrationSpike(step, duration) {
  const base = generateNormalData();
  // Oscillating high vibration
  base.vibration = 55 + Math.sin(step) * 10; // 45-65 Hz
  return base;
}

function printSummary() {
  const stats = monitor.getStats();
  
  console.log(`\n${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║                    MONITORING SUMMARY                      ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  console.log(`${colors.bold}Statistics:${colors.reset}`);
  console.log(`  Total readings processed: ${totalReadings}`);
  console.log(`  Normal operations: ${colors.green}${normalReadings}${colors.reset}`);
  console.log(`  Anomalies detected: ${colors.red}${anomalyCount}${colors.reset}`);
  console.log(`  Anomaly rate: ${colors.yellow}${stats.anomalyRate.toFixed(2)}%${colors.reset}`);
  
  console.log(`\n${colors.bold}Network Performance:${colors.reset}`);
  console.log(`  Network size: ${stats.networkInfo.size} neurons`);
  console.log(`  Learning rule: ${stats.networkInfo.learningRule}`);
  console.log(`  Capacity: ${stats.networkInfo.capacity} patterns`);
  
  console.log(`\n${colors.bold}Adaptive Threshold:${colors.reset}`);
  const threshStats = stats.thresholdStats;
  console.log(`  Current threshold: ${threshStats.threshold.toFixed(3)}`);
  console.log(`  Score distribution: p50=${threshStats.p50?.toFixed(3)}, p95=${threshStats.p95?.toFixed(3)}, p99=${threshStats.p99?.toFixed(3)}`);
  
  console.log(`\n${colors.bold}Baseline Statistics:${colors.reset}`);
  console.log(`  Energy: μ=${stats.baseline.energy.mean.toFixed(2)}, σ=${stats.baseline.energy.std.toFixed(2)}`);
  console.log(`  Hamming: μ=${stats.baseline.hamming.mean.toFixed(3)}, σ=${stats.baseline.hamming.std.toFixed(3)}`);
  
  console.log(`\n${colors.green}${colors.bold}✓ Monitoring complete!${colors.reset}\n`);
  
  // Exit cleanly
  process.exit(0);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down monitoring...');
  printSummary();
});