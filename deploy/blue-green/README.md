# Blue-Green Deployment Strategy

## Overview

Dream Home 11 uses a blue-green deployment strategy to achieve zero-downtime releases with instant rollback capability.

### Concept

Two identical environments (`blue` and `green`) run in parallel. At any time, only one color is active (serving live traffic) while the other is idle and can be updated.

- **Active**: The current color receiving production traffic
- **Idle**: The standby color that can be updated safely

### Deployment Flow

```
                     ┌─────────────────────┐
                     │   Ingress           │
                     │   (route-*.yaml)    │
                     └────────┬────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
      ┌───────▼───────┐               ┌───────▼───────┐
      │  Service      │               │  Service      │
      │  (blue)       │               │  (green)      │
      └───────┬───────┘               └───────┬───────┘
              │                               │
      ┌───────▼───────┐               ┌───────▼───────┐
      │  Deployment   │               │  Deployment   │
      │  (blue)       │               │  (green)      │
      │  replicas: 3  │               │  replicas: 3  │
      └───────────────┘               └───────────────┘
```

### Step-by-Step

1. **Current state**: Blue is live (ingress routes to `service-blue`), Green is idle on v1.0.0.
2. **Deploy v2.0.0**: Update the idle Green deployment with the new image tag.
3. **Test idle**: Run health checks against the Green service directly (internal only).
4. **Switch traffic**: Update the ingress to point to `service-green` instead of `service-blue`.
5. **Verify**: Run post-deployment checks on the live Green environment.
6. **Drain old**: Once confirmed healthy, scale down Blue to 0 replicas (or keep 1 for quick rollback).

### Rollback

To rollback, simply switch the ingress back to the previous color:

```bash
# If green is now active and has issues, switch back to blue:
kubectl apply -f deploy/blue-green/route-blue.yaml
```

This is instant — no image rebuild or re-deploy needed.

### Directory Structure

```
deploy/blue-green/
├── README.md                  # This file
├── deploy-blue.yaml           # Blue deployment (active/idle)
├── deploy-green.yaml          # Green deployment (active/idle)
├── service-blue.yaml          # Blue cluster-internal service
├── service-green.yaml         # Green cluster-internal service
├── route-blue.yaml            # Ingress routing to blue service
└── route-green.yaml           # Ingress routing to green service
```

### Usage

```bash
# Deploy new version to idle environment (assuming blue is active):
kubectl apply -f deploy/blue-green/deploy-green.yaml

# Verify idle environment:
kubectl port-forward service/dream-home-11-green 3001:3000
curl http://localhost:3001/health

# Switch traffic to green:
kubectl apply -f deploy/blue-green/route-green.yaml

# Scale down old environment:
kubectl scale deployment/dream-home-11-blue --replicas=0 -n dream-home-11

# Rollback (if needed):
kubectl apply -f deploy/blue-green/route-blue.yaml
kubectl scale deployment/dream-home-11-blue --replicas=3 -n dream-home-11
kubectl scale deployment/dream-home-11-green --replicas=0 -n dream-home-11
```

### Benefits

- **Zero-downtime**: Traffic switch is instantaneous
- **Instant rollback**: Just flip the ingress back
- **Isolated testing**: Validate new version without affecting users
- **Capacity headroom**: Both environments run during switch, handling peak load
