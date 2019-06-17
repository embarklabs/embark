<div class="o-flex o-flex-space-between">
  {% if next !== null %}
  <div class="o-flex__item">
    <a href="/{{next.path}}" class="c-button c-button--quite" title="{{__('paginator.prev.title')}}">{{__('paginator.prev.label')}}</a>
  </div>
  {% endif %}
  {% if prev !== null %}
  <div class="o-flex__item">
    <a href="/{{prev.path}}" class="c-button c-button--quite" title="{{__('paginator.next.title')}}">{{__('paginator.next.label')}}</a>
  </div>
  {% endif %}
</div>

