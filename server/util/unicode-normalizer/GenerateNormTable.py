# -*- coding: utf-8 -*-
import sys, codecs, json, copy, string
import unicodedata
from pyuca import Collator
sys.stdout=codecs.getwriter('UTF-8')(sys.stdout)
sys.stderr=codecs.getwriter('UTF-8')(sys.stderr)

UNICODE_RANGES=[
    ( 0x0000, 0x007F, 'Basic Latin' ),
    ( 0x0080, 0x00FF, 'C1 Controls and Latin-1 Supplement' ),
    ( 0x0100, 0x017F, 'Latin Extended-A' ),
    ( 0x0180, 0x024F, 'Latin Extended-B' ),
    ( 0x0250, 0x02AF, 'IPA Extensions' ),
    ( 0x02B0, 0x02FF, 'Spacing Modifier Letters' ),
    ( 0x0300, 0x036F, 'Combining Diacritical Marks' ),
    ( 0x0370, 0x03FF, 'Greek/Coptic' ),
    ( 0x0400, 0x04FF, 'Cyrillic' ),
    ( 0x0500, 0x052F, 'Cyrillic Supplement' ),
    ( 0x0530, 0x058F, 'Armenian' ),
    ( 0x0590, 0x05FF, 'Hebrew' ),
    ( 0x0600, 0x06FF, 'Arabic' ),
    ( 0x0700, 0x074F, 'Syriac' ),
    ( 0x0780, 0x07BF, 'Thaana' ),
    ( 0x0900, 0x097F, 'Devanagari' ),
    ( 0x0980, 0x09FF, 'Bengali/Assamese' ),
    ( 0x0A00, 0x0A7F, 'Gurmukhi' ),
    ( 0x0A80, 0x0AFF, 'Gujarati' ),
    ( 0x0B00, 0x0B7F, 'Oriya' ),
    ( 0x0B80, 0x0BFF, 'Tamil' ),
    ( 0x0C00, 0x0C7F, 'Telugu' ),
    ( 0x0C80, 0x0CFF, 'Kannada' ),
    ( 0x0D00, 0x0DFF, 'Malayalam' ),
    ( 0x0D80, 0x0DFF, 'Sinhala' ),
    ( 0x0E00, 0x0E7F, 'Thai' ),
    ( 0x0E80, 0x0EFF, 'Lao' ),
    ( 0x0F00, 0x0FFF, 'Tibetan' ),
    ( 0x1000, 0x109F, 'Myanmar' ),
    ( 0x10A0, 0x10FF, 'Georgian' ),
    ( 0x1100, 0x11FF, 'Hangul Jamo' ),
    ( 0x1200, 0x137F, 'Ethiopic' ),
    ( 0x13A0, 0x13FF, 'Cherokee' ),
    ( 0x1400, 0x167F, 'Unified Canadian Aboriginal Syllabics' ),
    ( 0x1680, 0x169F, 'Ogham' ),
    ( 0x16A0, 0x16FF, 'Runic' ),
    ( 0x1700, 0x171F, 'Tagalog' ),
    ( 0x1720, 0x173F, 'Hanunoo' ),
    ( 0x1740, 0x175F, 'Buhid' ),
    ( 0x1760, 0x177F, 'Tagbanwa' ),
    ( 0x1780, 0x17FF, 'Khmer' ),
    ( 0x1800, 0x18AF, 'Mongolian' ),
    ( 0x1900, 0x194F, 'Limbu' ),
    ( 0x1950, 0x197F, 'Tai Le' ),
    ( 0x19E0, 0x19FF, 'Khmer Symbols' ),
    ( 0x1D00, 0x1D7F, 'Phonetic Extensions' ),
    ( 0x1E00, 0x1EFF, 'Latin Extended Additional' ),
    ( 0x1F00, 0x1FFF, 'Greek Extended' ),
    ( 0x2000, 0x206F, 'General Punctuation' ),
    ( 0x2070, 0x209F, 'Superscripts and Subscripts' ),
    ( 0x20A0, 0x20CF, 'Currency Symbols' ),
    ( 0x20D0, 0x20FF, 'Combining Diacritical Marks for Symbols' ),
    ( 0x2100, 0x214F, 'Letterlike Symbols' ),
    ( 0x2150, 0x218F, 'Number Forms' ),
    ( 0x2190, 0x21FF, 'Arrows' ),
    ( 0x2200, 0x22FF, 'Mathematical Operators' ),
    ( 0x2300, 0x23FF, 'Miscellaneous Technical' ),
    ( 0x2400, 0x243F, 'Control Pictures' ),
    ( 0x2440, 0x245F, 'Optical Character Recognition' ),
    ( 0x2460, 0x24FF, 'Enclosed Alphanumerics' ),
    ( 0x2500, 0x257F, 'Box Drawing' ),
    ( 0x2580, 0x259F, 'Block Elements' ),
    ( 0x25A0, 0x25FF, 'Geometric Shapes' ),
    ( 0x2600, 0x26FF, 'Miscellaneous Symbols' ),
    ( 0x2700, 0x27BF, 'Dingbats' ),
    ( 0x27C0, 0x27EF, 'Miscellaneous Mathematical Symbols-A' ),
    ( 0x27F0, 0x27FF, 'Supplemental Arrows-A' ),
    ( 0x2800, 0x28FF, 'Braille Patterns' ),
    ( 0x2900, 0x297F, 'Supplemental Arrows-B' ),
    ( 0x2980, 0x29FF, 'Miscellaneous Mathematical Symbols-B' ),
    ( 0x2A00, 0x2AFF, 'Supplemental Mathematical Operators' ),
    ( 0x2B00, 0x2BFF, 'Miscellaneous Symbols and Arrows' ),
    ( 0x2E80, 0x2EFF, 'CJK Radicals Supplement' ),
    ( 0x2F00, 0x2FDF, 'Kangxi Radicals' ),
    ( 0x2FF0, 0x2FFF, 'Ideographic Description Characters' ),
    ( 0x3000, 0x303F, 'CJK Symbols and Punctuation' ),
    ( 0x3040, 0x309F, 'Hiragana' ),
    ( 0x30A0, 0x30FF, 'Katakana' ),
    ( 0x3100, 0x312F, 'Bopomofo' ),
    ( 0x3130, 0x318F, 'Hangul Compatibility Jamo' ),
    ( 0x3190, 0x319F, 'Kanbun (Kunten)' ),
    ( 0x31A0, 0x31BF, 'Bopomofo Extended' ),
    ( 0x31F0, 0x31FF, 'Katakana Phonetic Extensions' ),
    ( 0x3200, 0x32FF, 'Enclosed CJK Letters and Months' ),
    ( 0x3300, 0x33FF, 'CJK Compatibility' ),
    ( 0x3400, 0x4DBF, 'CJK Unified Ideographs Extension A' ),
    ( 0x4DC0, 0x4DFF, 'Yijing Hexagram Symbols' ),
    ( 0x4E00, 0x9FAF, 'CJK Unified Ideographs' ),
    ( 0xA000, 0xA48F, 'Yi Syllables' ),
    ( 0xA490, 0xA4CF, 'Yi Radicals' ),
    ( 0xAC00, 0xD7AF, 'Hangul Syllables' ),
    ( 0xD800, 0xDBFF, 'High Surrogate Area' ),
    ( 0xDC00, 0xDFFF, 'Low Surrogate Area' ),
    ( 0xF900, 0xFAFF, 'CJK Compatibility Ideographs' ),
    ( 0xFB00, 0xFB4F, 'Alphabetic Presentation Forms' ),
    ( 0xFB50, 0xFDFF, 'Arabic Presentation Forms-A' ),
    ( 0xFE00, 0xFE0F, 'Variation Selectors' ),
    ( 0xFE20, 0xFE2F, 'Combining Half Marks' ),
    ( 0xFE30, 0xFE4F, 'CJK Compatibility Forms' ),
    ( 0xFE50, 0xFE6F, 'Small Form Variants' ),
    ( 0xFE70, 0xFEFF, 'Arabic Presentation Forms-B' ),
    ( 0xFF00, 0xFFEF, 'Halfwidth and Fullwidth Forms' ),
    ( 0xFFF0, 0xFFFF, 'Specials' ) ]

