# Linkjuice.js (Universal Module Definition)

A tiny script (&lt;1KB) that automatically wraps and creates anchor links for <h1-h6> headings that have an `id`. Anchor links (by default) use the browser URL hash to keep the links you've clicked.

![linkjuice](https://cloud.githubusercontent.com/assets/1655968/16244257/15e88aa0-37f3-11e6-82d8-a6748593a8a2.gif)

## API

```js
linkjuice.init('.post__content', {
  selectors: ['h2', 'h3'],
  icon: '#'
});
```

#### init(arg[,])
Type: `String` Default: `undefined`

First argument is the target scope you want to bind to and search for heading tags.

#### options.selectors
Type: `Array` Default: `['h2', 'h3', 'h4', 'h5', 'h6']`

Default heading tags to search for, omits `<h1>` by default as that's generally a page title.

#### options.icon
Type: `String` Default: `'#'`

Default icon or text. This gets parsed to HTML so you can inject anything you like, such as `<i class="my-icon"></i>`.

#### options.contentFn
Type: `Function` Default: A function which returns the heading content as a link, prepended with the `icon` string.

This function is used to customize how each heading tag contents are rewritten.
It receives two parameters:

- `node`: The Heading tag DOM Node
- `icon`: The value of `options.icon`

It should return a string which is the heading tag's rewritten content.

Example which returns the original heading text followed by a FontAwesome link icon:

```js
const contentFn = (node) => `
    ${node.innerHTML} 
    <a href='#${node.id}' class='linkjuice'> 
      <i class='fa fa-link'></i>
    </a>
`;
```

## npm installation

```
npm install linkjuice --save
```

## Manual installation
Ensure you're using the files from the `dist` directory (contains compiled production-ready code). Ensure you place the script before the closing `</body>` tag.

```html
<body>
  <!-- html above -->
  <script src="dist/linkjuice.js"></script>
  <script>
  // linkjuice module available
  </script>
</body>
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using Gulp.

## Release history

- 1.0.1
  - Allow customized innerHTML content
- 1.0.0
  - Initial release

## License

The MIT License

Copyright (c) 2016 Todd Motto

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
