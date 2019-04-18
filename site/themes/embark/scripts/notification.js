const nunjucks = require('nunjucks');
const path = require('path');

hexo.extend.tag.register('notification', (args, content) => {
  return new Promise((resolve, reject) => {
    const type = args[0];
    const title = args[1];
    const text = hexo.render.renderSync({ text: content, engine: 'markdown' });

    return nunjucks.render(path.join(hexo.theme_dir, 'layout/partial/notification.swig'), {title, type, text }, (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(res);
    });
  });
}, { async: true, ends: true });
