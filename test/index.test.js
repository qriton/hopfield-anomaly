import {
  HopfieldNetwork,
  HopfieldAnomalyDetector,
  AnomalyMonitor,
  AdaptiveThreshold
} from '../src/index.js';

describe('Library Exports', () => {
  test('exports all classes', () => {
    expect(HopfieldNetwork).toBeDefined();
    expect(HopfieldAnomalyDetector).toBeDefined();
    expect(AnomalyMonitor).toBeDefined();
    expect(AdaptiveThreshold).toBeDefined();
  });
});

describe('HopfieldNetwork', () => {
  test('creates network with correct size', () => {
    const net = new HopfieldNetwork(20);
    expect(net.size).toBe(20);
    expect(net.trained).toBe(false);
  });

  test('weights are symmetric after training', () => {
    const net = new HopfieldNetwork(10);
    net.train([[1, -1, 1, -1, 1, -1, 1, -1, 1, -1]]);
    
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        expect(net._getWeight(i, j)).toBe(net._getWeight(j, i));
      }
    }
  });

  test('diagonal weights are zero', () => {
    const net = new HopfieldNetwork(10);
    net.train([[1, -1, 1, -1, 1, -1, 1, -1, 1, -1]]);
    
    for (let i = 0; i < 10; i++) {
      expect(net._getWeight(i, i)).toBe(0);
    }
  });

  test('energy decreases or stays same during recall', () => {
    const net = new HopfieldNetwork(10);
    net.train([[1, 1, 1, 1, 1, -1, -1, -1, -1, -1]]);
    
    const input = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1];
    const result = net.recall(input);
    const energies = result.energyPath;
    
    for (let i = 1; i < energies.length; i++) {
      expect(energies[i]).toBeLessThanOrEqual(energies[i - 1]);
    }
  });

  test('perfect recall of training pattern', () => {
    const net = new HopfieldNetwork(10, { seed: 12345 });
    const pattern = [1, 1, 1, 1, 1, -1, -1, -1, -1, -1];
    net.train([pattern]);
    
    const result = net.recall(pattern);
    expect(result.state).toEqual(pattern);
    expect(result.iterations).toBe(1);
    expect(result.converged).toBe(true);
  });

  test('JSON serialization roundtrip', () => {
    const net = new HopfieldNetwork(10, { seed: 12345 });
    net.train([[1, -1, 1, -1, 1, -1, 1, -1, 1, -1]]);
    
    const json = net.toJSON();
    const restored = HopfieldNetwork.fromJSON(json);
    
    expect(restored.size).toBe(net.size);
    expect(restored.trained).toBe(net.trained);
    expect(Array.from(restored.weights)).toEqual(Array.from(net.weights));
  });

  test('strictCapacity throws when exceeded', () => {
    const net = new HopfieldNetwork(10, { strictCapacity: true });
    const patterns = Array(20).fill(null).map(() => 
      [1, -1, 1, -1, 1, -1, 1, -1, 1, -1]
    );
    
    expect(() => net.train(patterns)).toThrow();
  });

  test('estimateCapacity without patterns returns theoretical', () => {
    const net = new HopfieldNetwork(100, { learningRule: 'hebbian' });
    const capacity = net.estimateCapacity();
    expect(capacity).toBe(Math.floor(0.138 * 100)); // 13
  });

  test('estimateCapacity with correlated patterns reduces capacity', () => {
    const net = new HopfieldNetwork(100);
    const uncorrelated = [
      Array(100).fill(1).map(() => Math.random() > 0.5 ? 1 : -1),
      Array(100).fill(1).map(() => Math.random() > 0.5 ? 1 : -1)
    ];
    const correlated = [
      Array(100).fill(1),
      Array(100).fill(1)
    ];
    
    const capUncorr = net.estimateCapacity(uncorrelated);
    const capCorr = net.estimateCapacity(correlated);
    
    expect(capCorr).toBeLessThan(capUncorr);
  });

  test('Storkey rule has higher capacity than Hebbian', () => {
    const netHebb = new HopfieldNetwork(100, { learningRule: 'hebbian' });
    const netStork = new HopfieldNetwork(100, { learningRule: 'storkey' });
    
    expect(netStork.estimateCapacity()).toBeGreaterThan(netHebb.estimateCapacity());
  });
});

