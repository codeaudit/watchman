import sys, os, argparse
from syntax_similarity import SyntaxVectorizer
sys.path.append(os.path.join(os.path.dirname(__file__), "./util"))
from redis_dispatcher import Dispatcher
from sentiment_filters import SentimentFilter

def set_err(job, msg):
    job['state'] = 'error'
    job['data'] = None
    job['error'] = msg

def process_message(key, job):
    # Examine job for correct fields
    if 'txt' not in job.keys():
        set_err(job, "No 'txt' in job fields")
        return
    if 'lang' not in job.keys():
        set_err(job, "No 'lang' in job fields")
        return

    # Check if the text language can be featurized
    if 'lang' == 'en':
        try:
            if SentimentFilter.is_scoreable(job['txt']) is False:
                job['data'] = []
                job['state'] = 'processed'
        except:
            set_err(job, "Error checking if doc is 'scorable'")

        try:
            job['data'] = syntax_vectorizer['en'].vec_from_tweet(job['txt'])
            job['state'] = 'processed'
        except:
            set_err(job, "Error making syntax vector:\n" + str(sys.exc_info()[0]))
    else:
        job['data'] = []
        job['state'] = 'processed'

if __name__ == '__main__':
    # ar = argparse.ArgumentParser()
    # ar.add_argument("")
    global sent_filt
    sent_filt = SentimentFilter()
    global syntax_vectorizer
    syntax_vectorizer = {}
    syntax_vectorizer['en'] = SyntaxVectorizer("july28_eng_")
    dispatcher = Dispatcher(redis_host='redis',
        process_func=process_message, channels=['genie:feature_txt'])
    dispatcher.start()
