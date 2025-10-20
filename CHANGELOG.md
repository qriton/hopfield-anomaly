# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.4.0] - 2025-01-20

### Added
- Pattern correlation-aware capacity estimation via `estimateCapacity()` method
- Automatic capacity adjustment based on pattern correlation analysis
- Inline test templates in source code documentation
- Performance characteristics table with benchmarked results
- Enhanced capacity warnings with correlation-based adjustments
- Suggested network sizes in error messages when capacity exceeded

### Changed
- Capacity checks now account for pattern correlation (empirical penalty: `1 + avgCorr * 10`)
- Error messages improved with actionable suggestions (e.g., recommended network size)
- Documentation includes complete test suite examples in comments

### Fixed
- Correlation between patterns now reduces effective capacity (prevents silent failures)

---

## [3.3.0] - 2025-01-20

### Added
- **Configurable score weights** via `scoreWeights` constructor option
  - Allows domain-specific tuning of anomaly scoring formula
  - Default: `{ energy: 0.25, drop: 0.25, hamming: 0.25, margin: 0.25 }`
- **Full z-score normalization** for all metrics (energy, energyDrop, hamming, margin)
  - Baseline statistics computed during training for all components
  - Scale-invariant anomaly scoring across different network sizes
- **Optimized gradient-based feature attribution**
  - Analytical computation reduces complexity from O(M×N²) to O(N²+MN)
  - ~100× speedup for feature impact calculation
- **Static `benchmark()` method** for performance profiling
  - Measures training time, detection latency, throughput, and memory usage
  - Configurable test parameters (featureCount, snapshotLength, dataPoints)
- **Strict capacity mode** via `strictCapacity` constructor option
  - Throws error instead of warning when pattern count exceeds capacity
  - Prevents silent degradation from overcapacity training
- **Baseline statistics tracking** for all metrics
  - Stores mean and standard deviation for energy, drop, hamming, and margin
  - Exported in configuration for model persistence

### Changed
- Anomaly score formula now uses z-scores across all components
  - Old: `0.3 * abs(E)/100 + 0.3 * drop/10 + 0.3 * hamming + 0.1 * (1-margin)`
  - New: `w₁*max(0,zEnergy) + w₂*max(0,zDrop) + w₃*max(0,zHamming) + w₄*max(0,zMargin)`
- Default score weights changed from `[0.3, 0.3, 0.3, 0.1]` to `[0.25, 0.25, 0.25, 0.25]` (equal weighting)
- Feature impact computation 100× faster via analytical energy gradients
- `detect()` result now includes z-score values for all metrics

### Fixed
- Scale sensitivity issues with different network sizes (via z-score normalization)
- Energy normalization now dimensionally correct (`E / (patternSize * 2)` instead of `E / 100`)

---

## [3.2.0] - 2025-01-20

### Added
- **Unsupervised adaptive threshold** via 95th percentile mode
  - `unsupervisedAdaptive: true` (default) automatically sets threshold to 95th percentile
  - No labeled data required for threshold adaptation
- **Baseline energy statistics** with z-score integration
  - Training computes mean and standard deviation of energy for stored patterns
  - Anomaly scores include z-score component relative to baseline
- **Gradient-based feature attribution** (`featureImpact` in detection results)
  - Computes energy delta (ΔE) by flipping each feature slice
  - Sorted by absolute impact (highest contributors first)
  - Causal attribution (not just activation density)
- **`trainWithDefaults()` explicit method**
  - Clearer API for default pattern generation
  - Replaces `train({ useDefaults: true })` pattern
- **Z-score metrics in detection results**
  - `metrics.zEnergy`, `metrics.zDrop`, `metrics.zHamming`, `metrics.zMargin`
  - Enables debugging of which component triggered anomaly

### Changed
- Adaptive threshold now works in fully unsupervised mode (default)
- Feature attribution shows causal contribution via energy gradients (not just activation)
- `AdaptiveThreshold` constructor accepts `unsupervised` parameter (default: `true`)
- Detection results include both legacy `contributingFeatures` and new `featureImpact`

### Deprecated
- `contributingFeatures` (activation-based) in favor of `featureImpact` (gradient-based)
  - Kept for backward compatibility
  - Will be removed in v4.0.0

---

## [3.1.0] - 2025-01-18