describe('HopfieldAnomalyDetector', () => {
  test('creates detector with correct parameters', () => {
    const detector = new HopfieldAnomalyDetector({
      featureCount: 3,
      snapshotLength: 5
    });
    
    expect(detector.featureCount).toBe(3);
    expect(detector.snapshotLength).toBe(5);
    expect(detector.patternSize).toBe(15);
  });

  test('z-scores computed from baseline after training', () => {
    const detector = new HopfieldAnomalyDetector({ featureCount: 2 });
    detector.setThresholds({
      a: { mode: 'above', value: 0.5 },
      b: { mode: 'above', value: 0.5 }
    }, ['a', 'b']);
    
    detector.trainWithDefaults();
    
    expect(detector.baseline.energy.mean).toBeDefined();
    expect(detector.baseline.energy.std).toBeGreaterThan(0);
    expect(detector.baseline.hamming.mean).toBeDefined();
    expect(detector.baseline.hamming.std).toBeGreaterThan(0);
  });

  test('configurable score weights', () => {
    const detector = new HopfieldAnomalyDetector({
      featureCount: 2,
      scoreWeights: { energy: 0.5, drop: 0.2, hamming: 0.2, margin: 0.1 }
    });
    
    expect(detector.scoreWeights.energy).toBe(0.5);
    expect(detector.scoreWeights.drop).toBe(0.2);
  });

  test('end-to-end detection with normal data', () => {
    const detector = new HopfieldAnomalyDetector({
      featureCount: 3,
      snapshotLength: 5,
      seed: 12345
    });
    
    detector.setThresholds({
      temp: { mode: 'range', min: 60, max: 80 },
      pressure: { mode: 'range', min: 95, max: 105 },
      vibration: { mode: 'below', value: 50 }
    });
    
    detector.trainWithDefaults();
    
    // Add normal data points
    for (let i = 0; i < 5; i++) {
      detector.addDataPoint({ temp: 70, pressure: 100, vibration: 20 });
    }
    
    const result = detector.detect();
    expect(result).toBeDefined();
    expect(typeof result.anomalyScore).toBe('number');
    expect(result.isAnomaly).toBeDefined();
    expect(result.featureImpact).toBeDefined();
    expect(result.featureImpact.length).toBe(3);
  });

  test('detects anomaly with abnormal data', () => {
    const detector = new HopfieldAnomalyDetector({
      featureCount: 2,
      snapshotLength: 3,
      seed: 12345,
      anomalyThreshold: 0.5
    });
    
    detector.setThresholds({
      a: { mode: 'range', min: 0, max: 1 },
      b: { mode: 'range', min: 0, max: 1 }
    });
    
    // Train with normal patterns
    const normalPattern = Array(6).fill(-1);
    detector.network.train([normalPattern]);
    detector.baseline = {
      energy: { mean: -3, std: 1 },
      drop: { mean: 0, std: 0.1 },
      hamming: { mean: 0, std: 0.1 },
      margin: { mean: 0, std: 0.1 }
    };
    detector.trained = true;
    
    // Add anomalous data
    for (let i = 0; i < 3; i++) {
      detector.addDataPoint({ a: 1, b: 1 }); // All 1s = anomalous
    }
    
    const result = detector.detect();
    expect(result.anomalyScore).toBeGreaterThan(0);
  });

  test('benchmark runs without error', () => {
    const perf = HopfieldAnomalyDetector.benchmark({
      featureCount: 5,
      snapshotLength: 3,
      dataPoints: 100
    });
    
    expect(perf.trainingTime).toBeGreaterThan(0);
    expect(perf.averageDetectLatency).toBeGreaterThan(0);
    expect(perf.throughput).toBeGreaterThan(0);
    expect(perf.memory).toBeDefined();
  });

  test('export and import config', () => {
    const detector = new HopfieldAnomalyDetector({ featureCount: 2 });
    detector.setThresholds({
      a: { mode: 'above', value: 0.5 },
      b: { mode: 'below', value: 0.5 }
    });
    detector.trainWithDefaults();
    
    const config = detector.exportConfig();
    const restored = HopfieldAnomalyDetector.fromConfig(config);
    
    expect(restored.featureCount).toBe(detector.featureCount);
    expect(restored.trained).toBe(detector.trained);
  });

  test('gradient-based feature attribution returns sorted impacts', () => {
    const detector = new HopfieldAnomalyDetector({
      featureCount: 3,
      snapshotLength: 2,
      seed: 12345
    });
    
    detector.setThresholds({
      a: { mode: 'range', min: 0, max: 1 },
      b: { mode: 'range', min: 0, max: 1 },
      c: { mode: 'range', min: 0, max: 1 }
    });
    
    detector.trainWithDefaults();
    
    for (let i = 0; i < 2; i++) {
      detector.addDataPoint({ a: 0.5, b: 0.5, c: 0.5 });
    }
    
    const result = detector.detect();
    expect(result.featureImpact).toBeDefined();
    expect(result.featureImpact.length).toBe(3);
    
    // Check sorted by absolute energyDelta
    for (let i = 1; i < result.featureImpact.length; i++) {
      expect(Math.abs(result.featureImpact[i - 1].energyDelta))
        .toBeGreaterThanOrEqual(Math.abs(result.featureImpact[i].energyDelta));
    }
  });
});

