/**
 * Advanced Performance Testing - Async Concurrent Load Testing
 * Uses Promise-based concurrent execution for high-accuracy metrics
 * Simulates 1, 5, 10, 25, 50 concurrent users with detailed reporting
 */

const http = require('http');
const https = require('https');
const url = require('url');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

// Test scenarios
const SCENARIOS = [
    {
        name: 'Light Load - Browse',
        endpoints: [
            { method: 'GET', path: '/runs', weight: 2 },
            { method: 'GET', path: '/reports', weight: 2 },
            { method: 'GET', path: '/modes', weight: 1 },
        ],
        duration: 15000, // 15 seconds per concurrency level
    },
    {
        name: 'Medium Load - Mixed Activity',
        endpoints: [
            { method: 'GET', path: '/runs', weight: 2 },
            { method: 'GET', path: '/reports', weight: 2 },
            { method: 'GET', path: '/modes', weight: 1 },
            { method: 'POST', path: '/runs', weight: 0.5, body: { reviewedDate: '2026-03-14', mode: 'standard' } },
        ],
        duration: 20000,
    },
];

const CONCURRENCY_LEVELS = [1, 5, 10, 25, 50];

class PerformanceTestRunner {
    constructor(scenario) {
        this.scenario = scenario;
        this.results = {};
    }

    async runTest() {
        console.log('\n' + '='.repeat(100));
        console.log(`SCENARIO: ${this.scenario.name}`);
        console.log('='.repeat(100) + '\n');

        for (const concurrency of CONCURRENCY_LEVELS) {
            await this.testConcurrency(concurrency);
            console.log('');
        }

        this.printSummary();
    }

    async testConcurrency(concurrentUsers) {
        console.log(`Testing with ${concurrentUsers} concurrent user(s)...`);

        const metrics = {
            requests: 0,
            responses: 0,
            errors: 0,
            responseTimes: [],
            errorDetails: {},
            statusCodes: {},
            startTime: Date.now(),
        };

        // Simulate concurrent users
        const userPromises = [];
        for (let userId = 0; userId < concurrentUsers; userId++) {
            userPromises.push(
                this.simulateUser(userId, metrics)
            );
        }

        await Promise.all(userPromises);

        const duration = (Date.now() - metrics.startTime) / 1000;
        const results = this.calculateMetrics(metrics, duration);

        this.results[concurrentUsers] = results;
        this.printConcurrencyResults(concurrentUsers, results);
    }

    async simulateUser(userId, metrics) {
        const endTime = Date.now() + this.scenario.duration;

        while (Date.now() < endTime) {
            const endpoint = this.selectEndpoint();
            await this.makeRequest(endpoint, metrics);

            // Think time
            await new Promise(resolve =>
                setTimeout(resolve, Math.random() * 500 + 100)
            );
        }
    }

    selectEndpoint() {
        const rand = Math.random();
        let cumulative = 0;
        const totalWeight = this.scenario.endpoints.reduce((sum, e) => sum + e.weight, 0);

        for (const endpoint of this.scenario.endpoints) {
            cumulative += endpoint.weight / totalWeight;
            if (rand <= cumulative) {
                return endpoint;
            }
        }
        return this.scenario.endpoints[0];
    }

