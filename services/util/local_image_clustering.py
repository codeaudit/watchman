
import sys
import json
from os.path import join, dirname
sys.path.append(join(dirname(__file__), '../feature-similarity-clustering'))
from feature_similarity import FeatureSimilarity
import matplotlib.pyplot as plt

if __name__ == '__main__':
    day_night = "day"
    similarity_threshold = .5
    feature_similarity = FeatureSimilarity(similarity_threshold, 0, 1)
    image_path = "/home/jlueders/Desktop/protest_concert/all_" + day_night + "_images"
    image_data_path = image_path + "/image_data.json"
    feature_data = None
    with open(image_data_path) as json_data:
        feature_data = json.load(json_data)

    for image_data in feature_data['feature_data']:
        feature_similarity.process_vector(image_data['image'], image_data['image'], image_data['features'],
                                          image_data['image'])
    print day_night + " Concert and Protest Image Clusters"
    total_image_count = 0
    y1=[]
    y2=[]
    x=[similarity_threshold, similarity_threshold]
    with open(image_path + '/cluster_data.json', 'w') as outfile:
        clusters = feature_similarity.get_clusters()
        for cluster in clusters:
            total_image_count += len(cluster['similar_image_urls'])
            cluster['num_concert_images'] = 0
            cluster['num_protest_images'] = 0
            for url in cluster['similar_image_urls']:
                if day_night + "_concert" in url:
                    cluster['num_concert_images'] += 1
                if day_night + "_protest" in url:
                    cluster['num_protest_images'] += 1
            y1.append(cluster['num_concert_images'])
            y2.append(cluster['num_protest_images'])
            print "------CLUSTER------"
            print "Sim Threshold: {}".format(similarity_threshold)
            print "Num Concert: {}".format(cluster['num_concert_images'])
            print "Num Protest: {}".format(cluster['num_protest_images'])
            print "-------------------"

        orphans = len(feature_data['feature_data']) - total_image_count

        print "Orphans: {}".format(orphans)

        plt.bar(x, y1, width=.01, color="blue")
        plt.bar(x, y2, width=.01, color="green")

        plt.show()
        json.dump(clusters, outfile)
