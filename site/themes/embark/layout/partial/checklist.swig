<div class="o-distance-l">
  <ul class="c-checklist">
    {% for item in items %}
      <li class="c-checklist__item">
        <span class="c-checklist__circle">
          <svg class="c-icon c-checklist__icon"><use xlink:href="../assets/icons/symbols.svg#icon-check"></use></svg>
        </span>
        {{ item }}
      </li>
    {% endfor %}
  </ul>
</div>

