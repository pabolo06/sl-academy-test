# Video Delivery Optimization

## Overview

This document outlines the video delivery optimization strategy for the SL Academy Platform, including CDN configuration, adaptive bitrate streaming, and video preloading.

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     Cache Miss     ┌──────────────┐
│  CDN Edge   │ ─────────────────> │ Origin Server│
│   (Cache)   │ <───────────────── │  (Supabase)  │
└─────────────┘     Video File     └──────────────┘
       │
       │ Cached Video
       ▼
┌─────────────┐
│ Video Player│
│  (Browser)  │
└─────────────┘
```

## CDN Configuration

### 1. CloudFlare CDN Setup

**Recommended CDN**: CloudFlare (free tier available)

#### Benefits
- Global edge network (200+ locations)
- Automatic video optimization
- DDoS protection
- Analytics and monitoring
- Free SSL/TLS

#### Configuration Steps

1. **Add Domain to CloudFlare**
   ```bash
   # Point your domain to CloudFlare nameservers
   # CloudFlare will provide nameservers after signup
   ```

2. **Configure Cache Rules**
   
   Create page rule for video files:
   ```
   URL Pattern: *.mp4, *.webm, *.m3u8, *.ts
   Settings:
     - Cache Level: Cache Everything
     - Edge Cache TTL: 1 month
     - Browser Cache TTL: 1 day
     - Origin Cache Control: On
   ```

3. **Enable Video Optimization**
   ```
   Speed > Optimization > Auto Minify
   - Enable for HTML, CSS, JS
   
   Speed > Optimization > Rocket Loader
   - Enable
   
   Speed > Optimization > Mirage
   - Enable (lazy loads images/videos)
   ```

4. **Configure CORS**
   ```
   Network > CORS
   - Allow Origin: your-frontend-domain.com
   - Allow Methods: GET, HEAD, OPTIONS
   - Allow Headers: Range, Content-Type
   ```

### 2. AWS CloudFront Setup

**Alternative**: AWS CloudFront (if using AWS infrastructure)

#### Configuration

```yaml
# cloudfront-distribution.yaml
Distribution:
  Origins:
    - DomainName: your-supabase-storage.supabase.co
      Id: supabase-storage
      CustomOriginConfig:
        HTTPPort: 80
        HTTPSPort: 443
        OriginProtocolPolicy: https-only
  
  DefaultCacheBehavior:
    TargetOriginId: supabase-storage
    ViewerProtocolPolicy: redirect-to-https
    AllowedMethods:
      - GET
      - HEAD
      - OPTIONS
    CachedMethods:
      - GET
      - HEAD
    ForwardedValues:
      QueryString: false
      Headers:
        - Origin
        - Access-Control-Request-Method
        - Access-Control-Request-Headers
      Cookies:
        Forward: none
    MinTTL: 0
    DefaultTTL: 86400  # 1 day
    MaxTTL: 31536000   # 1 year
    Compress: true
  
  PriceClass: PriceClass_100  # Use only North America and Europe
  Enabled: true
```

### 3. Supabase Storage Configuration

**Configure Supabase Storage for CDN**

```sql
-- Enable public access for video bucket
CREATE POLICY "Public video access"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Set cache headers for video files
UPDATE storage.buckets
SET public = true,
    file_size_limit = 524288000,  -- 500MB
    allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'application/x-mpegURL', 'video/MP2T']
WHERE id = 'videos';
```

## Adaptive Bitrate Streaming (ABR)

### 1. HLS (HTTP Live Streaming)

**Recommended format**: HLS with multiple quality levels

#### Video Encoding

Use FFmpeg to create multiple quality levels:

```bash
#!/bin/bash
# encode_video.sh - Create HLS stream with multiple bitrates

INPUT_VIDEO=$1
OUTPUT_DIR=$2

# Create output directory
mkdir -p $OUTPUT_DIR

# Generate multiple quality levels
ffmpeg -i $INPUT_VIDEO \
  -filter_complex \
  "[0:v]split=3[v1][v2][v3]; \
   [v1]scale=w=640:h=360[v1out]; \
   [v2]scale=w=1280:h=720[v2out]; \
   [v3]scale=w=1920:h=1080[v3out]" \
  -map "[v1out]" -c:v:0 libx264 -b:v:0 800k -maxrate 856k -bufsize 1200k \
  -map "[v2out]" -c:v:1 libx264 -b:v:1 2800k -maxrate 2996k -bufsize 4200k \
  -map "[v3out]" -c:v:2 libx264 -b:v:2 5000k -maxrate 5350k -bufsize 7500k \
  -map 0:a -c:a aac -b:a 128k -ac 2 \
  -f hls \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_segment_filename "$OUTPUT_DIR/segment_%v_%03d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:0 v:2,a:0" \
  "$OUTPUT_DIR/stream_%v.m3u8"