describe('AdaptiveThreshold', () => {
  test('creates threshold with defaults', () => {
    const thresh = new AdaptiveThreshold();
    expect(thresh.threshold).toBe(0.3);
    expect(thresh.windowSize).toBe(100);
    expect(thresh.unsupervised).toBe(true);
  });

  test('unsupervised mode sets to 95th percentile', () => {
    const thresh = new AdaptiveThreshold(0.5, 10, true);
    
    // Add 10 scores
    for (let i = 0; i < 10; i++) {
      thresh.update(i / 10); // 0, 0.1, 0.2, ..., 0.9
    }
    
    // 95th percentile of [0, 0.1, ..., 0.9] should be ~0.85
    expect(thresh.threshold).toBeGreaterThan(0.8);
    expect(thresh.threshold).toBeLessThan(0.95);
  });

  test('supervised mode adjusts on false positives', () => {
    const thresh = new AdaptiveThreshold(0.5, 10, false);
    const initialThreshold = thresh.threshold;
    
    // False positive: score > threshold but not actually anomaly
    thresh.update(0.6, true, false);
    
    expect(thresh.threshold).toBeGreaterThan(initialThreshold);
  });

  test('supervised mode adjusts on false negatives', () => {
    const thresh = new AdaptiveThreshold(0.5, 10, false);
    const initialThreshold = thresh.threshold;
    
    // False negative: score <= threshold but is actually anomaly
    thresh.update(0.4, true, true);
    
    expect(thresh.threshold).toBeLessThan(initialThreshold);
  });

  test('getStats returns percentiles', () => {
    const thresh = new AdaptiveThreshold();
    
    for (let i = 0; i < 100; i++) {
      thresh.update(i / 100);
    }
    
    const stats = thresh.getStats();
    expect(stats.p50).toBeCloseTo(0.5, 1);
    expect(stats.p95).toBeCloseTo(0.95, 1);
    expect(stats.p99).toBeCloseTo(0.99, 1);
  });
});

describe('AnomalyMonitor', () => {
  test('creates monitor with config', () => {
    const monitor = new AnomalyMonitor({ featureCount: 3 });
    expect(monitor.detector).toBeDefined();
    expect(monitor.detector.featureCount).toBe(3);
  });

  test('event callbacks trigger correctly', () => {
    const monitor = new AnomalyMonitor({
      featureCount: 2,
      snapshotLength: 2,
      seed: 12345
    });
    
    monitor.setThresholds({
      a: { mode: 'range', min: 0, max: 1 },
      b: { mode: 'range', min: 0, max: 1 }
    });
    
    monitor.trainWithDefaults();
    
    let anomalyFired = false;
    let dataFired = false;
    
    monitor.on('onAnomaly', () => { anomalyFired = true; });
    monitor.on('onData', () => { dataFired = true; });
    
    monitor.process({ a: 0.5, b: 0.5 });
    
    expect(dataFired).toBe(true);
  });

  test('fluent interface works', () => {
    const monitor = new AnomalyMonitor({ featureCount: 2 });
    
    const result = monitor
      .setThresholds({ a: { mode: 'above', value: 0.5 }, b: { mode: 'below', value: 0.5 } })
      .trainWithDefaults();
    
    expect(result).toBe(monitor);
  });

  test('export and import monitor config', () => {
    const monitor = new AnomalyMonitor({ featureCount: 2 });
    monitor.setThresholds({
      a: { mode: 'above', value: 0.5 },
      b: { mode: 'below', value: 0.5 }
    });
    monitor.trainWithDefaults();
    
    const config = monitor.exportConfig();
    const restored = AnomalyMonitor.fromConfig(config);
    
    expect(restored.detector.featureCount).toBe(2);
    expect(restored.detector.trained).toBe(true);
  });
});