### Added
- **Initial release** of production-ready Hopfield anomaly detection library
- **Hopfield Network implementation**
  - Normalized Hebbian learning rule (capacity: ~0.138 × N)
  - Storkey learning rule for higher capacity (capacity: ~0.25 × N)
  - Asynchronous recall with random neuron update order
  - Energy-based convergence tracking
  - Symmetric weight matrix with zero diagonal
- **Anomaly detection system**
  - Feature binarization with configurable threshold modes (above, below, equal, range)
  - Sliding window snapshot buffer
  - Energy-based anomaly scoring (input energy, energy drop, Hamming distance, margin)
  - Adaptive threshold calibration (semi-supervised mode with labeled feedback)
- **Seeded RNG** for reproducible experiments and debugging
- **Convergence tracking** with energy path recording
- **Event-driven monitoring** via `AnomalyMonitor` high-level API
  - `onAnomaly`, `onNormal`, `onData` event callbacks
  - Fluent interface for configuration chaining
- **Model persistence** via JSON export/import
  - `exportConfig()` / `fromConfig()` for detector serialization
  - `toJSON()` / `fromJSON()` for network serialization
- **Statistics tracking**
  - Data points processed, anomalies detected, anomaly rate
  - Last anomaly timestamp and history (rolling 100 events)

### Features
- CommonJS and ESM dual exports
- TypedArray optimization (Float64Array, Int8Array, Uint32Array)
- EventEmitter-based architecture for extensibility
- Comprehensive input validation and error handling
- Network capacity warnings (prevents overcapacity training)

---

## [Unreleased]

### Planned
- TypeScript definitions (`.d.ts` files)
- CLI tool for batch processing
- Prometheus/StatsD metric exporters
- WebAssembly version for browser performance
- Real-time visualization dashboard
- Pattern correlation penalty configuration (`correlationPenalty` option)
- Performance regression tests in CI/CD
- Sparse weight matrix support for large networks
- GPU acceleration via gpu.js

---

## Migration Guides

### Migrating from v3.1.0 to v3.2.0
**Breaking Changes:** None

**New Features:**
```js
// Before (v3.1.0)
detector.train({ useDefaults: true });

// After (v3.2.0) - Both work, new method preferred
detector.trainWithDefaults();

// Access new gradient-based attribution
const result = detector.detect();
console.log(result.featureImpact[0]); // { name: 'cpu', energyDelta: 0.45 }
```

### Migrating from v3.2.0 to v3.3.0
**Breaking Changes:** None (but default weights changed)

**Updated Defaults:**
```js
// Old default (v3.2.0)
scoreWeights: { energy: 0.3, drop: 0.3, hamming: 0.3, margin: 0.1 }

// New default (v3.3.0)
scoreWeights: { energy: 0.25, drop: 0.25, hamming: 0.25, margin: 0.25 }
```

**Custom Weights:**
```js
const detector = new HopfieldAnomalyDetector({
  featureCount: 3,
  scoreWeights: {
    energy: 0.4,    // Emphasize energy-based detection
    drop: 0.2,
    hamming: 0.3,
    margin: 0.1
  }
});
```

**Performance Profiling:**
```js
const perf = HopfieldAnomalyDetector.benchmark({
  featureCount: 10,
  snapshotLength: 5,
  dataPoints: 1000
});
console.log(`Latency: ${perf.averageDetectLatency}ms`);
```

### Migrating from v3.3.0 to v3.4.0
**Breaking Changes:** None

**New Capacity Checks:**
```js
// Capacity now adjusts for pattern correlation automatically
const net = new HopfieldNetwork(100);
const capacity = net.estimateCapacity(patterns);
// Returns lower value if patterns are correlated

// Enable strict mode to throw errors
const detector = new HopfieldAnomalyDetector({
  featureCount: 3,
  strictCapacity: true
});
```

---

## Notes

### Version Numbering
- **Major (X.0.0):** Breaking API changes
- **Minor (x.X.0):** New features, backward compatible
- **Patch (x.x.X):** Bug fixes, backward compatible

### Performance Benchmarks
See README.md for detailed performance characteristics table.

### Testing
All releases are tested against:
- Node.js v14, v16, v18, v20
- npm v7+
- Jest v29+

### License
MIT © Qriton

---

**Repository:** https://github.com/qriton/hopfield-anomaly  
**npm Package:** https://www.npmjs.com/package/@qriton/hopfield-anomaly