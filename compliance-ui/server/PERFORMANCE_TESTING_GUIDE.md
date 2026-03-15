# Performance Testing Guide

## Overview

This guide provides comprehensive performance testing scenarios for simulating up to 50 concurrent users against the Union Hall Compliance API.

## Quick Start

### 1. Basic Performance Test (Ramp-up to 50 Users)

```bash
cd compliance-ui/server
node performance-test.js
```

**What it does:**
- Ramps up from 1 to 50 concurrent users (1 user every 5 seconds)
- Runs for 30 seconds at each concurrency level
- Tests all major endpoints with weighted distribution
- Reports detailed metrics including p95, p99 latencies

**Expected Output:**
```
[timestamp] RAMPING UP TO 1 CONCURRENT USERS...
[timestamp] RAMPING UP TO 2 CONCURRENT USERS...
...
[timestamp] RAMPING UP TO 50 CONCURRENT USERS...

PERFORMANCE TEST RESULTS
========================

📊 SUMMARY STATISTICS:
Total Test Duration:        ~500s
Total Requests Sent:        2500+
Total Errors:               0-5
Success Rate:               99%+

⏱️  RESPONSE TIME STATISTICS (ms):
Average Response Time:      XXms
Min Response Time:          Xms
Max Response Time:          XXXms
95th Percentile (p95):      XXms
99th Percentile (p99):      XXXms
```

### 2. Advanced Performance Test (Multi-scenario)

```bash
node performance-test-advanced.js
```

**What it does:**
- Tests 2 different scenarios: Light Load and Medium Load
- Tests 5 concurrency levels: 1, 5, 10, 25, 50 users
- Provides side-by-side comparison
- Analyzes scaling behavior and degradation

**Output includes:**
```
SCENARIO: Light Load - Browse
Testing with 1 concurrent user(s)...
Testing with 5 concurrent users(s)...
...Testing with 50 concurrent users(s)...

SUMMARY ACROSS ALL CONCURRENCY LEVELS

Users | Requests | Success % | Errors | Throughput | Avg(ms) | p95(ms) | p99(ms)
✅ 1    |     500  |   100.0%  |      0 |      2.50  |   20.50 |      50 |      75
✅ 5    |    2500  |   100.0%  |      0 |     12.50  |   22.10 |      60 |      90
✅ 10   |    5000  |    99.9%  |      5 |     25.00  |   25.30 |      75 |     120
✅ 25   |   12500  |    99.5%  |     62 |     62.50  |   35.20 |     110 |     180
✅ 50   |   25000  |    99.2%  |    200 |    125.00  |   45.50 |     150 |     250
```

## Custom Configuration

### Set API URL

```bash
# Default: http://localhost:3001/api
API_URL=http://your-api.com:3001/api node performance-test.js
```

### Modify Test Duration

Edit the test files:

```javascript
const TEST_DURATION_SECONDS = 30; // Change to desired duration
const RAMP_UP_INTERVAL = 5000;    // Change ramp-up speed
const MAX_CONCURRENT_USERS = 50;  // Change max users
```

## Endpoints Tested

The performance tests automatically exercise these endpoints:

1. **GET /runs** - Fetch compliance runs (Weight: 2x)
2. **GET /reports** - Fetch reports (Weight: 2x)
3. **GET /modes** - Fetch compliance modes (Weight: 1x)
4. **POST /runs** - Execute compliance run (Weight: 0.5x)

Weights determine distribution - endpoints with higher weights are called more frequently.

## Performance Benchmarks

### Acceptable Ranges (50 concurrent users)

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|-----------|------|
| **Avg Latency** | < 50ms | < 100ms | < 500ms | > 500ms |
| **p95 Latency** | < 100ms | < 250ms | < 1000ms | > 1000ms |
| **p99 Latency** | < 200ms | < 500ms | < 2000ms | > 2000ms |
| **Error Rate** | < 0.1% | < 0.5% | < 1% | > 1% |
| **Throughput** | > 500 req/s | > 200 req/s | > 100 req/s | < 100 req/s |

## Key Metrics Explained

### Response Time Percentiles

- **p50 (Median)**: 50% of requests complete faster than this
- **p95**: 95% of requests complete faster than this (important for user experience)
- **p99**: 99% of requests complete faster than this (outliers)

### Error Rate

- **0%**: Perfect (no errors)
- **< 0.1%**: Excellent (1 error per 1000 requests)
- **< 1%**: Acceptable (10 errors per 1000 requests)
- **> 1%**: Needs investigation

## Troubleshooting

### High Response Times

1. **Database Performance**
   ```bash
   # Check slow queries
   SELECT * FROM sys.dm_exec_requests;
   ```

2. **Connection Pool**
   ```javascript
   // Ensure adequate pool size in DatabaseConfig.js
   max: 50, // Should support concurrent users
   idleTimeoutMillis: 30000,
   ```

