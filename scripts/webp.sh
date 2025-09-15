#!/bin/bash

# PNG to WebP conversion script with quality set to 80%
# Usage: ./png_to_webp.sh [folder_path]

# Check if folder argument is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 [folder_path]"
    echo "Converts all PNG files in the specified folder to WebP format with 80% quality"
    exit 1
fi

# Check if the folder exists
if [ ! -d "$1" ]; then
    echo "Error: Folder '$1' does not exist."
    exit 1
fi

# Check if cwebp is installed
if ! command -v cwebp &> /dev/null; then
    echo "Error: cwebp is not installed. Please install it with:"
    echo "sudo apt install webp"
    exit 1
fi

# Change to the specified directory
cd "$1"

# Count PNG files
png_count=$(find . -maxdepth 1 -name "*.png" | wc -l)
if [ "$png_count" -eq 0 ]; then
    echo "No PNG files found in the specified folder."
    exit 0
fi

echo "Found $png_count PNG files in '$1'"
echo "Converting to WebP with 80% quality..."

# Convert all PNG files to WebP with 80% quality
converted=0
for file in *.png; do
    if [ -f "$file" ]; then
        output_file="${file%.png}.webp"
        echo "Converting: $file → $output_file"
        cwebp -q 80 "$file" -o "$output_file" > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            echo "✓ Success: $output_file"
            ((converted++))
        else
            echo "✗ Failed to convert: $file"
        fi
    fi
done

echo "Conversion complete: $converted of $png_count files converted successfully."

# Optional: Display file size comparison
if [ "$converted" -gt 0 ]; then
    echo ""
    echo "File size comparison:"
    for file in *.webp; do
        if [ -f "$file" ]; then
            original="${file%.webp}.png"
            if [ -f "$original" ]; then
                original_size=$(du -h "$original" | cut -f1)
                webp_size=$(du -h "$file" | cut -f1)
                echo "$original: $original_size → $file: $webp_size"
            fi
        fi
    done
fi
