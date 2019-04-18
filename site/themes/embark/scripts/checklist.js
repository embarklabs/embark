const nunjucks = require('nunjucks');
const path = require('path');

hexo.extend.tag.register('checklist', (args) => {
  const items = args;
  return new Promise((resolve, reject) => {
    return nunjucks.render(path.join(hexo.theme_dir, 'layout/partial/checklist.swig'), { items }, (err, res) => {
      if (err) {
        return reject(err);
      }
      resolve(res);
    });
  });
}, { async: true });
