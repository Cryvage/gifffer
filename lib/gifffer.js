;(function webpackUniversalModuleDefinition(root, factory) {
  if (typeof exports === 'object' && typeof module === 'object')
    module.exports = factory()
  else if (typeof define === 'function' && define.amd)
    define('Gifffer', [], factory)
  else if (typeof exports === 'object') exports['Gifffer'] = factory()
  else root['Gifffer'] = factory()
})(this, function() {
  // Check if running in client
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }
  var d = document
  
  function Options(options){
    options = options || {}
    var self = this
    
    function parseStyles(styles) {
      var stylesStr = ''
      for (prop in styles) stylesStr += prop + ':' + styles[prop] + ';'
      return stylesStr
    }
    
    Object.defineProperty(self, 'playButtonStyles', {
      value: parseStyles(options.playButtonStyles || {
            'width': '60px',
            'height': '60px',
            'border-radius':'30px',
            'background': 'rgba(0, 0, 0, 0.3)',
            'position': 'absolute',
            'top': '50%',
            'left': '50%',
            'margin': '-30px'
        }),
      writable: false
    })
    
    Object.defineProperty(self, 'playButtonIconStyles', {
      value: parseStyles(options.playButtonIconStyles || {
            'width': '0',
            'height': '0',
            'border-top': '14px solid transparent',
            'border-bottom': '14px solid transparent',
            'border-left': '14px solid rgba(0, 0, 0, 0.5)',
            'position': 'absolute',
            'left': '26px',
            'top': '16px'
         }),
      writable: false
    })
    
    Object.defineProperty(self, 'isAddClickEvent', {
      value: typeof options.isAddClickEvent === "undefined" ? true : Boolean(options.isAddClickEvent),
      writable: false
    })
    
    Object.defineProperty(self, 'preventClickHook', {
      value: typeof options.preventClickHook === "function" ? options.preventClickHook : function(){ return false },
      writable: false
    })
    
    Object.defineProperty(self, 'beforeClickHook', {
      value: typeof options.beforeClickHook === "function" ? options.beforeClickHook : function(){},
      writable: false
    })
    
    Object.defineProperty(self, 'afterClickHook', {
      value: typeof options.afterClickHook === "function" ? options.afterClickHook : function(){},
      writable: false
    })
  }

  var Gifffer = function(options) {
    var images,
      i = 0,
      gifs = [],
      calculatedOptions = new Options(options),
      originalOptions = options
    
    options = calculatedOptions
    images = d.querySelectorAll('[data-gifffer]')
    for (; i < images.length; ++i) process(images[i], gifs, options)
    // returns each gif container to be usable programmatically
    return gifs
  }

  function formatUnit(v) {
    return v + (v.toString().indexOf('%') > 0 ? '' : 'px')
  }

  

  function createContainer(w, h, el, altText, opts) {
    var alt
    var con = d.createElement('BUTTON');
    var cls = el.getAttribute('class');
    var id = el.getAttribute('id');
    if( !(opts instanceof Options) ){
        opts = new Options()
    };
    var playButtonStyles = opts.playButtonStyles
    var playButtonIconStyles = opts.playButtonIconStyles

    cls ? con.setAttribute('class', el.getAttribute('class')) : null
    id ? con.setAttribute('id', el.getAttribute('id')) : null
    con.setAttribute(
      'style',
      'position:relative;cursor:pointer;background:none;border:none;padding:0;'
    )
    con.setAttribute('aria-hidden', 'true')

    // creating play button
    var play = d.createElement('DIV')
    if(opts.isAddClickEvent){
      play.setAttribute('class', 'gifffer-play-button')
      play.setAttribute('style', playButtonStyles)

      var trngl = d.createElement('DIV')
      trngl.setAttribute('style', playButtonIconStyles)
      play.appendChild(trngl)
    }

    // create alt text if available
    if (altText) {
      alt = d.createElement('p')
      alt.setAttribute('class', 'gifffer-alt')
      alt.setAttribute(
        'style',
        'border:0;clip:rect(0 0 0 0);height:1px;overflow:hidden;padding:0;position:absolute;width:1px;'
      )
      alt.innerText = altText + ', image'
    }

    // dom placement
    con.appendChild(play)
    el.parentNode.replaceChild(con, el)
    altText ? con.parentNode.insertBefore(alt, con.nextSibling) : null
    return { c: con, p: play }
  }

  function calculatePercentageDim(el, w, h, wOrig, hOrig) {
    var parentDimW = el.parentNode.offsetWidth
    var parentDimH = el.parentNode.offsetHeight
    var ratio = wOrig / hOrig

    if (w.toString().indexOf('%') > 0) {
      w = parseInt(w.toString().replace('%', ''))
      w = (w / 100) * parentDimW
      h = w / ratio
    } else if (h.toString().indexOf('%') > 0) {
      h = parseInt(h.toString().replace('%', ''))
      h = (h / 100) * parentDimW
      w = h * ratio
    }

    return { w: w, h: h }
  }

  function process(el, gifs, options) {
    var url,
      con,
      c,
      w,
      h,
      duration,
      play,
      gif,
      playing = false,
      cc,
      isC,
      durationTimeout,
      dims,
      altText

    url = el.getAttribute('data-gifffer')
    w = el.getAttribute('data-gifffer-width')
    h = el.getAttribute('data-gifffer-height')
    duration = el.getAttribute('data-gifffer-duration')
    altText = el.getAttribute('data-gifffer-alt')
    el.style.display = 'block'

    // creating the canvas
    c = document.createElement('canvas')
    isC = !!(c.getContext && c.getContext('2d'))
    if (w && h && isC) cc = createContainer(w, h, el, altText, options)

    // waiting for image load
    el.onload = function() {
      if (!isC) return

      w = w || el.width
      h = h || el.height

      // creating the container
      if (!cc) cc = createContainer(w, h, el, altText, options)
      con = cc.c
      play = cc.p
      dims = calculatePercentageDim(con, w, h, el.width, el.height)

      // listening for image click
      
      var stopPlaying = function(){
        if(!playing) return
        playing = false
        con.appendChild(play)
        con.removeChild(gif)
        con.appendChild(c)
        gif = null
        if(typeof durationTimeout === "number"){
            clearTimeout(durationTimeout)
        }
      }
      
      var startPlaying = function(duration){
        if(playing) return;
        playing = true
        gif = document.createElement('IMG')
        gif.setAttribute('style', 'width:100%;height:100%;')
        gif.setAttribute('data-uri', Math.floor(Math.random() * 100000) + 1)
        setTimeout(function() {
        gif.src = url
        }, 0)
        con.removeChild(play)
        con.removeChild(c)
        con.appendChild(gif)
        if (parseInt(duration) > 0) {
          durationTimeout = setTimeout(stopPlaying, duration)
        }
      }
      
      var togglePlaying = function(duration){
        return playing ? stopPlaying() : startPlaying(duration) 
      }
      
      var restartPlaying = function(duration){
        stopPlaying()
        startPlaying(duration)
      }
      var output = {"element" : con, "duration" : duration, "startPlaying" : startPlaying, "stopPlaying" : stopPlaying, "togglePlaying" : togglePlaying, "restartPlaying" : restartPlaying}
      gifs.push(output)
      
      
      if(options.isAddClickEvent){
        (function(output){
          con.addEventListener('click', function(){ 
            if(options.preventClickHook(output, playing)){
                return
            }
            options.beforeClickHook(output, playing)
            togglePlaying(duration) 
            options.afterClickHook(output, playing)
          })
        })(output)
      }
      // canvas
      c.width = dims.w
      c.height = dims.h
      c.getContext('2d').drawImage(el, 0, 0, dims.w, dims.h)
      con.appendChild(c)

      // setting the actual image size
      con.setAttribute(
        'style',
        'position:relative;cursor:pointer;width:' +
          dims.w +
          'px;height:' +
          dims.h +
          'px;background:none;border:none;padding:0;'
      )

      c.style.width = '100%'
      c.style.height = '100%'

      if (w.toString().indexOf('%') > 0 && h.toString().indexOf('%') > 0) {
        con.style.width = w
        con.style.height = h
      } else if (w.toString().indexOf('%') > 0) {
        con.style.width = w
        con.style.height = 'inherit'
      } else if (h.toString().indexOf('%') > 0) {
        con.style.width = 'inherit'
        con.style.height = h
      } else {
        con.style.width = dims.w + 'px'
        con.style.height = dims.h + 'px'
      }
    }
    el.src = url
  }

  return Gifffer
})
