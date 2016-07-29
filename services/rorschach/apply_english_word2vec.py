import sys, os, re
from elasticsearch import Elasticsearch
from syntax_similarity import SyntaxVectorizer
sys.path.append(os.path.join(os.path.dirname(__file__), "../util"))
from redis_dispatcher import Dispatcher

def process_message(key, job):
    if key == 1:
        print "SUBSCRIBED TO CHANNEL"
        return

    txt = re.sub('[\s#]', ' ', job['txt'].lower())
    txt = re.sub('[^\w\s]', '', txt)
    l_txt = filter(lambda x: x!='', txt.split(' '))
    f_vec = syntax_vectorizer.vec_from_tweet(job[l_txt])
    job['data'] = features
    job['state'] = 'processed'
    

if __name__ == '__main__':
    global syntax_vectorizer
    syntax_vectorizer = SyntaxVectorizer("july28_eng_")
    dispatcher = Dispatcher(redis_host='redis', procss_func=process_message, channels=['featurize'])
    dispatcher.start()