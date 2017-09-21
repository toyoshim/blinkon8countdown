/* global navigator */
/* global tma */
/* global MajVj */
/* global TmaTimeline */

var mv = null;
var host = null;
var reloading = false;
var sets = [];

// Handles MIDI messages.
function handleMIDIMessage (data) {
  if ((data[0] & 0xf0) != 0xb0)
    return;
  if (host)
    host.properties.controls[data[1]] = data[2];
}

// Handles MajVj messages.
function replyMajVjMessage (data) {
  var message = { type: 'MajVj', data: data };
  if (!window.opener) {
    if (data.command == 'ready')
      start(960, 540);
    console.log(message);
    return;
  }
  window.opener.postMessage(message, window.location.origin);
}

window.addEventListener('message', e => {
  if (e.data.type != 'MajVj')
    return;
  var data = e.data.data;
  switch (data.command) {
    case 'cc':
      handleMIDIMessage([0xb0, data.control, data.value]);
      break;
    case 'open':
      start(data.width, data.height);
      break;
    case 'reload':
      reloading = true;
      window.location.reload();
      break;
    case 'resize':
      resizeServer(data.width, data.height);
      break;
    case 'screen':
      if (data.mode == 'fullscreen')
        document.body.webkitRequestFullscreen();
      else
        document.webkitCancelFullScreen();
      break;
    default:
      tma.warn(data);
  }
}, false);

window.addEventListener('unload', e => {
  if (!reloading)
    replyMajVjMessage({ command: 'shutdown' });
}, false);

function resizeServer (width, height) {
  window.resizeTo(width, height);
  setTimeout(e => {
    window.resizeTo(
        width * 2 - window.innerWidth, height * 2 - window.innerHeight);
  }, 100);
  if (mv) {
    mv.resize(width, height);
    if (host)
      host.onresize(width / height);
  }
}

function start (width, height) {
  mv = new MajVj(width, height, false);
  host = mv.create('misc', 'host', sets[0]);
  resizeServer(width, height);
  mv.run(function (delta) {
    host.draw(delta);
  });
}

// Setups MIDI.
navigator.requestMIDIAccess().then(a => {
  var midi = e => handleMIDIMessage(e.data);

  a.addEventListener('statechange', e => {
    console.log(e);
    e.port.addEventListener('midimessage', midi, false);
  }, false);

  for (var port of a.inputs.values())
    port.addEventListener('midimessage', midi, false);
});

// MajVj bootstrap.
tma.extlibs = [ '../gl-matrix/dist/gl-matrix.js', 'ext/mv/MajVj.js' ];
tma.onload = function () {
  tma.log = function (message) {
    console.log.apply(console, arguments);
    replyMajVjMessage({ command: 'log', message: message });
  };
  tma.info = function (message) {
    console.info.apply(console, arguments);
    replyMajVjMessage({ command: 'info', message: message });
  };
  tma.warn = function (message) {
    console.warn.apply(console, arguments);
    replyMajVjMessage({ command: 'warn', message: message });
  };
  tma.error = function (message) {
    console.error.apply(console, arguments);
    replyMajVjMessage({ command: 'error', message: message });
  };
  tma.log('tmalib loaded.');
  tma.log('MajVj loading...');
  Promise.all([MajVj.loadAllPlugins()]).then(() => {
    tma.log('MajVj loaded.');
    tma.log('set.json loading...');
    tma.fetch('set.json', 'json', true).then(data => {
      tma.log('set.json loaded.');
      tma.log('server ready');
      sets = data.sets;
      replyMajVjMessage({ command: 'ready' });
    });
  });
};
replyMajVjMessage({ command: 'log', message: 'tmalib loading...' });
