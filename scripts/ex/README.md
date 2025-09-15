# Historical Newspaper Image Cleaning Pipeline

This pipeline automatically cleans and enhances scanned historical newspaper images by reducing noise, improving contrast, and sharpening text for better readability.

## Features

- **Noise Reduction**: Bilateral filtering and non-local means denoising
- **Contrast Enhancement**: CLAHE and gamma correction
- **Background Cleaning**: Morphological operations to remove artifacts
- **Text Sharpening**: Unsharp masking for improved readability
- **Batch Processing**: Process entire directories efficiently
- **Interactive Tuning**: Find optimal parameters for your specific images
- **Before/After Comparisons**: Visual validation of improvements

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Process Single Image

```bash
python image_cleaner.py input_image.jpg -o cleaned_image.jpg --comparison
```

### 3. Batch Process Directory

```bash
python batch_process.py -i newspaper_scans -o cleaned_images
```

### 4. Interactive Parameter Tuning

```bash
python config_tuner.py sample_image.jpg
```

## Usage Examples

### Basic Image Cleaning
```bash
# Clean single image with default settings
python image_cleaner.py 1771-09b-02.jpg

# Clean with specific processing steps
python image_cleaner.py 1771-09b-02.jpg --steps denoise contrast sharpen

# Create before/after comparison
python image_cleaner.py 1771-09b-02.jpg -c
```

### Batch Processing
```bash
# Process all JPG files in current directory
python batch_process.py

# Process specific directory with custom output
python batch_process.py -i scans/ -o cleaned/

# Use custom configuration
python batch_process.py --config custom_config.json

# Skip comparison images for faster processing
python batch_process.py --no-comparisons
```

### Parameter Tuning
```bash
# Start interactive tuning session
python config_tuner.py sample_image.jpg

# Load existing config for fine-tuning
python config_tuner.py sample_image.jpg -c existing_config.json
```

## Configuration

### Default Parameters

The pipeline uses these default parameters optimized for newspaper scans:

```json
{
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
```

### Parameter Descriptions

- **bilateral_d**: Neighborhood diameter for bilateral filtering (5-15)
- **bilateral_sigma_color**: Color space filter strength (50-150)
- **bilateral_sigma_space**: Coordinate space filter strength (50-150)
- **clahe_clip_limit**: Contrast limiting for CLAHE (1.0-4.0)
- **clahe_grid_size**: CLAHE tile grid size [width, height] (4-16)
- **gamma**: Gamma correction value (0.8-2.0)
- **denoise_h**: Denoising filter strength (5-20)
- **morph_kernel_size**: Morphological operation kernel size (1-5)
- **unsharp_amount**: Unsharp masking strength (0.5-3.0)
- **unsharp_radius**: Unsharp masking radius (0.5-2.0)
- **unsharp_threshold**: Unsharp masking threshold (0-10)

### Creating Custom Configurations

1. Generate default config template:
```bash
python batch_process.py --create-config
```

2. Edit `config.json` with your preferred values

3. Use custom config:
```bash
python batch_process.py --config config.json
```

## Processing Pipeline

The image cleaning pipeline applies these steps in sequence:

1. **Noise Reduction**
   - Bilateral filtering preserves edges while reducing noise
   - Non-local means denoising removes repetitive patterns

2. **Contrast Enhancement**
   - CLAHE improves local contrast adaptively
   - Gamma correction adjusts overall brightness

3. **Background Cleaning**
   - Morphological operations remove small artifacts
   - Background normalization reduces paper texture

4. **Sharpening**
   - Unsharp masking enhances text edges
   - Preserves fine details while reducing blur

## Interactive Tuning Commands

When using `config_tuner.py`, these commands are available:

- `set <param> <value>` - Adjust parameter value
- `show` - Display current parameters
- `test [steps]` - Process with current settings
- `compare [filename]` - Save before/after comparison
- `save <filename>` - Save configuration to file
- `load <filename>` - Load configuration from file
- `presets` - Show preset configurations
- `help` - Show detailed help
- `quit` - Exit tuning session

## Tips for Best Results

### For Light Damage/Noise:
- Reduce `bilateral_d` to 5-7
- Lower `denoise_h` to 5-8
- Use `clahe_clip_limit` around 1.5

### For Heavy Damage/Artifacts:
- Increase `bilateral_d` to 12-15
- Raise `denoise_h` to 15-20
- Use higher `clahe_clip_limit` (3.0-4.0)

### For Faded/Low Contrast Images:
- Increase `gamma` to 1.3-1.5
- Raise `clahe_clip_limit` to 3.0+
- Boost `unsharp_amount` to 2.0+

### For Sharp/High Quality Scans:
- Focus mainly on `denoise` and `sharpen` steps
- Skip `background` cleaning if unnecessary
- Use lighter settings to preserve quality

## File Structure

```
newspaper_image_cleaner/
├── image_cleaner.py      # Core processing module
├── batch_process.py      # Batch processing script
├── config_tuner.py       # Interactive parameter tuning
├── requirements.txt      # Python dependencies
└── README.md            # This documentation
```

## Troubleshooting

### ImportError: No module named 'cv2'
Install OpenCV: `pip install opencv-python`

### Memory Issues with Large Images
The tuner automatically resizes large images. For batch processing of very large images, consider resizing first.

### Poor Results
Use the interactive tuner to find optimal parameters for your specific image characteristics.

## Performance

- Single 3000x2000 image: ~3-5 seconds
- Batch processing depends on image size and quantity
- Interactive tuning uses smaller images for faster feedback