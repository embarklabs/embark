<div class="c-box">
  <img src="{{img}}" alt="Picture of {{name}}" class="c-avatar">
  <h3 class="c-body-title c-box__title">{{name}}</h3>
  <p class="c-meta">{{job}}</p>
  {% if github || twitter %}
  <div class="o-distance-m">
    <ul class="o-list-inline">
      {% if github %}
      <li class="o-list-inline__item">
        <a href="https://github.com/{{github}}" title="{{name}} on GitHub" target="_blank" class="o-flex o-flex-center u-link-uniform">
          <svg class="c-icon o-flex__item"><use xlink:href="{{url_for('../../assets/icons/symbols.svg#icon-github')}}"></use></svg>
          <span class="o-flex__item">Github</span>
        </a>
      </li>
      {% endif %}
      {% if twitter %}
      <li class="o-list-inline__item">
        <a href="https://twitter.com/{{twitter}}" title="{{name}} on Twitter" target="_blank" class="o-flex o-flex-center u-link-uniform">
          <svg class="c-icon o-flex__item"><use xlink:href="{{url_for('../../assets/icons/symbols.svg#icon-twitter')}}"></use></svg>
          <span class="o-flex__item">Twitter</span>
        </a>
      </li>
      {% endif %}
    </ul>
  </div>
  {% endif %}
</div>
