# @qriton/hopfield-anomaly

**Qriton's Production-ready Hopfield Neural Network for real-time anomaly detection with adaptive thresholds and energy-based scoring.**

---

## 🚀 Features

✅ **Seeded RNG** — Reproducible debugging  
✅ **Convergence Tracking** — Energy path analysis  
✅ **Adaptive Thresholds** — Auto-tuning detection  
✅ **Normalized Hebbian** — Correct implementation  
✅ **Storkey Learning** — Higher capacity networks  
✅ **Energy-Based Scoring** — Physics-grounded anomalies  

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
console.log(result.isAnomaly);      // false
console.log(result.anomalyScore);   // 0.245
console.log(result.confidence);     // 0.055
```

---

## 🧠 API Reference

### HopfieldAnomalyDetector

#### Constructor Options
```js
{
  featureCount: number,        // Required: number of features to monitor
  snapshotLength: 5,           // Time window size
  anomalyThreshold: 0.3,       // Detection threshold
  maxIterations: 10,           // Recall convergence limit
  learningRule: 'hebbian',     // 'hebbian' or 'storkey'
  adaptiveThreshold: true,     // Enable auto-tuning
  seed: null                   // RNG seed for reproducibility
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
  anomalyScore: number,
  confidence: number,
  timestamp: string,
  snapshot: number[],
  recalledPattern: number[],
  contributingFeatures: [
    { name: string, index: number, activation: number, pattern: number[] }
  ],
  energy: number,
  metrics: {
    energyInput: number,
    energyRecalled: number,
    energyDrop: number,
    hammingDistance: number,
    relativeHamming: number,
    margin: number
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

### Custom Learning Rules
```js
// Hebbian (default)
const detector1 = new HopfieldAnomalyDetector({ featureCount: 3, learningRule: 'hebbian' });

// Storkey (higher capacity)
const detector2 = new HopfieldAnomalyDetector({ featureCount: 3, learningRule: 'storkey' });
```

### Adaptive Threshold Tuning
```js
// Manual feedback for labeled data
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
  res.json(ready ? detector.detect() : { status: 'buffering' });
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

Client:
```js
const socket = io('http://localhost:3000');
socket.emit('metrics', { temp: 70, pressure: 100, vibration: 20 });
socket.on('detection', result => console.log('Detection:', result));
```

---

### Example 3: Batch Processing CSV
```js
const fs = require('fs');
const csv = require('csv-parser');
const { HopfieldAnomalyDetector } = require('@qriton/hopfield-anomaly');

const detector = new HopfieldAnomalyDetector({ featureCount: 3, snapshotLength: 5 });
detector.setThresholds({
  temp: { mode: 'range', min: 60, max: 80 },
  pressure: { mode: 'range', min: 95, max: 105 },
  vibration: { mode: 'below', value: 50 }
});
detector.train({ useDefaults: true });

fs.createReadStream('data.csv')
  .pipe(csv())
  .on('data', row => {
    detector.addDataPoint({
      temp: +row.temp,
      pressure: +row.pressure,
      vibration: +row.vibration
    });
    const result = detector.detect();
    if (result) console.log(result);
  });
```

---

### Example 4: System Metrics Monitoring
```js
const os = require('os');
const { AnomalyMonitor } = require('@qriton/hopfield-anomaly');

const monitor = new AnomalyMonitor({
  featureCount: 3,
  snapshotLength: 5,
  adaptiveThreshold: true
});

monitor.setThresholds({
  cpu: { mode: 'above', value: 80 },
  memory: { mode: 'above', value: 75 },
  load: { mode: 'above', value: 2 }
});
monitor.train({ useDefaults: true });

setInterval(() => {
  const cpu = os.loadavg()[0] * 100 / os.cpus().length;
  const memory = (1 - os.freemem() / os.totalmem()) * 100;
  const load = os.loadavg()[0];

  const result = monitor.process({ cpu, memory, load });
  if (result && result.isAnomaly) console.log('⚠️ System anomaly!', result.anomalyScore);
}, 5000);
```

---

### Example 5: Financial Market Monitoring
```js
const axios = require('axios');
const { HopfieldAnomalyDetector } = require('@qriton/hopfield-anomaly');

const detector = new HopfieldAnomalyDetector({ featureCount: 3, snapshotLength: 5, learningRule: 'storkey' });
detector.setThresholds({
  priceChange: { mode: 'above', value: 5 },
  volumeSpike: { mode: 'above', value: 20 },
  volatility: { mode: 'above', value: 10 }
});
detector.train({ useDefaults: true });

async function monitorStock(symbol) {
  const { data } = await axios.get(`https://api.example.com/stock/${symbol}`);
  detector.addDataPoint(data);
  const result = detector.detect();
  if (result?.isAnomaly) console.log(`⚠️ Anomaly in ${symbol}:`, result.anomalyScore);
}
setInterval(() => monitorStock('AAPL'), 60000);
```

---

## 🧩 Use Cases

- IoT sensor monitoring  
- Network security & intrusion detection  
- Server & process health monitoring  
- Financial time-series anomaly detection  
- Manufacturing & quality control  

---

## 🧬 How It Works

Hopfield networks store patterns as **energy minima**.  
Normal data converges to stable, low-energy states, while anomalies result in unstable or high-energy configurations.

1. Features → binarized via thresholds  
2. Sliding window builds snapshot pattern  
3. Hopfield recall stabilizes toward known states  
4. Energy, margin, and Hamming distance compute anomaly score  
5. Threshold adapts dynamically based on streaming data  

---

## 📄 License

**MIT © Qriton**

---

## 🤝 Contributing

Pull requests and issues welcome!  
Open at **[GitHub Repository URL](https://github.com/qriton/hopfield-anomaly)**
