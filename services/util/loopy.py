import urllib2
import json
from switch import switch


class Loopy:
    def __init__(self, base_url, params, page_size=100):
        self.base_url = base_url
        self.params = params
        self.page_size = page_size
        self.current_page = 1
        self.result_count = 0
        self.params = [
            {
                "query_type": "between",
                "property_name": "timestamp_ms",
                "query_value": [1469695563000, 1469702566000]
            },
            {
                "query_type": "where",
                "property_name": "lang",
                "query_value": "en"
            }
        ]

    def get_query_string(self):
        query_string = "?"
        for param in self.params:
            for case in switch(param.query_type):
                if case('between'):
                    query_string += "filter[where][" + param.property_name + "][" + param.query_type + "][0]="
                    query_string += param.query_value[0] + "&"
                    query_string += "filter[where][" + param.property_name + "][" + param.query_type + "][0]="
                    query_string += param.query_value[1] + "&"
                    break
                if case('where'):
                    query_string += "filter[" + param.query_type + "][" + param.property_name + "]="
                    query_string += param.query_value[0] + "&"
                    break
                if case():  # default, could also just omit condition or 'if True'
                    print "huh?"
        return query_string

    def get_count_query_string(self):
        return "count" + self.get_query_string()

    def get_count(self):
        self.base_url = "http://10.104.1.144:3003/api/socialMediaPosts/"
        result = json.load(urllib2.urlopen(self.base_url + self.get_count_query_string()))
        return result
