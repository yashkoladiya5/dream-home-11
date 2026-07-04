# Brand Assets

This directory stores the source brand assets for Dream Home 11. These assets are uploaded
to the CDN via `deploy/assets/upload-assets.sh` and served from CloudFront.

## Generating Assets

Asset files must be committed as versioned paths under `assets/{category}/{name}/{version}/`.
Before uploading, run the upload script to sync to S3 and generate the manifest.

## Requirements

- All PNG renders must be lossless (PNG-24) at 1x, 2x, and 3x densities
- SVGs must be compressed with SVGO
- Keep master source files (e.g. `.fig`, `.ai`, `.psd`) outside this directory in a
  shared design library

## Categories

- `logo/` — Logo variants (horizontal, square, icon mark)
- `icons/` — App icon renders at required platform sizes
- `placeholders/` — Loading, error, empty-state, and avatar placeholders
- `social/` — Social share and Open Graph images
- See individual `README.md` in each subdirectory for detailed specs.

## CDN Integration

| Environment | CDN Base URL |
|---|---|
| Production  | `https://cdn.dreamhome11.com` |
| Staging     | `https://staging-cdn.dreamhome11.com` |
| Development | Bundled local assets (no CDN) |

Use `CdnManifest.assetUrl('logo_horizontal')` in Dart code to resolve logical names
to full CDN URLs.
