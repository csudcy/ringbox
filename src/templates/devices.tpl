{% extends 'base.tpl' %}

{% block extra_title %}
    Choose Devices
{% endblock %}

{% block body %}
  <form method="GET" action="/watch/">
    <ul>
      {% for location, devices in locations.items() %}
        <li>
          {{ location }}
          <ul>
            {% for device in devices %}
              <li>
                <input type="checkbox" name="d" id="device_{{ device.id }}" value="{{ device.id }}"></input>
                <label for="device_{{ device.id }}">{{ device.name }}</label>
              </li>
            {% endfor %}
          </ul>
        </li>
      {% endfor %}
    </ul>
    <button type="submit">View Devices</button>
  </form>
{% endblock %}
