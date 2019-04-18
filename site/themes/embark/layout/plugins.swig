{{
  partial('partial/header', {
    title: page.title,
    tagline: page.tagline,
    compact: true
  })
}}
<main role="main">
  {% if page.intro %}
  <section class="o-container o-distance">
    {{
      partial('partial/heading', {
        referal: 'Plugins extend Embark and provide integration with other tools and technologies.',
        className: 'o-center',
        link: {
          href: '/docs/creating_plugins.html',
          text: 'Build your own!'
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
            text: plugin.description,
            link: {
              text: 'Learn more',
              href: plugin.link
            }
          })
        }}
      {% endfor %}
    </div>
  </section>
</main>
