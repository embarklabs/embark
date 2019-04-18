{{
  partial('partial/header', {
    title: page.title,
    tagline: page.tagline,
    link: {
      text: page.link.text,
      href: page.link.href
    },
    showGitHubStars: page.showGitHubStars,
    showInstallCmd: page.showInstallCmd
  })
}}
<main role="main">
  <section class="o-container o-distance">
    {{
      partial('partial/heading', {
        title: '<span class="u-text-light">More than a </span>framework.',
        referal: 'Embark is a platform with tools to make developing decentralize applications a breeze.',
        link: {
          text: 'Join the Community',
          href: '/community'
        },
        className: 'o-center'
      })
    }}
    <div class="o-distance-l">
      <div class="o-grid">
        {{
          partial('partial/whisperbox', {
            className: 'o-grid__column--1-1 o-grid__column--large-1-3',
            title: 'Smart Contract Management',
            text: 'Build, test and deploy your Smart Contracts without the hassle. Embark takes care of the ground work, watches for changes, and redeploy your application when needed.',
            icon: 'pen-write-paper',
            link: {
              text: 'Learn more',
              href: '/docs/contracts_configuration.html'
            }
          })
        }}
        {{
          partial('partial/whisperbox', {
            className: 'o-grid__column--1-1 o-grid__column--large-1-3',
            title: 'Easy to use Debugger and Testing',
            text: "Testing shouldn't be an after thought. Embark makes debugging and testing a first class citizen of your development experience.",
            icon: 'search-bar',
            link: {
              text: 'Learn more',
              href: '/docs/contracts_testing.html'
            }
          })
        }}
        {{
          partial('partial/whisperbox', {
            className: 'o-grid__column--1-1 o-grid__column--large-1-3',
            title: 'End to End DApp Development',
            text: 'Go beyond Smart Contracts if you want to. Embark offers great integrations with decentralized services such as IPFS and Whisper.',
            icon: 'pie-line-graph',
            link: {
              text: 'Learn more',
              href: '/docs/javascript_usage.html'
            }
          })
        }}
      </div>
    </div>
  </section>
  <section class="o-distance-xl">
    <div class="c-box c-box--dark">
      <div class="o-container">
        <div class="o-media">
          <div class="o-media__body">
            <h2 class="c-section-title u-text-ghost">Powerful CLI</h2>
            <p class="c-subtitle o-box__subtitle u-text-light">Embark's command line interface comes with a rich dashboard so <strong>you</strong> are in control.</p>
            <div class="o-distance-l">
              <ul class="c-checklist">
                {{ partial('partial/checklist_item', { icon: 'icon-check', text: 'Service Monitoring', style: 'u-text-light' }) }}
                {{ partial('partial/checklist_item', { icon: 'icon-check', text: 'Interactive REPL', style: 'u-text-light' }) }}
                {{ partial('partial/checklist_item', { icon: 'icon-check', text: 'Real-time Deployment', style: 'u-text-light' }) }}
              </ul>
            </div>
            <a href="/docs/create_project.html" title="Creating apps using the CLI" class="c-button o-distance-l">Get started</a>
          </div>
          <div class="o-media__asset">
            <img src="{{url_for('assets/images/cli-tool.png')}}" alt="">
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="o-container o-distance-xxl">
    <div class="o-grid">
      <div class="o-grid__column--1-1 o-grid__column--medium-1-2">
        <img src="{{url_for('assets/images/EMBARK_MODULAR.png')}}" alt="" style="max-width: 85%;">
      </div>
      <div class="o-grid__column--1-1 o-grid__column--medium-1-2">
        {{
          partial('partial/heading', {
            title: '<span class="u-text-light">Modular by </span>Design',
            referal: 'Pick and choose what features, plugins and tools you want to integrate with. Embark is built with modularity in mind.'
          })
        }}
        <div class="o-distance-l">
          <ul class="c-checklist">
            {{ partial('partial/checklist_item', { icon: 'icon-check', text: 'Smart Contract only or fully fledged DApps' }) }}
            {{ partial('partial/checklist_item', { icon: 'icon-check', text: 'Integrate with existing tools' }) }}
            {{ partial('partial/checklist_item', { icon: 'icon-check', text: 'Extend it to your needs' }) }}
          </ul>
        </div>
        <div class="o-distance-l">
          <div class="o-buttonbar">
            <a href="/plugins" title="Plugins" class="c-button o-buttonbar__item">See plugins</a>
            <a href="/docs/creating_plugins.html" title="Creating Plugins" class="c-button c-button--ghost o-buttonbar__item">Create your own</a>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="o-distance-xxl">
    <div class="c-box c-box--universe c-box--visible o-overlap" style="background-image: url({{url_for('../../assets/images/dots.png')}})">
      <div class="o-container">
        <div class="o-heading o-center">
          <h2 class="o-heading__title c-section-title">
            Mission control with <span class="u-text-ghost">Cockpit.</span>
          </h2>
          <p class="o-heading__subtitle c-subtitle u-text-ghost">
            A web interface for building, debugging and deploying decentralized applications.
          </p>
          <p class="o-heading__footer">
            <!-- <a href="#" class="c-button c-button--ghost" title="Get Started">Get Started</a>-->
          </p>
        </div>
        <div class="o-distance-xl">
          <div class="o-grid">
            <div class="o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-4">
              <h3 class="c-title-level-3 u-text-ghost">Web UI Dashboard</h3>
              <p>Gives an overview of all processes controlled by Embark. It also comes with an interactive console and predictive commands.</p>
              <a href="/docs/cockpit_dashboard.html" title="Cockpit Dashboard">Learn more &rarr;</a>
            </div>
            <div class="o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-4">
              <h3 class="c-title-level-3 u-text-ghost">Explorer</h3>
              <p>Cockpit's explorer lets you easily review any transactions, Smart Contracts and accounts.</p>
              <a href="/docs/cockpit_explorer.html" title="Cockpit Explorer">Learn more &rarr;</a>
            </div>
            <div class="o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-4">
              <h3 class="c-title-level-3 u-text-ghost">Deployment</h3>
              <p>With Cockpit, you can iteratively and selectively deploy your Smart Contracts, removing any headaches when it comes to complex applications.</p>
              <a href="/docs/cockpit_deployment.html" title="Cockpit Deployment">Learn more &rarr;</a>
            </div>
            <div class="o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-4">
              <h3 class="c-title-level-3 u-text-ghost">Code Editor</h3>
              <p>Edit your source files from right within Cockpit for quick and easy updates.</p>
              <a href="/docs/cockpit_editor.html" title="Cockpit Editor">Learn more &rarr;</a>
            </div>
          </div>
        </div>
        <div class="o-overlap__image">
          <img src="{{url_for('assets/images/tool-screenshot.png')}}" alt="Cockpit">
        </div>
      </div>
    </div>
  </section>
  <section class="o-distance">
    <div class="c-box c-box--unframed" style="background-image: url({{url_for('assets/images/bg-hexagons.png')}})">
      {{
        partial('partial/heading', {
          title: '<span class="u-text-light">For developers</span>, by developers',
          referal: 'Embark is a fully open source effort. Get involved and be part of the journey.',
          link: {
            text: 'Join the Community',
            href: '/community'
          },
          className: 'o-center'
        })
      }}
    </div>
  </section>
  <section>
    <div class="o-container-medium o-distance o-center">
      <div class="c-box c-box--spot">
          <h3><span >Sign up for updates</span></h3>
          <div id="mc_embed_signup" class="o-distance-l">
            <form action="https://status.us20.list-manage.com/subscribe/post?u=774518184e8661075f1b012f5&amp;id=4189213bb9" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate>
              <div class="o-buttonbar">
                <input type="email" value="" name="EMAIL" class="required email o-buttonbar__item" id="mce-EMAIL" placeholder="Enter your email address">
                <input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" class="c-button o-buttonbar__item">
                <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->
                <div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_774518184e8661075f1b012f5_4189213bb9" tabindex="-1" value=""></div>
              </div>
            </form>
          </div>
          <p class="o-distance-m">Sign up to our newsletter and get updates about Embark and our development progress first!</p>
      </div>
    </div>
  </section>
</main>
