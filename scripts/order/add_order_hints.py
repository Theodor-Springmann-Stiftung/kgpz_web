#!/usr/bin/env python3
"""
Script to add order hints to Beiträge XML files.

This script processes XML files in cache/git/XML/beitraege/ and adds order="N"
attributes to <stueck> elements when multiple pieces appear on the same page.
"""

import argparse
import os
import shutil
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from collections import defaultdict
from datetime import datetime

try:
    from lxml import etree
except ImportError:
    print("Error: lxml is required. Install with: pip install lxml")
    print("Or activate the virtual environment: source venv/bin/activate")
    sys.exit(1)


class OrderHintProcessor:
    """Processes XML files to add order hints to pieces on the same page."""

    def __init__(self, xml_dir: Path, backup: bool = True, dry_run: bool = False):
        self.xml_dir = xml_dir
        self.backup = backup
        self.dry_run = dry_run
        self.stats = {
            'files_processed': 0,
            'pieces_with_order_added': 0,
            'pages_with_multiple_pieces': 0,
            'existing_order_hints': 0
        }

    def process_all_files(self) -> None:
        """Process all XML files in the beitraege directory."""
        xml_files = list(self.xml_dir.glob("*-beitraege.xml"))

        if not xml_files:
            print(f"No XML files found in {self.xml_dir}")
            return

        print(f"Found {len(xml_files)} XML files to process")

        for xml_file in sorted(xml_files):
            try:
                self.process_file(xml_file)
            except Exception as e:
                print(f"Error processing {xml_file}: {e}")
                continue

        self.print_stats()

    def process_file(self, xml_file: Path, year: Optional[int] = None) -> None:
        """Process a single XML file to add order hints."""
        if year and not xml_file.name.startswith(f"{year}-"):
            return

        print(f"Processing {xml_file.name}...")

        # Parse XML with lxml to preserve comments and formatting
        try:
            parser = etree.XMLParser(remove_comments=False, remove_blank_text=False)
            tree = etree.parse(str(xml_file), parser)
            root = tree.getroot()
        except etree.XMLSyntaxError as e:
            print(f"  XML syntax error: {e}")
            return

        # Group pieces by (year, issue_nr, page_nr, beilage)
        page_groups = self._group_pieces_by_page(root)

        # Track changes
        changes_made = False

        # Debug: Show all groups found
        print(f"  Found {len(page_groups)} page groups")
        for page_key, pieces in page_groups.items():
            if len(pieces) > 1:
                print(f"  Multi-piece page: {page_key} has {len(pieces)} pieces")

        # Process each group that has multiple pieces
        for page_key, pieces in page_groups.items():
            if len(pieces) > 1:
                self.stats['pages_with_multiple_pieces'] += 1

                # Check if any pieces already have order hints
                has_existing_order = any(
                    stueck.get('order') is not None
                    for piece in pieces
                    for stueck in piece.findall('.//stueck')
                )

                if has_existing_order:
                    self.stats['existing_order_hints'] += len(pieces)
                    print(f"  Page {page_key}: Already has order hints, skipping")
                    continue

                # Add order hints
                for order_num, piece in enumerate(pieces, 1):
                    for stueck in piece.findall('.//stueck'):
                        # Check if this stueck matches our page grouping
                        if self._stueck_matches_page(stueck, page_key):
                            if not self.dry_run:
                                stueck.set('order', str(order_num))
                            changes_made = True
                            self.stats['pieces_with_order_added'] += 1

                print(f"  Page {page_key}: Added order hints to {len(pieces)} pieces")

        # Save file if changes were made
        if changes_made and not self.dry_run:
            self._save_file(xml_file, tree)

        self.stats['files_processed'] += 1

    def _group_pieces_by_page(self, root) -> Dict[Tuple, List]:
        """Group beitrag elements by the pages they appear on."""
        page_groups = defaultdict(list)

        # Handle namespace - the XML has a default namespace
        namespace = {'ns': 'https://www.koenigsberger-zeitungen.de'}

        # Try with namespace first, then without
        beitrag_elements = root.findall('.//ns:beitrag', namespace)
        if not beitrag_elements:
            # Fallback: try without namespace
            beitrag_elements = root.findall('.//beitrag')

        print(f"  Found {len(beitrag_elements)} beitrag elements")

        for beitrag in beitrag_elements:
            # Get all stueck elements for this piece
            stueck_elements = beitrag.findall('.//ns:stueck', namespace)
            if not stueck_elements:
                stueck_elements = beitrag.findall('.//stueck')

            for stueck in stueck_elements:
                # Extract page information
                year = stueck.get('when')
                issue_nr = stueck.get('nr')
                page_von = stueck.get('von')
                beilage = stueck.get('beilage', '0')  # Default to 0 for main pages

                # Skip if essential attributes are missing
                if not all([year, issue_nr, page_von]):
                    continue

                # Create page key
                page_key = (year, issue_nr, page_von, beilage)

                # Add this piece to the group (only once per page)
                if beitrag not in page_groups[page_key]:
                    page_groups[page_key].append(beitrag)

        return page_groups

    def _stueck_matches_page(self, stueck, page_key: Tuple) -> bool:
        """Check if a stueck element matches the given page key."""
        year, issue_nr, page_von, beilage = page_key

        return (
            stueck.get('when') == year and
            stueck.get('nr') == issue_nr and
            stueck.get('von') == page_von and
            stueck.get('beilage', '0') == beilage
        )

    def _save_file(self, xml_file: Path, tree) -> None:
        """Save the modified XML file with backup if requested."""
        if self.backup:
            backup_file = xml_file.with_suffix('.xml.backup')
            shutil.copy2(xml_file, backup_file)
            print(f"  Created backup: {backup_file.name}")

        # Write the modified XML
        tree.write(
            str(xml_file),
            encoding='utf-8',
            xml_declaration=True,
            pretty_print=True
        )

    def print_stats(self) -> None:
        """Print processing statistics."""
        print("\n" + "="*50)
        print("PROCESSING STATISTICS")
        print("="*50)
        print(f"Files processed: {self.stats['files_processed']}")
        print(f"Pages with multiple pieces: {self.stats['pages_with_multiple_pieces']}")
        print(f"Pieces with order hints added: {self.stats['pieces_with_order_added']}")
        print(f"Existing order hints found: {self.stats['existing_order_hints']}")

        if self.dry_run:
            print("\n*** DRY RUN MODE - No files were modified ***")


