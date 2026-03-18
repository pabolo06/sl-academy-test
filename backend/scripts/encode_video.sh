#!/bin/bash
# SL Academy Platform - Video Encoding Script
# Creates HLS stream with multiple bitrates for adaptive streaming

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}Error: FFmpeg is not installed${NC}"
    echo "Install FFmpeg:"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  macOS: brew install ffmpeg"
    echo "  Windows: Download from https://ffmpeg.org/download.html"
    exit 1
fi

# Check arguments
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <input_video> <output_directory> [options]"
    echo ""
    echo "Options:"
    echo "  --qualities <low|medium|high|all>  Quality levels to generate (default: all)"
    echo "  --format <hls|mp4>                 Output format (default: hls)"
    echo ""
    echo "Examples:"
    echo "  $0 input.mp4 output/"
    echo "  $0 input.mp4 output/ --qualities medium,high"
    echo "  $0 input.mp4 output/ --format mp4"
    exit 1
fi

INPUT_VIDEO=$1
OUTPUT_DIR=$2
QUALITIES="all"
FORMAT="hls"

# Parse optional arguments
shift 2
while [[ $# -gt 0 ]]; do
    case $1 in
        --qualities)
            QUALITIES="$2"
            shift 2
            ;;
        --format)
            FORMAT="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Validate input file
if [ ! -f "$INPUT_VIDEO" ]; then
    echo -e "${RED}Error: Input file not found: $INPUT_VIDEO${NC}"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${GREEN}Starting video encoding...${NC}"
echo "Input: $INPUT_VIDEO"
echo "Output: $OUTPUT_DIR"
echo "Format: $FORMAT"
echo "Qualities: $QUALITIES"
echo ""

# Get video info
echo -e "${YELLOW}Analyzing input video...${NC}"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$INPUT_VIDEO"

if [ "$FORMAT" == "hls" ]; then
    echo -e "${YELLOW}Generating HLS stream with adaptive bitrate...${NC}"
    
    # Generate HLS with multiple quality levels
    ffmpeg -i "$INPUT_VIDEO" \
      -filter_complex \
      "[0:v]split=3[v1][v2][v3]; \
       [v1]scale=w=640:h=360[v1out]; \
       [v2]scale=w=1280:h=720[v2out]; \
       [v3]scale=w=1920:h=1080[v3out]" \
      -map "[v1out]" -c:v:0 libx264 -b:v:0 800k -maxrate 856k -bufsize 1200k -preset fast -profile:v:0 baseline -level 3.0 \
      -map "[v2out]" -c:v:1 libx264 -b:v:1 2800k -maxrate 2996k -bufsize 4200k -preset fast -profile:v:1 main -level 4.0 \
      -map "[v3out]" -c:v:2 libx264 -b:v:2 5000k -maxrate 5350k -bufsize 7500k -preset fast -profile:v:2 high -level 4.2 \
      -map 0:a -c:a aac -b:a 128k -ac 2 \
      -f hls \
      -hls_time 6 \
      -hls_playlist_type vod \
      -hls_segment_filename "$OUTPUT_DIR/segment_%v_%03d.ts" \
      -master_pl_name master.m3u8 \
      -var_stream_map "v:0,a:0 v:1,a:0 v:2,a:0" \
      "$OUTPUT_DIR/stream_%v.m3u8"
    
    echo -e "${GREEN}✓ HLS stream generated successfully${NC}"
    echo "Master playlist: $OUTPUT_DIR/master.m3u8"
    echo "Quality levels:"
    echo "  - 360p (800 Kbps): $OUTPUT_DIR/stream_0.m3u8"
    echo "  - 720p (2.8 Mbps): $OUTPUT_DIR/stream_1.m3u8"
    echo "  - 1080p (5 Mbps): $OUTPUT_DIR/stream_2.m3u8"
    
elif [ "$FORMAT" == "mp4" ]; then
    echo -e "${YELLOW}Generating optimized MP4...${NC}"
    
    # Generate single MP4 optimized for web
    ffmpeg -i "$INPUT_VIDEO" \
      -c:v libx264 \
      -preset slow \
      -crf 23 \
      -c:a aac \
      -b:a 128k \
      -movflags +faststart \
      -pix_fmt yuv420p \
      "$OUTPUT_DIR/output.mp4"
    
    echo -e "${GREEN}✓ MP4 generated successfully${NC}"
    echo "Output: $OUTPUT_DIR/output.mp4"
    
else
    echo -e "${RED}Error: Unknown format: $FORMAT${NC}"
    exit 1
fi

# Get output file sizes
echo ""
echo -e "${YELLOW}Output file sizes:${NC}"
du -h "$OUTPUT_DIR"/* | sort -h

echo ""
echo -e "${GREEN}Encoding complete!${NC}"
