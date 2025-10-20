import { HopfieldAnomalyDetector } from '../src/index.js';

console.log('🔬 Hopfield Anomaly Detector Benchmark\n');

const configs = [
  { featureCount: 5, snapshotLength: 5, dataPoints: 1000, label: 'Small (25 neurons)' },
  { featureCount: 10, snapshotLength: 10, dataPoints: 1000, label: 'Medium (100 neurons)' },
  { featureCount: 20, snapshotLength: 10, dataPoints: 500, label: 'Large (200 neurons)' },
  { featureCount: 30, snapshotLength: 10, dataPoints: 200, label: 'XLarge (300 neurons)' }
];

configs.forEach(config => {
  console.log(`\n📊 ${config.label}`);
  console.log(`   Network: ${config.featureCount * config.snapshotLength} neurons`);
  console.log(`   Data points: ${config.dataPoints}`);
  
  const perf = HopfieldAnomalyDetector.benchmark(config);
  
  console.log(`   Training: ${perf.trainingTime.toFixed(2)} ms`);
  console.log(`   Detection latency: ${perf.averageDetectLatency.toFixed(2)} ms`);
  console.log(`   Throughput: ${perf.throughput.toFixed(0)} pts/sec`);
  console.log(`   Memory (RSS): ${(perf.memory.rss / 1024 / 1024).toFixed(1)} MB`);
});

console.log('\n✅ Benchmark complete\n');