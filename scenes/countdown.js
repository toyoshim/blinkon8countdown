/**
 * T'MediaArt library for JavaScript
 *  - MajVj extension - external plugin - countdown -
 * @param options options (See MajVj.prototype.create)
 */
MajVj.external.countdown = function(options) {
  this._mv = options.mv;
  this._screen = options.screen;
  this._random = options.mv.create('misc', 'random');
  this._rotate = 0;
  this._rotateRate = 1;
  this._paused = true;
  this._showSnap = false;
  this.properties = {
    'test1': 0,
    'start': 0,
    'soundGain' : 1.0,
  };
  this._lastProperties = {
    'test1': 0,
    'start': 0,
    'soundGain' : 1.0,
  };

  // Setups effect module.
  this._effect = options.mv.create('effect', 'noise', {
//			enable: ['color', 'tube', 'film']
			enable: ['color', 'tube', 'film', 'noise']
//      disable: ['color', 'slitscan', 'noise']
  });
  this._effect.properties.noise_level = [0.0, 0.1, 0.0];
  this._effect.properties.noise_color = [1, 1, 0];
	this._effect.properties.color_shift = [0, 0, 0];
	//this._effect.properties.color_level = [0.107, 0.074, 0.043];
	this._effect.properties.color_level = [0.5, 0.5, 0.8];
	//this._effect.properties.color_weight = [0.4, 0.7, 1.0];
	this._effect.properties.color_weight = [0.5, 0.5, 0.5];
  this._fbo = options.mv.screen().createFrameBuffer();

  // Setups 3D API interface.
  this._frame = options.mv.create('frame', 'api3d', {
    draw: this._draw.bind(this)
  });
  this._camera = options.mv.create('misc', 'camera');
  this._camera.moveTo(0, [0, -20, 80]);
  this._camera.lookAt(0, [0, -2, 0]);

  // Setups rendering primitives.
  this._sphere = TmaModelPrimitives.createSphere(
      2,
      TmaModelPrimitives.SPHERE_METHOD_EVEN,
      TmaModelPrimitives.SPHERE_FLAG_NO_TEXTURE
  );
  this._earth = TmaModelPrimitives.createSphere(4, TmaModelPrimitives.SPHERE_METHOD_EVEN);
  this._earth.setTexture(this._screen.createTexture(
      MajVj.external.countdown._earth, true, Tma3DScreen.FILTER_NEAREST));
  this._earthAlpha = 0.0;

  this._stars = TmaModelPrimitives.createStars(10000, 30000);
  
  this._snapbox = TmaModelPrimitives.createBox();
  this._snapbox.setTexture(this._screen.createTexture(MajVj.external.countdown._awsnap));

  // Setups BGM data.
  this._bgm = this._mv.create('misc', 'sound');
  this._bgmReady = false;
  tma.log('loading bgm...');
  this._bgm.fetch('scenes/bgm3.mp3', false).then(() => {
    this._bgmReady = true;
    tma.log('bgm sound ready');
  });
  
  // Setups number data.
  this._patterns = [];
  const mx = 20;
  const my = 40;
  const mn = 10;
  for (let i = 0; i < 10; ++i) {
    let pattern = [];
    let data = MajVj.external.countdown._number_patterns[i];
    for (let j = 0; j < 2048; ++j) {
      const n = this._random.generate(0, data.length) | 0;
      const line = data[n];
      const x = this._random.generate(line[0], line[2]) * mx;
      const y = this._random.generate(line[1], line[3]) * my * -1.0;
      const dx = this._random.generate(-mn, mn) * this._random.generate() * this._random.generate();
      const dy = this._random.generate(-mn, mn) * this._random.generate() * this._random.generate();
      pattern.push({ sx: x, sy: y, ex: x + dx, ey: y + dy });
    }
    this._patterns.push(pattern);
  }
  this._number = 10;
  this._numberRate = 0;

  // Setups Aw, Snap screen.
  this._snapFrame = options.mv.create('frame', 'api3d', {
    draw: this._drawSnap.bind(this)
  });
  this._snapZoom = options.mv.create('effect', 'zoom');

  // tempo = 122 (beat = 0.4918032786885246 sec)
  this._numberSequencer = new TmaSequencer();
  const sequence = new TmaSequencer.SerialTask();
  const duration = 491.8032786885246;
  sequence.append(new TmaSequencer.Task(0, (_1, _2, time) => { this._number = 9; this._numberRate = 0; }));
  sequence.append(new TmaSequencer.Task(duration * 3, () => {}));
  sequence.append(new TmaSequencer.Task(duration, (_1, _2, time) => { this._number = 9; this._numberRate = time / duration; }));
  sequence.append(new TmaSequencer.Task(duration * 3, () => {}));
  sequence.append(new TmaSequencer.Task(duration, (_1, _2, time) => { this._number = 8; this._numberRate = time / duration; }));
  sequence.append(new TmaSequencer.Task(duration * 3, () => {}));
  sequence.append(new TmaSequencer.Task(duration, (_1, _2, time) => { this._number = 7; this._numberRate = time / duration; }));
  sequence.append(new TmaSequencer.Task(duration * 3, () => {}));
  sequence.append(new TmaSequencer.Task(duration, (_1, _2, time) => { this._number = 6; this._numberRate = time / duration; }));
  sequence.append(new TmaSequencer.Task(duration * 3, () => {}));
  sequence.append(new TmaSequencer.Task(duration, (_1, _2, time) => { this._number = 5; this._numberRate = time / duration; }));
  sequence.append(new TmaSequencer.Task(duration * 3, () => {}));
  sequence.append(new TmaSequencer.Task(duration, (_1, _2, time) => { this._number = 4; this._numberRate = time / duration; }));
  sequence.append(new TmaSequencer.Task(duration * 3, () => {}));
  sequence.append(new TmaSequencer.Task(duration, (_1, _2, time) => { this._number = 3; this._numberRate = time / duration; }));
  sequence.append(new TmaSequencer.Task(duration * 3, () => {}));
  sequence.append(new TmaSequencer.Task(duration, (_1, _2, time) => { this._number = 2; this._numberRate = time / duration; }));
  sequence.append(new TmaSequencer.Task(duration * 3, () => {}));
  sequence.append(new TmaSequencer.Task(duration, (_1, _2, time) => { this._number = 1; this._numberRate = time / duration; }));
  sequence.append(new TmaSequencer.Task(duration * 2, () => { this._showSnap = true; }));
  sequence.append(new TmaSequencer.Task(duration, () => { this._snapZoom.properties.multi = [2, 2]; }));
  sequence.append(new TmaSequencer.Task(duration, () => { this._snapZoom.properties.multi = [4, 4]; }));
  sequence.append(new TmaSequencer.Task(0, () => {
    this._showSnap = false;
    this._number = 10;
    this._rotateRate = 2;
    this._camera.lookTo(0, [0, 0, -1]);
    this._camera.moveTo(duration * 2, [0, 0, 500]);
  }));
  sequence.append(new TmaSequencer.Task(0, (_1, _2, time) => { this._earthAlpha = 0.6; }));
  sequence.append(new TmaSequencer.Task(duration - 100, () => {}));
  sequence.append(new TmaSequencer.RepeatTask(new TmaSequencer.Task(duration, (_1, _2, time) => {
    this._blink = time / duration;
  }), -1));
  this._numberSequencer.register(0, sequence);

  // Setups NicoMoji strings. 
  this._nicoMojiBox = TmaModelPrimitives.createBox();
  this._nicoMojiList = [];
  this.blink = 0;
};

