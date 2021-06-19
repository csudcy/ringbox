<!-- Location Select -->
<select>
  {% for location in devices_by_location %}
    <option value="{{ loop.index0 }}" {% if loop.index0 == location_index %}selected{% endif %}>{{ location.name }} ({{ location.devices | length }} devices)</option>
  {% endfor %}
</select>

<!-- Date Select -->
<select>
  {% for date in dates %}
    <option value="{{ date }}" {% if date == chosen_date %}selected{% endif %}>{{ date }}</option>
  {% endfor %}
</select>

<!-- Speed Controls -->
{% set SPEEDS = [
  {'text': '<', 'value': -1.0},
  {'text': '||', 'value': 0},
  {'text': '1/4', 'value': 0.25},
  {'text': '1/2', 'value': 0.5},
  {'text': '>', 'value': 1.0},
  {'text': '2x', 'value': 2.0},
  {'text': '5x', 'value': 5.0},
  {'text': '10x', 'value': 10.0},
  {'text': '30x', 'value': 30.0}
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
