import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "./"))
sys.path.append(os.path.join(os.path.dirname(__file__), "../util"))
from loopy import Loopy

def name_event(host, event):
    if host[-1] != '/': host += '/'
    api_path = host + 'api/'
    query_params = [{
        "query_type": "between",
        "property_name": "end_time_ms"
    }]

    loopy = Loopy('{}eventModels'.format(api_path), query_params, page_size=500)

    print "attempting to name event"
    while True:
        page = loopy.get_next_page()
        if page is None:
            break
        for doc in page:
            print doc


