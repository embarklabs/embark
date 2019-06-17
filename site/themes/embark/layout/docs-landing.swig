{{
  partial('partial/header', {
    title: __(page.title),
    tagline: __('docs_landing_page.header.tagline'),
    link: {
      text: __('docs_landing_page.header.link'),
      href: '/docs/quick_start.html'
    }
  })
}}
<main role="main">
  <section class="o-container o-distance">
    {{
      partial('partial/heading', {
        title: __('docs_landing_page.intro_section.heading.title'),
        referal: __('docs_landing_page.intro_section.heading.referal'),
        className: 'o-center'
      })
    }}
    <div class="o-distance-l">
      <div class="o-grid">
        {{
          partial('partial/spotbox', {
            className: 'o-grid__column--1-1 o-grid__column--large-2-3',
            titleClassName: 'c-title-level-2',
            title: __('docs_landing_page.intro_section.box_1.title'),
            text: __('docs_landing_page.intro_section.box_1.text'),
            icon: 'list-to-do',
            link: {
              text: __('docs_landing_page.intro_section.box_1.link'),
              href: '/docs/overview.html'
            }
          })
        }}
        {{
          partial('partial/spotbox', {
            className: 'o-grid__column--1-1 o-grid__column--large-1-3',
            title: __('docs_landing_page.intro_section.box_2.title'),
            titleClassName: 'c-title-level-3',
            text: __('docs_landing_page.intro_section.box_2.text'),
            icon: 'browser-gauge',
            link: {
              text: __('docs_landing_page.intro_section.box_2.link'),
              href: '/docs/create_project.html'
            }
          })
        }}
      </div>
    </div>
    <div class="o-distance-l">
      <div class="o-grid">
        {{
          partial('partial/whisperbox', {
            className: 'o-grid__column--1-1 o-grid__column--large-1-2',
            title: __('docs_landing_page.intro_section.box_3.title'),
            text: __('docs_landing_page.intro_section.box_3.text'),
            icon: 'pen-write-paper',
            link: {
              text: __('docs_landing_page.intro_section.box_3.link'),
              href: '/docs/contracts_configuration.html'
            }
          })
        }}
        <!-- {{
          partial('partial/whisperbox', {
            className: 'o-grid__column--1-1 o-grid__column--large-1-3',
            title: 'Use Cockpit',
            text: "Learn how to develop, deploy and debug applications using Embark's companion interface Cockpit.",
            icon: 'space-rocket',
            link: {
              text: 'Learn more',
              href: '/docs/creating_plugins.html'
            }
          })
        }} -->
        {{
          partial('partial/whisperbox', {
            className: 'o-grid__column--1-1 o-grid__column--large-1-2',
            title: __('docs_landing_page.intro_section.box_4.title'),
            text: __('docs_landing_page.intro_section.box_4.text'),
            icon: 'module',
            link: {
              text: __('docs_landing_page.intro_section.box_4.link'),
              href: '/docs/creating_plugins.html'
            }
          })
        }}
      </div>
    </div>
    <div class="o-distance o-center">
      <a href="/docs/overview.html" title="{{__('docs_landing_page.intro_section.link.title')}}" class="c-button">{{__('docs_landing_page.intro_section.link.label')}}</a>
    </div>
  </section>
</main>
