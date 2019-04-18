{{
  partial('partial/header', {
    title: 'Building with Embark',
    tagline: 'Learn how <strong class="u-text-ghost">you</strong> can use Embark to build your apps.',
    link: {
      text: 'Quickstart &rarr;',
      href: '/docs/quick_start.html'
    }
  })
}}
<main role="main">
  <section class="o-container o-distance">
    {{
      partial('partial/heading', {
        title: '<span class="u-text-light">Start</span> here.',
        referal: "There's many ways to work with Embark. Here's a few good places to start.",
        className: 'o-center'
      })
    }}
    <div class="o-distance-l">
      <div class="o-grid">
        {{
          partial('partial/spotbox', {
            className: 'o-grid__column--1-1 o-grid__column--large-2-3',
            titleClassName: 'c-title-level-2',
            title: 'Documentation',
            text: 'Go straight to the docs and explore what Embark has to offer!',
            icon: 'list-to-do',
            link: {
              text: 'Learn more',
              href: '/docs/overview.html'
            }
          })
        }}
        {{
          partial('partial/spotbox', {
            className: 'o-grid__column--1-1 o-grid__column--large-1-3',
            title: 'Using the CLI',
            titleClassName: 'c-title-level-3',
            text: "Learn how to use Embark's command line interface to develop your apps.",
            icon: 'browser-gauge',
            link: {
              text: 'Learn more',
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
            title: 'Smart Contract Development',
            text: 'Embark provides a lot of flexibility when it comes to configuring, compiling and deploying your Smart Contracts.',
            icon: 'pen-write-paper',
            link: {
              text: 'Learn more',
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
            title: 'Create a plugin',
            text: 'Extend Embark to your needs! Learn how to build a plugin that integrates your favourite tools with Embark.',
            icon: 'module',
            link: {
              text: 'Learn more',
              href: '/docs/creating_plugins.html'
            }
          })
        }}
      </div>
    </div>
    <div class="o-distance o-center">
      <a href="/docs/overview.html" title="Docs Overview" class="c-button">Take me to the docs &rarr;</a>
    </div>
  </section>
</main>
