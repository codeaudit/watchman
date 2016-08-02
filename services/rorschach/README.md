# Rorschach - Vectorizes Tweets Based on text sentiment

As a part of the watchmen QCR pipeline, we take tweets in and vectorize them in a streaming fashion.  The Rorschach module is
responsible for creating text sentiment vectors for incoming messages.  It uses a gensim word2vec model trained on Twitter data, 
and weights words in a sentence using tf-idf weighting.  

