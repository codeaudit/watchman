import community, sys, os, uuid
import networkx as nx
from random import sample
sys.path.append(os.path.join(os.path.dirname(__file__), "../util"))
from loopy import Loopy
from sentiment_filters import SentimentFilter
from operator import itemgetter as iget
from operator import or_


class Louvaine:
    def __init__(self, base_url, ent_url, geo_url):
        self.graph = nx.Graph()
        self.nodes_detailed = {}
        stop_file = open(os.path.dirname(__file__) + '/files/' + 'stopWordList.txt', 'r')
        self.stop = set([])
        self.ent_url = ent_url
        self.geo_url = geo_url
        for line in stop_file:
            self.stop.add(line.strip('\n').strip('\r'))

        self.sf = SentimentFilter()
        if base_url[-1] == '/':
            self.url = base_url
        else:
            self.url = base_url + '/'

    def add_node(self, cluster):
        n_id = cluster['id']
        self.graph.add_node(n_id)
        self.nodes_detailed[n_id] = cluster

    def add_edge(self, c_link):
        self.graph.add_edge(c_link['source'], c_link['target'], {'weight':c_link['weight']})

    def get_text_sum(self, cluster, com):
        n_posts = len(cluster['similar_post_ids'])
        l_sample = cluster['similar_post_ids']
        if n_posts > 30:
            l_sample = sample(cluster['similar_post_ids'], 30)
            n_posts = 30

        words = {}
        websites = set([])
        places = []

        com["campaigns"]["total"] += n_posts

        query_params = [{
            "query_type": "inq",
            "property_name": "post_id",
            "query_value": l_sample
        }]
        lp = Loopy(self.url + 'socialMediaPosts', query_params, page_size=500)

        page = lp.get_next_page()
        if page is None:
            return

        for social_media_post in page:
            if social_media_post['featurizer'] != cluster['data_type']:
                continue

            entities = None
            try:
                entities = Loopy.post(self.ent_url, json={'text': social_media_post['text']})
            except:
                print 'error getting entities, ignoring'

            places.extend(self.extract_locations(entities))

            self.extract_campaigns(com, social_media_post)

            tokens = self.extract_tokens(social_media_post, words, websites)

        self.analyze_tokens(com, websites, words)

        self.analyze_locations(com, places)

    @staticmethod
    def analyze_locations(com, places):
        for place in places:
            if type(place) is not dict:
                continue
            place_name = ''
            weight = 0.0

            if 'city' in place.keys():
                place_name = place['city'] + ' '
                weight += 1
            elif 'state' in place.keys():
                place_name += place['state'] + ' '
                weight += .1
            elif 'country' in place.keys():
                place_name += ' ' + place['country'] + ' '
                weight += .05

            if place_name in com['location']:
                com['location'][place_name]['weight'] += weight
            else:
                com['location'][place_name] = {
                    "type": "inferred point",
                    "geo_type": "point",
                    "coords": [{
                        "lat": place['latitude'],
                        "lng": place['longitude']}
                    ],
                    "weight": weight
                }

    @staticmethod
    def analyze_tokens(com, websites, words):
        for k, v in words.iteritems():
            if v < 5:
                continue
            if v in com['keywords']:
                com['keywords'][k] += v
            else:
                com['keywords'][k] = v
        for url in list(websites):
            com['urls'].add(url)

    @staticmethod
    def extract_campaigns(com, social_media_post):
        if 'campaigns' in social_media_post:
            for campaign in social_media_post['campaigns']:
                if campaign in com["campaigns"]["ids"]:
                    com["campaigns"]["ids"][campaign] += 1
                else:
                    com["campaigns"]["ids"][campaign] = 1

    def extract_tokens(self, social_media_post, words, websites):
        for word in [w for w in self.sf.pres_tokenize(social_media_post['text'], social_media_post['lang']) if
                     w not in self.stop]:
            if word[0] == '#':
                continue
            if word[:4] == 'http':
                websites.add(word)
            if word[:3] == 'www':
                websites.add('http://' + word)
            if word in words:
                words[word] += 1
            else:
                words[word] = 1

    def extract_locations(self, entities):
        places = []
        if entities:
            for res in entities:
                if res['tag'] != 'LOCATION':
                    continue
                geos = Loopy.post(self.geo_url, json={'address': res['label']})
                for place in geos:
                    places.append(place)
                    break
        return places

    def get_img_sum(self, cluster):
        n_posts = len(cluster['similar_post_ids'])
        l_sample = cluster['similar_post_ids']
        if n_posts > 100:
            l_sample = sample(cluster['similar_post_ids'], 100)

        imgs = set()

        #TODO: fix query type once S.L. is fixed
        for id in l_sample:
            query_params = [{
                "query_type": "between",
                "property_name": "post_id",
                "query_value": [id, id]
            }]
            lp = Loopy(self.url + 'socialMediaPosts', query_params)
            page = lp.get_next_page()
            if page is None:
                continue
            for doc in page:
                if 'primary_image_url' not in doc:
                    continue
                imgs.add(doc['primary_image_url'])
                break

        return imgs

    def get_communities(self):
        partition = community.best_partition(self.graph)
        communities = {}

        print "Communities found, getting event summary information"
        n_nodes = len(self.graph.nodes())
        checkpoints = [.1, .25, .5, .75, .9, .95, .99999, 1.1]
        ind_checked = 0
        n_checked = 0
        for n in self.graph.nodes():
            n_checked += 1
            while n_checked > checkpoints[ind_checked]*n_nodes:
                ind_checked += 1
                print "Finished {}% of nodes".format(checkpoints[ind_checked-1]*100)

            images = set()
            com = str(partition[n])
            if n not in self.nodes_detailed:
                print "{} not found in detailed node list...why????".format(n)
                continue
            clust = self.nodes_detailed[n]
            if com in communities:
                communities[com]['cluster_ids'].append(n)
                communities[com]['topic_message_count'] += len(clust['similar_post_ids'])
            else:
                communities[com] = {
                    'id': str(uuid.uuid4()),
                    'name': 'default',
                    'start_time_ms': clust['start_time_ms'],
                    'end_time_ms':clust['end_time_ms'],
                    'cluster_ids':[n],
                    'domains':{},
                    'hashtags':{},
                    'keywords':{},
                    'campaigns':{"total":0, 'ids':{}},
                    'urls':set([]),
                    'image_urls':[],
                    'location':{},
                    'importance_score':1.0,
                    'topic_message_count':len(clust['similar_post_ids'])}

            #Expand Summary data (hashtags, keywords, images, urls, geo, domains)
            if clust['data_type'] == 'hashtag':
                communities[com]['hashtags'][clust['term']] = len(clust['similar_post_ids'])
                images |= self.get_img_sum(clust)
                #Add full text analysis, many communities have no image/text nodes
                self.get_text_sum(clust, communities[com])
            elif clust['data_type'] == 'domain':
                # TODO: Verify we don't need hashtag or a get_domain_sum function
                communities[com]['domains'][clust['term']] = len(clust['similar_post_ids'])
                images |= self.get_img_sum(clust)
                self.get_text_sum(clust, communities[com])
            elif clust['data_type'] == 'image':
                images |= self.get_img_sum(clust)
            elif clust['data_type'] == 'text':
                images |= self.get_img_sum(clust)
                self.get_text_sum(clust, communities[com])

            communities[com]['image_urls'] = list(set(communities[com]['image_urls']) |images)

            #Make Sure Time is Correct
            if clust['start_time_ms'] < communities[com]['start_time_ms']:
                communities[com]['start_time_ms'] = clust['start_time_ms']
            if clust['end_time_ms'] > communities[com]['end_time_ms']:
                communities[com]['end_time_ms'] = clust['end_time_ms']

        print "Information collected, formatting output"

        #Cleanup -> transform dicst to order lists, sets to lists for easy javascript comprehension
        for com in communities.keys():
            l_camps = []
            if communities[com]['campaigns']['total'] != 0:
                l_camps = [{k:1.*v/float(communities[com]['campaigns']['total'])}
                           for k, v in communities[com]['campaigns']['ids'].iteritems()]

            communities[com]['campaigns'] = l_camps

            l_tags = map(lambda x: x[0], sorted([(k, v)
                                                 for k, v in communities[com]['hashtags'].iteritems()], key=iget(1)))
            communities[com]['hashtags'] = l_tags[:10]  # slice

            l_terms = sorted(list(communities[com]['keywords'].iteritems()), key=iget(1), reverse=1)
            communities[com]['keywords'] = l_terms[:10] # slice

            communities[com]['urls'] = list(communities[com]['urls'])

            l_domains = map(lambda x: x[0], sorted([(k, v)
                                                    for k, v in communities[com]['domains'].iteritems()], key=iget(1)))
            communities[com]['domains'] = l_domains[:10]  # slice

            temp = []
            for k, v in communities[com]['location'].iteritems():
                dt = v
                dt['label'] = k
                temp.append(dt)
            communities[com]['location'] = temp

        return communities

    def save_communities(self):
        communities = self.get_communities()
        for com in communities.values():
            if len(com['cluster_ids']) < 3:
                continue

            print 'Posting communities to {}'.format(self.url)
            Loopy.post(self.url + 'events/', json=com)
            print 'Communities Saved!'

        return communities
