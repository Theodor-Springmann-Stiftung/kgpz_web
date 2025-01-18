import os
import re

# Path to the directory containing the files
directory = "data_bilder/"

# Regex pattern to match filenames with segments separated by '-'
pattern = re.compile(r"([0-9]+[a-zA-Z]*|[a-zA-Z]*[0-9]*)-([0-9]+[a-zA-Z]*|[a-zA-Z]*[0-9]*)-([0-9]+[a-zA-Z]*|[a-zA-Z]*[0-9]*)\.jpg")

def normalize_segment(segment):
    # Remove leading zeros from the numeric part of the segment
    return re.sub(r'^0+(\d+)', r'\1', segment)

def normalize_filename(filename):
    match = pattern.match(filename)
    if not match:
        return filename  # Skip files that don't match the pattern
    
    # Normalize each segment
    normalized_segments = [normalize_segment(segment) for segment in match.groups()]
    return "-".join(normalized_segments) + ".jpg"

def normalize_filenames_in_directory(directory):
    for filename in os.listdir(directory):
        if filename.endswith(".jpg"):
            old_path = os.path.join(directory, filename)
            normalized_name = normalize_filename(filename)
            new_path = os.path.join(directory, normalized_name)
            if old_path != new_path:
                print(f"Renaming: {old_path} -> {new_path}")
                os.rename(old_path, new_path)

# Normalize the filenames
normalize_filenames_in_directory(directory)
