const { 
  HopfieldNetwork, 
  HopfieldAnomalyDetector, 
  AnomalyMonitor,
  AdaptiveThreshold 
} = require('../src/index.js');

describe('Library Exports', () => {
  test('exports all classes', () => {
    expect(HopfieldNetwork).toBeDefined();
    expect(HopfieldAnomalyDetector).toBeDefined();
    expect(AnomalyMonitor).toBeDefined();
    expect(AdaptiveThreshold).toBeDefined();
  });
});

describe('Basic Functionality', () => {
  test('creates network', () => {
    const net = new HopfieldNetwork(20);
    expect(net.size).toBe(20);
  });

  test('creates detector', () => {
    const detector = new HopfieldAnomalyDetector({
      featureCount: 3,
      snapshotLength: 5
    });
    expect(detector.featureCount).toBe(3);
  });

  test('end-to-end detection', () => {
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
    
    detector.train({ useDefaults: true });
    
    for (let i = 0; i < 5; i++) {
      detector.addDataPoint({ temp: 70, pressure: 100, vibration: 20 });
    }
    
    const result = detector.detect();
    expect(result).toBeDefined();
    expect(typeof result.anomalyScore).toBe('number');
  });
});