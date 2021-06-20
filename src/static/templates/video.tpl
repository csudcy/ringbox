{% for device in chosen_location.devices %}
  <span class="video_container" id="video_{{ device.id }}">
    <video autoplay muted>
      <source src=""></source>
    </video>
    <!-- TODO: Time display? -->
    <!-- TODO: Scrubber? -->
    <!-- TODO: Download link? -->
    <!-- TODO: Fullscreen button? -->
  </span>
{% endfor %}
