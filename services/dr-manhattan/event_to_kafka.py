from kafka import KafkaProducer
from kafka.errors import KafkaError
from datetime import datetime
import json

def mongo_to_kafka(rec):
    loc = sorted(rec['location'], key=lambda x: x['weight'], reverse=True)
    o_loc = None
    if len(loc) > 0:
        o_loc = {"type": "Point",
                         "coordinates": [
                             loc[0]["coords"][0]["lng"],
                             loc[0]["coords"][0]["lat"]
                         ]
                }
    l_rec = []
    camps = filter(lambda x: x is not None, map(lambda x: x.keys()[0] if x.values()[0]>0.7 else None, rec['campaigns']))
    for camp in camps:
        l_rec.append(
            {'uid':rec['id'],
            'label':rec['name'],
            'startDate': datetime.fromtimestamp(rec['start_time_ms']/1000.0).isoformat(),
            'endDate': datetime.fromtimestamp(rec['end_time_ms']/1000.0).isoformat(),
            'hashtags': rec['hashtags'],
            'keywords':rec['keywords'],
            'urls':rec['urls'],
            'photos':rec['image_urls'],
            'importanceScore':rec['importance_score'],
            'topicMessageCount':rec['topic_message_count'],
            'campaigns': camp,
            'newsEventIds':[],
            'location': o_loc}
        )
    return l_rec

def stream_events(l_clusts, kafka_url, kafka_topic):
    print "Converting to Kafka format"
    kds = []
    for clust in l_clusts:
        kds.extend(mongo_to_kafka(clust))

    print "Creating Kafka Producer"
    producer = KafkaProducer(bootstrap_servers=kafka_url, value_serializer=lambda v: json.dumps(v).encode('utf-8'))
    print "Streaming Events"
    for doc in kds:
        state = producer.send(kafka_topic, doc)
        try:
            record_metadata = state.get(timeout=10)
            print (record_metadata.topic)
            print (record_metadata.partition)
            print (record_metadata.offset)
        except KafkaError:
            print KafkaError
            pass
