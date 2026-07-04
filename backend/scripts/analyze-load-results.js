#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_THRESHOLDS = {
  p95: 2000,
  p99: 5000,
  errorRate: 0.01,
};

const args = process.argv.slice(2);
let inputFile = null;
let outputFile = null;
let thresholds = { ...DEFAULT_THRESHOLDS };

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--input':
      inputFile = args[++i];
      break;
    case '--output':
      outputFile = args[++i];
      break;
    case '--threshold-p95':
      thresholds.p95 = parseInt(args[++i], 10);
      break;
    case '--threshold-p99':
      thresholds.p99 = parseInt(args[++i], 10);
      break;
    case '--threshold-error':
      thresholds.errorRate = parseFloat(args[++i]);
      break;
    case '--help':
      console.log(`
Usage: analyze-load-results.js [OPTIONS]

Analyze k6 JSON output files and generate performance reports.

Options:
  --input FILE         k6 JSON results file or directory of results
  --output FILE        Output report file (default: stdout + report.json)
  --threshold-p95 MS   p95 threshold in ms (default: 2000)
  --threshold-p99 MS   p99 threshold in ms (default: 5000)
  --threshold-error N  Error rate threshold (default: 0.01)
  --help               Show this help

Examples:
  node analyze-load-results.js --input ./reports/results.json
  node analyze-load-results.js --input ./reports/ --output report.md
`);
      process.exit(0);
  }
}

if (!inputFile) {
  console.error('Error: --input is required. Use --help for usage.');
  process.exit(1);
}

function loadResults(inputPath) {
  const stats = fs.statSync(inputPath);
  if (stats.isDirectory()) {
    const files = fs.readdirSync(inputPath).filter(f => f.endsWith('.json') && !f.startsWith('.'));
    const data = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(inputPath, file), 'utf-8');
      const parsed = JSON.parse(content);
      parsed._filename = file;
      data.push(parsed);
    }
    return data;
  }
  const content = fs.readFileSync(inputPath, 'utf-8');
  const parsed = JSON.parse(content);
  if (Array.isArray(parsed)) {
    return parsed.map((item, i) => {
      item._filename = item.test || `entry_${i}`;
      return item;
    });
  }
  parsed._filename = path.basename(inputPath);
  return [parsed];
}

function extractMetrics(testData) {
  const metrics = testData.metrics || {};
  const filename = testData._filename || 'unknown';
  const testName = testData.test || filename.replace(/\.json$/i, '');

  const durationMetric = metrics.http_req_duration;
  const failedMetric = metrics.http_req_failed;
  const reqsMetric = metrics.http_reqs;

  const extractTrend = (metric) => {
    if (!metric || !metric.type || metric.type !== 'trend') return null;
    return {
      avg: metric.values?.avg ?? 0,
      min: metric.values?.min ?? 0,
      max: metric.values?.max ?? 0,
      p50: metric.values?.['p(50)'] ?? metric.values?.med ?? 0,
      p90: metric.values?.['p(90)'] ?? 0,
      p95: metric.values?.['p(95)'] ?? 0,
      p99: metric.values?.['p(99)'] ?? 0,
    };
  };

  const extractRate = (metric) => {
    if (!metric || !metric.type || metric.type !== 'rate') return null;
    return {
      rate: metric.values?.rate ?? 0,
      passes: metric.values?.passes ?? 0,
      fails: metric.values?.fails ?? 0,
    };
  };

  const extractCounter = (metric) => {
    if (!metric || !metric.type || metric.type !== 'counter') return null;
    return { count: metric.values?.count ?? 0, rate: metric.values?.rate ?? 0 };
  };

  const requestRate = reqsMetric ? extractCounter(reqsMetric) : null;
  const totalRequests = requestRate ? requestRate.count : 0;
  const throughput = requestRate ? requestRate.rate : 0;

  const overall = extractTrend(durationMetric);
  const errorData = extractRate(failedMetric);

  const errorRate = errorData ? errorData.rate : 0;
  const errorCount = errorData ? errorData.fails : 0;

  const customTrends = {};
  const customRates = {};
  for (const [key, metric] of Object.entries(metrics)) {
    if (key === 'http_req_duration' || key === 'http_req_failed' || key === 'http_reqs' || key === 'iterations' || key === 'iteration_duration' || key === 'data_received' || key === 'data_sent' || key === 'checks' || key === 'vus' || key === 'vus_max' || key === 'http_req_blocked' || key === 'http_req_connecting' || key === 'http_req_tls_handshaking' || key === 'http_req_sending' || key === 'http_req_waiting' || key === 'http_req_receiving') {
      continue;
    }
    if (metric.type === 'trend') {
      customTrends[key] = extractTrend(metric);
    } else if (metric.type === 'rate') {
      customRates[key] = extractRate(metric);
    }
  }

  const thresholdResults = testData.thresholds || {};
  const failedThresholds = [];
  const passedThresholds = [];
  for (const [key, t] of Object.entries(thresholdResults)) {
    if (t.fail) {
      failedThresholds.push(key);
    } else {
      passedThresholds.push(key);
    }
  }

  const slowestEndpoints = Object.entries(customTrends)
    .filter(([key]) => key.includes('duration'))
    .sort((a, b) => (b[1]?.p95 ?? 0) - (a[1]?.p95 ?? 0))
    .slice(0, 5)
    .map(([key, val]) => ({ endpoint: key, ...val }));

  const violations = [];
  if (overall && overall.p95 > thresholds.p95) {
    violations.push({ metric: 'p95', actual: overall.p95, threshold: thresholds.p95, unit: 'ms' });
  }
  if (overall && overall.p99 > thresholds.p99) {
    violations.push({ metric: 'p99', actual: overall.p99, threshold: thresholds.p99, unit: 'ms' });
  }
  if (errorRate > thresholds.errorRate) {
    violations.push({ metric: 'errorRate', actual: errorRate, threshold: thresholds.errorRate, unit: 'rate' });
  }

  return {
    testName,
    filename,
    totalRequests,
    throughput,
    overall,
    errorRate,
    errorCount,
    customTrends,
    customRates,
    thresholdResults,
    failedThresholds,
    passedThresholds,
    slowestEndpoints,
    violations,
    passed: failedThresholds.length === 0 && violations.length === 0,
    raw: testData,
  };
}