/** Loads resources asynchronously.
 * @return a Promise oeject
 */
MajVj.external.countdown.load = function () {
 return new Promise((resolve, reject) => {
    Promise.all([
      MajVj.loadImageFrom('scenes/awsnap.png'),
      MajVj.loadImageFrom('scenes/earth2.png'),
      new Promise(resolve => {
        const link = document.createElement('link');
        link.setAttribute('href', 'https://fonts.googleapis.com/earlyaccess/nicomoji.css');
        link.setAttribute('rel', 'stylesheet');
        link.addEventListener('load', e => {
          document.fonts.load('10px Nico Moji');
          document.fonts.ready.then(() => resolve());
        });
        document.head.appendChild(link);
      })
    ]).then(results => {
      MajVj.external.countdown._awsnap = results[0];
      MajVj.external.countdown._earth = results[1];
      resolve();
    });
  });
}

MajVj.external.countdown._awsnap = null;
MajVj.external.countdown._earth = null;
MajVj.external.countdown._number_patterns = [
  /* 0 */ [ [-1, -1, 1, -1], [1, -1, 1, 1], [-1, 1, 1, 1], [-1, -1, -1, 1] ],
  /* 1 */ [ [0, -1, 0, 1] ],
  /* 2 */ [ [-1, -1, 1, -1], [1, -1, 1, 0], [-1, 0, 1, 0], [-1, 0, -1, 1], [-1, 1, 1, 1] ],
  /* 3 */ [ [-1, -1, 1, -1], [1, -1, 1, 1], [-1, 0, 1, 0], [-1, 1, 1, 1] ],
  /* 4 */ [ [-1, -1, -1, 0], [-1, 0, 1, 0], [1, -1, 1, 1] ],
  /* 5 */ [ [-1, -1, 1, -1], [-1, -1, -1, 0], [-1, 0, 1, 0], [1, 0, 1, 1], [-1, 1, 1, 1] ],
  /* 6 */ [ [-1, -1, 1, -1], [-1, 0, 1, 0], [1, 0, 1, 1], [-1, 1, 1, 1], [-1, -1, -1, 1] ],
  /* 7 */ [ [-1, -1, 1, -1], [1, -1, 1, 1] ],
  /* 8 */ [ [-1, -1, 1, -1], [1, -1, 1, 1], [-1, 1, 1, 1], [-1, -1, -1, 1], [-1, 0, 1, 0] ],
  /* 9 */ [ [-1, -1, 1, -1], [-1, 0, 1, 0], [1, -1, 1, 1], [-1, 1, 1, 1], [-1, -1, -1, 0] ],
];

