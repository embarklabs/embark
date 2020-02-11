{{
  partial('partial/header', {
    title: 'Documentation',
    compact: true
  })
}}
<main role="main">
  <section class="o-guided-content o-distance">
    <div class="o-guided-content__wrapper">
      <button title="Open docs menu" id="guides-trigger" class="c-button c-button--minion u-hidden-large-up">
        <svg class="c-icon c-icon--xs"><use xlink:href="{{url_for('../../assets/icons/symbols.svg')}}#icon-navigation-menu"></use></svg>
        <span>Guides</span>
      </button>
      <div class="c-guide o-guided-content__guide"  id="guide-navigation">
        <div class="c-guide__header u-hidden-large-up">
          <a href="" title="Guides">
            Guides
          </a>
          <button type="button" title="Close menu" id="guides-close">
            <svg class="c-icon c-icon--xs"><use xlink:href="{{url_for('../../assets/icons/symbols.svg')}}#icon-close"></use></svg>
          </button>
        </div>
        <div class="c-guide__body">
          <nav role="navigation">
            {% for section in Object.keys(site.data.sidebar['docs']) %}
              <div class="{% if !loop.first %}o-distance-xl{% endif %}">
                <h3 class="c-category-title">{{__('sidebar.docs.' + section)}}</h3>
                <ul class="o-list-bare">
                  {% for guide in Object.keys(site.data.sidebar['docs'][section]) %}
                  <li class="o-list-bare__item">
                    <a href="/docs/{{site.data.sidebar['docs'][section][guide]}}" title="{{__('sidebar.docs.' + guide)}}" class="u-link-uniform {% if is_current('/docs/' + site.data.sidebar['docs'][section][guide]) %}is-active{% endif %}">{{__('sidebar.docs.' + guide)}}</a>
                    <!-- <div class="o-distance-m">
                      <ul class="o-list-bare c-navigation__subnav">
                        <li class="o-list-bare__item">
                          <a href="#" title="What is Embark?" class="u-link-uniform">What is Embark?</a>
                        </li>
                      </ul>
                    </div> -->
                  </li>
                  {% endfor %}
                </ul>
              {% if !loop.first %}</div>{% endif %}
            {% endfor %}
          </nav>
        </div>
      </div>
      <div class="o-guided-content__content">
        <p class="c-meta">{{ __('page.last_updated', date(page.updated, 'MMMM Do YYYY')) }}
          (<a href="https://github.com/embarklabs/embark/edit/master/site/source/{{page.source}}" target="_blank">
            Improve this guide <svg class="c-icon c-icon--xs"><use xlink:href="{{url_for('../../assets/icons/symbols.svg')}}#icon-pen-write-paper"></use></svg>
          </a>)
        </p>
        <div class="o-standard-page">
          <h1>{{ page.title }}</h1>
          {{ page.content }}
        </div>
        <div class="o-container-medium o-distance-l">
          {{ docs_paginator() }}
        </div>
      </div>
      <div class="o-guided-content__addition">
        <h3 class="c-category-title">Contents</h3>
        {{ toc(page.content) }}
      </div>
    </div>
  </section>
</main>

<script src="/js/linkjuice/dist/linkjuice.min.js"></script>