function generateReport(allResults) {
  return {
    generatedAt: new Date().toISOString(),
    thresholds,
    summary: {
      totalTests: allResults.length,
      passed: allResults.filter(r => r.passed).length,
      failed: allResults.filter(r => !r.passed).length,
      totalRequests: allResults.reduce((s, r) => s + r.totalRequests, 0),
      avgThroughput: allResults.reduce((s, r) => s + r.throughput, 0) / allResults.length,
    },
    results: allResults,
  };
}

function printSummary(report) {
  const s = report.summary;
  console.log('');
  console.log('='.repeat(65));
  console.log('  Dream Home 11 — Load Test Analysis Report');
  console.log('='.repeat(65));
  console.log(`  Generated: ${report.generatedAt}`);
  console.log(`  Thresholds: p95 < ${report.thresholds.p95}ms, p99 < ${report.thresholds.p99}ms, errors < ${(report.thresholds.errorRate * 100).toFixed(1)}%`);
  console.log('');
  console.log('  Summary:');
  console.log(`    Tests: ${s.passed}/${s.totalTests} passed, ${s.failed} failed`);
  console.log(`    Total requests: ${s.totalRequests}`);
  console.log(`    Avg throughput: ${s.avgThroughput.toFixed(1)} req/s`);
  console.log('');

  for (const result of report.results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    const statusColor = result.passed ? '\x1b[32m' : '\x1b[31m';
    console.log(`  ${statusColor}[${status}]\x1b[0m ${result.testName}`);
    console.log(`    Requests: ${result.totalRequests} | Throughput: ${result.throughput.toFixed(1)}/s`);

    if (result.overall) {
      console.log(`    p50: ${result.overall.p50.toFixed(1)}ms | p95: ${result.overall.p95.toFixed(1)}ms | p99: ${result.overall.p99.toFixed(1)}ms | max: ${result.overall.max.toFixed(1)}ms`);
    }
    console.log(`    Error rate: ${(result.errorRate * 100).toFixed(2)}% (${result.errorCount} errors)`);

    if (result.failedThresholds.length > 0) {
      console.log(`    \x1b[31mFailed thresholds: ${result.failedThresholds.join(', ')}\x1b[0m`);
    }

    if (result.violations.length > 0) {
      for (const v of result.violations) {
        console.log(`    \x1b[31mViolation: ${v.metric}=${v.actual}${v.unit} (threshold: ${v.threshold}${v.unit})\x1b[0m`);
      }
    }

    if (result.slowestEndpoints.length > 0) {
      console.log(`    Slowest endpoints:`);
      for (const ep of result.slowestEndpoints) {
        console.log(`      ${ep.endpoint}: p95=${ep.p95.toFixed(1)}ms, p99=${ep.p99.toFixed(1)}ms`);
      }
    }
    console.log('');
  }

  const allSlowest = report.results
    .flatMap(r => (r.slowestEndpoints || []).map(e => ({ ...e, test: r.testName })))
    .sort((a, b) => (b.p95 ?? 0) - (a.p95 ?? 0))
    .slice(0, 10);

  if (allSlowest.length > 0) {
    console.log('  Top 10 slowest endpoint metrics across all tests:');
    console.log('  ' + '-'.repeat(55));
    console.log(`  ${'Endpoint'.padEnd(30)} ${'p50'.padEnd(8)} ${'p95'.padEnd(8)} ${'p99'.padEnd(8)}`);
    console.log('  ' + '-'.repeat(55));
    for (const ep of allSlowest) {
      console.log(`  ${ep.endpoint.padEnd(30)} ${(ep.p50 || 0).toFixed(0).padEnd(8)} ${(ep.p95 || 0).toFixed(0).padEnd(8)} ${(ep.p99 || 0).toFixed(0).padEnd(8)}`);
    }
    console.log('');
  }

  console.log('  Recommendations:');
  if (report.summary.failed > 0) {
    console.log('    - Review failed thresholds and optimize slow endpoints');
  }
  const highErrorTests = report.results.filter(r => r.errorRate > 0.01);
  if (highErrorTests.length > 0) {
    console.log('    - Investigate elevated error rates in: ' + highErrorTests.map(r => r.testName).join(', '));
  }
  console.log('    - Ensure Redis caching is enabled for read-heavy endpoints');
  console.log('    - Check database connection pool size and query performance');
  console.log('    - Review PgBouncer configuration if under load');
  console.log('');
}

const rawResults = loadResults(inputFile);
const analyzed = rawResults.map(extractMetrics);
const report = generateReport(analyzed);

const outputPath = outputFile || path.join(path.dirname(inputFile || '.'), 'analysis_report.json');
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
console.log(`Report written to: ${outputPath}`);

printSummary(report);

process.exit(report.summary.failed > 0 ? 1 : 0);
