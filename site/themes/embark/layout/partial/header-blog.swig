<header role="banner" class="c-header c-header--compact">
  <div class="o-container">
    <div class="c-header__top">
      <a href="{{ url_for_lang('') }}" title="Embark" class="c-logo c-logo--negative">Embark</a>
      <nav role="navigation" class="c-navigation">
        <div class="c-navigation__header">
          <a href="{{ url_for_lang('') }}" title="Embark" class="c-logo">Embark</a>
          <button class="c-navigation__close u-text-light" title="Close menu">
            <svg class="c-icon c-icon--xs"><use xlink:href="{{url_for('../assets/icons/symbols.svg#icon-close')}}"></use></svg>
          </button>
        </div>
        <div class="c-navigation__body">
          <ul class="c-navigation__list">
            <li class="c-navigation__item">
              <a href="{{ url_for('docs/quick_start.html') }}" class="c-navigation__anchor {% if is_quickstart() %}is-active{% endif %}" title="{{__('navigation.quick_start')}}">{{__('navigation.quick_start')}}</a>
            </li>
            <li class="c-navigation__item">
              <a href="/docs" class="c-navigation__anchor {% if is_current('/docs') && !is_quickstart() %}is-active{% endif %}" title="{{__('navigation.learn')}}">{{__('navigation.learn')}}</a>
            </li>
            <li class="c-navigation__item">
              <a href="/plugins" class="c-navigation__anchor {% if is_current('/plugins') %}is-active{% endif %}" title="{{__('navigation.plugins')}}">{{__('navigation.plugins')}}</a>
            </li>
            <li class="c-navigation__item">
              <a href="/community" class="c-navigation__anchor {% if is_current('/community') %}is-active{% endif %}" title="{{__('navigation.community')}}">{{__('navigation.community')}}</a>
            </li>
            <li class="c-navigation__item">
              <a href="https://blog.embarklabs.io" class="c-navigation__anchor {% if is_current('/news') %}is-active{% endif %}" title="{{__('navigation.blog')}}">{{__('navigation.blog')}}</a>
            </li>
          </ul>
        </div>
      </nav>
      <div class="o-flex o-flex-center">
        <form action="" class="o-flex__item u-hidden-until-large">
          <input type="search" placeholder="Search" id="search-input">
        </form>
        <div class="o-flex__item">
          <ul class="o-flex o-flex-center">
            <li class="o-flex__item">
              <a href="https://github.com/embarklabs/embark" title="Github" target="_blank" class="u-link-ghost">
                <svg class="c-icon"><use xlink:href="{{url_for('../assets/icons/symbols.svg#icon-github')}}"></use></svg>
              </a>
            </li>
            <li class="o-flex__item">
              <a href="https://twitter.com/EmbarkProject" title="Twitter" target="_blank">
                <svg class="c-icon"><use xlink:href="{{url_for('../assets/icons/symbols.svg#icon-twitter')}}"></use></svg>
              </a>
            </li>
            <li class="o-flex__item u-hidden-large-up">
              <button type="button"class="c-navigation__trigger u-link-ghost" title="Open menu">
                <svg class="c-icon"><use xlink:href="{{url_for('../assets/icons/symbols.svg#icon-navigation-menu')}}"></use></svg>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="c-quick-search o-distance-m u-hidden-large-up">
      <input type="search" id="inp-search" placeholder="Search">
    </div>
  </div>
  <div class="o-container-medium">
    <div class="c-header__body">
      <h1 class="c-title u-text-ghost">{{ title }}</h1>
      {% if author %}
      <div class="o-distance-m">
        <div class="o-flex o-flex-center">
          <span class="o-flex__item">
            <img src="{{ author.image }}" class="c-avatar-small">
          </span>
          <p class="o-flex__item">
            Written by {% if author.twitter %}<a href="https://twitter.com/{{author.twitter}}" title="{{author.name}} on Twitter">{{author.name}}</a>{% else %}{{author.name}}{% endif %} on the {% if articleDate %}<time class="u-text-ghost">{{ date(articleDate, 'Do MMMM YYYY') }}</time>{% endif %}
          </p>
        </div>
      </div>
      {% endif %}

      {% if tagline %}
      <p class="c-subtitle o-distance-s">{{ tagline }}</p>
      {% endif %}

      {% if link || showInstallCmd || linkAlternative %}
      <div class="o-buttonbar">
        {% if link %}
          <a href="{{ link.href }}" class="c-button o-buttonbar__item" title="{{ link.text }}">{{ link.text }}</a>
        {% endif %}
        {% if showInstallCmd %}
          <span class="c-button c-button--stateless o-buttonbar__item">npm install -g embark</span>
        {% endif %}
        {% if linkAlternative %}
          <a href="{{ link.href }}" class="c-button c-button--quite o-buttonbar__item" title="{{ linkAlternative.text }}">{{ linkAlternative.text }}</a>
        {% endif %}
      </div>
      {% endif %}
      {% if showGitHubStars %}
      <div class="o-distance-l">
        <a class="github-button" href="https://github.com/embarklabs/embark" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star embarklabs/embark on GitHub">Star</a>
      </div>
      {% endif %}
    </div>
  </div>
</header>

