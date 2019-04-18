{{
  partial('partial/header', {
    title: page.title,
    tagline: page.tagline,
    compact: true
  })
}}
<main role="main" class="o-standard-page">
  <section class="o-container-medium o-distance">
    {{page.content}}
  </section>
</main>

