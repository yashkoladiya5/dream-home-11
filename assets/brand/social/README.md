# Social Share Images

Open Graph and social sharing images for link previews.

## Files to Add

| File | Size | Usage |
|---|---|---|
| `share/v1/social_share_default.png` | 1200×630 | Default Open Graph image |
| `share/v1/social_share_contest.png` | 1200×630 | Contest share cards |
| `share/v1/social_share_team.png` | 1200×630 | Team invite cards |
| `favicon/v1/favicon.ico` | 32×32 | Browser favicon |
| `favicon/v1/favicon.svg` | vector | SVG favicon alternative |

## Open Graph Specs

- **Dimensions**: 1200×630 pixels (1.91:1 aspect ratio)
- **Format**: PNG-24 (lossless)
- **Max file size**: 300 KB
- **Text safe zone**: Center 600×300 area
- **Branding**: Include logo and brand mark in the safe zone
- **Text**: No user-specific text in the default image (added dynamically via meta tags)

## Upload Path

```
assets/branding/social/{version}/
assets/branding/favicon/{version}/
```

## HTML Meta Tag Reference

When deploying the web app, reference the default OG image as:

```html
<meta property="og:image" content="https://cdn.dreamhome11.com/assets/branding/social/v1/social_share_default.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
```
