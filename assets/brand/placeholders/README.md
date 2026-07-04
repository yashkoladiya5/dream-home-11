# Placeholder Images

Placeholder and state illustrations used across the app.

## Files to Add

| File | Size | Usage |
|---|---|---|
| `loading/v1/loading_placeholder.png` | 64×64 | Used in shimmer/loading states as fallback |
| `error/v1/error_illustration.png` | 400×400 | Generic error state screen |
| `empty/v1/empty_state_illustration.png` | 400×400 | Empty list/data state |
| `network/v1/no_network_illustration.png` | 400×400 | Offline/no connectivity state |
| `avatar/v1/avatar_placeholder.png` | 80×80 | User avatar fallback |
| `team/v1/team_placeholder.png` | 150×150 | Team/group avatar fallback |

## Specs

- **Format**: PNG-24 (lossless)
- **Color space**: sRGB
- **Style**: Flat illustrations matching the brand design system
- **Transparency**: Use alpha channel for rounded corners and soft edges
- **File size**: Keep under 50 KB per image (under 20 KB for avatars)

## Upload Path Convention

```
assets/placeholders/{category}/{version}/{filename}
```

Categories: `loading`, `error`, `empty`, `network`, `avatar`, `team`

## Fallback Behavior

In development mode (no CDN), these are served from the bundled `assets/` directory.
Use `AssetVersion.fallbackAsset()` to reference local copies.
