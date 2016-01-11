/* global LiveReload, Prism, location */
var metaMd = require('bespoke-meta-markdown')
var entities = require('entities')

// loads to global scope :(
var mermaid = require('mermaid')

module.exports = markdown

function markdown () {
  if (markdown.singleton) { return markdown.singleton }

  metaMd.marked.defaults.renderer.code = (function (m) {
    return function (code, lang, escaped) {
      if (/dia/.test(lang)) {
        return '<div class="mermaid">' + code + '</div>'
      }

      return entities.decodeHTML(
        m.call(metaMd.marked.defaults.renderer, code, lang, escaped)
      )
    }
  }(metaMd.marked.defaults.renderer.code))

  pollUntil(1000, function check () {
    check.count = ~~(check.count) + 1
    return check.count > 12 || !!window.LiveReload
  }, function ready () {
    LiveReload.addPlugin(MarkdownPlugin)
  })

  var style
  markdown.singleton = metaMd({
    notes: metaNotes(),
    note: metaNotes(),
    bull: function (slide, size) {
      var elix = Array.prototype
        .indexOf.call(slide.children, slide.querySelector('ul'))
      var o = {}
      o[elix] = {li: {'font-size': size}}
      this.custom(slide, o)
    },
    newline: function (slide) {
      slide.innerHTML =
        slide.innerHTML
          .replace(/\\\\n/mg, '__{{ESCAPED_NEWLINE}}__')
          .replace(/\\n/mg, '<br>')
          .replace(/__{{ESCAPED_NEWLINE}}__/mg, '\\n')
    },
    custom: function (slide, o) {
      if (slide.classList.contains('deck-notes')) {
        return
      }

      style = style || document.querySelector('style')

      if (!style) {
        style = document.createElement('style')
        document.head.appendChild(style)
      }

      Object.keys(o).forEach(function (elix) {
        Object.keys(o[elix]).forEach(function (attr) {
          if (attr in slide.children[elix].style) {
            slide.children[elix].style[attr] = o[elix][attr]
            return
          }
        })
        var styles = Object.keys(o[elix]).map(function (attr) {
          if (attr in slide.children[elix].style) {
            return ''
          }
          var id = slide.children[elix].id || Math.random()
              .toString(36).split('.')[1].replace(/^([0-9]+)([a-z])/, '$2')

          slide.children[elix].id = id
          return attr.split(',').map(function (a) {
            return '#' + id + ' ' + a
          }).join(',') + '{' +
          Object.keys(o[elix][attr]).map(function (a) {
            return a + ':' + o[elix][attr][a]
          }).join(';') + '}'
        }).join('\n')

        if (styles) {
          style.innerHTML += styles
        }
      })
    }
  })

  return markdown.singleton
}

function nop () {}
function metaNotes () {
  if (location.search !== '?notes') { return nop }

  return function (slide, notes) {
    slide.className = 'bespoke-slide deck-notes'
    slide.innerHTML = '<aside class=deck-note>' + notes + '</aside>'
  }
}

function MarkdownPlugin (window, host) {
  this.window = window
  this.host = host
}

MarkdownPlugin.prototype.reload = function (path, opts) {
  path = path.split('/')
  var file = path[path.length - 1]
  if (file.split('.')[1] !== 'md') { return false }
  markdown().reload(file, this)

  Prism.highlightAll()
  mermaid.init()

  return true
}

function pollUntil (t, fn, final) {
  if (fn()) { return final() }
  setTimeout(pollUntil, t, t, fn, final)
}
