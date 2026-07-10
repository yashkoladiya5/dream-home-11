const http = require('http');

const TARGET = process.env.TARGET_URL || 'http://localhost:3000';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '10', 10);
const TOTAL_REQUESTS = parseInt(process.env.TOTAL_REQUESTS || '100', 10);
const ENDPOINTS = [
  '/api/v1/health',
  '/api/v1/config/public',
  '/api/v1/banners/active',
];

let completed = 0;
let errors = 0;
const timings = [];

function makeRequest(endpoint) {
  const start = Date.now();
  return new Promise((resolve) => {
    const req = http.get(`${TARGET}${endpoint}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - start;
        timings.push(duration);
        if (res.statusCode >= 400) errors++;
        completed++;
        resolve();
      });
    });
    req.on('error', () => {
      errors++;
      completed++;
      resolve();
    });
    req.end();
  });
}

async function runLoadTest() {
  console.log(`\n=== Load Test ===`);
  console.log(`Target: ${TARGET}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`Endpoints: ${ENDPOINTS.join(', ')}\n`);

  const batchSize = Math.min(CONCURRENCY, TOTAL_REQUESTS);
  let sent = 0;

  while (sent < TOTAL_REQUESTS) {
    const batch = [];
    const batchCount = Math.min(batchSize, TOTAL_REQUESTS - sent);
    for (let i = 0; i < batchCount; i++) {
      batch.push(makeRequest(ENDPOINTS[sent % ENDPOINTS.length]));
      sent++;
    }
    await Promise.all(batch);
  }

  const totalTime = Math.max(...timings);
  const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
  const sortedTimings = [...timings].sort((a, b) => a - b);
  const p95 = sortedTimings[Math.floor(sortedTimings.length * 0.95)];
  const p99 = sortedTimings[Math.floor(sortedTimings.length * 0.99)];

  console.log('=== Results ===');
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`Completed: ${completed}`);
  console.log(`Errors: ${errors}`);
  console.log(`Error Rate: ${(errors / TOTAL_REQUESTS * 100).toFixed(2)}%`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Avg Response: ${avgTime.toFixed(2)}ms`);
  console.log(`P95: ${p95}ms`);
  console.log(`P99: ${p99}ms`);
  console.log(`Requests/sec: ${(TOTAL_REQUESTS / (totalTime / 1000)).toFixed(2)}`);
  console.log('');
}

runLoadTest().catch(console.error);
