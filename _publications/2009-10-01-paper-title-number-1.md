---
title: "INCLUDE: A Large Scale Dataset for Indian Sign Language Recognition"
collection: publications
permalink: /publication/INCLUDE
excerpt: 'INCLUDE is the first Isolated Sign Language Video Dataset for Indian Sign Language (ISL). In this paper, we published the INCLUDE dataset, which consists of 4287 videos across 263 ISL signs. We also published sign language recognition models that achieved a 94.5% accuracy on INCLUDE-50 (a subset of INCLUDE), and 85.6% accuracy on INCLUDE.'
date: 2020-10-12
venue: 'ACM MultiMedia'
paperurl: 'https://dl.acm.org/doi/10.1145/3394171.3413528'
citation: 
---
Indian Sign Language (ISL) is a complete language with its own grammar, syntax, vocabulary and several unique linguistic attributes. It is used by over 5 million deaf people in India. Currently, there is no publicly available dataset on ISL to evaluate Sign Language Recognition (SLR) approaches. In this work, we present the Indian Lexicon Sign Language Dataset - INCLUDE - an ISL dataset that contains 0.27 million frames across 4,287 videos over 263 word signs from 15 different word categories. INCLUDE is recorded with the help of experienced signers to provide close resemblance to natural conditions. A subset of 50 word signs is chosen across word categories to define INCLUDE-50 for rapid evaluation of SLR meth- ods with hyperparameter tuning. As the first large scale study of SLR on ISL, we evaluate several deep neural networks combining different methods for augmentation, feature extraction, encoding and decoding. The best performing model achieves an accuracy of 94.5% on the INCLUDE-50 dataset and 85.6% on the INCLUDE dataset. This model uses a pre-trained feature extractor and encoder and only trains a decoder. We further explore generalisation by fine-tuning the decoder for an American Sign Language dataset. On the ASLLVD with 48 classes, our model has an accuracy of 92.1%; improving on existing results and providing an efficient method to support SLR for multiple languages.

[Download paper here](http://academicpages.github.io/files/INCLUDE.pdf)
[Download dataset here](https://zenodo.org/record/4010759#.YXVPsp5BxPY)
