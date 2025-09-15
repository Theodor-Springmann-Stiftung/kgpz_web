#!/usr/bin/env python3
"""
Interactive Parameter Tuning Tool for Newspaper Image Cleaning

This tool helps you find optimal parameters for your specific images
by providing an interactive tuning interface.
"""

import cv2
import json
import numpy as np
from pathlib import Path
from image_cleaner import NewspaperImageCleaner


class ParameterTuner:
    """Interactive parameter tuning for image cleaning pipeline."""

    def __init__(self, sample_image_path):
        """Initialize with a sample image for tuning."""
        self.original = cv2.imread(str(sample_image_path))
        if self.original is None:
            raise ValueError(f"Could not load image: {sample_image_path}")

        # Resize large images for faster processing during tuning
        height, width = self.original.shape[:2]
        if height > 1500 or width > 1500:
            scale = min(1500/height, 1500/width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            self.original = cv2.resize(self.original, (new_width, new_height))
            print(f"Resized image to {new_width}x{new_height} for faster tuning")

        self.current_params = self._get_default_params()
        self.cleaner = NewspaperImageCleaner(self.current_params)

    def _get_default_params(self):
        """Get default parameters as starting point."""
        return {
            'bilateral_d': 9,
            'bilateral_sigma_color': 75,
            'bilateral_sigma_space': 75,
            'clahe_clip_limit': 2.0,
            'clahe_grid_size': (8, 8),
            'gamma': 1.2,
            'denoise_h': 10,
            'morph_kernel_size': 2,
            'unsharp_amount': 1.5,
            'unsharp_radius': 1.0,
            'unsharp_threshold': 0,
        }

    def update_parameter(self, param_name, value):
        """Update a single parameter and refresh the cleaner."""
        if param_name in self.current_params:
            # Handle special cases
            if param_name == 'clahe_grid_size':
                self.current_params[param_name] = (int(value), int(value))
            else:
                self.current_params[param_name] = value

            # Update cleaner with new parameters
            self.cleaner = NewspaperImageCleaner(self.current_params)
            print(f"Updated {param_name} = {value}")

    def process_with_current_params(self, steps=None):
        """Process the sample image with current parameters."""
        if steps is None:
            steps = ['denoise', 'contrast', 'background', 'sharpen']

        image = self.original.copy()

        # Apply processing steps
        if 'denoise' in steps:
            image = self.cleaner.reduce_noise(image)

        if 'contrast' in steps:
            image = self.cleaner.enhance_contrast(image)

        if 'background' in steps:
            image = self.cleaner.clean_background(image)

        if 'sharpen' in steps:
            image = self.cleaner.sharpen_image(image)

        return image

    def create_comparison(self, steps=None):
        """Create side-by-side comparison with current parameters."""
        processed = self.process_with_current_params(steps)

        # Create side-by-side comparison
        height = max(self.original.shape[0], processed.shape[0])
        comparison = np.hstack([
            cv2.resize(self.original, (self.original.shape[1], height)),
            cv2.resize(processed, (processed.shape[1], height))
        ])

        return comparison

    def save_comparison(self, output_path, steps=None):
        """Save comparison image to file."""
        comparison = self.create_comparison(steps)
        cv2.imwrite(str(output_path), comparison)
        print(f"Comparison saved to: {output_path}")

    def save_config(self, config_path):
        """Save current parameters to JSON config file."""
        # Convert tuple to list for JSON serialization
        config_to_save = self.current_params.copy()
        if 'clahe_grid_size' in config_to_save:
            config_to_save['clahe_grid_size'] = list(config_to_save['clahe_grid_size'])

        with open(config_path, 'w') as f:
            json.dump(config_to_save, f, indent=4)
        print(f"Configuration saved to: {config_path}")

    def load_config(self, config_path):
        """Load parameters from JSON config file."""
        with open(config_path, 'r') as f:
            loaded_params = json.load(f)

        # Convert list back to tuple if needed
        if 'clahe_grid_size' in loaded_params:
            loaded_params['clahe_grid_size'] = tuple(loaded_params['clahe_grid_size'])

        self.current_params.update(loaded_params)
        self.cleaner = NewspaperImageCleaner(self.current_params)
        print(f"Configuration loaded from: {config_path}")

    def interactive_tune(self):
        """Start interactive tuning session."""
        print("\n" + "="*60)
        print("INTERACTIVE PARAMETER TUNING")
        print("="*60)
        print("Commands:")
        print("  set <param> <value>  - Set parameter value")
        print("  show                 - Show current parameters")
        print("  test [steps]         - Test current parameters")
        print("  save <file>          - Save configuration to file")
        print("  load <file>          - Load configuration from file")
        print("  compare [file]       - Save comparison image")
        print("  presets              - Show parameter presets")
        print("  help                 - Show this help")
        print("  quit                 - Exit tuning")
        print("\nParameters you can adjust:")
        for param in self.current_params:
            print(f"  {param}")

        while True:
            try:
                command = input("\ntuner> ").strip().split()
                if not command:
                    continue

                cmd = command[0].lower()

                if cmd == 'quit' or cmd == 'exit':
                    break

                elif cmd == 'show':
                    self._show_parameters()

                elif cmd == 'set' and len(command) >= 3:
                    param = command[1]
                    try:
                        value = float(command[2]) if '.' in command[2] else int(command[2])
                    except ValueError:
                        value = command[2]
                    self.update_parameter(param, value)

                elif cmd == 'test':
                    steps = command[1:] if len(command) > 1 else None
                    print("Processing with current parameters...")
                    processed = self.process_with_current_params(steps)
                    print(f"Processed image shape: {processed.shape}")

                elif cmd == 'save' and len(command) > 1:
                    self.save_config(command[1])

                elif cmd == 'load' and len(command) > 1:
                    self.load_config(command[1])

                elif cmd == 'compare':
                    output = command[1] if len(command) > 1 else "tuning_comparison.jpg"
                    self.save_comparison(output)

                elif cmd == 'presets':
                    self._show_presets()

                elif cmd == 'help':
                    self._show_help()

                else:
                    print("Unknown command. Type 'help' for available commands.")

            except KeyboardInterrupt:
                print("\nExiting tuner...")
                break
            except Exception as e:
                print(f"Error: {str(e)}")

    def _show_parameters(self):
        """Display current parameter values."""
        print("\nCurrent Parameters:")
        print("-" * 30)
        for param, value in self.current_params.items():
            print(f"  {param:<20} = {value}")

    def _show_presets(self):
        """Show preset configurations for different image types."""
        presets = {
            "light_cleaning": {
                "bilateral_d": 5,
                "denoise_h": 5,
                "clahe_clip_limit": 1.5,
                "gamma": 1.1,
                "unsharp_amount": 1.2
            },
            "heavy_cleaning": {
                "bilateral_d": 15,
                "denoise_h": 15,
                "clahe_clip_limit": 3.0,
                "gamma": 1.3,
                "unsharp_amount": 2.0
            },
            "high_contrast": {
                "clahe_clip_limit": 4.0,
                "gamma": 1.4,
                "unsharp_amount": 2.5
            }
        }

        print("\nAvailable Presets:")
        print("-" * 30)
        for name, params in presets.items():
            print(f"{name}:")
            for param, value in params.items():
                print(f"  {param} = {value}")
            print()

    def _show_help(self):
        """Show detailed help information."""
        help_text = """
Parameter Descriptions:
-----------------------
bilateral_d          : Neighborhood diameter for bilateral filtering (5-15)
bilateral_sigma_color: Filter sigma in color space (50-150)
bilateral_sigma_space: Filter sigma in coordinate space (50-150)
clahe_clip_limit     : Contrast limit for CLAHE (1.0-4.0)
clahe_grid_size      : CLAHE tile grid size (4-16)
gamma                : Gamma correction value (0.8-2.0)
denoise_h            : Denoising filter strength (5-20)
morph_kernel_size    : Morphological operation kernel size (1-5)
unsharp_amount       : Unsharp masking amount (0.5-3.0)
unsharp_radius       : Unsharp masking radius (0.5-2.0)
unsharp_threshold    : Unsharp masking threshold (0-10)

Tips:
- Start with small adjustments (±20% of current value)
- Test frequently with 'compare' command
- Save working configurations before major changes
- Use 'test denoise' to test individual steps
        """
        print(help_text)


def main():
    """Main function for command line usage."""
    import argparse

    parser = argparse.ArgumentParser(description="Interactive parameter tuning for newspaper image cleaning")
    parser.add_argument("image", help="Sample image path for tuning")
    parser.add_argument("-c", "--config", help="Load initial config from file")

    args = parser.parse_args()

    try:
        tuner = ParameterTuner(args.image)

        if args.config:
            tuner.load_config(args.config)

        tuner.interactive_tune()

    except Exception as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    main()