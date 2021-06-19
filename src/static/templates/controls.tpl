<!-- Location Select -->
<select>
  {% for location in devices_by_location %}
    <option value="{{ loop.index0 }}" {% if loop.index0 == location_index %}selected{% endif %}>{{ location.name }} ({{ location.devices | length }} devices)</option>
  {% endfor %}
</select>

<!-- Date Select -->
<select>
  {% for date, count in chosen_location.event_count_by_date %}
    <option value="{{ date }}" {% if date == chosen_date %}selected{% endif %}>{{ date }} ({{ count }} events)</option>
  {% endfor %}
</select>

<!-- Time Display -->
<span id="time_display">
  ??:??:??
</span>

<!-- Speed Controls -->
{% set SPEEDS = [
  {'text': '||', 'value': 0},
  {'text': '.25x', 'value': 0.25},
  {'text': '.5x', 'value': 0.5},
  {'text': '1x', 'value': 1.0},
  {'text': '2x', 'value': 2.0},
  {'text': '4x', 'value': 4.0},
  {'text': '8x', 'value': 8.0},
  {'text': '16x', 'value': 16.0}
] %}
<span id="speed_control">
  {% for speed in SPEEDS %}
    <input
      type="radio"
      name="speed"
      id="speed_{{ loop.index0 }}"
      value="{{ speed.value }}"
      {% if speed.value == 1.0 %}checked{% endif %}></input>
    <label for="speed_{{ loop.index0 }}">{{ speed.text }}</label>
  {% endfor %}
</span>

<!-- TODO: Scrubber with device events -->
