# Apple Export Compliance Documentation

## App: Dream Home 11

### Does your app use encryption?

**YES** — The app uses standard HTTPS (TLS 1.2+) for all network communication.

### Details

| Question | Answer |
|----------|--------|
| Does the app contain encryption? | Yes |
| Is it exempt? | Yes |
| Exemption category | `5a002` — Apps that use only HTTPS/standard platform APIs for encryption |
| Is crypto registered with US BIS/ERC? | No — exempt per category 5a002 |

### Encryption Usage

1. **Network Communication**: All API calls use HTTPS with TLS 1.2+ (Alamofire/URLSession on iOS, OkHttp on Android via Flutter).
2. **Authentication**: Firebase Auth handles authentication with built-in TLS encryption.
3. **Data at Rest**: Uses platform-standard encryption (iOS Data Protection / Android File-Based Encryption). No custom encryption algorithms.
4. **No custom cryptographic algorithms**: The app solely relies on operating system provided encryption APIs and standard TLS.

### Supporting Evidence

- App uses Firebase SDKs which utilize TLS for all communications
- No custom encryption libraries or algorithms are implemented
- All network requests go through HTTPS endpoints
- Flutter's `http` and `dio` packages configured with TLS defaults
- No encryption export/import functionality exposed

### Submission Notes

When submitting to App Store Connect:
- Select **YES** for "Does your app contain encryption?"
- Select **YES** for "Does your app qualify for any of the exemptions?"
- Select **Category 5a002** — "Apps that use only standard platform encryption APIs and/or HTTPS"
- No additional export documentation required
