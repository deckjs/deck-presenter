var gui = window.nwDispatcher && window.nwDispatcher.requireNwGui();

module.exports = function () {

  if (!window.nwDispatcher) {
    return;
  }

  gui.Screen.Init();

  var broadcasting = false,
    notesShowing = false,
    notesWin,
    video;

  addEventListener('keypress', function (e) {
    screenshare(e);
    notes(e);
  });


  function notes(e) {
    if (e.which !== 'n'.charCodeAt(0)) { return; }

    if (notesShowing) {
      notesWin.close(true);
      notesShowing = false;
      return;
    }
    //TODO detect which screen the non-fullscreen window is on
    var screen = gui.Screen.screens[0];

    notesWin = gui.Window.open(location.href.split('#')[0] + '?notes' + location.hash, {
      toolbar: false,
      frame: false,
      'always-on-top': true,
      x: screen.bounds.width - 612,
      y: 22,
      width: 612,
      height: 272,
    });

    gui.Window.get().on('close', function () {
      notesWin.close(true);
    })

    notesShowing = true;

  }

  function screenshare(e) {
    if (e.which !== 'b'.charCodeAt(0)) { return; }

    var doc = window.fullscreen ? window.fullscreen.window.document : document;

    if (broadcasting) { return close(); }

    video = doc.createElement('video');
    doc.body.appendChild(video)
    video.id = 'receiver';

    gui.Screen.chooseDesktopMedia(
      ["window","screen"], function(streamId) {

        var constraint = {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: streamId,
            maxWidth: 1920,
            maxHeight: 1080,
            minFrameRate: 1,
            maxFrameRate: 5
          },
          optional:[]
        };

        navigator.webkitGetUserMedia(
          {audio:false, video: constraint},
          function(stream){
              video.src = URL.createObjectURL(stream);
              broadcasting = stream;
              video.play();
              stream.onended = close;
          },
          function(){ });

      });

      function close () {
        video.src = '';
        doc.body.removeChild(video);
        broadcasting.stop();
        broadcasting = false;
      }

  }

}

function nop(){}
module.exports.metaNotes = function () {
  // if (!(window.__nwWindowId && window.nwDispatcher)) {
  //   return nop;
  // }

  if (location.search !== '?notes') { return nop; }

  return function (slide, notes) {
    slide.className = 'bespoke-slide deck-notes';
    slide.innerHTML = '<aside class=deck-note>' + notes + '</aside>';
  }

}
