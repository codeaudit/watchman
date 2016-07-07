import os
import sys
import time
import argparse
import numpy as np
import json
import pandas as pd
import multiprocessing

from functools import partial
from pysparkling import Context
from caffe_featurizer import CaffeFeaturizer

parser = argparse.ArgumentParser(description='Featurize some images.')
parser.add_argument('-caffeRootDir', dest='caffeRootDir', action='store', help='root directory for caffe.')
args = parser.parse_args()
CAFFE_ROOT = args.caffeRootDir

sys.path.insert(0, CAFFE_ROOT + 'python')
featurizer = CaffeFeaturizer(CAFFE_ROOT)


def create_dictionary(subdir, file_i):
    file_full_path = os.path.join(subdir, file_i)
    dict = {}
    dict["name"] = file_full_path
    print '----SERIALIZING----'
    return json.dumps(dict)


def convert_files_to_dictionary(image_dir_path):
    for subdir, dirs, files in os.walk(image_dir_path):
        try:
            cpus = multiprocessing.cpu_count()
        except NotImplementedError:
            cpus = 2
        pool = multiprocessing.Pool(processes=cpus)
        # print pool.map(serialize, files)
        func = partial(create_dictionary, subdir)
        data = pool.map(func, files)
        return data


def dump(x):
    return json.dumps(x)


def get_caffe_features(file_path):
    try:
        featurizer.set_batch_size(1)
        featurizer.set_files([file_path])
        featurizer.load_files()
        featurizer.forward()

        features = pd.DataFrame(featurizer.featurize())
        features = features.drop(featurizer.errs)[0]

        return features

    except Exception as e:
        print e
        # print("ERROR reading image file %s" % str(bytes_str))
        print
        CURR_NUM_FEATURES = 88
        sentinel_vec = -1*np.ones(CURR_NUM_FEATURES)
        return sentinel_vec.tolist()


def get_features(image_json_txt_obj):
    print '---------------PROCESSING IMAGE----------------'
    image_json_dict = json.loads(image_json_txt_obj)
    file_path = str(image_json_dict["name"])
    features = get_caffe_features(file_path)
    image_json_dict["features"] = features
    return image_json_dict


def file_to_string(output_path):
    fd = open(output_path)
    arr = []
    for line in fd:
        arr.append(line)
    return arr


def remove_file(file):
    os.remove(file)


def get_all_features_in_path(image_dir_path, output_path, start_time):
    if not os.path.isdir(image_dir_path):
        return None
    data_arr = convert_files_to_dictionary(image_dir_path)
    # pysparkling:
    sc = Context()
    # pyspark:
    # conf = SparkConf().setAppName("HOG and GIST ETL")
    # sc = SparkContext(conf=conf)
    num_parts = 4
    rdd = sc.parallelize(data_arr, num_parts)
    # submit image rdd to processing
    rdd_features = rdd.map(get_features).coalesce(1)
    # save as txt file:
    rdd_features.map(dump).saveAsTextFile(output_path)
    print "------------------ %f minutes elapsed ------------------------" % ((time.time() - start_time)/60.0)
    results_str = file_to_string(output_path)
    remove_file(output_path)
    return results_str


# For each image file submitted for processing,
# saves features and corresponding filename as json object
# ------------------------------------------
# NOTE: for each json object in output, check first element of "features" list for -1.
# If equals -1, then method was unable to extract features from the image
def run_feature_extraction():
    start_time = time.time()
    desc='Feature Extraction for Images'
    parser = argparse.ArgumentParser(
        description=desc,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=desc)

    default_path = 'target_images'
    parser.add_argument("--input_dir", help="input directory", default=default_path)
    parser.add_argument("--output", help="output file", default='image_features')
    args = parser.parse_args()
    # serialize and put all images in rdd:
    # use json schema:
    #     "name": "",
    #     "bytes": ""
    #     "features": "[]"
    image_dir_path = args.input_dir
    data_arr = convert_files_to_dictionary(image_dir_path)

    # pysparkling:
    sc = Context()

    # pyspark:
    # conf = SparkConf().setAppName("HOG and GIST ETL")
    # sc = SparkContext(conf=conf)

    num_parts = 4
    rdd = sc.parallelize(data_arr, num_parts)
    # submit image rdd to processing
    rdd_features = rdd.map(get_features).coalesce(1)
    # save as txt file:
    rdd_features.map(dump).saveAsTextFile(args.output)
    print "------------------ %f minutes elapsed ------------------------" % ((time.time() - start_time)/60.0)

    # helper fct to encapsulate:
    # get_all_features_str(image_dir_path, args.output, start_time)


if __name__ == '__main__':
    run_feature_extraction()
