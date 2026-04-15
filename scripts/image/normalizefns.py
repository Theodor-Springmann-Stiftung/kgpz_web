import os
import re
import sys

DEFAULT_PICTURES_DIR = "pictures"
PICTURES_DIR = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PICTURES_DIR
YEAR_DIR_PATTERN = re.compile(r".*?(\d{4})$")
FILENAME_PATTERN = re.compile(
    r"([0-9]+[a-zA-Z]*|[a-zA-Z]*[0-9]*)-"
    r"([0-9]+[a-zA-Z]*|[a-zA-Z]*[0-9]*)-"
    r"([0-9]+[a-zA-Z]*|[a-zA-Z]*[0-9]*)(\.(?:jpg|jpeg|tif|tiff))$",
    re.IGNORECASE,
)
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".tif", ".tiff"}


def normalize_segment(segment):
    return re.sub(r"^0+(\d+)", r"\1", segment)


def normalize_filename(filename):
    match = FILENAME_PATTERN.match(filename)
    if not match:
        return filename

    normalized_segments = [normalize_segment(segment) for segment in match.groups()[:3]]
    extension = match.group(4).lower()
    return "-".join(normalized_segments) + extension


def normalize_year_directories(base_dir):
    for entry in sorted(os.listdir(base_dir)):
        old_path = os.path.join(base_dir, entry)
        if not os.path.isdir(old_path):
            continue

        match = YEAR_DIR_PATTERN.match(entry)
        if not match:
            continue

        normalized_name = match.group(1)
        new_path = os.path.join(base_dir, normalized_name)
        if old_path == new_path:
            continue

        if os.path.exists(new_path):
            raise FileExistsError(
                f"Cannot rename directory {old_path} to {new_path}: target already exists"
            )

        print(f"Renaming directory: {old_path} -> {new_path}")
        os.rename(old_path, new_path)


def normalize_filenames_recursively(base_dir):
    for root, _, files in os.walk(base_dir):
        for filename in files:
            _, extension = os.path.splitext(filename)
            if extension.lower() not in SUPPORTED_EXTENSIONS:
                continue

            old_path = os.path.join(root, filename)
            normalized_name = normalize_filename(filename)
            new_path = os.path.join(root, normalized_name)
            if old_path == new_path:
                continue

            if os.path.exists(new_path):
                raise FileExistsError(
                    f"Cannot rename file {old_path} to {new_path}: target already exists"
                )

            print(f"Renaming file: {old_path} -> {new_path}")
            os.rename(old_path, new_path)


normalize_year_directories(PICTURES_DIR)
normalize_filenames_recursively(PICTURES_DIR)
