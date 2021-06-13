<span class="history_container">
  HISTORY<br/>
  {% for location in devices_by_location %}
    {{ location.name }}<br/>
    <br/>
    {% for device in location.devices %}
      {{ device.name }}<br/>
      {{ device.id }}<br/>
      <br/>
    {% endfor %}
  {% endfor %}
</span>
