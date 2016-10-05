
import json
from itertools import starmap,izip
from operator import mul
import numpy as np

def cosine_similarity(v1, normalized_v1, v2, normalized_v2):
    return sum(starmap(mul, izip(v1, v2))) / (normalized_v1 * normalized_v2)

if __name__ == '__main__':
    cluster_path_1 = "/home/jlueders/Desktop/protest_concert/_protest/cluster_data.json"
    cluster_path_2 = "/home/jlueders/Desktop/protest_concert/night_protest/cluster_data.json"

    cluster1 = None
    cluster2 = None

    with open(cluster_path_1) as cluster1_data:
        cluster1 = json.load(cluster1_data)[0]

    with open(cluster_path_2) as cluster2_data:
        cluster2 = json.load(cluster2_data)[0]

    cluster1_norm_vector = np.linalg.norm(cluster1['average_similarity_vector'])
    cluster2_norm_vector = np.linalg.norm(cluster2['average_similarity_vector'])

    print cosine_similarity(cluster1['average_similarity_vector'], cluster1_norm_vector,
                            cluster2['average_similarity_vector'], cluster2_norm_vector)
    print "hello"

