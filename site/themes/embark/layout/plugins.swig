{{
  partial('partial/header', {
    title: __(page.title),
    tagline: __(page.tagline),
    compact: true
  })
}}
<main role="main">
  {% if page.intro %}
  <section class="o-container o-distance">
    {{
      partial('partial/heading', {
        referal: __('plugins_page.intro_section.heading.referal'),
        className: 'o-center',
        link: {
          href: '/docs/creating_plugins.html',
          text: __('plugins_page.intro_section.heading.link')
        }
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
