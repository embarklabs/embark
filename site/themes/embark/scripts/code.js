const nunjucks = require('nunjucks');
const path = require('path');
const { v1: uuidv1 } = require('uuid');

hexo.extend.tag.register('code_block', (args, content) => {

  return new Promise((resolve, reject) => {
    let context = {}

    args.forEach(arg => {
      let [key, value] = arg.split(':');
      context[key] = value;
    });

    context.content = content;
    context.id = uuidv1();

    return nunjucks.render(path.join(hexo.theme_dir, 'layout/partial/code.swig'), context, (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(res);
    });
  });
}, { async: true, ends: true});