```

#### Quality Levels

| Quality | Resolution | Bitrate | Use Case |
|---------|------------|---------|----------|
| Low (360p) | 640x360 | 800 Kbps | Mobile, slow connections |
| Medium (720p) | 1280x720 | 2.8 Mbps | Desktop, good connections |
| High (1080p) | 1920x1080 | 5 Mbps | Desktop, fast connections |

### 2. Frontend Implementation

**Update VideoPlayer component to support HLS**

```typescript
// frontend/components/VideoPlayer.tsx
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  videoUrl: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export function VideoPlayer({ videoUrl, onProgress, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [quality, setQuality] = useState<string>('auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check if HLS is supported
    if (videoUrl.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });

        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // Get available quality levels
          const levels = hls.levels.map((level, index) => ({
            index,
            height: level.height,
            bitrate: level.bitrate,
          }));

          setAvailableQualities(
            levels.map(l => `${l.height}p`)
          );

          // Auto quality by default
          hls.currentLevel = -1;
        });

        hlsRef.current = hls;

        return () => {
          hls.destroy();
        };
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = videoUrl;
      }
    } else {
      // Regular video file
      video.src = videoUrl;
    }
  }, [videoUrl]);

  const handleQualityChange = (qualityIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = qualityIndex;
      setQuality(qualityIndex === -1 ? 'auto' : `${hlsRef.current.levels[qualityIndex].height}p`);
    }
  };

  const handleProgress = () => {
    const video = videoRef.current;
    if (!video) return;

    const progress = (video.currentTime / video.duration) * 100;
    onProgress?.(progress);

    // Save progress to localStorage
    localStorage.setItem(`video_progress_${videoUrl}`, video.currentTime.toString());
  };

  const handleEnded = () => {
    onComplete?.();
    localStorage.removeItem(`video_progress_${videoUrl}`);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Restore saved progress
    const savedProgress = localStorage.getItem(`video_progress_${videoUrl}`);
    if (savedProgress) {
      video.currentTime = parseFloat(savedProgress);
    }
  }, [videoUrl]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        controls
        className="w-full rounded-lg"
        onTimeUpdate={handleProgress}
        onEnded={handleEnded}
        playsInline
      />
      
      {availableQualities.length > 0 && (
        <div className="absolute top-4 right-4 bg-black/70 rounded px-3 py-2">
          <select
            value={quality}
            onChange={(e) => {
              const index = e.target.value === 'auto' ? -1 : 
                availableQualities.indexOf(e.target.value);
              handleQualityChange(index);
            }}
            className="bg-transparent text-white text-sm"
          >
            <option value="auto">Auto</option>
            {availableQualities.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
```

### 3. Install HLS.js

```bash
cd frontend
npm install hls.js
npm install --save-dev @types/hls.js
```

## Video Preloading Strategy

### 1. Preload Next Lesson

**Implement intelligent preloading**

```typescript
// frontend/lib/video-preloader.ts
export class VideoPreloader {
  private preloadedVideos: Map<string, boolean> = new Map();

  preloadVideo(videoUrl: string) {
    if (this.preloadedVideos.has(videoUrl)) {
      return;
    }

    // Create link element for preloading
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = videoUrl;
    document.head.appendChild(link);

    this.preloadedVideos.set(videoUrl, true);
  }

  preloadNextLesson(currentLessonId: string, lessons: Lesson[]) {
    const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
    if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
      const nextLesson = lessons[currentIndex + 1];
      this.preloadVideo(nextLesson.video_url);
    }
  }

  clearPreloaded() {
    this.preloadedVideos.clear();
  }
}

export const videoPreloader = new VideoPreloader();
```

### 2. Use in Lesson Page

```typescript
// frontend/app/lessons/[lessonId]/page.tsx
import { videoPreloader } from '@/lib/video-preloader';

export default function LessonPage({ params }: { params: { lessonId: string } }) {
  const { data: lesson } = useLesson(params.lessonId);
  const { data: lessons } = useLessons(lesson?.track_id);

  useEffect(() => {
    if (lesson && lessons) {
      // Preload next lesson video
      videoPreloader.preloadNextLesson(lesson.id, lessons);
    }
  }, [lesson, lessons]);

  // ... rest of component
}
```

## Video Optimization Best Practices

### 1. Video Encoding Settings

**Recommended FFmpeg settings**:

```bash
# Optimize for web delivery
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 23 \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  -pix_fmt yuv420p \
  output.mp4
```

**Key settings**:
- `-preset slow`: Better compression (slower encoding)
- `-crf 23`: Constant quality (18-28 range, lower = better)
- `-movflags +faststart`: Enable progressive download
- `-pix_fmt yuv420p`: Maximum compatibility

### 2. Video Compression

| Setting | Value | Purpose |
|---------|-------|---------|
| Codec | H.264 (libx264) | Wide compatibility |
| Container | MP4 | Universal support |
| Audio Codec | AAC | Best quality/size ratio |
| Audio Bitrate | 128 Kbps | Good quality for speech |
| Pixel Format | yuv420p | Maximum compatibility |

### 3. File Size Targets

| Duration | 360p | 720p | 1080p |
|----------|------|------|-------|
| 5 min | 30 MB | 100 MB | 180 MB |
| 10 min | 60 MB | 200 MB | 360 MB |
| 20 min | 120 MB | 400 MB | 720 MB |

## Performance Monitoring

### 1. Video Metrics

Track these metrics:

```typescript
// frontend/lib/video-analytics.ts
export interface VideoMetrics {
  videoId: string;
  startTime: number;
  bufferingTime: number;
  qualitySwitches: number;
  averageBitrate: number;
  completionRate: number;
}

export function trackVideoMetrics(video: HTMLVideoElement, videoId: string) {
  const metrics: VideoMetrics = {
    videoId,
    startTime: Date.now(),
    bufferingTime: 0,
    qualitySwitches: 0,
    averageBitrate: 0,
    completionRate: 0,
  };

  let lastBufferTime = 0;

  video.addEventListener('waiting', () => {
    lastBufferTime = Date.now();
  });

  video.addEventListener('playing', () => {
    if (lastBufferTime > 0) {
      metrics.bufferingTime += Date.now() - lastBufferTime;
      lastBufferTime = 0;
    }
  });

  video.addEventListener('ended', () => {
    metrics.completionRate = 100;
    sendMetrics(metrics);
  });

  return metrics;
}
```

### 2. CDN Analytics

Monitor via CloudFlare dashboard:
- Cache hit rate (target: 90%+)
- Bandwidth usage
- Request count by location
- Error rates

## Troubleshooting

### Video Not Playing

1. **Check CORS headers**:
   ```bash
   curl -I https://your-cdn.com/video.mp4
   # Should include: Access-Control-Allow-Origin: *
   ```

2. **Check video format**:
   ```bash
   ffprobe video.mp4
   # Verify codec: h264, container: mp4
   ```

3. **Check CDN cache**:
   ```bash
   curl -I https://your-cdn.com/video.mp4
   # Look for: CF-Cache-Status: HIT
   ```

### Buffering Issues

1. **Reduce quality**: Lower bitrate for slow connections
2. **Check CDN**: Ensure CDN is serving from nearby edge
3. **Optimize encoding**: Use better compression settings
4. **Enable preloading**: Preload next segments

### Quality Switching Issues

1. **Check HLS manifest**: Verify all quality levels are available
2. **Monitor bandwidth**: Ensure sufficient bandwidth for quality
3. **Check player logs**: Look for HLS.js errors in console

## Implementation Checklist

- [ ] Set up CDN (CloudFlare or CloudFront)
- [ ] Configure cache rules for video files
- [ ] Enable CORS for video requests
- [ ] Encode videos in multiple quality levels
- [ ] Generate HLS manifests for adaptive streaming
- [ ] Update VideoPlayer component with HLS.js
- [ ] Implement quality selector UI
- [ ] Add video preloading for next lesson
- [ ] Track video metrics and analytics
- [ ] Test video playback on different devices
- [ ] Monitor CDN cache hit rates
- [ ] Document video upload and encoding process

## Cost Estimation

### CloudFlare (Free Tier)
- Bandwidth: Unlimited
- Requests: Unlimited
- Cache: Unlimited
- Cost: $0/month

### AWS CloudFront
- Bandwidth: $0.085/GB (first 10 TB)
- Requests: $0.0075/10,000 requests
- Estimated: $50-200/month (depends on usage)

### Video Storage (Supabase)
- Storage: $0.021/GB/month
- Bandwidth: $0.09/GB
- Estimated: $20-100/month (depends on library size)

## References

- [HLS.js Documentation](https://github.com/video-dev/hls.js/)
- [CloudFlare Video Optimization](https://developers.cloudflare.com/stream/)
- [FFmpeg Video Encoding Guide](https://trac.ffmpeg.org/wiki/Encode/H.264)
- [Adaptive Bitrate Streaming](https://en.wikipedia.org/wiki/Adaptive_bitrate_streaming)
- [Video Optimization Best Practices](https://web.dev/fast/#optimize-your-videos)
