import GenerateNormTable
import os, sys, codecs, json, os.path

class UnicodeNormalizer:    

    def __init__(self):
        self.UNICODE_NORMALIZER_DATAFILE = "UnicodeNormalizerData.json"
        
        if os.path.isfile(self.UNICODE_NORMALIZER_DATAFILE):
            with codecs.open(self.UNICODE_NORMALIZER_DATAFILE, "r", "utf-8") as f:
                self.norm_table = json.load(f)
        else:
            self.norm_table = GenerateNormTable.GenerateCombinedTable()
    #
        
    def normalizeCharacter(self, unicodeCharacter):
        if unicodeCharacter in self.norm_table:
            return self.norm_table[unicodeCharacter]
        return unicodeCharacter    
    #

    def normalizeText(self, unicodeText):
        return u"".join(map(self.normalizeCharacter, unicodeText))
    #
    
    def writeDataFile(self):
        with codecs.open(self.UNICODE_NORMALIZER_DATAFILE, "w", "utf-8") as f:
            json.dump(self.norm_table, f, indent=4)
        return os.stat(self.UNICODE_NORMALIZER_DATAFILE).st_size
    #
    
    def deleteDataFile(self):
        if os.path.isfile(self.UNICODE_NORMALIZER_DATAFILE):
            os.remove(self.UNICODE_NORMALIZER_DATAFILE)
        return not os.path.isfile(self.UNICODE_NORMALIZER_DATAFILE)
    #
    
if __name__ == "__main__":

    import sys
    import codecs
    if len(sys.argv) > 1:
        print u" ".join(map(normalizeText, sys.argv[1:]))
    else:
        sys.stdout=codecs.getwriter('UTF-8')(sys.stdout)
        sys.stdin=codecs.getreader('UTF-8')(sys.stdin)
        for line in sys.stdin:
            line.rstrip()
            print(normalizeText(line))

#fi __main__
