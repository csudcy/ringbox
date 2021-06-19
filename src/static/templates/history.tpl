{% for device in chosen_location.devices %}
  <span class="history_container" id="history_{{ device.id }}">
    <div>
      {{ device.name }}<br/>
      {% if device.history[chosen_date] %}
        {% for event in device.history[chosen_date] | reverse %}
            <button data-event-id="{{ event.id }}">
              &nbsp; &nbsp; {{ event.created_at | nice_time }} &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ({{ event.duration }}s, {{ event.type }})
            </button><br/>
        {% endfor %}
      {% else %}
        -
      {% endif %}
    </div>
  </span>
{% endfor %}
