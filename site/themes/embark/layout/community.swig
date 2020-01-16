{{
  partial('partial/header', {
    title: __(page.title),
    tagline: __(page.tagline),
    link: {
      text: __(page.link.text),
      href: page.link.href
    },
    showGitHubStars: false,
    showInstallCmd: false,
  })
}}
<main role="main">
  <section class="o-container o-distance">
    {{
      partial('partial/heading', {
        title: __('community_page.contribute_section.heading.title'),
        referal: __('community_page.contribute_section.heading.referal'),
        className: 'o-center'
      })
    }}
    <div class="o-distance">
      <div class="o-grid o-center">
        <div class="o-grid__column--1-1 o-grid__column--medium-1-2">
          {{
            partial('partial/spotbox', {
              title: __('community_page.spotbox.title'),
              text: __('community_page.spotbox.text'),
              icon: 'app-window-search-text',
              link: {
                text: __('community_page.spotbox.link'),
                href: 'https://github.com/embarklabs/embark'
              }
            })
          }}
        </div>
      </ul>
    </div>
    <div class="o-distance-xxl">
      <div class="o-grid">
        <div class="o-grid__column--1-1 o-grid__column--large-1-3">
          <img src="{{url_for('assets/images/EMBARK_FRAMEWORK.png')}}" alt="">
        </div>
        <div class="o-grid__column--1-1 o-grid__column--large-2-3">
          {{
            partial('partial/heading', {
              title: __('community_page.not_just_code_section.heading.title'),
              referal: __('community_page.not_just_code_section.heading.referal'),
              link: {
                text: __('community_page.not_just_code_section.heading.link'),
                href: 'https://gitter.im/embark-framework/Lobby',
                class: 'c-button'
              }
            })
          }}
        </div>
      </div>
      <div class="o-distance">
        <div class="o-grid">
          {{
            partial('partial/whisperbox', {
              className: 'o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-3',
              title: __('community_page.not_just_code_section.box_1.title'),
              text: __('community_page.not_just_code_section.box_1.text'),
              icon: 'search-bar'
            })
          }}
          {{
            partial('partial/whisperbox', {
              className: 'o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-3',
              title: __('community_page.not_just_code_section.box_2.title'),
              text: __('community_page.not_just_code_section.box_2.text'),
              icon: 'paginate-filter-video-alternate'
            })
          }}
          {{
            partial('partial/whisperbox', {
              className: 'o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-3',
              title: __('community_page.not_just_code_section.box_3.title'),
              text: __('community_page.not_just_code_section.box_3.text'),
              icon: 'notes-paper-text'
            })
          }}
          {{
            partial('partial/whisperbox', {
              className: 'o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-3',
              title: __('community_page.not_just_code_section.box_4.title'),
              text: __('community_page.not_just_code_section.box_4.text'),
              icon: 'module'
            })
          }}
            {{
              partial('partial/whisperbox', {
                className: 'o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-3',
                title: __('community_page.not_just_code_section.box_5.title'),
                text: __('community_page.not_just_code_section.box_5.text'),
                icon: 'computer-bug-search',
              })
            }}
            {{
              partial('partial/whisperbox', {
                className: 'o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-3',
                title: __('community_page.not_just_code_section.box_6.title'),
                text: __('community_page.not_just_code_section.box_6.text'),
                icon: 'tag-new-circle',
              })
            }}
          </div>
        </div>
      </div>
    </div>
  </section>


  <section class="o-distance">
    <div class="c-box c-box--universe">
      <div class="o-container">
        {{
          partial('partial/heading', {
            title: __('community_page.team_section.heading.title'),
            className: 'o-center'
          })
        }}
        <div class="o-distance-xl">
          <div class="o-grid" id="team">
            <div class="o-grid__column--1-1 o-grid__column--large-1-3">
              {{
                partial('partial/contributor-box', {
                  img: 'https://pbs.twimg.com/profile_images/928272512181563392/iDJdvy2k_400x400.jpg',
                  name: 'Iuri Matias',
                  job: __('community_page.team_section.job_team_lead'),
                  github: 'Iurimatias',
                  twitter: 'iurimatias'
                })
              }}
            </div>
            <div class="o-grid__column--1-1 o-grid__column--large-1-3">
              {{
                partial('partial/contributor-box', {
                  img: 'https://pbs.twimg.com/profile_images/993873866878570496/-aE4byjj_400x400.jpg',
                  name: 'Jonathan Rainville',
                  job: __('community_page.team_section.job_engineer'),
                  github: 'jrainville',
                  twitter: 'shyolghul'
                })
              }}
            </div>
            <div class="o-grid__column--1-1 o-grid__column--large-1-3">
              {{
                partial('partial/contributor-box', {
                  img: 'https://avatars1.githubusercontent.com/u/5089238?s=460&v=4',
                  name: 'Eric Mastro',
                  job: __('community_page.team_section.job_engineer'),
                  github: 'emizzle',
                  twitter: 'ericmastro'
                })
              }}
            </div>
            <div class="o-grid__column--1-1 o-grid__column--large-1-3">
              {{
                partial('partial/contributor-box', {
                  img: 'https://pbs.twimg.com/profile_images/965722487735701504/m58KNgWN_400x400.jpg',
                  name: 'Andre Medeiros',
                  job: __('community_page.team_section.job_engineer'),
                  github: 'andremedeiros',
                  twitter: 'superdealloc'
                })
              }}
            </div>
            <div class="o-grid__column--1-1 o-grid__column--large-1-3">
              {{
                partial('partial/contributor-box', {
                  img: 'https://pbs.twimg.com/profile_images/257742900/13168239_400x400.jpg',
                  name: 'Anthony Laibe',
                  job: __('community_page.team_section.job_engineer'),
                  github: 'alaibe',
                  twitter: 'a_laibe'
                })
              }}
            </div>
            <div class="o-grid__column--1-1 o-grid__column--large-1-3">
              {{
                partial('partial/contributor-box', {
                  img: 'https://avatars3.githubusercontent.com/u/194260?s=460&v=4',
                  name: 'Michael Bradley',
                  job: __('community_page.team_section.job_engineer'),
                  github: 'michaelsbradleyjr'
                })
              }}
            </div>
            <div class="o-grid__column--1-1 o-grid__column--large-1-3">
              {{
                partial('partial/contributor-box', {
                  img: 'https://pbs.twimg.com/profile_images/1063160577973866496/aM313uHG_400x400.jpg',
                  name: 'Richard Ramos',
                  job: __('community_page.team_section.job_engineer'),
                  github: 'rramos',
                  twitter: 'richardramos_me'
                })
              }}
            </div>
            <div class="o-grid__column--1-1 o-grid__column--large-1-3">
              {{
                partial('partial/contributor-box', {
                  img: 'https://pbs.twimg.com/profile_images/993785060733194241/p3oAIMDP_400x400.jpg',
                  name: 'Pascal Precht',
                  job: __('community_page.team_section.job_engineer'),
                  github: 'PascalPrecht',
                  twitter: 'PascalPrecht'
                })
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <!-- <section class="o-distance">
    <div class="c-box c-box--universe">
      <div class="o-container">
        {{
          partial('partial/heading', {
            title: '<span class="u-text-ghost">Upcoming</span> events',
            className: 'o-center'
          })
        }}
        <div class="o-distance-xl">
          <div class="o-grid" id="event">
            <div class="o-grid__column--1-1 o-grid__column--large-1-3">
              {{
                partial('partial/event-box', {
                  name: 'Embark Meetup',
                  eventDate: '23rd April 2019',
                  location: 'Dublin',
                  description: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.',
                  link: {
                    text: 'Details',
                    href: 'https://meetup.com'
                  }
                })
              }}
            </div>
            <div class="o-grid__column--1-1 o-grid__column--large-1-3">
              {{
                partial('partial/event-box', {
                  name: 'Embark Meetup',
                  eventDate: '23rd April 2019',
                  location: 'Dublin',
                  description: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.',
                  link: {
                    text: 'Details',
                    href: 'https://meetup.com'
                  }
                })
              }}
            </div>
            <div class="o-grid__column--1-1 o-grid__column--large-1-3">
              {{
                partial('partial/event-box', {
                  name: 'Embark Meetup',
                  eventDate: '23rd April 2019',
                  location: 'Dublin',
                  description: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.',
                  link: {
                    text: 'Details',
                    href: 'https://meetup.com'
                  }
                })
              }}
            </div>
          </div>
          <div class="o-center o-distance">
            <p class="c-subtitle u-text-ghost">Want to host your own Embark meetup? Get in touch and we can help you out!</p>
          </div>
        </div>
      </div>
    </div>
  </section> -->
</main>
