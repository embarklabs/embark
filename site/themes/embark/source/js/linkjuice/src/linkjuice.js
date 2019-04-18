let scope, nodes, inject;

const makeLink = (node, inject) => `
    <a class="linkjuice" id="${node.id}">
      <span class="linkjuice-icon">${inject}</span>${node.innerHTML}
    </a>`;

const makeTocItem = node => `<a href="#${node.id}">${node.innerHTML}</a>`;

const wrapNode = (node, contentFn) => {
  if (!node.id) {
    console.warn('No ID for element', node);
    return;
  }
  node.innerHTML = contentFn(node, inject);
};

const addAtLevel = (nodeLevel, node, tree) => {
  let level = tree;

  while (--nodeLevel >= 0) {
    if (!Array.isArray(level[level.length - 1])) {
      level.push([]);
    }

    level = level[level.length - 1];
  }

  level.push(node);
};

const createTree = nodes => {
  const headerRegexp = /^H[1-6]$/;
  const tree = [];

  if (nodes.filter(node => !headerRegexp.test(node.tagName)).length > 0) {
    console.warn('Nested table of contents is only possible with regular header tags');
    return tree;
  }

  nodes.forEach(node => addAtLevel(parseInt(node.tagName.substr(1), 10) - 1, node, tree));
  return tree;
};

const createTocHtml = (nodes, contentFn) => {

  const nodesHtml = nodes.map(node => Array.isArray(node) ? createTocHtml(node, contentFn) : `<li>${contentFn(node)}</li>`
  ).join('');

  return `<ul>${nodesHtml}</ul>`;

};

const linkjuice = (mount, { contentFn = makeLink, icon = '#', selectors = ['h2', 'h3', 'h4', 'h5', 'h6'], tableOfContents = false}) => {
  scope = document.querySelector(mount);
  if (!scope) return;

  inject = icon;
  nodes = Array.prototype.slice.call(scope.querySelectorAll((selectors).join(',')));

  if (typeof tableOfContents === 'object' && tableOfContents !== null) {
    const toc = document.querySelector(tableOfContents.selector);

    if (!toc) {
      console.warn('No table of contents element found for the specified selector');
      return;
    }

    const tocElements = tableOfContents.nested === true ? createTree(nodes) : nodes;
    const createTocItem = typeof tableOfContents.contentFn === 'function' ? tableOfContents.contentFn : makeTocItem;

    toc.innerHTML = createTocHtml(tocElements, createTocItem);
  }

  nodes.map(node => wrapNode(node, contentFn));
};

export const init = (mount, options = {}) => linkjuice(mount, options);
