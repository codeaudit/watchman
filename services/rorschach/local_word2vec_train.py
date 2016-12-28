import json, time, os, logging, sys, argparse, codecs
import numpy as np
from datetime import date
from math import log
import matplotlib.pyplot as plt
#from sklearn.feature_extraction.text import TfidfVectorizer
from gensim.models import Word2Vec
sys.path.append(os.path.join(os.path.dirname(__file__), "../util"))
from sentiment_filters import SentimentFilter

def vec_from_tweet(model, l_txt, dimensions, s_words, d_idf):
    v = np.zeros(dimensions)
    vi = np.zeros(dimensions)
    for term in l_txt:
        if term in s_words:
            v = v + model[term]
            if term in d_idf.keys():
                vi = vi + d_idf[term]*model[term]
    f = map(lambda x: (x[0], x[1], d_idf[x[1]] if x[1] in d_idf.keys() else 0), enumerate(l_txt))
    f.sort(key=lambda x: x[2], reverse=True)
    vif = np.zeros(dimensions)
    for t in f[:3]:
        term = t[1]
        if term in s_words and term in d_idf.keys():
            vif = vif + d_idf[term]*model[term]
    return (v, vi, vif)

def get_cos(v1, v2):
    return np.dot(v1, v2)/(np.linalg.norm(v1)*np.linalg.norm(v2))

