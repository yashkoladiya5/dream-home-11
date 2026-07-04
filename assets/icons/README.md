# App Icon & Brand Assets Specification

## Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| PrimaryRed | `#D22C2C` | App icon background, primary buttons, brand elements |
| DarkSlate | `#121826` | Background surfaces, text, dark mode base |
| Gold | `#F59E0B` | Accents, highlights, prize indicators, star elements |
| White | `#FFFFFF` | Logo mark, text on red, icon foregrounds |

## Android Adaptive Icons

Generate both layers from `app_icon.svg`:

### Foreground Layer (`mipmap-*/ic_launcher_foreground.png`)
- Full-bleed 108x108 dp in a 72x72 dp viewport (66% circle safe zone)
- Content: House silhouette + "11" text mark — must fit within inner 66% circle
- Colors: White foreground on transparent background
- Padding: 12 dp from edge of the 108 dp bounding box

### Background Layer (`mipmap-*/ic_launcher_background.png`)
- Solid fill: PrimaryRed `#D22C2C`
- Size: 108x108 dp

### Monochrome Layer (Android 13+)
- Single white silhouette of the house+11 mark
- Used for themed icons

## Android Raster Sizes

| Density | DPI | Size | Folder |
|---------|-----|------|--------|
| mdpi | 160 | 48×48 px | `mipmap-mdpi/` |
| hdpi | 240 | 72×72 px | `mipmap-hdpi/` |
| xhdpi | 320 | 96×96 px | `mipmap-xhdpi/` |
| xxhdpi | 480 | 144×144 px | `mipmap-xxhdpi/` |
| xxxhdpi | 640 | 192×192 px | `mipmap-xxxhdpi/` |

**Adaptive icon file paths:**
- `android/app/src/main/res/mipmap-{density}/ic_launcher.webp`
- `android/app/src/main/res/mipmap-{density}/ic_launcher_round.webp`

## iOS App Icon Sizes

Generate from `app_icon.svg` at the following output sizes:

| Size (px) | Filename | Device Context |
|-----------|----------|----------------|
| 20×20 | `AppIcon20x20@1x.png` | iPhone Notification |
| 40×40 | `AppIcon20x20@2x.png` | iPhone Notification @2x |
| 60×60 | `AppIcon20x20@3x.png` | iPhone Notification @3x |
| 29×29 | `AppIcon29x29@1x.png` | iPhone Settings |
| 58×58 | `AppIcon29x29@2x.png` | iPhone Settings @2x |
| 87×87 | `AppIcon29x29@3x.png` | iPhone Settings @3x |
| 40×40 | `AppIcon40x40@1x.png` | iPhone Spotlight |
| 80×80 | `AppIcon40x40@2x.png` | iPhone Spotlight @2x |
| 120×120 | `AppIcon40x40@3x.png` | iPhone Spotlight @3x |
| 60×60 | `AppIcon60x60@2x.png` | iPhone App @2x |
| 120×120 | `AppIcon60x60@2x.png` | iPhone App @2x (actual) |
| 180×180 | `AppIcon60x60@3x.png` | iPhone App @3x |
| 76×76 | `AppIcon76x76@1x.png` | iPad App |
| 152×152 | `AppIcon76x76@2x.png` | iPad App @2x |
| 167×167 | `AppIcon83.5x83.5@2x.png` | iPad Pro App |
| 1024×1024 | `AppIcon1024x1024.png` | App Store (must be PNG, no alpha) |

**iOS asset path:** `ios/Runner/Assets.xcassets/AppIcon.appiconset/`

## Play Store Graphic Assets

| Asset | Size | Format | Notes |
|-------|------|--------|-------|
| App Icon | 512×512 px | 32-bit PNG | Same as 1024 but downscaled, no alpha |
| App Icon (hi-res) | 1024×1024 px | 32-bit PNG | No transparency, full-bleed background |
| Feature Graphic | 1024×500 px | PNG/JPG | No title overlay; brand visual only |
| Phone Screenshots | 1242×2208 px (or native res) | PNG/JPG | Minimum 3, max 8 per device type |

## Feature Graphic Specs
- Background: DarkSlate `#121826` with subtle gradient or pattern
- Left-aligned: House icon + "11" mark in Gold `#F59E0B` and White
- Right side: Optional contest elements (leaderboard, trophy silhouettes)
- No text overlays (Google Play adds title programmatically)
- No more than 20% of the graphic should contain text

## Safe Zones

| Asset | Safe Zone | Notes |
|-------|-----------|-------|
| App icon (all platforms) | Inner 66% of bounding box | Content must not exceed this zone |
| Feature Graphic | 1024×500 center 924×400 | Keep key visual in center |
| Screenshots | Top and bottom 10% | Avoid critical UI in these zones |

## Generation Tools

Recommended: `flutter_launcher_icons` package (`dev_dependencies`):
```yaml
dev_dependencies:
  flutter_launcher_icons: ^0.14.1

flutter_launcher_icons:
  android: true
  ios: true
  image_path: "assets/icons/app_icon.png"
  adaptive_icon_foreground: "assets/icons/app_icon_foreground.png"
  adaptive_icon_background: "#D22C2C"
  adaptive_icon_monochrome: "assets/icons/app_icon_monochrome.png"
  min_sdk_android: 21
```

For production assets:
1. Designer creates final `app_icon.svg` with proper safe zones
2. Export PNGs at all required sizes (use `flutter_launcher_icons` or `iconsurge`/`appicon.co`)
3. Place Android icons in `android/app/src/main/res/mipmap-*`
4. Place iOS icons in Xcode asset catalog
5. Generate Play Store graphics at specified dimensions
