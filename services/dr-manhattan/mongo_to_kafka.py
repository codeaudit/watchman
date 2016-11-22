from event_to_kafka import stream_events
import requests, argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("mongo_url", type=str, help="URL for getting data from mongo")
    parser.add_argument("-kafka_url", type=str, help="If writing events to kafka, specify url (default=None)", default=None)
    parser.add_argument("-kafka_topic", type=str, help="If writing event to kafka, specify topic (default=None)", default=None)
    parser.add_argument("--debug", help="Switch on for debugging", action='store_true')
    args = parser.parse_args()

    print "Debug:", args.debug

    print "Requesting Events"
    print "mongo_url = {}".format(args.mongo_url)
    r = requests.get("{}/api/events".format(args.mongo_url)).json()

    stream_events(r, args.kafka_url, args.kafka_topic, debug=args.debug)

