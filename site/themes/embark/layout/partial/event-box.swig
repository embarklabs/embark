<div class="c-box {% if className %} {{ className }} {% endif %}">
  {% if eventDate %}<span class="c-tag c-tag--light c-box__offset">{{eventDate}}</span>{% endif %}
  <h3 class="c-body-title">
    {% if linkTitle %}
      <a href="{{link.href}}" title="{{name}}">{{name}}</a>
    {% else %}
      {{name}}
    {% endif %}
  </h3>
  {% if dateInfo || location %}
    <p class="c-meta">
    {% if location %}{{location}}{% endif %}
    {% if dateInfo %}{{date(dateInfo, 'Do MMMM YYYY')}}{% endif %}
    </p>
  {% endif %}
  <p class="c-box__subtitle u-text-ghost">{{description}}</p>
  {% if link %}
  <p class="c-box__footer">
    <a href="{{ link.href }}" title="{{ link.text }}" class="c-link c-link--ghost">{{link.text}}</a>
  </p>
  {% endif %}
</div>

