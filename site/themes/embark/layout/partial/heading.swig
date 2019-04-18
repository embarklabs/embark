<div class="o-heading {{className}}">
  {% if title %}
  <h2 class="o-heading__title c-section-title">
    {{title}}
  </h2>
  {% endif %}
  {% if referal %}
  <p class="o-heading__subtitle c-subtitle u-text-death">
    {{ referal }}
  </p>
  {% endif %}
  {% if link %}
  <p class="o-heading__footer">
    <a href="{{link.href}}" {% if link.class %} class="{{link.class}}" {% else %} class="c-link" {% endif %} title="{{link.text}}">{{link.text}}</a>
  </p>
  {% endif %}
</div>

