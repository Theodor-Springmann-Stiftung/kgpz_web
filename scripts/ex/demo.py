#!/usr/bin/env python3
"""
Demo Script for Newspaper Image Cleaning Pipeline

This script demonstrates the cleaning pipeline on the sample images
and shows the available functionality.
"""

import sys
import os
from pathlib import Path

# Add current directory to Python path
sys.path.append(str(Path(__file__).parent))

try:
    from image_cleaner import NewspaperImageCleaner, create_comparison_image
    import cv2
    import numpy as np
    print("✓ All required libraries imported successfully")
except ImportError as e:
    print(f"✗ Import error: {e}")
    print("Please install required packages: pip install -r requirements.txt")
    sys.exit(1)


def demo_single_image(image_path):
    """Demonstrate processing a single image."""
    print(f"\n=== Processing Single Image: {image_path} ===")

    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}")
        return False

    try:
        # Initialize cleaner
        cleaner = NewspaperImageCleaner()

        # Process image
        output_path = f"demo_cleaned_{Path(image_path).name}"
        processed, original = cleaner.process_image(image_path, output_path)

        # Create comparison
        comparison_path = f"demo_comparison_{Path(image_path).name}"
        create_comparison_image(original, processed, comparison_path)

        print(f"✓ Processed image saved: {output_path}")
        print(f"✓ Comparison saved: {comparison_path}")
        return True

    except Exception as e:
        print(f"✗ Error processing {image_path}: {str(e)}")
        return False


def demo_step_by_step(image_path):
    """Demonstrate individual processing steps."""
    print(f"\n=== Step-by-Step Processing: {image_path} ===")

    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}")
        return

    try:
        # Load image
        original = cv2.imread(image_path)
        if original is None:
            print(f"Could not load image: {image_path}")
            return

        # Resize if too large for demo
        height, width = original.shape[:2]
        if height > 1000 or width > 1000:
            scale = min(1000/height, 1000/width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            original = cv2.resize(original, (new_width, new_height))
            print(f"Resized to {new_width}x{new_height} for demo")

        cleaner = NewspaperImageCleaner()

        # Process step by step
        steps = [
            ('original', original),
            ('denoised', cleaner.reduce_noise(original.copy())),
            ('contrast_enhanced', cleaner.enhance_contrast(original.copy())),
            ('background_cleaned', cleaner.clean_background(original.copy())),
            ('sharpened', cleaner.sharpen_image(original.copy()))
        ]

        # Save each step
        for step_name, image in steps:
            output_path = f"demo_step_{step_name}_{Path(image_path).name}"
            cv2.imwrite(output_path, image)
            print(f"✓ Saved {step_name}: {output_path}")

        print("✓ Individual processing steps completed")

    except Exception as e:
        print(f"✗ Error in step-by-step processing: {str(e)}")


def show_image_info():
    """Show information about available images."""
    print("\n=== Available Sample Images ===")

    image_files = []
    for ext in ['*.jpg', '*.jpeg', '*.JPG', '*.JPEG']:
        image_files.extend(Path('.').glob(ext))

    if not image_files:
        print("No image files found in current directory")
        return []

    for img_file in image_files:
        try:
            # Load image to get dimensions
            img = cv2.imread(str(img_file))
            if img is not None:
                height, width = img.shape[:2]
                file_size = img_file.stat().st_size / (1024*1024)  # MB
                print(f"  {img_file.name}: {width}x{height} pixels, {file_size:.1f}MB")
            else:
                print(f"  {img_file.name}: Could not load")
        except Exception as e:
            print(f"  {img_file.name}: Error - {str(e)}")

    return image_files


def main():
    """Main demo function."""
    print("Historical Newspaper Image Cleaning Pipeline - Demo")
    print("=" * 55)

    # Show available images
    image_files = show_image_info()

    if not image_files:
        print("\nNo images found. Please add some image files to test.")
        return

    # Select first image for demo
    sample_image = image_files[0]
    print(f"\nUsing sample image: {sample_image.name}")

    # Demo single image processing
    success = demo_single_image(str(sample_image))

    if success:
        # Demo step-by-step processing
        demo_step_by_step(str(sample_image))

        print(f"\n=== Demo Complete ===")
        print("Generated files:")
        print("  - demo_cleaned_*.jpg (cleaned image)")
        print("  - demo_comparison_*.jpg (before/after comparison)")
        print("  - demo_step_*.jpg (individual processing steps)")

        print(f"\nNext steps:")
        print(f"  - Try: python config_tuner.py {sample_image.name}")
        print(f"  - Try: python batch_process.py")
        print(f"  - Adjust parameters in config.json for better results")

    else:
        print("\nDemo failed. Please check your Python environment and dependencies.")


if __name__ == "__main__":
    main()