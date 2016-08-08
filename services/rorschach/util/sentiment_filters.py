import re
from polyglot.text import Text

class SentimentFilter:
    def __init__(self):
        self.good_langs = ['en']

    def which_languages(self):
        return self.good_langs

    def is_scoreable(self, caption, lang='en'):
        if lang == 'en':
            # replace all white space charactes (tabs newlines,etc) and the hashtag with a space
            caption = re.sub('[\s#]', ' ', caption.lower(), flags=re.UNICODE)
            # remove non aplhpa numeric except for '@' (so we can filter out emails and usernames)
            caption = re.sub('[^\w\s@]', '', caption, flags=re.UNICODE)
            all_words = caption.strip().split(' ')
            scorable_words = 0
            for word in all_words:
                if word == '':
                    continue
                if word[0] == '@':
                    continue
                if len(word) > 4:
                    if word[:4] == 'http' or word.find('.com') != -1 or word.find('.jpeg') != -1:
                        continue
                scorable_words += 1
            if scorable_words > 4:
                return True
            return False
        if lang == 'ar':
            caption = re.sub('[\s#]', ' ', caption, flags=re.UNICODE)
            caption = re.sub('[\u0627-\u064a\w]', '', caption, flags=re.UNICODE)
            all_words = filter(lambda x: len(x)>1, Text(caption).words)
            if len(all_words) > 4:
                return True
            return False
        else:
            return True
