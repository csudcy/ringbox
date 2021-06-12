{% extends 'base.tpl' %}

{% block extra_title %}
    Login
{% endblock %}

{% block body %}
  <form method="POST" action=".">
    <ul>
      <li>
        <label for="username">Username: </label>
        <input type="text" name="username" id="username" value="{{ username }}"></input>
      </li>
      <li>
        <label for="password">Password: </label>
        <input type="password" name="password" id="password" value="{{ password }}"></input>
      </li>
      {% if needs_otp %}
        <li>
          <label for="otp">OTP: </label>
          <input type="text" name="otp" id="otp"></input>
        </li>
      {% endif %}
    </ul>
    <button type="submit">Show Devices</button>
  </form>
{% endblock %}
