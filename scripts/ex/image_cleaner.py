"""
Historical Newspaper Image Cleaning Pipeline

This module provides functions to clean and enhance scanned historical newspaper images
by reducing noise, improving contrast, and sharpening text for better readability.
"""

import cv2
import numpy as np
from PIL import Image, ImageEnhance
import os
import argparse
import json
from pathlib import Path


class NewspaperImageCleaner:
    """
    Image processing pipeline specifically designed for historical newspaper scans.
    """

    def __init__(self, config=None):
        """Initialize with default or custom configuration."""
        self.config = config or self._default_config()

    def _default_config(self):
        """Default processing parameters optimized for newspaper scans."""
        return {
            'bilateral_d': 9,           # Neighborhood diameter for bilateral filter
            'bilateral_sigma_color': 75,  # Filter sigma in color space
            'bilateral_sigma_space': 75,  # Filter sigma in coordinate space
            'clahe_clip_limit': 2.0,    # Contrast limiting for CLAHE
            'clahe_grid_size': (8, 8),  # CLAHE grid size
            'gamma': 1.2,               # Gamma correction value
            'denoise_h': 10,            # Denoising filter strength
            'morph_kernel_size': 2,     # Morphological operation kernel size
            'unsharp_amount': 1.5,      # Unsharp masking amount
            'unsharp_radius': 1.0,      # Unsharp masking radius
            'unsharp_threshold': 0,     # Unsharp masking threshold
        }

    def reduce_noise(self, image):
        """
        Apply noise reduction techniques to remove speckles and JPEG artifacts.

        Args:
            image: Input BGR image

        Returns:
            Denoised image
        """
        # Bilateral filter - preserves edges while reducing noise
        bilateral = cv2.bilateralFilter(
            image,
            self.config['bilateral_d'],
            self.config['bilateral_sigma_color'],
            self.config['bilateral_sigma_space']
        )

        # Non-local means denoising for better noise reduction
        if len(image.shape) == 3:
            # Color image
            denoised = cv2.fastNlMeansDenoisingColored(
                bilateral, None,
                self.config['denoise_h'],
                self.config['denoise_h'],
                7, 21
            )
        else:
            # Grayscale image
            denoised = cv2.fastNlMeansDenoising(
                bilateral, None,
                self.config['denoise_h'],
                7, 21
            )

        return denoised

    def enhance_contrast(self, image):
        """
        Improve image contrast using CLAHE and gamma correction.

        Args:
            image: Input BGR image

        Returns:
            Contrast-enhanced image
        """
        # Convert to LAB color space for better contrast processing
        if len(image.shape) == 3:
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l_channel, a_channel, b_channel = cv2.split(lab)
        else:
            l_channel = image

        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(
            clipLimit=self.config['clahe_clip_limit'],
            tileGridSize=self.config['clahe_grid_size']
        )
        l_channel = clahe.apply(l_channel)

        # Reconstruct image
        if len(image.shape) == 3:
            enhanced = cv2.merge([l_channel, a_channel, b_channel])
            enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        else:
            enhanced = l_channel

        # Apply gamma correction
        gamma = self.config['gamma']
        inv_gamma = 1.0 / gamma
        table = np.array([((i / 255.0) ** inv_gamma) * 255
                         for i in np.arange(0, 256)]).astype("uint8")
        enhanced = cv2.LUT(enhanced, table)

        return enhanced

    def clean_background(self, image):
        """
        Remove small artifacts and clean background noise.

        Args:
            image: Input image

        Returns:
            Background-cleaned image
        """
        # Convert to grayscale for morphological operations
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image

        # Morphological opening to remove small noise
        kernel = np.ones((self.config['morph_kernel_size'],
                         self.config['morph_kernel_size']), np.uint8)

        # Opening (erosion followed by dilation)
        opened = cv2.morphologyEx(gray, cv2.MORPH_OPEN, kernel)

        # If original was color, apply the mask
        if len(image.shape) == 3:
            # Create a mask and apply it to the original color image
            mask = opened > 0
            result = image.copy()
            result[~mask] = [255, 255, 255]  # Set background to white
            return result
        else:
            return opened

    def sharpen_image(self, image):
        """
        Apply unsharp masking to enhance text clarity.

        Args:
            image: Input image

        Returns:
            Sharpened image
        """
        # Convert to float for processing
        float_img = image.astype(np.float32) / 255.0

        # Create Gaussian blur
        radius = self.config['unsharp_radius']
        sigma = radius / 3.0
        blurred = cv2.GaussianBlur(float_img, (0, 0), sigma)

        # Unsharp masking
        amount = self.config['unsharp_amount']
        sharpened = float_img + amount * (float_img - blurred)

        # Threshold and clamp
        threshold = self.config['unsharp_threshold'] / 255.0
        sharpened = np.where(np.abs(float_img - blurred) < threshold,
                           float_img, sharpened)
        sharpened = np.clip(sharpened, 0.0, 1.0)

        return (sharpened * 255).astype(np.uint8)

    def process_image(self, image_path, output_path=None, steps=None):
        """
        Process a single image through the complete pipeline.

        Args:
            image_path: Path to input image
            output_path: Path for output image (optional)
            steps: List of processing steps to apply (optional)

        Returns:
            Processed image array
        """
        if steps is None:
            steps = ['denoise', 'contrast', 'background', 'sharpen']

        # Load image
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Could not load image: {image_path}")

        original = image.copy()

        # Apply processing steps
        if 'denoise' in steps:
            print(f"Applying noise reduction...")
            image = self.reduce_noise(image)

        if 'contrast' in steps:
            print(f"Enhancing contrast...")
            image = self.enhance_contrast(image)

        if 'background' in steps:
            print(f"Cleaning background...")
            image = self.clean_background(image)

        if 'sharpen' in steps:
            print(f"Sharpening image...")
            image = self.sharpen_image(image)

        # Save output if path provided
        if output_path:
            cv2.imwrite(str(output_path), image)
            print(f"Processed image saved to: {output_path}")

        return image, original

    def process_directory(self, input_dir, output_dir, extensions=None):
        """
        Process all images in a directory.

        Args:
            input_dir: Input directory path
            output_dir: Output directory path
            extensions: List of file extensions to process
        """
        if extensions is None:
            extensions = ['.jpg', '.jpeg', '.png', '.tif', '.tiff']

        input_path = Path(input_dir)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        for file_path in input_path.iterdir():
            if file_path.suffix.lower() in extensions:
                print(f"\nProcessing: {file_path.name}")
                output_file = output_path / f"cleaned_{file_path.name}"

                try:
                    self.process_image(file_path, output_file)
                except Exception as e:
                    print(f"Error processing {file_path.name}: {str(e)}")

        print(f"\nBatch processing completed. Results in: {output_dir}")