def CreateUnicodeCharList():
    charlist = []
    for tup in UNICODE_RANGES:
        for codepoint in range(tup[0], tup[1]+1):
            charlist.append(unichr(codepoint))
    return charlist


# pyuca.Collator.sort_key returns collation keys in a hard-to-compare manner
# (zero separated tuples in a continuous list), here we convert these to up to 4 actual tuples
def rationalizeCollationKeys(colkeys):
    rationalKeys = [ (0,) ]*4
    segment_count = 0
    idx = 0
    for i in range(len(colkeys)):
        k = colkeys[i]
        if k == 0:
            segment_count = 0
            idx = idx + 1
        else:
            if segment_count == 0:
                rationalKeys[idx] = (k,)
            else:
                rationalKeys[idx] = rationalKeys[idx] + (k,)
            segment_count = segment_count + 1
    return rationalKeys


def GenerateCollationEquivalenceTable(unicodecharlist):
    charbuckets = {}
    C = Collator()
    
    def internal_sortfunc(codepointA, codepointB):
        A = rationalizeCollationKeys(C.sort_key(codepointA))
        B = rationalizeCollationKeys(C.sort_key(codepointB))
        cmp = 0
        if (A[2], A[3]) < (B[2], B[3]):
            cmp = -1
        elif (A[2], A[3]) > (B[2], B[3]):
            cmp = 1
        return cmp

    for codepoint in unicodecharlist:
        # Up to 4 collation keys are returned, we group on first two non-zero keys
        collationkeys = rationalizeCollationKeys(C.sort_key(codepoint))
        # print codepoint + " : " + repr(collationkeys)
        if collationkeys[0] == 0:
            continue
        
        # Not sure why case-ish transitions map to this value in the Unicode standard,
        # but this value seems to be consitently used in this way across all scripts.
        if collationkeys[1][0] != 32:
            continue
        k0 = collationkeys[0]
        k1 = collationkeys[1]
        if k0 not in charbuckets:
            charbuckets[k0] = {}
        if k1 not in charbuckets[k0]:
            charbuckets[k0][k1] = []
        charbuckets[k0][k1].append(codepoint)
    
    codepointMap = {}
    for k1 in charbuckets:
        for k2 in charbuckets[k1]:
            # This is what we are looking for:  buckets containing multiple characters.
            # Find the character with the lowest sort order in the bucket according
            # to it's full collation key sequence and map all of the other characters
            # in the bucket to this "smallest" characeter.  For instance this maps
            # "A" to "a".
            if len(charbuckets[k1][k2]) > 1:
                s = sorted(charbuckets[k1][k2], internal_sortfunc)
                for codepoint in s[1:]:
                    codepointMap[codepoint] = s[0]
    
    return codepointMap