    async makeRequest(endpoint, metrics) {
        return new Promise((resolve) => {
            const targetUrl = new URL(endpoint.path, API_URL);
            const startTime = Date.now();

            const options = {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'PerformanceTest/2.0',
                },
                timeout: 10000,
            };

            const protocol = targetUrl.protocol === 'https:' ? https : http;
            const request = protocol.request(targetUrl, options, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    metrics.responses++;
                    metrics.responseTimes.push(responseTime);

                    const statusCode = response.statusCode;
                    metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + 1;

                    if (statusCode >= 400) {
                        metrics.errors++;
                        const errorKey = `HTTP ${statusCode}`;
                        metrics.errorDetails[errorKey] = (metrics.errorDetails[errorKey] || 0) + 1;
                    }

                    resolve();
                });
            });

            request.on('error', (error) => {
                metrics.errors++;
                metrics.responseTimes.push(Date.now() - startTime);
                const errorType = error.code || 'UNKNOWN';
                metrics.errorDetails[errorType] = (metrics.errorDetails[errorType] || 0) + 1;
                resolve();
            });

            request.on('timeout', () => {
                metrics.errors++;
                metrics.responseTimes.push(Date.now() - startTime);
                metrics.errorDetails['TIMEOUT'] = (metrics.errorDetails['TIMEOUT'] || 0) + 1;
                request.destroy();
                resolve();
            });

            if (endpoint.body) {
                request.write(JSON.stringify(endpoint.body));
            }

            metrics.requests++;
            request.end();
        });
    }

    calculateMetrics(metrics, durationSeconds) {
        const sorted = [...metrics.responseTimes].sort((a, b) => a - b);
        const len = sorted.length;

        return {
            users: len,
            duration: durationSeconds,
            requests: metrics.requests,
            responses: metrics.responses,
            errors: metrics.errors,
            errorRate: (metrics.errors / metrics.requests * 100) || 0,
            successRate: ((metrics.responses / metrics.requests * 100) || 0),
            throughput: metrics.responses / durationSeconds,
            avgLatency: metrics.responses > 0 ? metrics.responseTimes.reduce((a, b) => a + b) / metrics.responses : 0,
            minLatency: sorted[0] || 0,
            maxLatency: sorted[len - 1] || 0,
            p50: sorted[Math.floor(len * 0.5)] || 0,
            p75: sorted[Math.floor(len * 0.75)] || 0,
            p90: sorted[Math.floor(len * 0.9)] || 0,
            p95: sorted[Math.floor(len * 0.95)] || 0,
            p99: sorted[Math.floor(len * 0.99)] || 0,
            statusCodes: metrics.statusCodes,
            errors: metrics.errorDetails,
        };
    }

    printConcurrencyResults(concurrentUsers, results) {
        console.log(`  Concurrent Users: ${concurrentUsers}`);
        console.log(`  ├─ Total Requests:     ${results.requests}`);
        console.log(`  ├─ Successful:         ${results.responses} (${results.successRate.toFixed(1)}%)`);
        console.log(`  ├─ Errors:             ${results.errors} (${results.errorRate.toFixed(2)}%)`);
        console.log(`  ├─ Throughput:         ${results.throughput.toFixed(2)} req/s`);
        console.log(`  ├─ Avg Latency:        ${results.avgLatency.toFixed(2)}ms`);
        console.log(`  ├─ Min/Max Latency:    ${results.minLatency}ms / ${results.maxLatency}ms`);
        console.log(`  ├─ p50/p95/p99:        ${results.p50}ms / ${results.p95}ms / ${results.p99}ms`);

        if (results.errors > 0) {
            console.log(`  └─ Errors: ${JSON.stringify(results.errors).substring(0, 60)}...`);
        } else {
            console.log(`  └─ 🟢 No errors`);
        }
    }

    printSummary() {
        console.log('\n' + '='.repeat(100));
        console.log('SUMMARY ACROSS ALL CONCURRENCY LEVELS');
        console.log('='.repeat(100) + '\n');

        console.log('Users | Requests | Success % | Errors | Throughput | Avg(ms) | p95(ms) | p99(ms)');
        console.log('-'.repeat(100));

        for (const concurrency of CONCURRENCY_LEVELS) {
            if (this.results[concurrency]) {
                const r = this.results[concurrency];
                const status = r.errors === 0 ? '✅' : '❌';
                console.log(
                    `${status} ${r.users.toString().padStart(4)} | ` +
                    `${r.requests.toString().padStart(8)} | ` +
                    `${r.successRate.toFixed(1).padStart(8)}% | ` +
                    `${r.errors.toString().padStart(6)} | ` +
                    `${r.throughput.toFixed(2).padStart(10)} | ` +
                    `${r.avgLatency.toFixed(2).padStart(7)} | ` +
                    `${r.p95.toString().padStart(7)} | ` +
                    `${r.p99.toString().padStart(7)}`
                );
            }
        }

        console.log('\n' + '='.repeat(100) + '\n');

        // Analysis
        this.printAnalysis();
    }

    printAnalysis() {
        console.log('📊 ANALYSIS & INSIGHTS:\n');

        const results50 = this.results[50];
        if (!results50) return;

        if (results50.avgLatency < 100) {
            console.log('✅ EXCELLENT: Average latency under 100ms');
        } else if (results50.avgLatency < 500) {
            console.log('✅ GOOD: Average latency under 500ms');
        } else if (results50.avgLatency < 1000) {
            console.log('⚠️  ACCEPTABLE: Average latency under 1000ms');
        } else {
            console.log('❌ POOR: Average latency exceeds 1000ms');
        }

        if (results50.errorRate < 0.1) {
            console.log('✅ EXCELLENT: Error rate < 0.1%');
        } else if (results50.errorRate < 1) {
            console.log('✅ GOOD: Error rate < 1%');
        } else {
            console.log('❌ HIGH ERROR RATE: ' + results50.errorRate.toFixed(2) + '%');
        }

        if (results50.p99 < 1000) {
            console.log('✅ EXCELLENT: P99 latency under 1000ms');
        } else if (results50.p99 < 2000) {
            console.log('⚠️  ACCEPTABLE: P99 latency under 2000ms');
        } else {
            console.log('❌ POOR: P99 latency exceeds 2000ms');
        }

        // Scaling analysis
        const results1 = this.results[1];
        if (results1 && results50) {
            const latencyScaling = (results50.avgLatency / results1.avgLatency);
            const degradation = ((latencyScaling - 1) * 100).toFixed(1);

            console.log(`\n📈 SCALING ANALYSIS (1 → 50 users):`);
            console.log(`   Latency increased by ${degradation}% (${latencyScaling.toFixed(2)}x)`);

            if (latencyScaling < 1.5) {
                console.log(`   ✅ Excellent scaling behavior`);
            } else if (latencyScaling < 3) {
                console.log(`   ⚠️  Good scaling but some degradation`);
            } else {
                console.log(`   ❌ Significant scaling issues - consider optimization`);
            }
        }

        console.log('\n');
    }
}

async function main() {
    console.log('\n' + '█'.repeat(100));
    console.log('ADVANCED PERFORMANCE TESTING - CONCURRENT LOAD TEST');
    console.log('█'.repeat(100));
    console.log(`API URL: ${API_URL}`);
    console.log(`Concurrency Levels: ${CONCURRENCY_LEVELS.join(', ')}`);
    console.log('█'.repeat(100) + '\n');

    try {
        for (const scenario of SCENARIOS) {
            const runner = new PerformanceTestRunner(scenario);
            await runner.runTest();
        }

        console.log('✅ All tests completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

main();
