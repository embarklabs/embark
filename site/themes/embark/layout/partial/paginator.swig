<div class="o-flex o-flex-space-between">
  {% if next !== null %}
  <div class="o-flex__item">
    <a href="/{{next.path}}" class="c-button c-button--quite" title="Previous">&larr; Previous</a>
  </div>
  {% endif %}
  {% if prev !== null %}
  <div class="o-flex__item">
    <a href="/{{prev.path}}" class="c-button c-button--quite" title="Next Article">Next &rarr;</a>
  </div>
  {% endif %}
</div>

