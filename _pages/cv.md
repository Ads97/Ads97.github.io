---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

Education
======
* B.Tech From IIT-Madras, 2019

Publications
======
  <ul>{% for post in site.publications %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>

Research
======
  <ul>{% for post in site.talks %}
    {% include archive-single-talk-cv.html %}
  {% endfor %}</ul>

Awards
======
  <ul>{% for post in site.teaching %}
    {% include archive-single-talk-cv.html %}
  {% endfor %}</ul>
  
Work experience
======
  <ul>{% for post in site.posts %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>
  
Activities
======
  <ul>{% for post in site.portfolio %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>

