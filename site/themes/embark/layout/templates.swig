{{
  partial('partial/header', {
    title: __(page.title),
    tagline: __(page.tagline),
    compact: true
  })
}}
<main role="main">
  {% if page.deprecationNotice %}
  <section class="o-container o-distance">
    {{
      partial('partial/notification', {
        type: 'danger',
        title: 'DEPRECATION NOTICE',
        text: page.deprecationNotice
      })
    }}
  </section>
  {% endif %}
  <section class="o-container o-distance">
    <div class="o-grid">
      {% for plugin in site.data[page.data] %}
        {{
          partial('partial/whisperbox', {
            className: 'o-grid__column--1-1 o-grid__column--large-1-3',
            title: plugin.name,
            text: __(plugin.description),
            link: {
              text: __('plugins_page.learn_more_link'),
              href: plugin.link
            }
          })
        }}
      {% endfor %}
    </div>
  </section>
</main>
