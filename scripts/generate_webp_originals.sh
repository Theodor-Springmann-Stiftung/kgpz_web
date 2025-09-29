#!/bin/bash

# Script to generate high-quality WebP versions of original JPEG files
# These will be used for the single page viewer (enlarged view)
# Overwrites existing WebP files for fresh conversion
# Usage: ./scripts/generate_webp_originals.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
QUALITY=95          # WebP quality (0-100) - very high for single page viewer
COMPRESSION=1       # WebP compression level (0-6, lower = less compression, higher quality)
PICTURES_DIR="pictures"

# Check if cwebp is installed
if ! command -v cwebp &> /dev/null; then
    echo -e "${RED}Error: cwebp is not installed. Please install WebP tools:${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install webp"
    echo "  macOS: brew install webp"
    echo "  CentOS/RHEL: sudo yum install libwebp-tools"
    exit 1
fi

# Check if pictures directory exists
if [ ! -d "$PICTURES_DIR" ]; then
    echo -e "${RED}Error: Pictures directory '$PICTURES_DIR' not found${NC}"
    exit 1
fi

echo -e "${BLUE}Generating high-quality WebP originals for single page viewer...${NC}"
echo "Quality: $QUALITY% (near-lossless)"
echo "Compression: $COMPRESSION (minimal compression for maximum quality)"
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
    webp_file="$dir/${name_no_ext}.webp"

    # Check if WebP original already exists
    if [ -f "$webp_file" ]; then
        echo -e "${YELLOW}Overriding existing WebP: $webp_file${NC}"
    fi

    # Convert to high-quality WebP
    echo "Processing: $jpg_file -> $webp_file"

    if cwebp -q "$QUALITY" -m "$COMPRESSION" -alpha_cleanup "$jpg_file" -o "$webp_file" 2>/dev/null; then
        # Check file sizes
        jpg_size=$(stat -f%z "$jpg_file" 2>/dev/null || stat -c%s "$jpg_file" 2>/dev/null)
        webp_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null)

        if [ -n "$jpg_size" ] && [ -n "$webp_size" ]; then
            if [ "$webp_size" -lt "$jpg_size" ]; then
                reduction=$(( (jpg_size - webp_size) * 100 / jpg_size ))
                echo -e "${GREEN}  ✓ Success! Size reduction: ${reduction}%${NC}"
            else
                increase=$(( (webp_size - jpg_size) * 100 / jpg_size ))
                echo -e "${GREEN}  ✓ Success! Size increase: ${increase}% (expected for high quality)${NC}"
            fi
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
export QUALITY COMPRESSION GREEN RED YELLOW BLUE NC

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
webp_files=$(find "$PICTURES_DIR" -type f -name "*.webp" ! -name "*-preview.webp" | wc -l)
processed=$webp_files
skipped=0
errors=$((total_files - processed))

# Final summary
echo ""
echo -e "${BLUE}=== Summary ===${NC}"
echo "Processed: $processed files"
echo "Skipped: $skipped files"
echo "Errors: $errors files"

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}All conversions completed successfully!${NC}"
else
    echo -e "${YELLOW}Completed with $errors errors${NC}"
fi

# Information about file structure
echo ""
echo -e "${BLUE}=== File Structure ===${NC}"
echo "After running this script, you'll have:"
echo "  original.jpg         -> Original JPEG file (fallback)"
echo "  original.webp        -> High-quality WebP (single page viewer)"
echo "  original-preview.webp -> Compressed WebP (layout views)"
echo ""
echo "The backend will prefer .webp files for the single page viewer,"
echo "falling back to .jpg if WebP is not available."

# Calculate total space impact (optional)
echo ""
echo -e "${BLUE}=== Space Analysis ===${NC}"
echo "To analyze space usage:"
echo "  Original JPEGs: find $PICTURES_DIR -name '*.jpg' -exec du -ch {} + | tail -1"
echo "  WebP originals: find $PICTURES_DIR -name '*.webp' ! -name '*-preview.webp' -exec du -ch {} + | tail -1"
echo "  WebP previews:  find $PICTURES_DIR -name '*-preview.webp' -exec du -ch {} + | tail -1"