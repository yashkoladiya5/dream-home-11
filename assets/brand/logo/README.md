# Logo Assets

SVG source with PNG renders at 1x, 2x, and 3x for platforms that don't support SVG.

## Files to Add

| File | Type | Size | Notes |
|---|---|---|---|
| `primary/v1/logo_horizontal.svg` | SVG | vector | Master horizontal logo |
| `primary/v1/logo_square.svg` | SVG | vector | Square/stacked logo variant |
| `primary/v1/logo_horizontal.png` | PNG | 512×128 | 1x render |
| `primary/v1/logo_horizontal@2x.png` | PNG | 1024×256 | 2x render |
| `primary/v1/logo_horizontal@3x.png` | PNG | 1536×384 | 3x render |
| `primary/v1/logo_square.png` | PNG | 512×512 | 1x render |
| `mark/v1/brand_mark.svg` | SVG | vector | Icon-only brand mark |
| `mark/v1/brand_mark.png` | PNG | 256×256 | 1x render |

## Format Specs

- **SVG**: Minified with SVGO, viewBox preserved, no external dependencies
- **PNG**: sRGB, lossless (PNG-24), transparent background
- **Colors**: Use exact brand color hex values from design system
- **Clear space**: Maintain minimum clear space of 1/4 the logo height on all sides

## Upload Path Convention

```
assets/logos/primary/{version}/logo_horizontal.png
assets/logos/primary/{version}/logo_square.png
assets/branding/mark/{version}/brand_mark.png
```

Update the version directory name when logo is redesigned.
