# CDN Configuration Guide

## CloudFlare Setup (Recommended)

### Step 1: Add Domain

1. Sign up at https://cloudflare.com
2. Add your domain
3. Update nameservers at your domain registrar

### Step 2: Configure Cache Rules

Create page rules for video files:

```
URL Pattern: *.mp4
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 day
```

```
URL Pattern: *.m3u8
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 5 minutes
  - Browser Cache TTL: 1 minute
```

```
URL Pattern: *.ts
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 day
```

### Step 3: Enable Optimizations

- Speed > Optimization > Auto Minify: Enable
- Speed > Optimization > Rocket Loader: Enable
- Network > HTTP/3: Enable

### Step 4: Configure CORS

Add custom headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Range, Content-Type
```

## AWS CloudFront Setup

See VIDEO_DELIVERY_OPTIMIZATION.md for detailed configuration.

## Testing

```bash
# Test cache status
curl -I https://your-cdn.com/video.mp4 | grep -i cache

# Expected: CF-Cache-Status: HIT
```
