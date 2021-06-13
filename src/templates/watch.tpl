{% extends 'base.tpl' %}

{% block extra_title %}
  Watch
{% endblock %}

{% block extra_head %}
{% endblock %}

{% block scripts %}
  <!-- Libraries -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.min.css" integrity="sha512-1PKOgIY59xJ8Co8+NE6FZ+LOAZKjy+KY8iq0G4B3CyeY6wYHN3yt9PW0XpSriVlkMXe40PTKnXrLnZ9+fkDaog==" crossorigin="anonymous" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/nunjucks/3.0.1/nunjucks.min.js" integrity="sha512-IIuR+Zp8wvP0dxNcSsRPoL7SXzP1kGmosDtcU7f6cPObZ9F5Ze/icFSRH/SqigP468jGwDm2XOE0/gSGm/cTBw==" crossorigin="anonymous"></script>

  <!-- Custom -->
  <link rel="stylesheet" href="/static/watch.css" type="text/css">
  <script src="/static/watch.js"></script>
{% endblock %}

{% block body %}
  <span class="container_main">
    <span id="video_container">
      Loading...
    </span>
    <span id="controls_container">
      Loading...
    </span>
    <span id="history_container">
      Loading...
    </span>
  </span>
{% endblock %}
