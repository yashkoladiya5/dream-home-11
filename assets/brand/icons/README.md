# App Icon Assets

Master icon source (1024×1024) and platform-specific renders.

## Master Source

Create a 1024×1024 PNG from the design source and place at:

```
icons/app_icon/v1/app_icon_master.png
```

## Required Platform Sizes

### Android

| Size (dp) | File | Generated From |
|---|---|---|
| 48×48 | `app_icon_android_mdpi.png` | Master @ 0.5× |
| 72×72 | `app_icon_android_hdpi.png` | Master @ 0.75× |
| 96×96 | `app_icon_android_xhdpi.png` | Master @ 1× |
| 144×144 | `app_icon_android_xxhdpi.png` | Master @ 1.5× |
| 192×192 | `app_icon_android_xxxhdpi.png` | Master @ 2× |
| 512×512 | `app_icon_android_playstore.png` | Master @ 0.5× |

### iOS

| Size (pt) | File | Generated From |
|---|---|---|
| 40×40 | `app_icon_ios_20pt@2x.png` | Master @ 0.1× |
| 60×60 | `app_icon_ios_20pt@3x.png` | Master @ 0.15× |
| 58×58 | `app_icon_ios_29pt@2x.png` | Master @ 0.15× |
| 87×87 | `app_icon_ios_29pt@3x.png` | Master @ 0.2× |
| 80×80 | `app_icon_ios_40pt@2x.png` | Master @ 0.2× |
| 120×120 | `app_icon_ios_40pt@3x.png` | Master @ 0.3× |
| 120×120 | `app_icon_ios_60pt@2x.png` | Master @ 0.3× |
| 180×180 | `app_icon_ios_60pt@3x.png` | Master @ 0.45× |
| 1024×1024 | `app_icon_ios_marketing.png` | Master @ 1× |

## Upload Path

```
assets/icons/app_icon/{version}/
```

The upload script discovers files recursively, so all generated sizes will be synced.