def GenerateNumeralEquivalenceTable(unicodecharlist):
    codepointMap = {}
    C = Collator()
    baseNumerals = [u'0', u'1', u'2', u'3', u'4', u'5', u'6', u'7', u'8', u'9']
    baseKeys = {}
    for codepoint in baseNumerals:
        numval = unicodedata.numeric(codepoint)
        baseKeys[numval] = codepoint
        
    for codepoint in unicodecharlist:
        if unicodedata.category(codepoint) in ["No", "Nl"]:
            numval = unicodedata.numeric(codepoint)
            if numval in baseKeys:
                if codepoint != baseKeys[numval]:
                    codepointMap[codepoint] = baseKeys[numval]
            
    return codepointMap

# Format of UnicodeData.txt given at:  ftp://ftp.unicode.org/Public/3.0-Update/UnicodeData-3.0.0.html
# Subject to change, pulled on 2017-01-03
def GenerateUnicodeDataTable():
    codepointMap = {}
    with codecs.open("UnicodeData.txt", "r", "utf-8") as f:
        for line in f:
            if line[0] == u'#':
                continue
            line = line.rstrip()
            fields = line.split(u';')
            if len(fields) == 15:
                ( Code_value,
                    Character_name,
                    General_Category,
                    Canonical_Combining_Classes,
                    Bidirectional_Category,
                    Character_Decomposition_Mapping,
                    Decimal_digit_value,
                    Digit_value,
                    Numeric_value,
                    Mirrored,
                    Unicode1Name,
                    Comment_field,
                    Uppercase_Mapping,
                    Lowercase_Mapping,
                    Titlecase_Mapping ) = fields
                if len(Lowercase_Mapping) > 0:
                    codepointMap[unichr(int(Code_value, 16))] = unichr(int(Lowercase_Mapping, 16))
    return codepointMap

def GenerateUnicodeDataTable():
    codepointMap = {}
    with codecs.open("UnicodeData.txt", "r", "utf-8") as f:
        for line in f:
            if line[0] == '#':
                continue
            line = line.rstrip()
            fields = line.split(';')
            if len(fields) == 15:
                ( Code_value,
                    Character_name,
                    General_Category,
                    Canonical_Combining_Classes,
                    Bidirectional_Category,
                    Character_Decomposition_Mapping,
                    Decimal_digit_value,
                    Digit_value,
                    Numeric_value,
                    Mirrored,
                    Unicode1Name,
                    Comment_field,
                    Uppercase_Mapping,
                    Lowercase_Mapping,
                    Titlecase_Mapping ) = fields
                if len(Lowercase_Mapping) > 0:
                    codepointMap[unichr(int(Code_value, 16))] = unichr(int(Lowercase_Mapping, 16))
    return codepointMap
    
