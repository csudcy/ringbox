{% for device in chosen_location.devices %}
  <span class="video_container" id="video_{{ device.id }}">
    Loading {{ device.name }}...
  </span>
{% endfor %}