def main(s_lng='en', test_words=[]):
    s_path = '/Volumes/ed_00/data/raw_tweet_data/tweets_w_img_url/'
    #s_path = '/Users/jgartner/Desktop/tweets/'
    s_save = date.today().strftime('%b%d')+'_'+s_lng

    l_files = os.listdir(s_path)
    _X = []
    d_df = {}
    #raw_text = []
    t0 = time.time()
    tt = time.time()
    sent_filt = SentimentFilter()
    keys = set([])
    l_num = 0
    l_docs = [[] for x in range(len(test_words))]
    for s_file in l_files:
        if s_file[-4:] != 'json':
            continue
        f = open(s_path+s_file)
        for line in f:
            try:
                d0 = json.loads(line)
            except:
                continue
            if 'lang' not in d0.keys():
                continue
            if d0['lang'] != s_lng:
                continue
            txt = d0['text']
            if sent_filt.is_scoreable(txt, s_lng, True) is False:
                continue
            l_txt = sent_filt.tokenize(txt, s_lng, True)
            if test_words is not None:
                for i in range(len(l_docs)):
                    if test_words[i] in l_txt:
                        l_docs[i].append(l_num)
            _X.append(l_txt)
            l_num += 1
            if l_num %100==0:
                diff = time.time() - tt
                print "time for 100:", diff, "(total", l_num, ")"
                tt = time.time()
                sys.stdout.flush()
            for t in l_txt:
                if t in keys:
                    d_df[t] += 1
                else:
                    d_df[t] = 1
                    keys.add(t)

    diff = time.time()-t0
    print "\nTime to read in", l_num, "files", diff

    print "Training Model"
    t0 = time.time()
    dimensions = 100
    logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)
    model = Word2Vec(_X, min_count=100, size=dimensions)
    model.save('./models/' + s_save + 'word2vec')
    diff = time.time()-t0
    print "Time to train model:", diff
    print "Number of tweets:", len(_X)

    d_idf = {}
    model_vocab = set(model.vocab.keys())
    print "Terms in dict:", len(d_df.keys())
    for k, v in d_df.iteritems():
        if k not in model_vocab:
            continue
        freq = float(v)/float(l_num)
        if v > 100 and freq < 0.95:
            d_idf[k] = map(lambda x: x*log(1/freq), list(model[k]))
    with codecs.open('models/' + s_save, mode='w', encoding='utf-8') as outfile:
        outfile.write(json.dumps(d_idf))


    t0 = time.time()
    l_sim = [[], [], []]
    l_dif = [[], [], []]
    s_words = set(model.index2word)
    n_comp = 200
    print "TEST cosine diff of test phrases on {}x{} combination of sentances".format(n_comp,n_comp)
    for i in l_docs[0][:n_comp]:
        (v1, vi1, vif1) = vec_from_tweet(model, _X[i], dimensions, s_words, d_idf)
        for j in l_docs[1][:n_comp]:
            if i == j:
                continue
            (v2, vi2, vif2) = vec_from_tweet(model, _X[j], dimensions, s_words, d_idf)
            l_sim[0].append(get_cos(v1, v2))
            l_sim[1].append(get_cos(vi1, vi2))
            l_sim[2].append(get_cos(vif1, vif2))
        for k in l_docs[2][:n_comp]:
            if i == k:
                continue
            (v3, vi3, vif3) = vec_from_tweet(model, _X[k], dimensions, s_words, d_idf)
            l_dif[0].append(get_cos(v1, v3))
            l_dif[1].append(get_cos(vi1, vi3))
            l_dif[2].append(get_cos(vif1, vif3))

    if test_words is not None:
        diff = time.time()-t0
        print "Time to test model:", diff
        bins = map(lambda x: x*0.01, range(101))
        plt.figure(1)
        plt.subplot(231)
        plt.hist(l_sim[0], bins=bins)
        plt.yscale('log', nonposy='clip')
        x1, x2, y1, y2 = plt.axis()
        plt.axis((x1,x2,0.1,10000))
        plt.title("Cos Similarity " + test_words[0] + " to " + test_words[1] + ", bag of words")
        plt.subplot(232)
        plt.hist(l_sim[1], bins=bins)
        plt.yscale('log', nonposy='clip')
        x1, x2, y1, y2 = plt.axis()
        plt.axis((x1,x2,0.1,10000))
        plt.title("Cos Similarity " + test_words[0] + " to " + test_words[1] + ", tf-idf")
        plt.subplot(233)
        plt.hist(l_sim[2], bins=bins)
        plt.yscale('log', nonposy='clip')
        x1, x2, y1, y2 = plt.axis()
        plt.axis((x1,x2,0.1,10000))
        plt.title("Cos Similarity " + test_words[0] + " to " + test_words[1] + ", tf-idf, filtered")
        plt.subplot(234)
        plt.hist(l_dif[0], bins=bins)
        plt.title("Cos Similarity " + test_words[0] + " to " + test_words[2] + ", bag of words")
        plt.yscale('log', nonposy='clip')
        x1, x2, y1, y2 = plt.axis()
        plt.axis((x1,x2,0.1,10000))
        plt.subplot(235)
        plt.hist(l_dif[1], bins=bins)
        plt.title("Cos Similarity " + test_words[0] + " to " + test_words[2] + ", tf-idf")
        plt.yscale('log', nonposy='clip')
        x1, x2, y1, y2 = plt.axis()
        plt.axis((x1,x2,0.1,10000))
        plt.subplot(236)
        plt.hist(l_dif[2], bins=bins)
        plt.title("Cos Similarity " + test_words[0] + " to " + test_words[2] + ", tf-idf, filtered")
        plt.yscale('log', nonposy='clip')
        x1, x2, y1, y2 = plt.axis()
        plt.axis((x1,x2,0.1,10000))
        plt.savefig("cos_sep.png")
        plt.show()

if __name__ == "__main__":
    par = argparse.ArgumentParser()
    par.add_argument("lang_code", help="Languae Code for tweets to train model (e.g. 'en')")
    par.add_argument("--test_words", help="Two words, separated by a comma, for testing cosine similarity (example 'tory,football')", default=None)
    args = par.parse_args()
    s_lng = args.lang_code
    l_test = args.test_words.split(',') if type(args.test_words)==type('') else None
    print s_lng, l_test
    main(s_lng=s_lng, test_words=l_test)
