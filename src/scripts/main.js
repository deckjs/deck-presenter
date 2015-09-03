// Require Node modules in the browser thanks to Browserify: http://browserify.org
var bespoke = require('bespoke'),
  base = require('@deck/base-theme'),
  keys = require('bespoke-keys'),
  touch = require('bespoke-touch'),
  scale = require('bespoke-scale'),
  hash = require('bespoke-hash'),
  synchro = require('bespoke-synchro'),
  pdf = require('bespoke-pdf'),
  markdown = require('./markdown');
  app = require('./app');


// Bespoke.js
bespoke.from('article', [
  pdf(),
  base(),
  keys(),
  touch(),
  markdown(),
  scale(),
  hash(),
  synchro(),
  tile()
]);



function tile(opts) {
  opts = opts || {};
  opts.className = opts.className || 'tile-view';
  opts.key = opts.key || 't';
  var keyCode = opts.key.charCodeAt(0);

  return function (deck) {
    addEventListener('keypress', function (e) { 
      if (e.which !== keyCode) { return; }
      
      deck.parent.classList[
        deck.parent.classList.contains(opts.className) ?
        'remove' :
        'add'
      ](opts.className);

    })
  }
}
 

// Prism syntax highlighting
// This is actually loaded from "bower_components" thanks to
// debowerify: https://github.com/eugeneware/debowerify
require('prism');

Prism.hooks.add('after-highlight', function (env) {
  var pre = env.element.parentElement;
  if (!pre || pre.nodeName.toLowerCase() !== 'pre') { return; }
  fitcode(env.element.parentElement)
})

function fitcode(el) {
  var style = getComputedStyle(el);
  var lines = el.innerText.trim().split('\n').length;
  var fs = parseInt(style.fontSize);
  var lh = parseInt(style.lineHeight);
  var ratio = fs/lh;
  var height = parseInt(style.height);
  var textHeight = lh * lines;
  var diff = textHeight - height;
  var over = diff > 0;

  if (!over) { return; }

  var adjustLh = height / lines;
  var adjustFs = adjustLh * ratio;

  el.style.lineHeight = adjustLh + 'px';
  el.style.fontSize = adjustFs + 'px';
}


//make sure app code is initalized at the very last
app();