import json

class HashtagClusters:
    def __init__(self, min_posts):
        self.hash_groups = {}
        self.min_post = min_posts

    def process_vector(self, vector_id, vector):
        for term in vector:
            if term in self.hash_groups.keys():
                self.hash_groups[term].append(vector_id)
            else:
                self.hash_groups[term] = [vector_id]

    def get_clusters(self):
        d0 = {}
        for k,v in self.hash_groups:
            if len(v) > self.min_post:
                d0[k] = v
        return d0

    def to_json(self):
        return json.dumps(self.get_clusters())