MajVj.external.countdown._messages = [
  'Welcome to TOKYO',
  'BlinkOn 8', 'BlinkOn 8', 'BlinkOn 8', 'BlinkOn 8', 'BlinkOn 8',
  'BlinkOn', 'BlinkOn', 'BlinkOn', 'BlinkOn', 'BlinkOn', 'BlinkOn', 'BlinkOn', 'BlinkOn',
  'Blink',
  'Blink Blink Blink!!',
  'Let\'s Blink !',
  '<blink>',
  'ようこそ',
  '歓迎',
  'ｷﾀ━━━━(ﾟ∀ﾟ)━━━━!!',
  '日本',
  '♨',
  '東京',
  'TOKYO',
  'T O K Y O',
  'WWW',
  'www',
  'Open Web Platform',
  'Google Tokyo',
  '＼(^o^)／',
  '・ω・',
  '(^o^)',
  'ლ(´ڡ`ლ)',
  '(≧∇≦)/',
  'ΩΩΩ<な、なんだってー!?',
  'ｷﾀ━━(゜∀゜)━( ゜∀)━( 　゜)━(　　)━(　　)━(゜ 　)━(∀゜ )━(゜∀゜)━━!!!!!',
  '(#ﾉﾟДﾟ)ﾉ　･ﾟ･┻┻ﾟ･:.｡o',
  '＼(゜ロ＼)(／ロ゜)／',
  'Web',
  'ウェブ',
  'World Wide Web',
  '88888888',
  '8888',
  '888888888888888',
  '88888888888',
  '8888888888888888888888',
  '88888',
  '88888888888888888',
];

/**
 * Draws a frame.
 * @param delta delta time from the last rendering
 */
MajVj.external.countdown.prototype.draw = function(delta) {
  // Updates camera settings.
  this._camera.update(delta);
  this._frame.properties.position = this._camera.position();
  this._frame.properties.orientation = this._camera.orientation();

  // Updates rendering primitives.
  this._rotate += delta / 50000 * this._rotateRate;

  const screen = this._fbo.bind();
  
  if (this._showSnap) {
    // Renders to offline screen.
    this._screen.fillColor(0, 0, 0, 1);
    this._snapFrame.draw(delta);
    
    // Renders to screen with effects.
    screen.bind();
    this._screen.fillColor(0, 0, 0, 1);
    this._snapZoom.draw(delta, this._fbo.texture);
    
    // Continues to run sequencer.
    this._numberSequencer.run(delta);
  } else {
    // Renders to offline screen.
    this._screen.fillColor(0.3, 0.2, 0.4, 1);
    this._frame.draw(delta);

    // Renders to screen with effects.
    screen.bind();
    this._screen.fillColor(0.2, 0.1, 0.2, 1);
    // Use Math.random() because draw() calls are not reproducible.
    this._effect.properties.volume = Math.random() * 0.03;
    this._effect.draw(delta, this._fbo.texture);
  }
 
  // BGM Volume update.
  if (this.properties.soundGain != this._lastProperties.soundGain)
    this._bgm.setGain(this.properties.soundGain);
  
  // Backup properties.
  this._lastProperties.test1 = this.properties.test1;
  this._lastProperties.start = this.properties.start;
  this._lastProperties.soundGain = this.properties.soundGain;
};

