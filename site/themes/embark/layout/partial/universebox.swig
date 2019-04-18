<div class="c-box c-box--universe {% if className %} {{ className }} {% endif %}">
  {% if icon %}
  <svg class="c-icon c-icon--l"><use xlink:href="{{url_for('../../assets/icons/symbols.svg')}}#icon-{{ icon }}"></use></svg>
  {% endif %}
  <h3 class="{% if titleClassName %}{{titleClassName}}{% else %}c-body-title{% endif %} u-text-ghost">{{title}}</h3>
  <p class="c-box__subtitle u-text-ghost">{{ text }}</p>
  {% if link %}
  <p class="c-box__footer">
    <a href="{{link.href}}" title="{{link.text}}" class="c-link">{{ link.text }}</a>
  </p>
  {% endif %}
</div>

