
import sys
import json
from os import listdir, getenv
from os.path import isfile, join, dirname
sys.path.append(join(dirname(__file__), '../caffe-image-featurizer'))
import caffe_feature_extraction

if __name__ == '__main__':
    caffe_root = getenv('CAFFE_HOME', 'CAFFE_HOME not set!')
    image_path = "/home/jlueders/Desktop/protest_concert/all_day_images"
    image_data = {'feature_data':[]}

    for f in listdir(image_path):
        image_file = join(image_path, f)
        if isfile(image_file):
            features = caffe_feature_extraction.get_all_features_in_path(caffe_root, image_file)
            image_data['feature_data'].append({'image':image_file, 'features':features})
    with open(image_path + '/image_data.json', 'w') as outfile:
        json.dump(image_data, outfile)
