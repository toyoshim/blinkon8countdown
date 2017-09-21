// Handles MajVj messages.
var server = null;
var serverReady = false;
var pendingMessages = [];

function postMajVjMessage(data) {
  if (!server)
    return;
  if (!serverReady) {
    pendingMessages.push(data);
    return;
  }
  var message = { type: 'MajVj', data: data };
  server.postMessage(message, window.location.origin);
}

function handleVMIDI(data) {
  postMajVjMessage({ command: 'cc', control: data.control, value: data.value });
}

window.addEventListener('message', e => {
  if (e.data.type == 'vMIDI')
    return handleVMIDI(e.data);
  if (e.data.type != 'MajVj')
    return;
  var data = e.data.data;
  switch (data.command) {
    case 'log':
    case 'info':
    case 'warn':
    case 'error':
      var time = Date(e.timeStamp);
      var log = 'MajVj:' + data.command + '[' + time + '] : ' + data.message;
      console.log(log);
      document.getElementById('log').textContent = log;
      break;
    case 'ready':
      serverReady = true;
      pendingMessages.forEach(data => postMajVjMessage(data));
      pendingMessages = [];
      break;
    case 'shutdown':
      server = null;
      console.log('server shutdown')
      break;
    default:
      console.log(data);
      break;
  }
}, false);

window.addEventListener('unload', e => {
  if (server)
    server.close();
});

// UI utilities.
function addSelect(id, items) {
  var select = document.createElement('select');
  select.setAttribute('id', id);
  items.forEach(item => {
    var option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  });
  document.body.appendChild(select);
}

function addButton(id, callback) {
  var input = document.createElement('input');
  input.setAttribute('type', 'button');
  input.setAttribute('id', id);
  input.setAttribute('value', id);
  input.addEventListener('click', callback);
  document.body.appendChild(input);
}

function addTextbox(id, def) {
  var input = document.createElement('input');
  input.setAttribute('type', 'text');
  input.setAttribute('id', id);
  input.setAttribute('value', def);
  document.body.appendChild(input);
}

function addSpan(text) {
  var span = document.createElement('span');
  span.textContent = text;
  document.body.appendChild(span);
}

function addPre(text) {
  var pre = document.createElement('pre');
  pre.textContent = text;
  document.body.appendChild(pre);
}

function addHr() {
  var hr = document.createElement('hr');
  document.body.appendChild(hr);
}

// Constructs UI components.
addSelect('SIZE', [
  '1280x720',   // 16:9
  '1366x768',   // 16:9
  '1920x1080',  // 16:9
  '(custom)'
]);

addTextbox('WIDTH', '1024');
addSpan('x');
addTextbox('HEIGHT', '768');

function getServerSize() {
  var size = document.getElementById('SIZE').value.split('x');
  if (size.length != 2) {
    size = [
      document.getElementById('WIDTH').value,
      document.getElementById('HEIGHT').value
    ];
  }
  return { width: size[0], height: size[1] };
}

addButton('OPEN', e => {
  serverReady = false;
  if (server)
    server.close();
  server = window.open('server.html', 'MajVj', 'scrollbars=no,status=no');
  var size = getServerSize();
  postMajVjMessage({ command: 'open', width: size.width, height: size.height });
});

addButton('FULLSCREEN', e => {
  postMajVjMessage({ command: 'screen', mode: 'fullscreen' });
});

addButton('WINDOW', e => {
  postMajVjMessage({ command: 'screen', mode: 'window' });
});

addButton('RESIZE', e => {
  var size = getServerSize();
  postMajVjMessage(
      { command: 'resize', width: size.width, height: size.height });
});

addButton('RELOAD', e => {
  var size = getServerSize();
  postMajVjMessage({ command: 'reload' });
  serverReady = false;
  postMajVjMessage({ command: 'open', width: size.width, height: size.height });
});

addHr();
const div = document.createElement('pre');
div.setAttribute('id', 'log');
div.textContent = 'No log message from the server.'
document.body.appendChild(div);

addHr();

var xhr = new XMLHttpRequest();
xhr.open('GET', 'set.json', true);
xhr.responseType = 'json';
xhr.onloadend = function () {
  if (!xhr.response) {
    console.log('JSON format error');
    return;
  }
  var sets = xhr.response.sets;
  for (var i = 0; i < sets.length; ++i) {
    console.log(sets[i]);
    if (sets[i].comments)
      addPre(sets[i].comments.join('\n'));
    addHr();
  }
};
xhr.send();