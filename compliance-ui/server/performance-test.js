/**
 * Performance Testing Script - Ramp Up to 50 Concurrent Users
 * Tests key backend API endpoints with increasing concurrent load
 * Reports metrics: response times, throughput, errors, p95, p99
 */

const http = require('http');
const https = require('https');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const TEST_DURATION_SECONDS = 30; // Duration per concurrent user level
const RAMP_UP_INTERVAL = 5000; // Increase users every 5 seconds
const MAX_CONCURRENT_USERS = 50;

// Test endpoints configuration
const ENDPOINTS = [
    { method: 'GET', path: '/runs', name: 'Fetch Runs', weight: 2 },
    { method: 'GET', path: '/reports', name: 'Fetch Reports', weight: 2 },
    { method: 'GET', path: '/modes', name: 'Fetch Modes', weight: 1 },
    { method: 'POST', path: '/runs', name: 'Execute Run', weight: 0.5, body: { reviewedDate: '2026-03-14', mode: 'standard' } },
];

// Metrics tracking
const metrics = {
    requests: 0,
    responses: 0,
    errors: 0,
    totalTime: 0,
    responseTimes: [],
    errorDetails: {},
    startTime: Date.now(),
    currentUsers: 0,
};

/**
 * Make HTTP request to endpoint
 */
function makeRequest(endpoint) {
    return new Promise((resolve) => {
        const url = new URL(endpoint.path, API_URL);
        const startTime = Date.now();

        const options = {
            method: endpoint.method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'PerformanceTest/1.0',
            },
        };

        const protocol = url.protocol === 'https:' ? https : http;
        const request = protocol.request(url, options, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                const responseTime = Date.now() - startTime;
                metrics.responses++;
                metrics.totalTime += responseTime;
                metrics.responseTimes.push(responseTime);

                if (response.statusCode >= 400) {
                    metrics.errors++;
                    const errorKey = `${response.statusCode}`;
                    metrics.errorDetails[errorKey] = (metrics.errorDetails[errorKey] || 0) + 1;
                    console.error(`[ERROR] ${endpoint.name}: ${response.statusCode} - ${responseTime}ms`);
                }

                resolve({ statusCode: response.statusCode, responseTime });
            });
        });

        request.on('error', (error) => {
            metrics.errors++;
            const errorType = error.code || 'UNKNOWN';
            metrics.errorDetails[errorType] = (metrics.errorDetails[errorType] || 0) + 1;
            console.error(`[ERROR] ${endpoint.name}: ${errorType}`);
            resolve({ error: errorType, responseTime: Date.now() - startTime });
        });

        request.setTimeout(10000, () => {
            metrics.errors++;
            metrics.errorDetails['TIMEOUT'] = (metrics.errorDetails['TIMEOUT'] || 0) + 1;
            request.destroy();
            resolve({ error: 'TIMEOUT', responseTime: Date.now() - startTime });
        });

        if (endpoint.body) {
            request.write(JSON.stringify(endpoint.body));
        }

        request.end();
        metrics.requests++;
    });
}

/**
 * Select random endpoint based on weight
 */
function selectEndpoint() {
    const rand = Math.random();
    let cumulativeWeight = 0;
    const totalWeight = ENDPOINTS.reduce((sum, e) => sum + e.weight, 0);

    for (const endpoint of ENDPOINTS) {
        cumulativeWeight += endpoint.weight / totalWeight;
        if (rand <= cumulativeWeight) {
            return endpoint;
        }
    }
    return ENDPOINTS[0];
}

/**
 * Simulate user making requests
 */
async function simulateUser(userId, durationMs) {
    const startTime = Date.now();

    while (Date.now() - startTime < durationMs) {
        const endpoint = selectEndpoint();
        await makeRequest(endpoint);

        // Simulate user think time (100-500ms)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
    }
}

/**
 * Ramp up users progressively
 */
