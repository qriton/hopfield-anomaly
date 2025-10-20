# @qriton/hopfield-anomaly

**Qriton's Production-ready Hopfield Neural Network for real-time anomaly detection with adaptive thresholds and energy-based scoring.**

[![npm version](https://img.shields.io/npm/v/@qriton/hopfield-anomaly)](https://www.npmjs.com/package/@qriton/hopfield-anomaly)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@qriton/hopfield-anomaly)](https://nodejs.org)

---

## 🚀 Features

✅ **Z-Score Normalization** — Statistically grounded anomaly scoring  
✅ **Configurable Weights** — Tune detection for your domain  
✅ **Gradient-Based Attribution** — Identify root cause features (O(N²) optimized)  
✅ **Adaptive Thresholds** — Unsupervised auto-tuning (95th percentile)  
✅ **Correlation-Aware Capacity** — Prevents spurious attractors  
✅ **Seeded RNG** — Reproducible debugging  
✅ **Convergence Tracking** — Energy path analysis  
✅ **Storkey Learning** — Higher capacity networks  
✅ **Built-in Benchmarking** — Performance profiling  

---

## 📦 Installation
```bash
npm install @qriton/hopfield-anomaly
```

---

## ⚡ Quick Start
```js
const { HopfieldAnomalyDetector } = require('@qriton/hopfield-anomaly');

// Initialize detector
const detector = new HopfieldAnomalyDetector({
  featureCount: 3,
  snapshotLength: 5,
  anomalyThreshold: 0.3,
  learningRule: 'storkey',
  scoreWeights: { energy: 0.25, drop: 0.25, hamming: 0.25, margin: 0.25 },
  seed: 12345
});

// Define thresholds
detector.setThresholds({
  temperature: { mode: 'range', min: 60, max: 80 },
  pressure: { mode: 'range', min: 95, max: 105 },
  vibration: { mode: 'below', value: 50 }
});

// Train network
detector.train({ useDefaults: true });

// Process data points
for (let i = 0; i < 5; i++) {
  detector.addDataPoint({ temperature: 70, pressure: 100, vibration: 20 });
}

// Detect anomalies
const result = detector.detect();
console.log(result.isAnomaly);           // false
console.log(result.anomalyScore);        // 0.245
console.log(result.confidence);          // 0.055
console.log(result.featureImpact[0]);    // { name: 'temperature', energyDelta: -0.123 }
```

---

## 📊 Performance Characteristics

| Network Size (N) | Memory | Recall Latency | Training Time |
|------------------|--------|----------------|---------------|
| 100 neurons      | ~80KB  | ~0.5ms         | ~10ms         |
| 500 neurons      | ~2MB   | ~15ms          | ~200ms        |
| 1000 neurons     | ~8MB   | ~80ms          | ~1.5s         |

*Tested on Node.js v18, Intel i7-9700K*

**Run your own benchmarks:**
```bash
npm run benchmark
```

---

## 🧠 API Reference

### HopfieldAnomalyDetector

#### Constructor Options
```js
{
  featureCount: number,                 // Required: number of features to monitor
  snapshotLength: 5,                    // Time window size
  anomalyThreshold: 0.3,                // Detection threshold
  maxIterations: 10,                    // Recall convergence limit
  learningRule: 'hebbian',              // 'hebbian' or 'storkey'
  adaptiveThreshold: true,              // Enable auto-tuning
  unsupervisedAdaptive: true,           // Use percentile (true) or labeled feedback (false)
  scoreWeights: {                       // Configurable scoring weights
    energy: 0.25,
    drop: 0.25,
    hamming: 0.25,
    margin: 0.25
  },
  strictCapacity: false,                // Throw error if capacity exceeded
  seed: null                            // RNG seed for reproducibility
}
```

#### Methods

**setThresholds(thresholds, featureNames?)**
```js
detector.setThresholds({
  temp: { mode: 'range', min: 60, max: 80 },
  status: { mode: 'equal', value: 1 },
  cpu: { mode: 'below', value: 80 },
  memory: { mode: 'above', value: 1000 }
});
```

**train(options?)**
```js
// Auto-generate patterns
detector.train({ useDefaults: true });

// Custom patterns
detector.train({ 
  patterns: [
    [-1, -1, 1, 1, -1],
    [1, -1, -1, 1, 1]
  ]
});
```

**trainWithDefaults()** *(New in v3.2.0)*
```js
// Explicit method for default training
detector.trainWithDefaults();
```

**addDataPoint(features)**
```js
const ready = detector.addDataPoint({ temp: 70, status: 1, cpu: 45, memory: 2048 });
// Returns true when buffer is full
```

**detect()**
```js
const result = detector.detect();
// Returns null if buffer not full
// Otherwise returns detection result
```

**getStats()**
```js
const stats = detector.getStats();
console.log(stats.anomaliesDetected);
console.log(stats.anomalyRate);
console.log(stats.baseline);              // Z-score baselines (v3.2.0+)
console.log(stats.thresholdStats);        // Adaptive threshold stats
```

**static benchmark(config)** *(New in v3.3.0)*
```js
const perf = HopfieldAnomalyDetector.benchmark({
  featureCount: 10,
  snapshotLength: 5,
  dataPoints: 1000
});
console.log(perf.averageDetectLatency);   // ms
console.log(perf.throughput);             // points/sec
```

**exportConfig() / fromConfig(config)**
```js
const config = detector.exportConfig();
const restored = HopfieldAnomalyDetector.fromConfig(config);
```

---

### Detection Result Structure
```js
{
  isAnomaly: boolean,
  anomalyScore: number,                  // Z-score based (v3.2.0+)
  confidence: number,
  timestamp: string,
  snapshot: number[],
  recalledPattern: number[],
  
  contributingFeatures: [                // Legacy (activation-based)
    { name: string, index: number, activation: number, pattern: number[] }
  ],
  
  featureImpact: [                       // NEW in v3.2.0 (gradient-based)
    { name: string, index: number, energyDelta: number }
  ],
  
  energy: number,
  metrics: {
    energyInput: number,
    energyRecalled: number,
    energyDrop: number,
    hammingDistance: number,
    relativeHamming: number,
    margin: number,
    zEnergy: number,                     // NEW in v3.2.0
    zDrop: number,                       // NEW in v3.2.0
    zHamming: number,                    // NEW in v3.2.0
    zMargin: number                      // NEW in v3.2.0
  },
  convergence: {
    iterations: number,
    energyPath: number[],
    converged: boolean
  }
}
```

---

## ⚙️ Advanced Usage

### High-Level Monitor API
```js
const { AnomalyMonitor } = require('@qriton/hopfield-anomaly');

const monitor = new AnomalyMonitor({ featureCount: 3 })
  .setThresholds({
    temp: { mode: 'range', min: 60, max: 80 },
    pressure: { mode: 'range', min: 95, max: 105 },
    vibration: { mode: 'below', value: 50 }
  })
  .train({ useDefaults: true })
  .on('onAnomaly', (result) => console.log('⚠️ Anomaly:', result.anomalyScore))
  .on('onNormal', (result) => console.log('✅ Normal:', result.anomalyScore));

// Stream metrics
monitor.process({ temp: 70, pressure: 100, vibration: 20 });
```

### Custom Scoring Weights *(New in v3.3.0)*
```js
const detector = new HopfieldAnomalyDetector({
  featureCount: 3,
  scoreWeights: {
    energy: 0.4,      // Emphasize energy deviation
    drop: 0.2,
    hamming: 0.3,
    margin: 0.1
  }
});
```

### Strict Capacity Mode *(New in v3.3.0)*
```js
const detector = new HopfieldAnomalyDetector({
  featureCount: 3,
  learningRule: 'hebbian',
  strictCapacity: true    // Throws error if pattern count exceeds capacity
});

try {
  detector.network.train(tooManyPatterns);
} catch (err) {
  console.error('Capacity exceeded:', err.message);
}
```

### Custom Learning Rules
```js
// Hebbian (default) - Capacity: ~0.138 * N
const detector1 = new HopfieldAnomalyDetector({ featureCount: 3, learningRule: 'hebbian' });

// Storkey (higher capacity) - Capacity: ~0.25 * N
const detector2 = new HopfieldAnomalyDetector({ featureCount: 3, learningRule: 'storkey' });
```

### Adaptive Threshold Tuning
```js
// Unsupervised mode (default) - automatically sets to 95th percentile
const detector = new HopfieldAnomalyDetector({
  featureCount: 3,
  adaptiveThreshold: true,
  unsupervisedAdaptive: true
});

// Supervised mode - manual feedback for labeled data
detector.adaptiveThreshold.update(
  0.45,  // anomaly score
  true,  // labeled data
  true   // actually an anomaly
);
```

---

## 💻 Integration Examples

### Example 1: Express.js API
```js
const express = require('express');
const { HopfieldAnomalyDetector } = require('@qriton/hopfield-anomaly');

const app = express();
app.use(express.json());

const detector = new HopfieldAnomalyDetector({
  featureCount: 4,
  snapshotLength: 5,
  learningRule: 'storkey',
  adaptiveThreshold: true
});

detector.setThresholds({
  cpu: { mode: 'above', value: 80 },
  memory: { mode: 'above', value: 75 },
  disk: { mode: 'above', value: 90 },
  network: { mode: 'above', value: 1000 }
});
detector.train({ useDefaults: true });

app.post('/detect', (req, res) => {
  const ready = detector.addDataPoint(req.body);
  if (ready) {
    const result = detector.detect();
    res.json({
      ...result,
      topFeature: result.featureImpact[0].name  // Root cause
    });
  } else {
    res.json({ status: 'buffering' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

---

### Example 2: Real-Time Streaming (WebSockets)
```js
const http = require('http');
const socketIo = require('socket.io');
const { AnomalyMonitor } = require('@qriton/hopfield-anomaly');

const server = http.createServer();
const io = socketIo(server);

const monitor = new AnomalyMonitor({ featureCount: 3, snapshotLength: 5, learningRule: 'hebbian', seed: 42 });
monitor.setThresholds({
  temp: { mode: 'range', min: 60, max: 80 },
  pressure: { mode: 'range', min: 95, max: 105 },
  vibration: { mode: 'below', value: 50 }
});
monitor.train({ useDefaults: true });

io.on('connection', socket => {
  socket.on('metrics', data => {
    const result = monitor.process(data);
    if (result) socket.emit('detection', result);
  });
});
server.listen(3000, () => console.log('WebSocket server on port 3000'));
```

---

## 🧩 Use Cases

- ✅ IoT sensor monitoring  
- ✅ Network security & intrusion detection  
- ✅ Server & process health monitoring  
- ✅ Financial time-series anomaly detection  
- ✅ Manufacturing & quality control  
- ✅ Application performance monitoring (APM)
- ✅ Threshold-based binary monitoring

---

## 🧬 How It Works

Hopfield networks store patterns as **energy minima** in a recurrent neural network.  
Normal data converges to stable, low-energy states, while anomalies result in unstable or high-energy configurations.

### Detection Pipeline

1. **Binarization**: Features → binary patterns via thresholds  
2. **Snapshot**: Sliding window builds temporal pattern  
3. **Recall**: Hopfield network stabilizes toward learned attractors  
4. **Scoring**: Z-scored energy, margin, and Hamming distance  
5. **Attribution**: Gradient-based feature impact (O(N²) optimized)  
6. **Adaptation**: Threshold adjusts to 95th percentile

### Key Advantages

- 🧠 **Interpretable**: Energy landscape reveals "why" (not just "what")
- 🎯 **Deterministic**: Seeded RNG ensures reproducibility
- ⚡ **Fast**: O(N²) recall + O(N²+MN) attribution
- 📊 **Statistical**: Z-score normalization prevents scale issues
- 🔧 **Configurable**: Tune weights for your domain

---

## 📈 Changelog

### v3.4.0 (2025-01-20)
**Added:**
- Pattern correlation-aware capacity estimation (`estimateCapacity()`)
- Inline test templates in documentation
- Performance table in README
- Enhanced capacity warnings with correlation adjustment

**Changed:**
- Capacity checks now account for pattern correlation
- Improved error messages with suggested network sizes

---

### v3.3.0 (2025-01-20)
**Added:**
- Configurable score weights (`scoreWeights` option)
- Full z-score normalization for all metrics (energy, drop, hamming, margin)
- Optimized gradient-based feature attribution (O(N²+MN) instead of O(M×N²))
- Static `benchmark()` method for performance profiling
- `strictCapacity` mode for hard capacity enforcement
- Baseline statistics tracking for all metrics

**Changed:**
- Anomaly score formula now uses z-scores across all components
- Default score weights changed to equal (0.25 each)
- Feature impact computation 100× faster via analytical gradients

**Fixed:**
- Scale sensitivity issues with different network sizes
- Energy normalization now dimensionally correct

---

### v3.2.0 (2025-01-20)
**Added:**
- Unsupervised adaptive threshold (95th percentile mode)
- Baseline energy statistics with z-score integration
- Gradient-based feature attribution (`featureImpact`)
- `trainWithDefaults()` explicit method
- Z-score metrics in detection results

**Changed:**
- Adaptive threshold now works without labeled data
- Feature attribution shows causal contribution (not just activation)

**Deprecated:**
- `contributingFeatures` (legacy, activation-based) - use `featureImpact` instead

---

### v3.1.0 (Initial Release)
**Features:**
- Hebbian and Storkey learning rules
- Seeded RNG for reproducibility
- Convergence tracking with energy paths
- Semi-supervised adaptive thresholds
- Event-driven monitoring (AnomalyMonitor)
- JSON export/import for model persistence

---

## 🔬 Capacity Guidelines

| Learning Rule | Capacity Formula | 100 Neurons | 500 Neurons | 1000 Neurons |
|---------------|------------------|-------------|-------------|--------------|
| **Hebbian**   | ~0.138 × N       | 13 patterns | 69 patterns | 138 patterns |
| **Storkey**   | ~0.25 × N        | 25 patterns | 125 patterns| 250 patterns |

⚠️ **Warning:** Exceeding capacity causes spurious attractors and false positives.  
💡 **Tip:** Use `strictCapacity: true` to enforce hard limits.  
📊 **Note:** Real capacity is lower for correlated patterns (automatically adjusted in v3.4.0+).

---

## ⚠️ When NOT to Use

This library is optimized for **discrete/binary threshold-based monitoring**.  
Consider alternatives for:

- ❌ High-dimensional continuous data → Use Isolation Forest or Autoencoders
- ❌ Sub-millisecond latency requirements → Pre-compute or use simpler methods
- ❌ Online learning → Hopfield requires batch training
- ❌ > 1000 features → Memory footprint becomes prohibitive (O(N²))
- ❌ Image/video anomalies → Use CNNs or VAEs

---

## 🧪 Testing
```bash
# Run full test suite
npm test

# Run with coverage
npm run test:coverage

# Run benchmarks
npm run benchmark
```

---

## 📄 License

**MIT © Qriton**

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Issues:** [GitHub Issues](https://github.com/qriton/hopfield-anomaly/issues)  
**Discussions:** [GitHub Discussions](https://github.com/qriton/hopfield-anomaly/discussions)

---

## 🔗 Links

- **npm Package:** https://www.npmjs.com/package/@qriton/hopfield-anomaly
- **GitHub Repository:** https://github.com/qriton/hopfield-anomaly
- **Documentation:** [See API Reference above]
- **Report Issues:** https://github.com/qriton/hopfield-anomaly/issues

---

## 🙏 Acknowledgments

Based on:
- Hopfield, J.J. (1982). "Neural networks and physical systems with emergent collective computational abilities"
- Amit, D.J., Gutfreund, H., Sompolinsky, H. (1985). "Storing infinite numbers of patterns in a spin-glass model"
- Storkey, A. (1998). "Increasing the capacity of a Hopfield network without sacrificing functionality"

---

**Built with ❤️ by Qriton**