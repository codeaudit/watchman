import re

def is_scoreable(caption):
    caption = re.sub('[\s#]',' ',caption.lower(),flags=re.UNICODE)  # replace all white space charactes (tabs newlines,etc) and the hashtag with a space
    caption = re.sub('[^\w\s@]','',caption,flags=re.UNICODE) #remove non aplhpa numeric except for '@' (so we can filter out emails and usernames)
    all_words = caption.strip().split(' ')
    scorable_words = 0
    for word in all_words:
        if word == '':
            continue
        if word[0] == '@':
            continue
        if len(word)>4:
            if word[:4] == 'http' or word.find('.com')!=-1 or word.find('.jpeg')!=-1:
                continue
        scorable_words += 1
    if scorable_words >4:
        return True
    return False