async function rampUpUsers() {
    let currentLevel = 1;
    const levelDuration = TEST_DURATION_SECONDS * 1000;
    const activeUsers = [];

    console.log('\n' + '='.repeat(80));
    console.log('PERFORMANCE TESTING - RAMP UP TO 50 CONCURRENT USERS');
    console.log('='.repeat(80));
    console.log(`API URL: ${API_URL}`);
    console.log(`Test Duration per Level: ${TEST_DURATION_SECONDS}s`);
    console.log(`Ramp-up Interval: ${RAMP_UP_INTERVAL}ms`);
    console.log('='.repeat(80) + '\n');

    // Ramp up phase
    while (currentLevel <= MAX_CONCURRENT_USERS) {
        metrics.currentUsers = currentLevel;

        console.log(`\n[${new Date().toLocaleTimeString()}] RAMPING UP TO ${currentLevel} CONCURRENT USERS...`);

        // Start new users up to current level
        for (let i = activeUsers.length; i < currentLevel; i++) {
            activeUsers.push(
                simulateUser(i, levelDuration)
                    .catch(error => console.error(`User ${i} error:`, error))
            );
        }

        // Wait for ramp interval before increasing
        await new Promise(resolve => setTimeout(resolve, RAMP_UP_INTERVAL));
        currentLevel++;
    }

    // Wait for all users to complete
    console.log(`\n[${new Date().toLocaleTimeString()}] WAITING FOR ALL USERS TO COMPLETE...`);
    await Promise.all(activeUsers);

    printResults();
}

/**
 * Calculate percentile
 */
function percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}

/**
 * Print test results
 */
function printResults() {
    const elapsedSeconds = (Date.now() - metrics.startTime) / 1000;
    const avgResponseTime = metrics.responses > 0 ? metrics.totalTime / metrics.responses : 0;
    const throughput = metrics.responses / elapsedSeconds;
    const errorRate = metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0;

    const p50 = percentile([...metrics.responseTimes], 50);
    const p95 = percentile([...metrics.responseTimes], 95);
    const p99 = percentile([...metrics.responseTimes], 99);
    const minResponse = metrics.responseTimes.length > 0 ? Math.min(...metrics.responseTimes) : 0;
    const maxResponse = metrics.responseTimes.length > 0 ? Math.max(...metrics.responseTimes) : 0;

    console.log('\n' + '='.repeat(80));
    console.log('PERFORMANCE TEST RESULTS');
    console.log('='.repeat(80) + '\n');

    // Summary Stats
    console.log('📊 SUMMARY STATISTICS:');
    console.log('-'.repeat(80));
    console.log(`Total Test Duration:        ${elapsedSeconds.toFixed(2)}s`);
    console.log(`Total Requests Sent:        ${metrics.requests}`);
    console.log(`Total Responses Received:   ${metrics.responses}`);
    console.log(`Total Errors:               ${metrics.errors} (${errorRate.toFixed(2)}%)`);
    console.log(`Success Rate:               ${(100 - errorRate).toFixed(2)}%`);

    // Response Time Stats
    console.log('\n⏱️  RESPONSE TIME STATISTICS (ms):');
    console.log('-'.repeat(80));
    console.log(`Average Response Time:      ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time:          ${minResponse}ms`);
    console.log(`Max Response Time:          ${maxResponse}ms`);
    console.log(`Median (p50):               ${p50}ms`);
    console.log(`95th Percentile (p95):      ${p95}ms`);
    console.log(`99th Percentile (p99):      ${p99}ms`);

    // Throughput
    console.log('\n🚀 THROUGHPUT:');
    console.log('-'.repeat(80));
    console.log(`Requests/Second:            ${throughput.toFixed(2)} req/s`);
    console.log(`Average Response/s:         ${(metrics.responses / elapsedSeconds).toFixed(2)} res/s`);

    // Error Details
    if (metrics.errors > 0) {
        console.log('\n❌ ERROR BREAKDOWN:');
        console.log('-'.repeat(80));
        Object.entries(metrics.errorDetails).forEach(([error, count]) => {
            const percentage = (count / metrics.errors) * 100;
            console.log(`${error.padEnd(20)} : ${count.toString().padStart(4)} (${percentage.toFixed(1)}%)`);
        });
    }

    // Performance Assessment
    console.log('\n📈 PERFORMANCE ASSESSMENT:');
    console.log('-'.repeat(80));

    const assessment = {
        responseTime: avgResponseTime < 100 ? '✅ EXCELLENT' : avgResponseTime < 500 ? '✅ GOOD' : avgResponseTime < 1000 ? '⚠️  ACCEPTABLE' : '❌ POOR',
        errorRate: errorRate < 0.1 ? '✅ EXCELLENT' : errorRate < 1 ? '✅ GOOD' : errorRate < 5 ? '⚠️  ACCEPTABLE' : '❌ POOR',
        p95: p95 < 500 ? '✅ EXCELLENT' : p95 < 1000 ? '✅ GOOD' : '⚠️  NEEDS IMPROVEMENT',
        p99: p99 < 1000 ? '✅ EXCELLENT' : p99 < 2000 ? '✅ GOOD' : '⚠️  NEEDS IMPROVEMENT',
    };

    console.log(`Average Response Time:      ${assessment.responseTime} (${avgResponseTime.toFixed(0)}ms)`);
    console.log(`Error Rate:                 ${assessment.errorRate} (${errorRate.toFixed(2)}%)`);
    console.log(`P95 Response Time:          ${assessment.p95} (${p95}ms)`);
    console.log(`P99 Response Time:          ${assessment.p99} (${p99}ms)`);

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(80));

    if (avgResponseTime > 500) {
        console.log('⚠️  Response times are slow. Consider:');
        console.log('   - Optimizing database queries');
        console.log('   - Adding caching (Redis)');
        console.log('   - Implementing request pagination');
    }

    if (errorRate > 1) {
        console.log('⚠️  Error rate is high. Check:');
        console.log('   - Application logs for errors');
        console.log('   - Database connection pooling');
        console.log('   - Memory/CPU usage under load');
    }

    if (p99 > 2000) {
        console.log('⚠️  P99 latency is concerning. Consider:');
        console.log('   - Load balancing');
        console.log('   - Query optimization');
        console.log('   - Horizontal scaling');
    }

    if (avgResponseTime < 100 && errorRate < 0.1) {
        console.log('✅ System performance is excellent!');
    }

    console.log('\n' + '='.repeat(80) + '\n');

    // Advanced metrics
    printDetailedMetrics();
}

