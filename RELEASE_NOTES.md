# Dream Home 11 — v1.0.0 Release Notes

> **Release Date:** $(date +%Y-%m-%d)
> **Version:** 1.0.0
> **Build:** 1

---

## Overview

Dream Home 11 is India's first fantasy home contest platform where users predict real estate outcomes, compete on leaderboards, and earn points redeemable for real homes, cash, and rewards. Built with Flutter (frontend) and NestJS (backend), the platform delivers a production-grade experience with secure payments, real-time updates, and enterprise infrastructure.

---

## Features

### Authentication & Onboarding
- Phone number OTP verification via Firebase Authentication
- Multi-language support (English, Hindi, and more)
- Secure JWT-based session management with `flutter_secure_storage`
- 18+ age verification and restricted state checks (Assam, Odisha, Telangana)
- Splash screen with shimmer loading and language selection grid

### Dashboard & Profile
- Personalized dashboard with tier ranking (Bronze, Silver, Gold, Platinum)
- Profile management with avatar upload, name, and email editing
- KYC verification status tracking (Pending, Verified, Rejected)
- Notification preferences with per-category toggles
- Account overview with settings, logs, and security options

### Contests
- Mega, Home, and Private contest types with dedicated UIs
- Real-time contest updates via WebSocket/Socket.IO
- Join confirmation with wallet verification and `SELECT FOR UPDATE` locking
- Contest rules and scoring display with confirmation dialogs
- Private contest creation with 8-character invite codes
- Contest running and completed state tracking with live point feeds
- Performance analytics with charts and social sharing

### Wallet & Payments
- Double-entry ledger system with `transactions` table
- Razorpay payment gateway integration (UPI, cards, net banking)
- Bonus points on deposits (₹100 → +20, ₹500 → +120, ₹1000 → +300)
- Withdrawal with KYC verification and bank account management
- Transaction history with pagination and type filters (Contest, Deposit, Withdraw)
- Webhook signature verification (SHA-256) for payment confirmation

### Points & Rewards
- Tier-based point multipliers (Bronze 1×, Silver 1.1×, Gold 1.25×, Platinum 1.5×)
- Daily action caps with Redis tracking (24h TTL keys)
- Streak tracking with bonuses (+100 for 7-day, +600 for 30-day)
- Rewards catalog with catalog grid and detail views
- Spin wheel gamification with tier-based reward ranges
- Daily polls system awarding +20 points per vote

### Community & Engagement
- Social feed with image posts, likes, and threaded comments
- Real-time chat (direct messages and group channels)
- Referral program (+30 on signup, +50 on KYC completion)
- Leaderboards (global and series) powered by Redis sorted sets
- Find People screen with search and recommendations

### Security
- SSL certificate pinning with configurable `ENABLE_SSL_PINNING` flag
- Device root/jailbreak detection via native Android Kotlin and iOS Swift
- Rate limiting (global + per-user) with `@nestjs/throttler`
- API key authentication and CORS restricted to known origins
- Audit logging across all financial transactions
- Input sanitization with `class-validator` whitelist mode
- Helmet security headers for HTTP response protection

### Infrastructure
- Docker/Kubernetes deployment ready with Docker Compose production config
- PgBouncer connection pooling for PostgreSQL
- Redis caching layer with RDB snapshots and AOF persistence
- CDN asset delivery for static resources
- Prometheus/Grafana monitoring with business metrics dashboards
- Sentry error tracking with performance tracing
- CI/CD pipelines with automated testing
- Terraform AWS infrastructure (optional)

---

## Installation

| Platform | Link |
|----------|------|
| Google Play Store | [Download from Google Play](https://play.google.com/store/apps/details?id=com.dreamhome11.app) |
| Apple App Store | [Download from App Store](https://apps.apple.com/app/dream-home-11/idXXXXXXXXXX) |

---

## System Requirements

| Platform | Minimum Version |
|----------|----------------|
| Android | 8.0 (API 26) or later |
| iOS | 15.0 or later |
| Internet | Broadband / 4G connection required |
| Permissions | Location (for restricted state checks) |

---

## Known Issues

> None at launch.

---

## Support

| Channel | Contact |
|---------|---------|
| Email | support@dreamhome11.com |
| FAQ | In-app FAQs screen (Screen 58) |
| Support Tickets | In-app support ticket system (Screen 59) |

---

## Technical Details

| Component | Technology | Version |
|-----------|------------|---------|
| Mobile Framework | Flutter | 3.10+ |
| Backend Framework | NestJS | 11.x |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7 |
| Authentication | Firebase Auth | SDK 4.x |
| Payments | Razorpay | — |
| Monitoring | Prometheus + Grafana | — |
| Error Tracking | Sentry | SDK 8.x |

---

## Contributors

- Development Team, Dream Home 11

---

*© $(date +%Y) Dream Home 11. All rights reserved.*
