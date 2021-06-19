<select>
  {% for location in devices_by_location %}
    <option value="{{ loop.index0 }}" {% if loop.index0 == location_index %}selected{% endif %}>{{ location.name }} ({{ location.devices | length }} devices)</option>
  {% endfor %}
</select>

<select>
  {% for date in dates %}
    <option value="{{ date }}" {% if date == chosen_date %}selected{% endif %}>{{ date }}</option>
  {% endfor %}
</select>
