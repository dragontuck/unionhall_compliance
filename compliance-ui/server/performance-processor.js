/**
 * Artillery Processor Script
 * Handles custom logic for performance testing
 */

module.exports = {
    setup: function (context, ee, next) {
        // Setup runs before tests
        console.log('Setting up performance test environment...');

        ee.on('beforeRequest', function (requestParams, context, ee, next) {
            // Log request details
            requestParams.headers['X-Load-Test'] = 'true';
            requestParams.headers['X-Test-ID'] = context.vars.$uuid;
            return next();
        });

        ee.on('response', function (latency, responseCode, requestParams, context, ee, next) {
            // Track custom metrics
            if (latency > 1000) {
                console.log(`⚠️ Slow response (${latency}ms): ${requestParams.method} ${requestParams.url}`);
            }
            return next();
        });

        return next();
    },

    cleanup: function (context, ee, next) {
        // Cleanup after tests
        console.log('Performance test completed');
        return next();
    },

    beforeRequest: function (requestParams, context, ee, next) {
        // Add timestamp
        requestParams.headers['X-Request-Time'] = new Date().toISOString();
        return next();
    },

    afterResponse: function (requestParams, response, context, ee, next) {
        // Process response
        return next();
    }
};
