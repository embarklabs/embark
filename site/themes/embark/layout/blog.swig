{{
  partial('partial/header', {
    title: __(page.title),
    tagline: __(page.tagline),
    compact: true
  })
}}

{% set len = site.posts.length %}
{% set sortedPosts = site.posts.sort('date', 'desc') %}
{% set posts = sortedPosts.toArray() %}

<main role="main">
  <section class="o-container o-distance">
    <div class="o-grid">
      {{
        partial('partial/coverbox', {
          className: 'o-grid__column--1-1 o-grid__column--large-2-3',
          title: posts[0].title,
          titleClassName: 'c-title-level-2',
          text: posts[0].summary,
          image: posts[0].image,
          dateInfo: posts[0].date,
          link: {
            text: 'Read more',
            href: url_for(posts[0].path)
          }
        })
      }}

      {{
        partial('partial/coverbox', {
          className: 'o-grid__column--1-1 o-grid__column--large-1-3',
          title: posts[1].title,
          titleClassName: 'c-title-level-3',
          text: posts[1].summary,
          image: posts[1].image,
          dateInfo: posts[1].date,
          link: {
            text: 'Read more',
            href: url_for(posts[1].path)
          }
        })
      }}
    </div>
  </section>
  <section class="o-distance">
    <div class="c-box c-box--universe">
      <div class="o-container">
        <div class="o-grid" id="event">
          {{
            partial('partial/event-box', {
              className: 'o-grid__column--1-1 o-grid__column--large-1-3',
              name: posts[4].title,
              linkTitle: true,
              dateInfo: date(posts[4].date),
              description: posts[4].summary,
              link: {
                text: 'Read more',
                href: url_for(posts[4].path)
              }
            })
          }}
          {{
            partial('partial/event-box', {
              className: 'o-grid__column--1-1 o-grid__column--large-1-3',
              name: posts[3].title,
              linkTitle: true,
              dateInfo: date(posts[3].date),
              description: posts[3].summary,
              link: {
                text: 'Read more',
                href: url_for(posts[3].path)
              }
            })
          }}
          {{
            partial('partial/event-box', {
              className: 'o-grid__column--1-1 o-grid__column--large-1-3',
              name: posts[2].title,
              linkTitle: true,
              dateInfo: date(posts[2].date),
              description: posts[2].summary,
              link: {
                text: 'Read more',
                href: url_for(posts[2].path)
              }
            })
          }}
        </div>
      </div>
    </div>
  </section>
  <div class="o-container o-distance o-center">
    <a href="https://blog.embarklabs.io/archives" class="c-button" title="{{__('blog.view_all_link')}}">{{__('blog.view_all_link')}}</a>
  </div>
</main>

