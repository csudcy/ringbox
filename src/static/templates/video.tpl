{% for device in chosen_location.devices %}
  <span class="video_container" id="video_{{ device.id }}">
    <video autoplay controls muted>
      <source src=""></source>
    </video>
  </span>
{% endfor %}
