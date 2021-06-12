{% extends 'base.tpl' %}

{% block extra_title %}
    Watch
{% endblock %}

{% block body %}
  <ul>
    {% for device in devices %}
      <li>
        {{ device.name }} ({{ device.id }})
      </li>
    {% endfor %}
  </ul>
{% endblock %}
