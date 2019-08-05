/*
 * canvas-keyframes.js v1.0.0
 * (c) 2019 wenyi
 * Released under the MIT license
 */

// Defaults
var defaultSettings = {
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
};
var is = {
  arr: function (a) { return Array.isArray(a); },
  obj: function (a) { return stringContains(Object.prototype.toString.call(a), 'Object'); },
  pth: function (a) { return is.obj(a) && a.hasOwnProperty('totalLength'); },
  svg: function (a) { return a instanceof SVGElement; },
  inp: function (a) { return a instanceof HTMLInputElement; },
  dom: function (a) { return a.nodeType || is.svg(a); },
  str: function (a) { return typeof a === 'string'; },
  fnc: function (a) { return typeof a === 'function'; },
  und: function (a) { return typeof a === 'undefined'; },
  hex: function (a) { return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a); },
  rgb: function (a) { return /^rgb/.test(a); },
  hsl: function (a) { return /^hsl/.test(a); },
  col: function (a) { return (is.hex(a) || is.rgb(a) || is.hsl(a)); },
  key: function (a) { return !defaultInstanceSettings.hasOwnProperty(a) && !defaultTweenSettings.hasOwnProperty(a) && a !== 'targets' && a !== 'keyframes'; }
};
function cloneObject(o) {
    var clone = {};
    for (var p in o) { clone[p] = o[p]; }
    return clone;
}
  
function replaceObjectProps(o1, o2) {
    var o = cloneObject(o1);
    for (var p in o1) { o[p] = o2.hasOwnProperty(p) ? o2[p] : o1[p]; }
    return o;
}
function mergeObjects(o1, o2) {
    var o = cloneObject(o1);
    for (var p in o2) { o[p] = is.und(o1[p]) ? o2[p] : o1[p]; }
    return o;
}
function getApriteArray(obj, obj2) {
    if ( obj === void 0 ) obj = {};
    if ( obj2 === void 0 ) obj2 = {};

    var width = obj.width;
    var height = obj.height;
    var w = obj2.w;
    var h = obj2.h;
    //计算雪碧图数量
    var wt = width / w;
    var ht = height / h;
    var spriteArray = [];
    // 手动生成雪碧图坐标 一维数组
    for (var j=0;j<ht; j++) {
        for (var i=0; i<wt; i++) {
            spriteArray.push({
                x: w * i,
                y: h * j
            });
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
}
var instanceID = 0;

function createNewInstance(params) {
    var settings = replaceObjectProps(defaultSettings, params);
    var id = instanceID;
    instanceID++;
    return mergeObjects(settings, {
        id: id
    });
}
var raf;
var activeInstance = null;
var engine = (function () {
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
function CanvasKeyFrames(el, imgs, mode, params) {
    if ( params === void 0 ) params = {};

    if (!el || !imgs) {
        throw new Error('el和imgs是必填参数')
    }
    if (mode !== 'array' && mode !== 'sprite') {
        throw new Error('只支持"array"和"sprite"模式')
    }
    var resolve = null;
    var now = 0;
    var then = Date.now();
    var delta = 0;
    function makePromise(instance) {
        var promise = window.Promise && new Promise(function (_resolve) { return resolve = _resolve; });
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
    var instance = createNewInstance(params);
    var interval = 1000 / instance.fps;
    createCanvas(instance);

    var promise = makePromise(instance);
    function drawImg() {
        var n = instance.process;
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
        if (instance[cb]) { instance[cb](instance); }
    }
    function countIteration() {
        if (instance.remaining) {
            instance.remaining--;
        }
    }
    function resetTime() {
        now = 0;
        then = Date.now();
        delta = 0;
    }
    function setProgress() {
        if (!instance.begin) {
            instance.begin = true;
            instance.ispause = false;
            console.log(instance.process, 'aaa', instance.start);
            instance.process = instance.direction === 'normal' ? instance.start - 1 : instance.start + 1;
            console.log('动态',instance.process);
        }
        console.log('???????????');
        countIteration();
        if (!instance.remaining) {
            instance.ispause = true;
            if (!instance.completed) {
              instance.completed = true;
              if (instance.repeat) {
                instance.repeatDirec = !instance.repeatDirec;
                if (instance.repeatDirec) {
                    instance.direction = instance.direction === 'normal' ? 'alternate' : 'normal';
                    if (instance.direction === 'normal') {
                        var start = instance.start;
                        var end = instance.end;
                        if (start > end) {
                            instance.start = end;
                            instance.end = start;
                        }
                    }
                } else {
                    instance.direction = instance.direction === 'alternate' ? 'normal' : 'alternate';
                }
              }
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
                if (instance.direction === 'normal') {
                    instance.process = instance.process >= instance.end ? instance.start : instance.process + 1;
                } else {
                    instance.process = instance.process <= 0 ? instance.start : instance.process - 1;
                }
                instance.pause();
            }
        } else {
            if (instance.direction === 'normal') {
                instance.process = instance.process >= instance.end ? instance.start : instance.process + 1;
            } else {
                instance.process = instance.process <= 0 ? instance.start : instance.process - 1;
            }
        }
        console.log('打印instance.process=>', instance.process);
    }
    instance.tick = function(t) {
        now = Date.now();
　　    delta = now - then;
    　　if (delta > interval && !instance.ispause) {
    　　　　then = now - (delta % interval);
            console.log('enter', instance.process);
            setProgress();
            drawImg();
    　　}
    };
    instance.goto = function(n) {
        instance.process = n;
        drawImg();
    };
    instance.next = function() {
        var n = instance.process + 1 >= instance.framesLenth ? 0 : instance.process + 1;
        instance.goto(n);
    };
    instance.prev = function() {
        var n = instance.process - 1 <= 0 ? instance.framesLenth - 1 : instance.process - 1;
        instance.goto(n);
    };
    instance.fromTo = function(params) {
        if ( params === void 0 ) params = {};

        var from = params.from;
        var to = params.to;
        var loop = params.loop;
        var complete = params.complete;
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
    };
    instance.repeatloop = function (params) {
        if ( params === void 0 ) params = {};

        instance.repeat = true;
        instance.fromTo(params);
    };
    instance.pause = function() {
        raf = cancelAnimationFrame(raf);
        resetTime();
        instance.ispause = true;
        instance.state = 'stop';
        drawImg();
    };
    instance.stop = function() {
        raf = cancelAnimationFrame(raf);
        resetTime();
        instance.begin = false;
        instance.state = 'stop';
        instance.ispause = true;
        instance.process = 0;
        drawImg();
    };
    instance.play = function() {
        if (!instance.ispause) { return; }
        instance.ispause = false;
        activeInstance = instance;
        if (!raf) { engine(); }
    };
    instance.destroy = function(){
        instance.ctx = null;
        instance.canvas.remove();
        instance.canvas = null;
        instance.ispause = true;
        raf = cancelAnimationFrame(raf);
        resetTime();
        for (var key in instance){
            delete instance[key];
        }
    };
    showCover();
    if (instance.autoplay) { instance.play(); }
    return instance;
}

CanvasKeyFrames.version = '1.0.0';
CanvasKeyFrames.random = function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };

export default CanvasKeyFrames;
