import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "./"))
sys.path.append(os.path.join(os.path.dirname(__file__), "../util"))
from loopy import Loopy

def name_event(host, event):
    if host[-1] != '/': host += '/'
    api_path = host
    query_params = []

    loopy = Loopy('{}eventModels'.format(api_path), query_params, page_size=500)

    print "attempting to name event"
    while True:
        page = loopy.get_next_page()
        if page is None:
            break

        for doc in page:
            similar_term_count = 0
            if 'hashtags' not in event:
                return
            if 'terms' not in doc:
                return
            for term in event['hashtags']:
                if term in doc['terms']:
                    similar_term_count +=1
            if similar_term_count/len(doc['terms']) >= .6:
                print "found a {} event".format(doc['name'])
                event['name'] = doc['name']
                return
            print doc


