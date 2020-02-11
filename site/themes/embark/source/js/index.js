document.addEventListener('DOMContentLoaded', function () {

  svg4everybody();
  var pre = document.querySelectorAll('pre');
  pre = [].slice.call(pre);
  pre.forEach(function (block) {
    hljs.highlightBlock(block);
  });

  const navigation = document.querySelector('.c-navigation');
  const guideNavigation = document.querySelector('#guide-navigation');
  const navigationTrigger = document.querySelector('.c-navigation__trigger');
  const guidesTrigger = document.querySelector('#guides-trigger');
  const navigationClose = document.querySelector('.c-navigation__close');
  const guidesClose = document.querySelector('#guides-close');

  navigationTrigger.addEventListener('click', function () {
    navigation.classList.toggle('is-active');
  });

  navigationClose.addEventListener('click', function () {
    navigation.classList.remove('is-active');
  });

  if (guidesTrigger) {
    guidesTrigger.addEventListener('click', function () {
      guideNavigation.classList.toggle('is-active');
    });
    guidesClose.addEventListener('click', function () {
      guideNavigation.classList.remove('is-active');
    });
  }

  const clipboard = new ClipboardJS(".c-button--squared");
  clipboard.on('success', function (e) {
    e.clearSelection();
  });

  if (typeof linkjuice !== 'undefined') {
    linkjuice.init('.o-standard-page', {
      selectors: ['h2', 'h3', 'h4'],
      icon: '#',
      contentFn: function (node, icon) {
        return node.textContent+' <a href="#'+node.id+'"><span class="icon">'+icon+'</span></a>';
      }
    });
  }
});
