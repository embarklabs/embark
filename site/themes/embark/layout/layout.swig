<!DOCTYPE html>
<html lang="en" dir="ltr">
  {{ partial('partial/head') }}
  <body>
    {{ body }}
    {{ partial('partial/footer') }}

    <script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.4/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js"></script>
    <script>
      const EMBARK_DOC_VERSIONS = {
        {% for version in Object.keys(site.data.versions) %}'{{version}}': '{{site.data.versions[version].url}}'{% if !loop.last %},{% endif%}{% endfor %}
      };
    </script>
    <script src="/js/index.js"></script>

    {% if config.algolia[page.lang] %}
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/docsearch.js@2/dist/cdn/docsearch.min.js"></script>
    <script type="text/javascript">
      docsearch({
        apiKey: '{{ config.algolia[page.lang].apiKey }}',
        indexName: '{{ config.algolia[page.lang].indexName }}',
        inputSelector: '#search-input'
      });
    </script>
    {% endif %}
  </body>
</html>

