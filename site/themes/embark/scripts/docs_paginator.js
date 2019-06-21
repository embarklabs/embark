const pathFn = require('path');
const nunjucks = require('nunjucks');

hexo.extend.helper.register('docs_paginator', function() {
  const type = this.page.canonical_path.split('/')[0];
  const sidebar = this.site.data.sidebar[type];
  const path = pathFn.basename(this.path);
  const prefix = 'sidebar.' + type + '.';
  const __ = hexo.theme.i18n.__(this.page.lang || this.page.language);

  let list = {};

  for (var i in sidebar) {
    for (var j in sidebar[i]) {
      list[sidebar[i][j]] = j;
    }
  }

  const keys = Object.keys(list);
  const index = keys.indexOf(path);

  return nunjucks.render(pathFn.join(hexo.theme_dir, 'layout/partial/paginator.swig'), {
    prev: index < keys.length -1 ? { path: 'docs/'+keys[index+1] } : null,
    next: index > 0 ? { path: 'docs/'+keys[index-1] } : null,
    __
  });
});
