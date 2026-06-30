# Dream Home 11 — K6 Load Tests

Load test scripts for the Dream Home 11 backend API.

## Prerequisites

- [k6](https://k6.io/docs/getting-started/installation/) installed
- Backend server running (default: `http://localhost:3000`)

```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## Running Tests

All tests accept a `BASE_URL` environment variable to target a different host.

### Smoke Test (quick sanity check, 5 VUs for 30s)

```bash
k6 run load-test/smoke.js
```

### Leaderboard (ramps to 300 VUs)

```bash
k6 run load-test/leaderboard.js
```

### Contests (ramps to 400 VUs)

```bash
k6 run load-test/contests.js
```

### Wallet & Transactions (ramps to 200 VUs)

```bash
k6 run load-test/wallet.js
```

### Compensation Admin (ramps to 80 VUs)

```bash
k6 run load-test/compensation.js
```

### Custom target URL

```bash
k6 run -e BASE_URL=https://staging.example.com load-test/leaderboard.js
```

## Thresholds Monitored

| Test              | p(95) Latency | Error Rate |
|-------------------|---------------|------------|
| Smoke             | < 2000ms      | < 5%       |
| Leaderboard       | < 500ms       | < 1%       |
| Contests          | < 400ms       | < 1%       |
| Wallet            | < 800ms       | < 2%       |
| Compensation      | < 1000ms      | < 1%       |

## Test Structure

```
load-test/
├── config.js        # Shared base URL, API prefix, auth helper
├── smoke.js         # Quick 30s sanity check on main endpoints
├── leaderboard.js   # Leaderboard endpoint under ramp-up load
├── contests.js      # Contest listing with status filters
├── wallet.js        # Wallet/transactions/dashboard endpoints
├── compensation.js  # Admin compensation stats endpoint
└── README.md        # This file
```
