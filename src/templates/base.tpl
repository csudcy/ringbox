<!DOCTYPE html>
<html>
  <head>
    <title>{% block extra_title %}Welcome!{% endblock %} | Ringbox</title>
    <link rel="icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACO0lEQVR4Xu2avy8EURDHP0dDNFQItR9/AaJU0PtRColaQyca0aFQS/wDiFIrGjqdv4BWqURG7hJZb3Nz2dvZOTtb7s3uzHze98178/Ya1Pxq1Dx/AkAooOYEYgrUXABRBMucAlPAJrAETAPDUCnwG2Atq/gyAIwCx8A20O9oipkAmANugXFHibdCKR2AJH8PDDhMXkIqFYDI/tnpyJso4ALYcTTyZ8BTJp7XxL2uVGWp9i/OCt46cK0ZkG6sAlLxDzTODG1MATwC84bJaVyZAngHRjRRGdqYAviseIeX4moK4AMYNBxdjStTALICzGqiMrQxBXDZ3Pcb5tfWlSmAFeCubUi2BqYAJDVvS6E5gEXgAeizHehcb+YAJJJ94KTOACT3I+DQAYRKFNDKewM4B8YqBFEpAMl7CNgFtgDpFq2vygH8TngSmAGWm3UiC0OCzV57iQZL+nvp8zWXrEpvGsNutMMaP2IjJ7JXCeNUDNLLr2Zsk0daWud5dgGgKMEOns9TgPYV/1YBAUBJIBSQ+rSlhJdr5qEIanPoeQVMAAuJbFNLo/pcX0vPwzKYF8NX4gf1Ti4AFCSQVwPMdmKASwUEAKu9eCggpkDv1ADpr7Pf3AvW4J/Hs22v3Kt8GUwVwW4kq31HAND+wUFLtNOdYCggZ24WBa593uUUKKsIpqCcllRw//jysBXWqqIUuwCQg9WyFyhlZLUvDQWEArRa+ad2loeiLhEGAJfDYhhUKMAQtktXoQCXw2IY1DfY5HdBKFlDHgAAAABJRU5ErkJggg=="/>
    {% block extra_head %}{% endblock %}
  </head>
  <body>
    {% block body %}
    {% endblock %}
  </body>
  {% block scripts %}
  {% endblock %}
</html>