3. **Network Latency**
   - Verify API server is responsive
   - Check network between test machine and server

### High Error Rates

1. **Check Application Logs**
   ```bash
   tail -f logs/application.log | grep ERROR
   ```

2. **Verify Database Connection**
   ```bash
   # Test MSSQL connectivity
   npm test -- src/config/DatabaseConfig.test.js
   ```

3. **Check Memory Usage**
   ```bash
   # Monitor while running tests
   top -p $(pgrep -f "node server.js")
   ```

### Timeout Errors

```javascript
// Increase timeout in performance test
request.setTimeout(15000, () => { // Increase from 10000ms
    // timeout handler
});
```

## Advanced Tuning

### Load Testing with Different Patterns

**Spike Test** (sudden load increase):
```javascript
CONCURRENCY_LEVELS = [1, 50]; // Jump directly to 50 users
RAMP_UP_INTERVAL = 0;         // No ramp-up
```

**Soak Test** (sustained load):
```javascript
TEST_DURATION_SECONDS = 300;  // 5 minutes per level
MAX_CONCURRENT_USERS = 20;    // Moderate sustained load
```

**Stress Test** (push to breaking point):
```javascript
MAX_CONCURRENT_USERS = 100;   // Scale beyond expected
RAMP_UP_INTERVAL = 2000;      // Fast ramp-up
```

## Integration with CI/CD

### Add NPM Script

```json
{
  "scripts": {
    "perf:test": "node performance-test.js",
    "perf:test:advanced": "node performance-test-advanced.js",
    "perf:test:baseline": "API_URL=http://production.api.com node performance-test.js"
  }
}
```

### GitHub Actions Example

```yaml
name: Performance Tests
on: [push]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 22
      - run: npm install
      - run: npm start &
      - run: sleep 5  # Wait for server startup
      - run: npm run perf:test
```

## Analyzing Results

### Compare Before/After Changes

```bash
# Baseline
node performance-test.js > baseline.txt

# Make code changes

# Compare
diff baseline.txt after_changes.txt
```

### Track Degradation

```javascript
// In results, compare:
if (results50.avgLatency > baseline * 1.2) {
    console.log('⚠️ Performance degraded > 20%');
}
```

## Professional Load Testing Tools

For enterprise-grade testing, consider:

### Artillery

```bash
npm install -g artillery
```

Create `artillery.yml`:
```yaml
config:
  target: "http://localhost:3001/api"
  phases:
    - duration: 30
      arrivalRate: 1
      name: "Ramp up"
    - duration: 60
      arrivalRate: 50
      name: "Sustained load"

scenarios:
  - name: "API Load Test"
    flow:
      - get:
          url: "/runs"
```

Run: `artillery run artillery.yml`

### k6

```bash
npm install -g k6
```

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
  ],
};

export default function() {
  let response = http.get('http://localhost:3001/api/runs');
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
```

Run: `k6 run script.js`

## Monitoring During Tests

### CPU & Memory

```bash
# Terminal 1: Run tests
node performance-test.js

# Terminal 2: Monitor (macOS/Linux)
top -p $(pgrep -f "node" | head -1)

# Terminal 2: Monitor (Windows)
tasklist | findstr "node"
Get-Process node | Select-Object Name, Id, PagedMemorySize, Cpu
```

### Network

```bash
# Monitor network connections
netstat -an | grep ESTABLISHED | wc -l
```

## Results Interpretation

### Excellent (Green Zone ✅)
- **Avg latency < 100ms**
- **p95 latency < 250ms**
- **Error rate < 0.1%**
- **Throughput > 200 req/s**

→ **Action**: Deploy with confidence. Continue monitoring.

### Good (Yellow Zone ⚠️)
- **Avg latency 100-300ms**
- **p95 latency 250-500ms**
- **Error rate 0.1-1%**
- **Throughput 100-200 req/s**

→ **Action**: Acceptable but monitor. Plan optimizations.

### Poor (Red Zone ❌)
- **Avg latency > 300ms**
- **p95 latency > 1000ms**
- **Error rate > 1%**
- **Throughput < 100 req/s**

→ **Action**: Investigate bottlenecks. Optimize before production.

## Reference: Historical Results

Track your improvements:

```
Date        | Scenario      | Users | Avg(ms) | p95(ms) | Errors | Status
2026-03-14  | Light Load    | 50    | 45     | 150    | 0      | ✅ Good
After OptA  | Light Load    | 50    | 35     | 120    | 0      | ✅ Better
After OptB  | Light Load    | 50    | 28     | 95     | 0      | ✅ Excellent
```

---

**For detailed reports and analysis, see:**
- `CODE_QUALITY_EVALUATION.html` - Architecture & code review
- `CODE_QUALITY_EVALUATION.md` - Full technical evaluation