MajVj.external.countdown.prototype._drawNumber = function(api, n) {
  api.setAlphaMode(true, api.gl.ONE, api.gl.ONE);
  api.color = [0.8, 0.5, 1.0, 1.0];
  const pattern = this._patterns[n];
  for (let data of pattern) {
    api.drawLine([data.sx, data.sy, 0], [data.ex, data.ey, 0]);
  }
};

MajVj.external.countdown.prototype._drawNumber = function(api, n1, n2, rate) {
  const p1 = this._patterns[n1];
  const p2 = this._patterns[n2];
  const r1 = 1 - rate;
  const r2 = rate;
  for (let i = 0; i < p1.length; ++i) {
    let nx = this._random.generate(-1, 1);
    let ny = this._random.generate(-1, 1);
    api.drawLine(
        [nx + p1[i].sx * r1 + p2[i].sx * r2, ny + p1[i].sy * r1 + p2[i].sy * r2, 0],
        [nx + p1[i].ex * r1 + p2[i].ex * r2, ny + p1[i].ey * r1 + p2[i].ey * r2, 0]);
  }
};

MajVj.external.countdown.prototype._draw = function(api) {
  const rotate = [ [-Math.PI / 2.0, 0.0, this._rotate] ];
  api.setAlphaMode(false);
  api.drawPrimitive(this._earth, 100, 100, 100, [0, 0, 0], rotate, this._earthAlpha * (0.5 + this._blink / 4));
 
  api.setAlphaMode(true);
  const l = 1.2 - this._earthAlpha / 2;
  api.color = [0.05 * l, 0.05 * l, 0.3 * l, 1.0];
  api.drawPrimitive(this._stars, 0.02, 0.02, 0.02, [0, 0, 0], rotate);
  api.drawPrimitive(this._sphere, 100, 100, 100, [0, 0, 0], rotate);

  const nicoMojiList = this._nicoMojiList;
  this._nicoMojiList = [];
  for (let nicoMoji of nicoMojiList) {
    this._nicoMojiBox.setTexture(nicoMoji.texture);
    if (this._blink < 0.75) {
      api.drawPrimitive(
          this._nicoMojiBox, nicoMoji.texture.width / 2, nicoMoji.texture.height / 2, 1, nicoMoji.position);
    }
    nicoMoji.position[0] -= nicoMoji.v;
    if (nicoMoji.position[0] > -1000)
      this._nicoMojiList.push(nicoMoji);
  }
  if (this._random.generate() > 0.97)
    this._appendNicoMoji();
 
  
  if (this._paused) {
    if (this._lastProperties.start && !this.properties.start && this._bgmReady) {
      this._paused = false;
      this._bgm.play();
    }
    return;
  }
  
  this._numberSequencer.run(api.delta);
  if (this._number < 10 && this._earthAlpha < 0.5) {
    api.color = [0.5 * l, 0.5 * l, 1.0 * l, 1.0];
    api.setAlphaMode(true, api.gl.ONE, api.gl.ONE);
    this._drawNumber(api, this._number, this._number - 1, TmaTimeline.convert(
        'cubic-bezier', this._numberRate, { x1: 0.90, y1: 0.0, x2: 1.0, y2: 1.0}));
  }
};

MajVj.external.countdown.prototype._drawSnap = function(api) {
  api.setAlphaMode(false);
  api.fill([242 / 255, 241 / 255, 239 / 255, 1]);
  const aspect = MajVj.external.countdown._awsnap.height / MajVj.external.countdown._awsnap.width;
  api.drawPrimitive(this._snapbox, 1, aspect, 0, [0, 0, -1]);
};

MajVj.external.countdown.prototype._appendNicoMoji = function () {
  const message = this._random.generate(0, MajVj.external.countdown._messages.length) | 0;
  const r = this._random.generate(80, 150) | 0;
  const g = this._random.generate(80, 150) | 0;
  const b = this._random.generate(80, 150) | 0;
  const color = 'rgb(' + r + ',' + g + ',' + b + ')';
  const texture = this._screen.createStringTexture(
        MajVj.external.countdown._messages[message], { name: 'Nico Moji', size: 64, foreground: color });
  const z = this._random.generate(1, 3);
  this._nicoMojiList.push({
    texture: texture,
    position: [300 + texture.width / 2, this._random.generate(-150, 150), 100 * z],
    v: this._random.generate(0.5, 4)
  });
};