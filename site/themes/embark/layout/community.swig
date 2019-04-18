{{
  partial('partial/header', {
    title: 'Join the community',
    tagline: page.tagline,
    link: {
      text: page.link.text,
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
        title: '<span class="u-text-light">How to</span> contribute',
        referal: 'There are a number of ways to contribute and getting involved, from submitting a pull request to growing the community.',
        className: 'o-center'
      })
    }}
    <div class="o-distance">
      <div class="o-grid o-center">
        <div class="o-grid__column--1-1 o-grid__column--medium-1-2">
          {{
            partial('partial/spotbox', {
              title: 'Checkout the GitHub Repos',
              text: 'Look for issues with specifics tags you may be interested in.',
              icon: 'app-window-search-text',
              link: {
                text: 'See the Repo',
                href: 'https://github.com/embark-framework/embark'
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
              title: "It's not just <span class='u-text-light'>code</span>",
              referal: 'We believe that contributions go far beyond working on our code base. Help out with writing docs, creating a tutorial or simply talk to us on our channels.',
              link: {
                text: 'Join us in Gitter',
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
              title: 'Help improving the docs',
              text: "You don't have to code to contribute, we're happy about any improvements to our documentation.",
              icon: 'search-bar'
            })
          }}
          {{
            partial('partial/whisperbox', {
              className: 'o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-3',
              title: 'Create a tutorial',
              text: 'Record a video of a simple tutorial and share it with the community.',
              icon: 'paginate-filter-video-alternate'
            })
          }}
          {{
            partial('partial/whisperbox', {
              className: 'o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-3',
              title: 'Help answer questions',
              text: 'Help out newcomers with questions in our Gitter channel or Stack Overflow.',
              icon: 'notes-paper-text'
            })
          }}
          {{
            partial('partial/whisperbox', {
              className: 'o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-3',
              title: 'Create a plugin',
              text: 'Embark integrates well with other tools. Build a plugin to get support for your tool of choice.',
              icon: 'module'
            })
          }}
            {{
              partial('partial/whisperbox', {
                className: 'o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-3',
                title: 'Report a bug',
                text: 'If you find a bug, let us know and we work on fixing it.',
                icon: 'computer-bug-search',
              })
            }}
            {{
              partial('partial/whisperbox', {
                className: 'o-grid__column--1-1 o-grid__column--medium-1-2 o-grid__column--large-1-3',
                title: 'Work on new features',
                text: 'Collaborate with peers on new features you want to see landing.',
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
            title: 'Meet the <span class="u-text-ghost">team</span>.',
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
                  job: 'Creator and Team Lead',
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
                  job: 'Software Engineer',
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
                  job: 'Software Engineer',
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
                  job: 'Software Engineer',
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
                  job: 'Software Engineer',
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
                  job: 'Software Engineer',
                  github: 'michaelsbradleyjr'
                })
              }}
            </div>
            <div class="o-grid__column--1-1 o-grid__column--large-1-3">
              {{
                partial('partial/contributor-box', {
                  img: 'https://pbs.twimg.com/profile_images/1063160577973866496/aM313uHG_400x400.jpg',
                  name: 'Richard Ramos',
                  job: 'Software Engineer',
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
                  job: 'Software Engineer',
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
