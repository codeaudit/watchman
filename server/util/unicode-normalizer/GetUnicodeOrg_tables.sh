#/bin/bash
# This script downloads data and reference files used by GenerateNormTable.py

# This table includes basic lower-casing info among other things:
wget ftp://ftp.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt
# format information for above:
    wget ftp://ftp.unicode.org/Public/3.0-Update/UnicodeData-3.0.0.html

# This file contains advanced lower-casing and normalization info,
# includes embedded comments that describe the format
wget ftp://ftp.unicode.org/Public/UCD/latest/ucd/CaseFolding.txt

# This doesn't provide anything useful for generic Unicode normalization
#   -- contains a few conflicting region-specific rules, we operate in region agnotistic mode.
# wget ftp://ftp.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt
