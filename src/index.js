// Defaults

const defaultSettings = {
    el: null,
    mode: 'array',
    direction: 'normal',
    fps: 30,
    imgs: null,
    loop: true,
    autoplay: false,
    cover: 0,
    process: 0,
    framesLenth: 0,
    ispause: true,
    state: 'stop',
    start: 0,
    end: 0,
    remaining: 0,
    completed: false,
    update: null,
    begin: null,
    complete: null,
    repeat: false,
    repeatDirec: true
}
const is = {
  arr: a => Array.isArray(a),
  obj: a => stringContains(Object.prototype.toString.call(a), 'Object'),
  pth: a => is.obj(a) && a.hasOwnProperty('totalLength'),
  svg: a => a instanceof SVGElement,
  inp: a => a instanceof HTMLInputElement,
  dom: a => a.nodeType || is.svg(a),
  str: a => typeof a === 'string',
  fnc: a => typeof a === 'function',
  und: a => typeof a === 'undefined',
  hex: a => /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a),
  rgb: a => /^rgb/.test(a),
  hsl: a => /^hsl/.test(a),
  col: a => (is.hex(a) || is.rgb(a) || is.hsl(a)),
  key: a => !defaultInstanceSettings.hasOwnProperty(a) && !defaultTweenSettings.hasOwnProperty(a) && a !== 'targets' && a !== 'keyframes'
}
function cloneObject(o) {
    const clone = {};
    for (let p in o) clone[p] = o[p];
    return clone;
}
  
function replaceObjectProps(o1, o2) {
    const o = cloneObject(o1);
    for (let p in o1) o[p] = o2.hasOwnProperty(p) ? o2[p] : o1[p];
    return o;
}
function mergeObjects(o1, o2) {
    const o = cloneObject(o1);
    for (let p in o2) o[p] = is.und(o1[p]) ? o2[p] : o1[p];
    return o;
}
function getApriteArray(obj = {}, obj2 = {}) {
    let {width, height} = obj;
    let {w, h} = obj2;
    //计算雪碧图数量
    const wt = width / w;
    const ht = height / h;
    var spriteArray = [];
    // 手动生成雪碧图坐标 一维数组
    for (var j=0;j<ht; j++) {
        for (var i=0; i<wt; i++) {
            spriteArray.push({
                x: w * i,
                y: h * j
            })
        }
    }
    return spriteArray;
}
function createCanvas(instance) {
    var canvas = document.createElement('canvas');
    canvas.width = instance.width * window.devicePixelRatio || instance.el.clientWidth;
    canvas.height = instance.height * window.devicePixelRatio || instance.el.clientHeight;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    instance.ctx = canvas.getContext('2d');
    instance.el.appendChild(canvas);

    instance.canvas = canvas;
    return instance;
};
let instanceID = 0;

function createNewInstance(params) {
    const settings = replaceObjectProps(defaultSettings, params);
    const id = instanceID;
    instanceID++;
    return mergeObjects(settings, {
        id: id
    });
}
let raf;
let activeInstance = null;
const engine = (() => {
    function play() {
      raf = requestAnimationFrame(step);
    }
    function step(t) {
      if (!activeInstance.ispause) {
        activeInstance.tick(t);
        play();
      } else {
        raf = cancelAnimationFrame(raf);
      }
    }
    return play;
})();
function CanvasKeyFrames(el, imgs, mode, params = {}) {
    if (!el || !imgs) {
        throw new Error('el和imgs是必填参数')
    }
    if (mode !== 'array' && mode !== 'sprite') {
        throw new Error('只支持"array"和"sprite"模式')
    }
    let resolve = null;
    let now = 0;
    let then = Date.now();
    let delta = 0;
    function makePromise(instance) {
        const promise = window.Promise && new Promise(_resolve => resolve = _resolve);
        instance.finished = promise;
        return promise;
    }
    if (mode === 'array') {
        params.framesLenth = imgs.length;
    } else {
        params.spriteArray =  getApriteArray({width: imgs.width, width: imgs.height},{w: params._iw, h: params._ih});
        params.framesLenth = params.spriteArray.length;
    }
    params.el = el;
    params.mode = mode;
    params.imgs = imgs;
    params.start = 0;
    params.end = params.framesLenth - 1;
    params.remaining = params.framesLenth;
    let instance = createNewInstance(params);
    let interval = 1000 / instance.fps;
    createCanvas(instance);

    let promise = makePromise(instance);
    function toggleDirection() {
        const direction = instance.direction;
        if (direction !== 'alternate'){
            instance.direction = direction !== 'normal' ? 'normal' : 'reverse';
        }
        instance.reversed = !instance.reversed;
    }
    function drawImg() {
        let n = instance.process;
        instance.ctx.clearRect(0, 0, instance.canvas.width, instance.canvas.height);

        if (instance.mode === 'array') {
            //判断图片有没有宽度
            if (instance.imgs[n].width !== 0) {
                instance.ctx.drawImage(instance.imgs[n], 0, 0, instance.canvas.width, instance.canvas.height);
            }
        } else if (instance.mode === 'sprite') {
            if (instance.options.framesCount) {
                instance.ctx.drawImage(instance.imgs, instance.spriteArray[n].x, instance.spriteArray[n].y, instance._iw, instance._ih, 0, 0, instance.canvas.width, instance.canvas.height);
            } else {
                var imgWidth = instance.imgs.width / instance.imgsLen;
                instance.ctx.drawImage(instance.imgs, imgWidth * n, 0, imgWidth, instance.imgs.height, 0, 0, instance.canvas.width, instance.canvas.height);
            }
        } else {
            throw new Error('没有匹配的模式')
        }
    }
    function showCover() {
        drawImg();
    }
    function setCallback(cb) {
        if (instance[cb]) instance[cb](instance);
    }
    function countIteration() {
        if (instance.remaining) {
          instance.remaining--;
        }
    }
    function setProgress() {
        if (!instance.begin) {
            console.log(instance.begin);
            instance.begin = true;
            instance.ispause = false;
            instance.process = instance.start - 1;
        }
        countIteration();
        if (!instance.remaining) {
            if (!instance.completed) {
              if (instance.repeat) {
                instance.repeatDirec = !instance.repeatDirec;
                if (instance.repeatDirec) {
                    instance.direction = instance.direction === 'normal' ? 'alternate' : 'normal'
                    if (instance.direction === 'normal') {
                        let {start, end} = instance;
                        if (start > end) {
                            instance.start = end;
                            instance.end = start;
                        }
                    }
                } else {
                    instance.direction = instance.direction === 'alternate' ? 'normal' : 'alternate'
                }
              }
              instance.completed = true;
              setCallback('complete');
            }
            if (instance.loop) {
                instance.completed = false;
                instance.remaining = Math.abs(instance.end - instance.start) + 1;
                
                if (instance.repeat) {
                    if (instance.repeatDirec) {
                        instance.process = instance.start;
                    } else {
                        instance.process = instance.end;
                    }
                } else {
                    instance.process = instance.start;
                }
            } else {
                instance.pause();
            }
        } else {
            if (instance.direction === 'normal') {
                instance.process = instance.process >= instance.end ? instance.start : instance.process + 1
            } else {
                instance.process = instance.process <= 0 ? instance.start : instance.process - 1;
            }
        }
    }
    instance.tick = function(t) {
        now = Date.now();
　　    delta = now - then;
    　　if (delta > interval) {
    　　　　then = now - (delta % interval);
            setProgress();
            drawImg();
    　　}
    }
    instance.goto = function(n) {
        instance.process = n;
        drawImg();
    }
    instance.next = function() {
        let n = instance.process + 1 >= instance.framesLenth ? 0 : instance.process + 1;
        instance.goto(n);
    }
    instance.prev = function() {
        let n = instance.process - 1 <= 0 ? instance.framesLenth - 1 : instance.process - 1;
        instance.goto(n);
    }
    instance.fromTo = function(params = {}) {
        let {from, to, loop, complete} = params;
        instance.loop = loop;
        instance.complete = complete;
        if (from <= to) {
            instance.direction = 'normal';
            instance.repeatDirec = true;
            instance.start = from > -1 ? from : 0;
            instance.end = to < instance.framesLenth ? to : instance.framesLenth - 1;
        } else {
            instance.direction = 'alternate';
            instance.repeatDirec = false;
            instance.start = from < instance.framesLenth ? from : instance.framesLenth - 1;
            instance.end = to > -1 ? to : 0;
        }
        instance.remaining = Math.abs(instance.end -  instance.start) + 1;
        instance.process = instance.start;
        instance.play();
    }
    instance.repeatloop = function (params = {}) {
        instance.repeat = true;
        instance.fromTo(params);
    }
    instance.pause = function() {
        instance.ispause = true;
        instance.state = 'stop';
    }
    instance.stop = function() {
        instance.begin = false;
        instance.state = 'stop';
        instance.ispause = true;
        instance.process = 0;
    }
    instance.play = function() {
        if (!instance.ispause) return;
        instance.ispause = false;
        activeInstance = instance;
        if (!raf) engine();
    }
    instance.destroy = function(){
        instance.ctx = null;
        instance.canvas.remove();
        instance.canvas = null;
        for (let key in instance){
            delete instance[key];
        }
    }
    showCover();
    if (instance.autoplay) instance.play();
    return instance;
}

CanvasKeyFrames.version = '1.0.0';
CanvasKeyFrames.random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export default CanvasKeyFrames;