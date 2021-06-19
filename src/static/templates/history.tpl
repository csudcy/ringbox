{% for device in chosen_location.devices %}
  <span class="history_container" id="history_{{ device.id }}">
    Loading {{ device.name }}...
  </span>
{% endfor %}