def create_comparison_image(original, processed, output_path):
    """
    Create a side-by-side comparison image.

    Args:
        original: Original image array
        processed: Processed image array
        output_path: Path to save comparison
    """
    # Resize images to same height if needed
    h1, w1 = original.shape[:2]
    h2, w2 = processed.shape[:2]

    if h1 != h2:
        height = min(h1, h2)
        original = cv2.resize(original, (int(w1 * height / h1), height))
        processed = cv2.resize(processed, (int(w2 * height / h2), height))

    # Create side-by-side comparison
    comparison = np.hstack([original, processed])
    cv2.imwrite(str(output_path), comparison)
    print(f"Comparison saved to: {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Clean historical newspaper images")
    parser.add_argument("input", help="Input image or directory path")
    parser.add_argument("-o", "--output", help="Output path")
    parser.add_argument("-d", "--directory", action="store_true",
                       help="Process entire directory")
    parser.add_argument("-c", "--comparison", action="store_true",
                       help="Create before/after comparison")
    parser.add_argument("--steps", nargs="+",
                       choices=['denoise', 'contrast', 'background', 'sharpen'],
                       default=['denoise', 'contrast', 'background', 'sharpen'],
                       help="Processing steps to apply")
    parser.add_argument("--config", help="JSON config file with custom parameters")

    args = parser.parse_args()

    # Load config if provided
    config = None
    if args.config and os.path.exists(args.config):
        with open(args.config, 'r') as f:
            config = json.load(f)
        # Convert list back to tuple if needed
        if config and 'clahe_grid_size' in config:
            config['clahe_grid_size'] = tuple(config['clahe_grid_size'])
        print(f"Loaded config from: {args.config}")

    cleaner = NewspaperImageCleaner(config)

    if args.directory:
        output_dir = args.output or "cleaned_images"
        cleaner.process_directory(args.input, output_dir)
    else:
        output_path = args.output
        if not output_path:
            input_path = Path(args.input)
            output_path = input_path.parent / f"cleaned_{input_path.name}"

        processed, original = cleaner.process_image(args.input, output_path, args.steps)

        if args.comparison:
            comparison_path = Path(output_path).parent / f"comparison_{Path(args.input).name}"
            create_comparison_image(original, processed, comparison_path)