/**
 * Print detailed metrics table
 */
function printDetailedMetrics() {
    console.log('📋 DETAILED METRICS TABLE:');
    console.log('-'.repeat(80));

    const metrics_table = [
        { metric: 'Total Requests', value: metrics.requests },
        { metric: 'Successful Requests', value: metrics.responses },
        { metric: 'Failed Requests', value: metrics.errors },
        { metric: 'Total Data Transferred', value: `${(metrics.totalTime / 1000).toFixed(2)} s` },
        { metric: 'Average Latency', value: `${(metrics.totalTime / metrics.responses).toFixed(2)} ms` },
        { metric: 'Min Latency', value: `${Math.min(...metrics.responseTimes)} ms` },
        { metric: 'Max Latency', value: `${Math.max(...metrics.responseTimes)} ms` },
        { metric: 'Median Latency', value: `${percentile([...metrics.responseTimes], 50)} ms` },
        { metric: 'P90 Latency', value: `${percentile([...metrics.responseTimes], 90)} ms` },
        { metric: 'P95 Latency', value: `${percentile([...metrics.responseTimes], 95)} ms` },
        { metric: 'P99 Latency', value: `${percentile([...metrics.responseTimes], 99)} ms` },
    ];

    metrics_table.forEach(row => {
        console.log(`${row.metric.padEnd(30)} : ${row.value}`);
    });

    console.log('-'.repeat(80) + '\n');
}

/**
 * Main execution
 */
async function main() {
    try {
        // Test connectivity
        console.log('Testing API connectivity...');
        await makeRequest(ENDPOINTS[0]);
        console.log('✅ API is reachable\n');

        // Run ramp-up test
        await rampUpUsers();

        process.exit(0);
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Run tests
main();
