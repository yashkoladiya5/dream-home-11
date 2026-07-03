# Dream Home 11 - Kubernetes Deployment

## Prerequisites

- Kubernetes 1.24+ cluster
- kubectl configured with cluster access
- [nginx-ingress-controller](https://kubernetes.github.io/ingress-nginx/deploy/) installed
- [cert-manager](https://cert-manager.io/docs/installation/) installed
- Metrics Server installed (for HPA)

## Directory Structure

```
deploy/k8s/
├── namespace.yaml           # Namespace definition
├── service-account.yaml     # ServiceAccount + RBAC
├── configmap.yaml           # Non-sensitive configuration
├── secrets.yaml             # Secret template (replace values)
├── deployment.yaml          # Backend deployment
├── service.yaml             # ClusterIP service
├── ingress.yaml             # Ingress with TLS
├── hpa.yaml                 # HorizontalPodAutoscaler
├── pdb.yaml                 # PodDisruptionBudget
├── network-policy.yaml      # Network policies
├── kustomization.yaml       # Kustomize root config
├── README.md                # This file
└── overlays/
    ├── staging/
    │   └── kustomization.yaml
    └── production/
        └── kustomization.yaml
```

## Quick Start

### 1. Create the namespace and secrets

```bash
# Create secrets (REQUIRED before deploying)
kubectl create secret generic dream-home-11-secrets \
  --namespace dream-home-11 \
  --from-literal=DB_HOST='<pgbouncer-host>' \
  --from-literal=DB_USERNAME='<db-username>' \
  --from-literal=DB_PASSWORD='<db-password>' \
  --from-literal=DB_DATABASE='dream_home_11' \
  --from-literal=REDIS_HOST='<redis-host>' \
  --from-literal=JWT_SECRET='<generate with: openssl rand -base64 64>' \
  --from-literal=FIREBASE_SERVICE_ACCOUNT_PATH='<path-to-firebase-json>'
```

### 2. Deploy to Production

```bash
kubectl apply -k deploy/k8s/overlays/production
```

### 3. Deploy to Staging

```bash
kubectl apply -k deploy/k8s/overlays/staging
```

### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -n dream-home-11 -w

# Check services
kubectl get svc -n dream-home-11

# Check ingress
kubectl get ingress -n dream-home-11

# Check HPA
kubectl get hpa -n dream-home-11
```

## Required Secrets

The following secrets **must** be provided before the application will function:

| Secret Key                     | Description                                          |
|--------------------------------|------------------------------------------------------|
| `DB_HOST`                      | PostgreSQL / PgBouncer hostname or IP                |
| `DB_USERNAME`                  | Database user                                        |
| `DB_PASSWORD`                  | Database password                                    |
| `DB_DATABASE`                  | Database name (default: dream_home_11)               |
| `REDIS_HOST`                   | Redis hostname or IP                                 |
| `JWT_SECRET`                   | JWT signing secret (64+ chars, random)               |
| `FIREBASE_SERVICE_ACCOUNT_PATH`| Path to Firebase service account JSON                |

> **Security Note**: Never commit actual secrets to version control. Use external secret management (External Secrets Operator, SealedSecrets, Vault, etc.) for production.

## Ingress & TLS

This deployment expects cert-manager's `letsencrypt-prod` ClusterIssuer to be available. TLS certificates for `api.dreamhome11.com` and `admin.dreamhome11.com` are automatically provisioned.

### Setting up the Ingress Controller

If not already installed:

```bash
# Install nginx-ingress-controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# Create the ClusterIssuer for production
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@dreamhome11.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

## Network Policies

The NetworkPolicy in this deployment:

- **Ingress**: Allows traffic only from the `ingress-nginx` namespace and within the `dream-home-11` namespace
- **Egress**: Allows DNS, HTTPS (external APIs), and documents placeholder rules for PostgreSQL and Redis CIDRs

Before applying, update the egress rules in `network-policy.yaml` with your actual database and Redis CIDR ranges.

## Customizing Deployments

### Overlays

- **Staging** (`overlays/staging/`): 2 replicas, lower resource limits, `dream-home-11-staging` namespace
- **Production** (`overlays/production/`): 5 replicas, higher resource limits, `dream-home-11` namespace, stricter autoscaling

### Applying specific overlays

```bash
# Preview changes
kubectl kustomize deploy/k8s/overlays/production

# Apply
kubectl apply -k deploy/k8s/overlays/production

# Delete
kubectl delete -k deploy/k8s/overlays/production
```

## Monitoring

- Prometheus metrics are scraped at `:3000/metrics` (configured via pod annotations)
- Liveness: `/health/live`
- Readiness: `/health/ready`
- Startup: `/health`

## Upgrading

The deployment uses a rolling update strategy with `maxSurge: 1` and `maxUnavailable: 0`, ensuring zero-downtime deployments.

```bash
# Update the image version in deployment.yaml, then:
kubectl apply -k deploy/k8s/overlays/production
```
