#!/usr/bin/env python3
# assumes spark runs via project's docker-compose file.

'''
BEFORE RUNNING:
1.
'''

from pymongo import MongoClient, IndexModel, ASCENDING
from pyspark.sql import SparkSession, Row
from pyspark.sql.functions import array, explode, lit
import os, datetime, time, glob

host = 'mongo:27017'
uri_str = 'mongodb://' + host
mongo = MongoClient(uri_str)
db_name = 'rancor'
db = mongo[db_name]
posts_coll = 'SocialMediaPost'
# input_dir = os.getenv('PROVIDERS_PATH', '/tmp/data/')
input_dir = '/tmp/data'

mongo_ds = 'com.mongodb.spark.sql'
posts_uri = dict(uri=uri_str, database=db_name, collection=posts_coll)

# must specify partitioner for mongo 3.0
spark = SparkSession.builder \
  .config('spark.mongodb.input.partitioner', 'MongoSplitVectorPartitioner') \
  .getOrCreate()

sc = spark.sparkContext
sc.setLogLevel('ERROR')


# drop collection
db.drop_collection(posts_coll)

# help pyspark to infer schema
def rec_to_row(tweet):
    return Row(
        hashtags=(tweet[b'hashtags']),
        image_urls=(tweet[b'image_urls']),
        lang=str(tweet[b'lang']),
        post_id=str(tweet[b'post_id']),
        post_type=(tweet[b'post_type']).decode(),
        post_url=str(tweet[b'post_url']),
        text=str(tweet[b'text']),
        timestamp_ms=int(tweet[b'timestamp_ms']),
        state='new',
        system_created=datetime.datetime.now(),
        featurizer='hashtag'
    )

# check for 'bytes' type in all attrs (fails schema inference if so)
# for a in [b'lang', b'post_id', b'post_url', b'post_type', b'text']:
#     print(type(rdd.take(1)[0][a]))

start_time = 0
num_files = sum(os.path.isfile(f) for f in glob.glob(os.path.join(input_dir, 'part-*')))
print('found %s files' % num_files)

for i in range(num_files):
    # print run time per 10 files
    if i % 10 == 0:
        if start_time:
            print(time.time() - start_time, 'sec')
        start_time = time.time()

    fname = 'part-' + str(i).rjust(5, '0')
    print(fname)

    rdd = sc.pickleFile(os.path.join(input_dir, fname))
    posts_df = spark.createDataFrame(rdd.map(rec_to_row))
    # duplicate for other featurizers
    posts_df = posts_df.withColumn('featurizer', explode(array(lit('image'), posts_df['featurizer'])))
    posts_df = posts_df.withColumn('featurizer', explode(array(lit('text'), posts_df['featurizer'])))

    posts_df.write.format(mongo_ds).mode('overwrite').options(**posts_uri).save()

print('count:', db[posts_coll].count())

# db[posts_coll].drop_indexes()
# idx1 = IndexModel([('ProviderID', ASCENDING)], unique=True)
# idx2 = IndexModel([('iProviderID', ASCENDING)], unique=True)
# idx3 = IndexModel([('featured', ASCENDING)], sparse=True)
# db[posts_coll].create_indexes([idx1, idx2, idx3])

sc.stop()