def main():
    parser = argparse.ArgumentParser(description='Add order hints to Beiträge XML files')
    parser.add_argument('--year', type=int, help='Process only files for specific year')
    parser.add_argument('--all', action='store_true', help='Process all years')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be changed without modifying files')
    parser.add_argument('--no-backup', action='store_true', help='Skip creating backup files')
    parser.add_argument('--xml-dir', type=Path, default=Path('../../cache/git/XML/beitraege'),
                       help='Directory containing XML files (default: ../../cache/git/XML/beitraege)')

    args = parser.parse_args()

    # Validation
    if not args.year and not args.all:
        parser.error("Must specify either --year YYYY or --all")

    if not args.xml_dir.exists():
        print(f"Error: XML directory not found: {args.xml_dir}")
        sys.exit(1)

    # Initialize processor
    processor = OrderHintProcessor(
        xml_dir=args.xml_dir,
        backup=not args.no_backup,
        dry_run=args.dry_run
    )

    # Process files
    if args.all:
        processor.process_all_files()
    else:
        # Find the specific year file
        xml_file = args.xml_dir / f"{args.year}-beitraege.xml"
        if not xml_file.exists():
            print(f"Error: File not found: {xml_file}")
            sys.exit(1)
        processor.process_file(xml_file, args.year)
        processor.print_stats()


if __name__ == '__main__':
    main()