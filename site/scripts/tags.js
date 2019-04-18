/* global hexo */

'use strict';

hexo.extend.tag.register('note', function(args, content) {
  var className = args.shift();
  var header = '';
  var result = '';

  if (args.length) {
    header += '<strong class="note-title">' + args.join(' ') + '</strong>';
  }

  result += '<blockquote class="note ' + className + '">' + header;
  result += hexo.render.renderSync({text: content, engine: 'markdown'});
  result += '</blockquote>';

  return result;
}, true);
