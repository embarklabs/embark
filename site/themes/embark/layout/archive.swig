{% if is_category() %}
  {{
    partial('partial/header', {
      title: 'Categories: ' +site.data.categories[page.category],
      tagline: '&nbsp;',
      compact: true,
      link: {
        text: '&larr; Back to blog',
        href: '/news'
      },
    })
  }}
{% else %}
  {{
    partial('partial/header', {
      title: __('archives.header.title'),
      tagline: '&nbsp;',
      compact: true,
      link: {
        text: __('archives.header.link'),
        href: '/news'
      },
    })
  }}
{% endif %}
<main role="main">
  <section class="o-container-medium o-distance">
    {% for post in page.posts %}
      {{
        partial('partial/whisperbox', {
          className: 'o-distance-m',
          title: post.title,
          linkClassName: 'u-link-uniform',
          titleClassName: 'c-title-level-3',
          linkTitle: true,
          text: post.summary,
          dateInfo: post.date,
          link: {
            text: __('archives.article_box.read_more_link'),
            href: url_for(post.path)
          }
        })
      }}
    {% endfor %}
  </section>
  <div class="o-container o-distance o-center">
    <a href="https://blog.embarklabs.io" class="c-button" title="{{__('archives.back_to_blog_link.title')}}">{{__('archives.back_to_blog_link.label')}}</a>
  </div>
</main>

