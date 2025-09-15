#!/bin/bash
# Convenience script to run the image cleaning pipeline with virtual environment

# Activate virtual environment
source venv/bin/activate

# Check if any arguments provided
if [ $# -eq 0 ]; then
    echo "Historical Newspaper Image Cleaning Pipeline"
    echo "Usage examples:"
    echo "  $0 demo                              # Run demo"
    echo "  $0 clean image.jpg                   # Clean single image"
    echo "  $0 batch                             # Process all images in directory"
    echo "  $0 tune image.jpg                    # Interactive parameter tuning"
    echo "  $0 python script.py [args]          # Run custom Python script"
    exit 1
fi

case "$1" in
    "demo")
        python demo.py
        ;;
    "clean")
        shift
        python image_cleaner.py "$@"
        ;;
    "batch")
        shift
        python batch_process.py "$@"
        ;;
    "tune")
        shift
        python config_tuner.py "$@"
        ;;
    "python")
        shift
        python "$@"
        ;;
    *)
        python "$@"
        ;;
esac