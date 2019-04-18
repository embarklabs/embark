{{
  partial('partial/header-blog', {
    title: page.title,
    tagline: page.tagline,
    author: site.data.authors[page.author],
    articleDate: page.date
  })
}}
<main role="main" class="o-standard-page">
  <section class="o-container-medium o-distance">
    {{page.content}}
  </section>
  
  {% if page.next !== null || page.prev !== null %}

  <div class="o-container-medium o-distance">
    {{ partial('partial/paginator', { next: page.next, prev: page.prev }) }}
  </div>
  {% endif %}
</main>

