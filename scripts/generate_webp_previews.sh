#!/bin/bash

# Script to generate WebP preview images from existing JPEG files
# Resizes images to 50% and applies high compression for fast layout loading
# Usage: ./scripts/generate_webp_previews.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
QUALITY=75          # WebP quality (0-100)
COMPRESSION=6       # WebP compression level (0-6, higher = better compression)
PICTURES_DIR="pictures"

# Check if cwebp is installed
if ! command -v cwebp &> /dev/null; then
    echo -e "${RED}Error: cwebp is not installed. Please install WebP tools:${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install webp"
    echo "  macOS: brew install webp"
    echo "  CentOS/RHEL: sudo yum install libwebp-tools"
    exit 1
fi

# Check if ImageMagick identify is installed (for resizing)
if ! command -v identify &> /dev/null; then
    echo -e "${YELLOW}Warning: ImageMagick identify not found. Resizing will be skipped.${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo "  CentOS/RHEL: sudo yum install ImageMagick"
    echo ""
fi

# Check if pictures directory exists
if [ ! -d "$PICTURES_DIR" ]; then
    echo -e "${RED}Error: Pictures directory '$PICTURES_DIR' not found${NC}"
    exit 1
fi

echo -e "${GREEN}Generating WebP preview images...${NC}"
echo "Quality: $QUALITY%"
echo "Compression: $COMPRESSION"
echo "Resize: 50% (for faster loading)"
echo ""

# Counters
processed=0
skipped=0
errors=0

# Function to process a single file
process_file() {
    local jpg_file="$1"

    # Skip if already a preview file
    if [[ "$jpg_file" =~ -preview\.(jpg|jpeg)$ ]]; then
        return 0
    fi

    # Generate output filename
    dir=$(dirname "$jpg_file")
    filename=$(basename "$jpg_file")
    name_no_ext="${filename%.*}"
    webp_file="$dir/${name_no_ext}-preview.webp"

    # Check if WebP preview already exists
    if [ -f "$webp_file" ]; then
        echo -e "${YELLOW}Overriding existing preview: $webp_file${NC}"
    fi

    # Get image dimensions and calculate 50%
    dimensions=$(identify -ping -format "%w %h" "$jpg_file" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$dimensions" ]; then
        width=$(echo $dimensions | cut -d' ' -f1)
        height=$(echo $dimensions | cut -d' ' -f2)
        new_width=$((width / 2))
        new_height=$((height / 2))
        resize_params="-resize $new_width $new_height"
        echo "Processing: $jpg_file -> $webp_file (${width}x${height} → ${new_width}x${new_height})"
    else
        # Fallback: no resizing if we can't get dimensions
        resize_params=""
        echo "Processing: $jpg_file -> $webp_file (no resize - couldn't get dimensions)"
    fi

    # Convert to WebP
    if cwebp -q "$QUALITY" -m "$COMPRESSION" $resize_params "$jpg_file" -o "$webp_file" 2>/dev/null; then
        # Check file sizes
        jpg_size=$(stat -f%z "$jpg_file" 2>/dev/null || stat -c%s "$jpg_file" 2>/dev/null)
        webp_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null)

        if [ -n "$jpg_size" ] && [ -n "$webp_size" ]; then
            reduction=$(( (jpg_size - webp_size) * 100 / jpg_size ))
            echo -e "${GREEN}  ✓ Success! Size reduction: ${reduction}%${NC}"
        else
            echo -e "${GREEN}  ✓ Success!${NC}"
        fi
        return 0
    else
        echo -e "${RED}  ✗ Failed to convert $jpg_file${NC}"
        return 1
    fi
}

# Export the function and variables for parallel execution
export -f process_file
export QUALITY COMPRESSION GREEN RED YELLOW NC

# Detect number of CPU cores for parallel processing
CPU_CORES=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)
PARALLEL_JOBS=$((CPU_CORES))

echo "Using $PARALLEL_JOBS parallel jobs (detected $CPU_CORES CPU cores)"
echo ""

# Find all JPG files and process them in parallel
find "$PICTURES_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" \) | \
    grep -v -E '\-preview\.(jpg|jpeg)$' | \
    xargs -n 1 -P "$PARALLEL_JOBS" -I {} bash -c 'process_file "$@"' _ {}

# Wait for all background processes to complete
wait

# Count actual results
total_files=$(find "$PICTURES_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" \) | grep -v -E '\-preview\.(jpg|jpeg)$' | wc -l)
preview_files=$(find "$PICTURES_DIR" -type f -name "*-preview.webp" | wc -l)
processed=$preview_files
skipped=0
errors=$((total_files - processed))

# Final summary
echo ""
echo -e "${GREEN}=== Summary ===${NC}"
echo "Processed: $processed files"
echo "Skipped: $skipped files"
echo "Errors: $errors files"

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}All conversions completed successfully!${NC}"
else
    echo -e "${YELLOW}Completed with $errors errors${NC}"
fi

# Calculate total space saved (optional)
echo ""
echo "To see space savings, run:"
echo "  find $PICTURES_DIR -name '*-preview.webp' -exec du -ch {} + | tail -1"
echo "  find $PICTURES_DIR -name '*.jpg' -exec du -ch {} + | tail -1"