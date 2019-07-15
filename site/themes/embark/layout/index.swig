{{
  partial('partial/header', {
    title: __('start_page.header.title'),
    tagline: __('start_page.header.tagline'),
    link: {
      text: __('start_page.header.link'),
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
        title: __('start_page.intro_section.heading.title'),
        referal: __('start_page.intro_section.heading.referal'),
        link: {
          text: __('start_page.intro_section.heading.link'),
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
            title: __('start_page.intro_section.box_1.title'),
            text: __('start_page.intro_section.box_1.text'),
            icon: 'pen-write-paper',
            link: {
              text: __('start_page.intro_section.box_1.link'),
              href: '/docs/contracts_configuration.html'
            }
          })
        }}
        {{
          partial('partial/whisperbox', {
            className: 'o-grid__column--1-1 o-grid__column--large-1-3',
            title: __('start_page.intro_section.box_2.title'),
            text: __('start_page.intro_section.box_2.text'),
            icon: 'search-bar',
            link: {
              text: __('start_page.intro_section.box_2.link'),
              href: '/docs/contracts_testing.html'
            }
          })
        }}
        {{
          partial('partial/whisperbox', {
            className: 'o-grid__column--1-1 o-grid__column--large-1-3',
            title: __('start_page.intro_section.box_3.title'),
            text: __('start_page.intro_section.box_3.text'),
            icon: 'pie-line-graph',
            link: {
              text: __('start_page.intro_section.box_3.link'),
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
            <h2 class="c-section-title u-text-ghost">{{__('start_page.cli_section.heading.title')}}</h2>
            <p class="c-subtitle o-box__subtitle u-text-light">{{__('start_page.cli_section.heading.referal')}}</p>
            <div class="o-distance-l">
              <ul class="c-checklist">
                {{ partial('partial/checklist_item', { icon: 'icon-check', text: __('start_page.cli_section.checklist.item_1'), style: 'u-text-light' }) }}
                {{ partial('partial/checklist_item', { icon: 'icon-check', text: __('start_page.cli_section.checklist.item_2'), style: 'u-text-light' }) }}
                {{ partial('partial/checklist_item', { icon: 'icon-check', text: __('start_page.cli_section.checklist.item_3'), style: 'u-text-light' }) }}
              </ul>
            </div>
            <a href="/docs/create_project.html" title="{{__('start_page.cli_section.link.title')}}" class="c-button o-distance-l">{{__('start_page.cli_section.link.label')}}</a>
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
            title: __('start_page.modular_section.heading.title'),
            referal: __('start_page.modular_section.heading.referal')
          })
        }}
        <div class="o-distance-l">
          <ul class="c-checklist">
            {{ partial('partial/checklist_item', { icon: 'icon-check', text: __('start_page.modular_section.checklist.item_1') }) }}
            {{ partial('partial/checklist_item', { icon: 'icon-check', text: __('start_page.modular_section.checklist.item_2') }) }}
            {{ partial('partial/checklist_item', { icon: 'icon-check', text: __('start_page.modular_section.checklist.item_3') }) }}
          </ul>
        </div>
        <div class="o-distance-l">
          <div class="o-buttonbar">
            <a href="/plugins" title="{{__('start_page.modular_section.link_1.title')}}" class="c-button o-buttonbar__item">{{__('start_page.modular_section.link_1.label')}}</a>
            <a href="/docs/creating_plugins.html" title="{{__('start_page.modular_section.link_2.title')}}" class="c-button c-button--ghost o-buttonbar__item">{{__('start_page.modular_section.link_2.label')}}</a>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="o-distance-xxl">
    <div class="c-box c-box--universe c-box--visible o-overlap" style="background-image: url({{url_for('../../assets/images/dots.png')}})">
      <div class="o-container">
        <div class="o-heading o-center">
          <h2 class="o-heading__title c-section-title">{{__('start_page.cockpit_section.heading.title')}}</h2>
          <p class="o-heading__subtitle c-subtitle u-text-ghost">{{__('start_page.cockpit_section.heading.referal')}}</p>
          <p class="o-heading__footer">
            <!-- <a href="#" class="c-button c-button--ghost" title="Get Started">Get Started</a>-->
          </p>
        </div>
        <div class="o-distance-xl">
          <div class="o-grid">
            <div class="o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-4">
              <h3 class="c-title-level-3 u-text-ghost">{{__('start_page.cockpit_section.box_1.title')}}</h3>
              <p>{{__('start_page.cockpit_section.box_1.text')}}</p>
              <a href="/docs/cockpit_dashboard.html" title="{{__('start_page.cockpit_section.box_1.link.title')}}">{{__('start_page.cockpit_section.box_1.link.label')}}</a>
            </div>
            <div class="o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-4">
              <h3 class="c-title-level-3 u-text-ghost">{{__('start_page.cockpit_section.box_2.title')}}</h3>
              <p>{{__('start_page.cockpit_section.box_2.text')}}</p>
              <a href="/docs/cockpit_explorer.html" title="{{__('start_page.cockpit_section.box_2.link.title')}}">{{__('start_page.cockpit_section.box_2.link.label')}}</a>
            </div>
            <div class="o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-4">
              <h3 class="c-title-level-3 u-text-ghost">{{__('start_page.cockpit_section.box_3.title')}}</h3>
              <p>{{__('start_page.cockpit_section.box_3.text')}}</p>
              <a href="/docs/cockpit_deployment.html" title="{{__('start_page.cockpit_section.box_3.link.title')}}">{{__('start_page.cockpit_section.box_3.link.label')}}</a>
            </div>
            <div class="o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-4">
              <h3 class="c-title-level-3 u-text-ghost">{{__('start_page.cockpit_section.box_4.title')}}</h3>
              <p>{{__('start_page.cockpit_section.box_4.text')}}</p>
              <a href="/docs/cockpit_editor.html" title="{{__('start_page.cockpit_section.box_4.link.title')}}">{{__('start_page.cockpit_section.box_4.link.label')}}</a>
            </div>
          </div>
        </div>
        <div class="o-overlap__image">
          <img src="{{url_for('assets/images/tool-screenshot.png')}}" alt="Cockpit">
        </div>
      </div>
    </div>
  </section>
  <section class="o-container o-distance o-center">
    <p class="c-subtitle u-text-death">Companies who use and love Embark.</p>
    <div class="o-distance-m">
      <ul class="o-list-inline o-flex-space-between o-nowrap">
        <li class="o-list-inline__item">
          <img src="{{url_for('assets/images/company-flexdapps.svg')}}" alt="Flexdapps">
        </li>
        <li class="o-list-inline__item">
          <img src="{{url_for('assets/images/company-giveth.svg')}}" alt="Giveth">
        </li>
        <li class="o-list-inline__item">
          <img src="{{url_for('assets/images/company-status.svg')}}" alt="status">
        </li>
      </ul>
    </div>
  </section>
  <section class="o-distance">
    <div class="c-box c-box--unframed" style="background-image: url({{url_for('assets/images/bg-hexagons.png')}})">
      {{
        partial('partial/heading', {
          title: __('start_page.outro_section.heading.title'),
          referal: __('start_page.outro_section.heading.referal'),
          link: {
            text: __('start_page.outro_section.heading.link'),
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
          <h3><span>{{__('start_page.newsletter_section.heading.title')}}</span></h3>
          <div id="mc_embed_signup" class="o-distance-l">
            <form action="https://status.us20.list-manage.com/subscribe/post?u=774518184e8661075f1b012f5&amp;id=4189213bb9" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate>
              <div class="o-buttonbar">
                <input type="email" value="" name="EMAIL" class="required email o-buttonbar__item" id="mce-EMAIL" placeholder="Enter your email address">
                <input type="submit" value="{{__('start_page.newsletter_section.button.label')}}" name="subscribe" id="mc-embedded-subscribe" class="c-button o-buttonbar__item">
                <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->
                <div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_774518184e8661075f1b012f5_4189213bb9" tabindex="-1" value=""></div>
              </div>
            </form>
          </div>
          <p class="o-distance-m">{{__('start_page.newsletter_section.heading.text')}}</p>
      </div>
    </div>
  </section>
</main>