def GenerateCaseFoldingTable():
    codepointMap = {}
    with codecs.open("CaseFolding.txt", "r", "utf-8") as f:
        for line in f:
            if line[0] == u'#':
                continue
            line = line.rstrip()
            fields = line.split(u';')
            if len(fields) == 4:
                ( Code, Status, Mapping, Comment) = fields
                code_letter = unichr(int(Code.strip(), 16))
                mapping_letters = u""
                for map_code in Mapping.strip().split(u' '):
                    if len(map_code) > 0:
                        mapping_letters = mapping_letters + unichr(int(map_code, 16))
                codepointMap[code_letter] = mapping_letters
    return codepointMap

def GenerateCombinedTable(trace = False):
    codepointMap = {}
    
    # Start with Numeral Equivalence table:
    numeralEquivalenceTable = GenerateNumeralEquivalenceTable(CreateUnicodeCharList())
    codepointMap = copy.copy(numeralEquivalenceTable)
    
    # Identify agreements/disagreements with Collation Equivalence Table:
    collationEquivalenceTable = GenerateCollationEquivalenceTable(CreateUnicodeCharList())
    for codepoint in collationEquivalenceTable:
        if codepoint in codepointMap:
            if trace:
                if collationEquivalenceTable[codepoint] == codepointMap[codepoint]:
                    print >> sys.stderr, repr(codepoint) + u"\tY\tCE\t" + repr(codepointMap[codepoint])
                else:
                    print >> sys.stderr, repr(codepoint) + u"\tn\tCE\t" + repr(codepointMap[codepoint]) + u"\t" + repr(collationEquivalenceTable[codepoint])
        else:
            codepointMap[codepoint] = collationEquivalenceTable[codepoint]
    
    # Identify agreements/disagreements with Unicode Data Table:
    unicodeDataTable = GenerateUnicodeDataTable()    
    for codepoint in unicodeDataTable:
        if codepoint in codepointMap:
            if trace:
                if unicodeDataTable[codepoint] == codepointMap[codepoint]:
                    print >> sys.stderr, repr(codepoint) + u"\tY\tDT\t" + repr(codepointMap[codepoint]) 
                else:
                    print >> sys.stderr, repr(codepoint) + u"\tn\tDT\t" + repr(codepointMap[codepoint]) + u"\t" + repr(unicodeDataTable[codepoint])
        else:
            codepointMap[codepoint] = unicodeDataTable[codepoint]
    
    # Merge Case Folding Table by key
    caseFoldingTable = GenerateCaseFoldingTable()
    for codepoint in caseFoldingTable:
        if codepoint in codepointMap:
            if trace:
                if caseFoldingTable[codepoint] == codepointMap[codepoint]:
                    print >> sys.stderr, repr(codepoint) + u"\tY\tCF\t" + repr(codepointMap[codepoint]) 
                else:
                    print >> sys.stderr, repr(codepoint) + u"\tn\tCF\t" + repr(codepointMap[codepoint]) + u"\t" + repr(caseFoldingTable[codepoint])
        else:
            codepointMap[codepoint] = caseFoldingTable[codepoint]
            
    # Apply Case Folding Table to RHS
    for codepoint in codepointMap:
        mapstr0 = codepointMap[codepoint]
        mapstr = mapstr0
        for c in mapstr:
            if c in caseFoldingTable:
                if len(caseFoldingTable[c]) > 1:
                    mapstr = string.replace(mapstr, c, caseFoldingTable[c])
                    codepointMap[codepoint] = mapstr
                    if trace:
                        print >> sys.stderr, repr(codepoint) + u"\tRH\t" + repr(mapstr0) + u"\t" + repr(mapstr)
    
    return codepointMap
    
# Pretty print the table when invoked from the command line.
if __name__ == "__main__":    
    mapped = GenerateCombinedTable(True)
    print "{"
    leader = "    "
    for codepoint in mapped:
            print leader + repr(codepoint) + " : " + repr(mapped[codepoint])
            leader = "    ,"
    print "}"
    
# fi __main__
