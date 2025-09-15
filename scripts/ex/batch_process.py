#!/usr/bin/env python3
"""
Batch Processing Script for Historical Newspaper Images

Simple script to process multiple images with the newspaper cleaning pipeline.
Includes progress tracking and error handling.
"""

import os
import sys
import time
import json
from pathlib import Path
from image_cleaner import NewspaperImageCleaner, create_comparison_image


def process_batch(input_dir=".", output_dir="cleaned", config_file=None,
                 create_comparisons=True, file_pattern="*.jpg"):
    """
    Process all newspaper images in a directory.

    Args:
        input_dir: Directory containing input images
        output_dir: Directory for cleaned images
        config_file: JSON file with custom parameters
        create_comparisons: Whether to create before/after comparisons
        file_pattern: Glob pattern for files to process
    """

    # Load custom config if provided
    config = None
    if config_file and os.path.exists(config_file):
        with open(config_file, 'r') as f:
            config = json.load(f)
        print(f"Loaded custom config from {config_file}")

    # Initialize cleaner
    cleaner = NewspaperImageCleaner(config)

    # Setup paths
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    if create_comparisons:
        comparison_path = output_path / "comparisons"
        comparison_path.mkdir(exist_ok=True)

    # Find all image files
    image_files = list(input_path.glob(file_pattern))
    image_files.extend(input_path.glob("*.jpeg"))
    image_files.extend(input_path.glob("*.JPG"))
    image_files.extend(input_path.glob("*.JPEG"))

    if not image_files:
        print(f"No image files found in {input_dir}")
        return

    print(f"Found {len(image_files)} images to process")
    print(f"Output directory: {output_path.absolute()}")

    # Process each image
    success_count = 0
    error_count = 0
    start_time = time.time()

    for i, img_file in enumerate(image_files, 1):
        print(f"\n[{i}/{len(image_files)}] Processing: {img_file.name}")

        try:
            # Process image
            output_file = output_path / f"cleaned_{img_file.name}"
            processed, original = cleaner.process_image(img_file, output_file)

            # Create comparison if requested
            if create_comparisons:
                comp_file = comparison_path / f"comparison_{img_file.name}"
                create_comparison_image(original, processed, comp_file)

            success_count += 1
            print(f"✓ Completed: {img_file.name}")

        except Exception as e:
            error_count += 1
            print(f"✗ Error processing {img_file.name}: {str(e)}")

    # Summary
    elapsed_time = time.time() - start_time
    print(f"\n" + "="*50)
    print(f"Batch Processing Complete")
    print(f"{"="*50}")
    print(f"Successfully processed: {success_count}")
    print(f"Errors: {error_count}")
    print(f"Total time: {elapsed_time:.1f} seconds")
    print(f"Average time per image: {elapsed_time/len(image_files):.1f} seconds")
    print(f"Output directory: {output_path.absolute()}")


def create_sample_config():
    """Create a sample configuration file for customization."""
    config = {
        "bilateral_d": 9,
        "bilateral_sigma_color": 75,
        "bilateral_sigma_space": 75,
        "clahe_clip_limit": 2.0,
        "clahe_grid_size": [8, 8],
        "gamma": 1.2,
        "denoise_h": 10,
        "morph_kernel_size": 2,
        "unsharp_amount": 1.5,
        "unsharp_radius": 1.0,
        "unsharp_threshold": 0
    }

    with open("config.json", "w") as f:
        json.dump(config, f, indent=4)

    print("Created config.json with default parameters.")
    print("Edit this file to customize processing settings.")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Batch process historical newspaper images",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python batch_process.py                    # Process current directory
  python batch_process.py -i scans -o clean # Process 'scans' folder
  python batch_process.py --no-comparisons  # Skip comparison images
  python batch_process.py --config custom.json  # Use custom settings
        """
    )

    parser.add_argument("-i", "--input", default=".",
                       help="Input directory (default: current directory)")
    parser.add_argument("-o", "--output", default="cleaned",
                       help="Output directory (default: cleaned)")
    parser.add_argument("-c", "--config",
                       help="JSON config file with custom parameters")
    parser.add_argument("--no-comparisons", action="store_true",
                       help="Skip creating before/after comparison images")
    parser.add_argument("--pattern", default="*.jpg",
                       help="File pattern to match (default: *.jpg)")
    parser.add_argument("--create-config", action="store_true",
                       help="Create sample config file and exit")

    args = parser.parse_args()

    if args.create_config:
        create_sample_config()
        sys.exit(0)

    process_batch(
        input_dir=args.input,
        output_dir=args.output,
        config_file=args.config,
        create_comparisons=not args.no_comparisons,
        file_pattern=args.pattern
    )