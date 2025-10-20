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

describe('HopfieldNetwork - Edge Cases', () => {
  test('throws error for invalid size', () => {
    expect(() => new HopfieldNetwork(0)).toThrow('Network size must be a positive integer');
    expect(() => new HopfieldNetwork(-5)).toThrow('Network size must be a positive integer');
    expect(() => new HopfieldNetwork(1.5)).toThrow('Network size must be a positive integer');
  });

  test('throws error for invalid pattern array', () => {
    const net = new HopfieldNetwork(10);
    expect(() => net.train(null)).toThrow('Patterns must be a non-empty array');
    expect(() => net.train([])).toThrow('Patterns must be a non-empty array');
  });

  test('throws error for wrong pattern size', () => {
    const net = new HopfieldNetwork(10);
    expect(() => net.train([[1, -1, 1]])).toThrow('Pattern 0 must be an array of size 10');
  });

  test('throws error for invalid pattern values', () => {
    const net = new HopfieldNetwork(10);
    expect(() => net.train([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]])).toThrow('Pattern 0 must contain only -1 or 1 values');
  });

  test('throws error for unknown learning rule', () => {
    const net = new HopfieldNetwork(10, { learningRule: 'invalid' });
    expect(() => net.train([[1, -1, 1, -1, 1, -1, 1, -1, 1, -1]])).toThrow('Unknown learning rule: invalid');
  });

  test('throws error when recall before training', () => {
    const net = new HopfieldNetwork(10);
    expect(() => net.recall([1, -1, 1, -1, 1, -1, 1, -1, 1, -1])).toThrow('Network must be trained before recall');
  });

  test('throws error for wrong input size in recall', () => {
    const net = new HopfieldNetwork(10);
    net.train([[1, -1, 1, -1, 1, -1, 1, -1, 1, -1]]);
    expect(() => net.recall([1, -1, 1])).toThrow('Input must be an array of size 10');
  });

  test('recall does not converge within max iterations', () => {
    const net = new HopfieldNetwork(10, { seed: 12345 });
    net.train([[1, 1, 1, 1, 1, -1, -1, -1, -1, -1]]);
    const result = net.recall([1, -1, 1, -1, 1, -1, 1, -1, 1, -1], 1);
    expect(result.converged).toBe(false);
    expect(result.iterations).toBe(1);
  });

  test('Storkey learning rule trains correctly', () => {
    const net = new HopfieldNetwork(10, { learningRule: 'storkey' });
    net.train([[1, -1, 1, -1, 1, -1, 1, -1, 1, -1]]);
    expect(net.trained).toBe(true);
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

describe('HopfieldAnomalyDetector - Edge Cases', () => {
  test('throws error for invalid featureCount', () => {
    expect(() => new HopfieldAnomalyDetector({ featureCount: 0 })).toThrow('featureCount must be a positive integer');
    expect(() => new HopfieldAnomalyDetector({ featureCount: -1 })).toThrow('featureCount must be a positive integer');
    expect(() => new HopfieldAnomalyDetector({ featureCount: 1.5 })).toThrow('featureCount must be a positive integer');
  });

  test('throws error for wrong threshold count', () => {
    const detector = new HopfieldAnomalyDetector({ featureCount: 3 });
    expect(() => detector.setThresholds({ a: { mode: 'above', value: 5 } })).toThrow('Expected 3 thresholds, got 1');
  });

  test('throws error for missing threshold mode', () => {
    const detector = new HopfieldAnomalyDetector({ featureCount: 1 });
    expect(() => detector.setThresholds({ a: { value: 5 } })).toThrow("Threshold for 'a' missing mode");
  });

  test('throws error for invalid threshold mode', () => {
    const detector = new HopfieldAnomalyDetector({ featureCount: 1 });
    expect(() => detector.setThresholds({ a: { mode: 'invalid', value: 5 } })).toThrow("Invalid mode 'invalid' for 'a'");
  });

  test('throws error for range mode without min/max', () => {
    const detector = new HopfieldAnomalyDetector({ featureCount: 1 });
    expect(() => detector.setThresholds({ a: { mode: 'range', value: 5 } })).toThrow("Range mode for 'a' requires min and max");
  });

  test('throws error for missing value in non-range mode', () => {
    const detector = new HopfieldAnomalyDetector({ featureCount: 1 });
    expect(() => detector.setThresholds({ a: { mode: 'above' } })).toThrow("Threshold for 'a' missing value");
  });

  test('throws error when training without thresholds', () => {
    const detector = new HopfieldAnomalyDetector({ featureCount: 2 });
    expect(() => detector.train()).toThrow('Thresholds must be set before training');
  });

  test('throws error when training without patterns and useDefaults=false', () => {
    const detector = new HopfieldAnomalyDetector({ featureCount: 2 });
    detector.setThresholds({ a: { mode: 'above', value: 5 }, b: { mode: 'below', value: 10 } });
    expect(() => detector.train({ useDefaults: false })).toThrow('No training patterns provided');
  });

  test('throws error when detecting before training', () => {
    const detector = new HopfieldAnomalyDetector({ featureCount: 2 });
    detector.setThresholds({ a: { mode: 'above', value: 5 }, b: { mode: 'below', value: 10 } });
    detector.addDataPoint({ a: 3, b: 12 });
    detector.addDataPoint({ a: 4, b: 11 });
    expect(() => detector.detect()).toThrow('Network not trained. Call train() first.');
  });

  test('detect returns null when buffer not full', () => {
    const detector = new HopfieldAnomalyDetector({ featureCount: 2, snapshotLength: 5 });
    detector.setThresholds({ a: { mode: 'above', value: 5 }, b: { mode: 'below', value: 10 } });
    detector.trainWithDefaults();
    detector.addDataPoint({ a: 3, b: 12 });
    const result = detector.detect();
    expect(result).toBeNull();
  });

  test('throws error for missing feature in data point', () => {
    const detector = new HopfieldAnomalyDetector({ featureCount: 2 });
    detector.setThresholds({ a: { mode: 'above', value: 5 }, b: { mode: 'below', value: 10 } }, ['a', 'b']);
    expect(() => detector.addDataPoint({ a: 3 })).toThrow('Missing feature: b');
  });

  test('all threshold modes work correctly', () => {
    const detector = new HopfieldAnomalyDetector({ featureCount: 4, snapshotLength: 2 });
    detector.setThresholds({
      above: { mode: 'above', value: 5 },
      below: { mode: 'below', value: 10 },
      equal: { mode: 'equal', value: 7 },
      range: { mode: 'range', min: 3, max: 8 }
    });
    
    detector.trainWithDefaults();
    
    // Test above mode: 6 > 5 = true (1)
    // Test below mode: 8 < 10 = true (1)
    // Test equal mode: 7 === 7 = true (1)
    // Test range mode: 5 in [3,8] = true (1)
    detector.addDataPoint({ above: 6, below: 8, equal: 7, range: 5 });
    detector.addDataPoint({ above: 6, below: 8, equal: 7, range: 5 });
    
    const result = detector.detect();
    expect(result).toBeDefined();
  });

  test('reset clears buffer', () => {
    const detector = new HopfieldAnomalyDetector({ featureCount: 2, snapshotLength: 3 });
    detector.setThresholds({ a: { mode: 'above', value: 5 }, b: { mode: 'below', value: 10 } });
    detector.addDataPoint({ a: 3, b: 12 });
    detector.addDataPoint({ a: 4, b: 11 });
    expect(detector.buffer.length).toBe(2);
    detector.reset();
    expect(detector.buffer.length).toBe(0);
  });

  test('getStats returns correct information', () => {
    const detector = new HopfieldAnomalyDetector({ featureCount: 2 });
    detector.setThresholds({ a: { mode: 'above', value: 5 }, b: { mode: 'below', value: 10 } });
    detector.trainWithDefaults();
    
    const stats = detector.getStats();
    expect(stats.trained).toBe(true);
    expect(stats.dataPointsProcessed).toBe(0);
    expect(stats.anomaliesDetected).toBe(0);
    expect(stats.networkInfo).toBeDefined();
    expect(stats.baseline).toBeDefined();
    expect(stats.scoreWeights).toBeDefined();
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

describe('AdaptiveThreshold - Edge Cases', () => {
  test('getStats returns null for empty scores', () => {
    const thresh = new AdaptiveThreshold();
    const stats = thresh.getStats();
    expect(stats.p50).toBeNull();
    expect(stats.p95).toBeNull();
    expect(stats.p99).toBeNull();
  });

  test('threshold stays within bounds', () => {
    const thresh = new AdaptiveThreshold(0.5, 10, false);
    
    // Try to push below 0.1
    for (let i = 0; i < 50; i++) {
      thresh.update(0.4, true, true); // False negative
    }
    expect(thresh.threshold).toBeGreaterThanOrEqual(0.1);
    
    // Reset and try to push above 0.9
    const thresh2 = new AdaptiveThreshold(0.5, 10, false);
    for (let i = 0; i < 50; i++) {
      thresh2.update(0.6, true, false); // False positive
    }
    expect(thresh2.threshold).toBeLessThanOrEqual(0.9);
  });

  test('unsupervised mode does not update before window is full', () => {
    const thresh = new AdaptiveThreshold(0.5, 10, true);
    const initialThreshold = thresh.threshold;
    
    for (let i = 0; i < 5; i++) {
      thresh.update(0.8); // Only 5 scores, window size is 10
    }
    
    expect(thresh.threshold).toBe(initialThreshold);
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

describe('AnomalyMonitor - Edge Cases', () => {
  test('process returns null when buffer not ready', () => {
    const monitor = new AnomalyMonitor({ featureCount: 2, snapshotLength: 5 });
    monitor.setThresholds({ a: { mode: 'above', value: 5 }, b: { mode: 'below', value: 10 } });
    monitor.trainWithDefaults();
    
    const result = monitor.process({ a: 3, b: 12 });
    expect(result).toBeNull();
  });

  test('reset works', () => {
    const monitor = new AnomalyMonitor({ featureCount: 2, snapshotLength: 3 });
    monitor.setThresholds({ a: { mode: 'above', value: 5 }, b: { mode: 'below', value: 10 } });
    monitor.trainWithDefaults();
    
    monitor.process({ a: 3, b: 12 });
    monitor.process({ a: 4, b: 11 });
    
    monitor.reset();
    const stats = monitor.getStats();
    expect(stats.bufferSize).toBe(0);
  });

  test('benchmark method accessible from monitor', () => {
    const monitor = new AnomalyMonitor({ featureCount: 2 });
    const perf = monitor.benchmark({ featureCount: 3, snapshotLength: 2, dataPoints: 50 });
    expect(perf.trainingTime).toBeGreaterThan(0);
  });

  test('on method returns monitor for chaining', () => {
    const monitor = new AnomalyMonitor({ featureCount: 2 });
    const result = monitor.on('onData', () => {});
    expect(result).toBe(monitor);
  });

  test('on method with invalid event does nothing', () => {
    const monitor = new AnomalyMonitor({ featureCount: 2 });
    const result = monitor.on('invalidEvent', () => {});
    expect(result).toBe(monitor);
  });
});