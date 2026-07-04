# Dream Home 11 — App Store Submission Guide

> **Version:** 1.0.0
> **Last Updated:** $(date +%Y-%m-%d)

---

## Prerequisites

- [ ] **Apple Developer Program** ($99/year) — active membership
- [ ] **Google Play Developer account** ($25 one-time) — active
- [ ] **App icons** generated per `deploy/store/specs/app_icon_specs.md`
- [ ] **Screenshots** prepared for all required devices (see `deploy/store/app-store-metadata.md`)
- [ ] **Privacy policy** hosted at `https://dreamhome11.com/privacy`
- [ ] **Terms of service** hosted at `https://dreamhome11.com/terms-of-service`
- [ ] **App Store Connect** access configured with admin role
- [ ] **Google Play Console** access configured with Owner role

---

## Google Play Store Submission

### Step 1: Prepare Store Listing

- [ ] **App name**: `Dream Home 11`
- [ ] **Short description** (80 chars):
  > Play fantasy home contests, earn points, and win real homes!
- [ ] **Full description** (4000 chars max): See `deploy/store/app-store-metadata.md`
- [ ] **Screenshots** (2–8 per device type):
  - Phone: 2–8 screenshots (at least 2 required)
  - 7-inch tablet: 2–8 screenshots (if applicable)
  - 10-inch tablet: 2–8 screenshots (if applicable)
- [ ] **Feature graphic**: 1024×500px (JPEG or PNG)
- [ ] **Promo video**: Optional, YouTube URL
- [ ] **App icon**: 512×512px (32-bit PNG)
- [ ] **Content rating**: Complete questionnaire
- [ ] **App category**: Games > Casual
- [ ] **Tags**: Fantasy, Real Estate, Contests, Rewards

### Step 2: Set Up Pricing & Distribution

- [ ] **Pricing model**: Free
- [ ] **Target countries**: India (primary), expand globally in future releases
- [ ] **Contains ads**: No
- [ ] **In-app purchases**: No (skill-based platform, not gambling)
- [ ] **Data safety**: Complete privacy and security section
  - Data collected: Phone number, Name, Email, KYC documents
  - Data shared: KYC documents with third-party verification services (Digio/Zoop.one)
  - Security practices: Encrypted in transit (TLS 1.2+)

### Step 3: Production Release

- [ ] **Release type**: Production (not beta/internal)
- [ ] **App bundle**: `build/app/outputs/bundle/release/app-release.aab`
- [ ] **Version**: 1.0.0 (build 1)
- [ ] **Release notes**:
  > Initial release of Dream Home 11 — India's first fantasy home contest platform!
  > Join contests, predict real estate outcomes, earn points, and win real homes.
- [ ] **Rollout percentage**: Start at 1% staged rollout → monitor 24h → 25% → 50% → 100%

### Step 4: Pre-Registration (Optional)

- [ ] Enable pre-registration 2–4 weeks before launch to build initial user base

---

## Apple App Store Submission

### Step 1: Prepare App Store Connect

- [ ] **App name**: Dream Home 11
- [ ] **Privacy policy URL**: `https://dreamhome11.com/privacy`
- [ ] **Support URL**: `https://dreamhome11.com/support`
- [ ] **Marketing URL**: `https://dreamhome11.com`
- [ ] **Subtitle**: `Play, Earn Points, Win Your Dream Home`

### Step 2: Prepare iOS Build

- [ ] Build archive in Xcode or via:
  ```bash
  flutter build ios --release --no-codesign
  ```
  Then archive in Xcode via `Product → Archive`
- [ ] Upload to App Store Connect via Xcode Organizer or Transporter
- [ ] Verify build processing completes (no missing symbols, bitcode issues)

### Step 3: App Information

- [ ] **Category**: Games > Casual
- [ ] **Age rating**: 12+ (mild gambling references; actual play is 18+)
- [ ] **Content copyright**: © $(date +%Y) Dream Home 11
- [ ] **Keywords**: `fantasy homes, contests, rewards, gaming, real estate, prizes, dream home, points`

### Step 4: Export Compliance

- [ ] Does your app contain encryption? **Yes**
- [ ] Does your app qualify for any exemptions? **Yes**
- [ ] Exemption category: **Category 5a002** (standard HTTPS/TLS encryption)
- [ ] See: `deploy/store/export-compliance.md`

### Step 5: Prepare for Review

- [ ] **Demo account**: Provide demo credentials for App Store reviewers
  - Phone: `+91XXXXXXXXXX` (test OTP endpoint)
  - KYC documents: (test Aadhaar/PAN numbers)
- [ ] **Notes**: Include note explaining fantasy sports/skill-gaming model to avoid gambling classification
  - Emphasize skill-based nature (knowledge of real estate determines outcomes)
  - Reference Indian Supreme Court ruling on skill games vs gambling
  - Mention restricted states (Assam, Odisha, Telangana) where paid contests are blocked
- [ ] **Contact**: `review@dreamhome11.com` for reviewer questions

### Step 6: Version Release

- [ ] **Version**: `1.0.0`
- [ ] **Build**: Matches uploaded build
- [ ] **Phased release**: Enable "Phased Release for Automatic Updates" (7-day period)
- [ ] **Manual release**: Do not auto-release; manually release after review approval

---

## Post-Submission Checklist

- [ ] **Monitor for rejection reasons** (App Store Connect / Google Play Console)
- [ ] **Prepare appeal documentation** if rejected:
  - Clarification on skill-gaming model
  - Legal opinion letter (if needed)
  - Compliance documentation with IT Act / state laws
- [ ] **Respond to reviewer questions** within 24 hours
- [ ] **Prepare hotfix** for any post-launch critical bugs
- [ ] **Plan v1.0.1 update** with initial user feedback
- [ ] **Monitor crash reports** in Sentry and Firebase Crashlytics
- [ ] **Watch server metrics** for launch-day load spikes
- [ ] **Track conversion** from store listing (impressions → installs → registrations)

---

## Troubleshooting Common Rejections

| Issue | Solution |
|-------|----------|
| **Gambling/games of chance** | Clearly document skill-based nature; reference court rulings; show restricted state handling |
| **Incomplete metadata** | Fill all App Store Connect fields; provide demo account |
| **Crash on launch** | Test on real device; check Sentry for crash reports |
| **Privacy policy missing** | Host privacy policy at a public URL before submission |
| **Placeholder content** | Remove all placeholder/lorem-ipsum text from app |
| **Login required** | Provide working demo account credentials |

---

## Tools & Resources

| Resource | Location |
|----------|----------|
| Store Metadata | `deploy/store/app-store-metadata.md` |
| Export Compliance | `deploy/store/export-compliance.md` |
| App Icons Spec | `deploy/store/specs/app_icon_specs.md` |
| Release Script | `scripts/release.sh` |
| Verification Script | `scripts/verify-release.sh` |
| Release Notes | `RELEASE_NOTES.md` |
| Pre-Launch Checklist | `deploy/docs/pre-launch-checklist.md` |

---

*End of guide — Proceed to submission when all prerequisites are met.*
