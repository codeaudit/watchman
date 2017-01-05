import UnicodeNormalizer
u = UnicodeNormalizer.UnicodeNormalizer()
print repr(  u.deleteDataFile() )
print repr(  u.normalizeCharacter(u'A') == u'a'  )
print repr(  u.writeDataFile() > 0  )
U = UnicodeNormalizer.UnicodeNormalizer()
print repr(  U.normalizeText(u"AZ") == u"az"  )
