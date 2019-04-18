<a href="{{link.href}}" class="c-box c-box--cover {% if className %} {{ className }} {% endif %}" style="background-image: url({% if image %}{{ image }}{% else %}https://images.unsplash.com/photo-1551086144-2e1250996ba7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1351&q=80{% endif %})">
  <div class="c-box__overlay"></div>
  <div class="c-box__body">
    {% if icon %}
    <svg class="c-icon c-icon--l"><use xlink:href="{{url_for('../../assets/icons/symbols.svg')}}#icon-{{ icon }}"></use></svg>
    {% endif %}
    <h3 class="{% if titleClassName %}{{titleClassName}}{% else %}c-body-title{% endif %} u-text-ghost">{{title}}</h3>
    {% if dateInfo %}<time class="c-meta u-text-ghost">{{ date(dateInfo, 'Do MMMM YYYY') }}</time>{% endif %}
    <p class="c-box__subtitle u-text-ghost">{{ text }}</p>
    {% if link %}
    <p class="c-box__footer">
      <span class="c-link">{{ link.text }}</span>
    </p>
    {% endif %}
  </div>
</a>

