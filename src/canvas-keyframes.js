;(function() {
    'use strict';
    /**
	 * [CanvasKeyFrames 序列帧播放工具]
	 * el      [canvas容器,必须是DOM对象]
	 * type    [图片模式，'array'和 'sprite'模式，array是图片对象数组，sprite是基于宽度扩展的单张雪碧图]
	 * imgs    [图片帧对象数组或单图，对应不同模式]
	 * options {
				cover: 10, //指定封面帧，默认是0
			    fps: 30, //默认是24
			    loop: 10 //初始化默认的循环数，在formTo中可以设置，默认是infinite,
			    ratio: 2 //雪碧图模式才需要，图片的高清比例，与@2x相似，默认是2，低清模式是1,
			    width: 300, //注意，隐藏元素是拿不到宽度的，所以特殊情况下需要指定宽度
                height: 300,
                _iw: 300, // 雪碧图中单个图片的宽度
                _ih: 300, // 雪碧图中单个图片的高度
                framesCount: 14 // 雪碧图帧数
            }
	 */
    function CanvasKeyFrames(el, type, imgs, options) {
        if (!el || !imgs) {
            throw new Error('el和imgs是必填参数')
        }

        if (type !== 'array' && type !== 'sprite') {
            throw new Error('只支持"array"和"sprite"模式')
        }
        this.el = el;
        this.mode = type; //模式
        this.imgs = imgs;
        this.imgsLen = null;
        this.canvas = null;
        this.ctx = null;
        this.timer = null; //定时器
        this.state = 'stop';
        this.infinite = 1000000000;

        this.ispause = false;
        // 帧总量
        this.plusNum = 0;
        // 帧总量计数器
        this.plusCount = 0;
        this.count = 0;

        var defaultoptions = {
            cover: 0,
            fps: 24,
            loop: 'infinite',
            ratio: 1
        }
        this.options = options || defaultoptions;
        this.options.cover = options.cover || defaultoptions.cover;
        this.options.fps = options.fps || defaultoptions.fps;
        this.options.loop = options.loop || defaultoptions.loop;
        // 图片分辨比例，与@2x的概念相似，只有sprite需要该选项，默认为2
        this.options.ratio = options.ratio || defaultoptions.ratio;

        //记录起始帧
        this.recordFrom = 0;
        //记录结束帧
        this.recordTo = null;
        //记录循环方式
        this.recordInf = this.options.loop;
        init(this);
    }
    /**
     * 初始化
     */
    function init(self) {
        createCanvas(self);
        if (self.mode === 'array') {
            self.imgsLen = self.imgs.length;
        } else if (self.mode === 'sprite') {
            //计算雪碧图数量
            self.wt = self.imgs.width / self.options._iw;
            self.ht = self.imgs.height / self.options._ih;
            var spriteArray = [];
            // 手动生成雪碧图坐标 一维数组
            for (var j=0;j<self.ht; j++) {
                for (var i=0; i<self.wt; i++) {
                    spriteArray.push({
                        x: self.options._iw * i,
                        y: self.options._ih * j
                    })
                }
            }
            self.spriteArray = spriteArray;
            self.imgsLen = self.options.framesCount ? self.options.framesCount : Math.round(2 * self.imgs.width / (self.canvas.width * self.options.ratio))
        }
        self.recordTo = self.imgsLen - 1;
        showCover(self);
    }
    /**
     * 创建canvas
     * @return {[type]} [description]
     */
    function createCanvas(self) {
        var canvas = document.createElement('canvas');
        canvas.width = self.options.width * 2 || self.el.clientWidth;
        canvas.height = self.options.height * 2 || self.el.clientHeight;
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        self.ctx = canvas.getContext('2d');
        self.el.appendChild(canvas);

        self.canvas = canvas;
    };
    /**
     * drawImg
     */
    function drawImg(self, n) {
        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);

        if (self.mode === 'array') {
            //判断图片有没有宽度
            if (self.imgs[n].width !== 0) {
                self.ctx.drawImage(self.imgs[n], 0, 0, self.canvas.width, self.canvas.height);
            }
        } else if (self.mode === 'sprite') {
            if (self.options.framesCount) {
                self.ctx.drawImage(self.imgs, self.spriteArray[n].x, self.spriteArray[n].y, self.options._iw, self.options._ih, 0, 0, self.canvas.width, self.canvas.height);
            } else {
                var imgWidth = self.imgs.width / self.imgsLen;
                self.ctx.drawImage(self.imgs, imgWidth * n, 0, imgWidth, self.imgs.height, 0, 0, self.canvas.width, self.canvas.height);
            }
        } else {
            throw new Error('没有匹配的模式')
        }
    }

    function showCover(self) {
        drawImg(self, self.options.cover);
    }
    /**
     * API
     * @type {Object}
     */
    CanvasKeyFrames.prototype = {
        constructor: CanvasKeyFrames,
        /**
         * 跳到某一帧
         */
        goto: function(n) {
            drawImg(this, n);
            this.count = n;
        },
        /**
         * 下一帧
         */
        next: function() {
            var n = this.count + 1 >= this.imgsLen ? 0 : this.count + 1;
            this.goto(n);
        },
        /**
         * 上一帧
         */
        prev: function() {
            var n = this.count - 1 <= 0 ? this.imgsLen - 1 : this.count - 1;
            this.goto(n);
        },
        /**
         * @param  {[type]}   from     [启始帧（从0开始）]
         * @param  {[type]}   to       [结束帧数]
         * @param  {[type]}   loop     [循环次数，默认是infiniten]
         * @param  {Function} callback [description]
         */
        fromTo: function(from, to, loop, callback) {
            var self = this;
            //先清除上次未执行完的动画
            clearInterval(this.timer);
            var keyCount = from;
            var timeFn = function timeFn() {
                if (self.ispause) {
                    return;
                }

                //当总量计数器达到帧总量的时候退出
                if (self.plusNum <= self.plusCount) {
                    clearInterval(self.timer);
                    //还原状态
                    self.timer = null;
                    self.plusNum = 0;
                    self.plusCount = 0;
                    self.state = 'stop';
                    callback && callback();
                    return;
                } else { //未达到，继续循环
                    //一次循环结束，重置keyCount为from
                    if (keyCount > to) {
                        keyCount = from;
                    }
                    self.goto(keyCount);
                    //帧计数器
                    keyCount++;
                    //总量计数器
                    self.plusCount++;
                }
            };

            //总量计数器
            this.plusCount = 0;
            this.state = 'play';
            loop = !loop || loop === 'infinite' ? this.infinite : loop;

            //帧总量 帧数*循环次数
            this.plusNum = (to - from + 1) * loop;
            this.ispause = false;

            this.recordFrom = from;
            this.recordTo = to;
            this.recordInf = loop;

            timeFn();
            this.timer = setInterval(timeFn, 1000 / this.options.fps);
        },
        /**
         * @param  {[type]}   to       [启始帧（从高位开始）]
         * @param  {[type]}   from     [结束帧数（从低位结束）]
         * @param  {[type]}   loop     [循环次数，默认是infiniten]
         * @param  {Function} callback [description]
         */
        toFrom: function(to, from, loop, callback) {
            var self = this;

            //先清除上次未执行完的动画
            clearInterval(this.timer);
            var keyCount = to;
            var timeFn = function timeFn() {
                if (self.ispause) {
                    return;
                }

                //当总量计数器达到帧总量的时候退出
                if (self.plusNum <= self.plusCount) {
                    clearInterval(self.timer);
                    //还原状态
                    self.timer = null;
                    self.plusNum = 0;
                    self.plusCount = 0;
                    self.state = 'stop';
                    callback && callback();
                    return;
                } else { //未达到，继续循环

                    //一次循环结束，重置keyCount为to
                    if (keyCount < from) {
                        keyCount = to;
                    }
                    self.goto(keyCount);
                    //帧计数器
                    keyCount--;
                    //总量计数器
                    self.plusCount++;
                }
            };

            //总量计数器
            this.plusCount = 0;
            this.state = 'play';
            loop = !loop || loop === 'infinite' ? this.infinite : loop;

            //帧总量 帧数*循环次数
            this.plusNum = (to - from + 1) * loop;
            this.ispause = false;

            this.recordFrom = from;
            this.recordTo = to;
            this.recordInf = loop;

            timeFn();
            this.timer = setInterval(timeFn, 1000 / this.options.fps);
        },
        /**
         * fromto正着播一遍,然后回调fromBack,倒着播一遍，然后再回调toBack,进行逻辑判断
         * @param  {[type]}   from     [启始帧（从0开始）]
         * @param  {[type]}   to       [结束帧数]
         * @param  {[type]}   loop     [循环次数，默认是infinite正播过去，再倒播回来]
         * @param  {Function} callback [description]
         
         */
        repeatplay: function(from, to, loop, callback) {
            var self = this;
            var count = 0;

            loop = !loop || loop === 'infinite' ? this.infinite : loop;

            var toBack = function toBack() {
                count++;
                if (count === loop) {
                    callback && callback();
                } else {
                    self.fromTo(from, to, 1, fromBack);
                }
            };

            var fromBack = function fromBack() {
                self.toFrom(to, from, 1, toBack);
            }

            this.fromTo(from, to, 1, fromBack);
        },
        /**
         * @param  {[type]}   from     [启始帧（从0开始）]
         * @param  {[type]}   loop     [循环次数，默认是infinite]
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        from: function(from, loop, callback) {
            //计算结束帧
            var to = this.imgsLen - 1;
            this.fromTo(from, to, loop, callback);
        },
        /**
         * @param  {[type]}   to       [结束帧数]
         * @param  {[type]}   loop     [循环次数，默认是infinite]
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        to: function(to, loop, callback) {
            //默认起始帧是0
            var from = 0;
            this.fromTo(from, to, loop, callback);
        },
        /**
         * 暂停动画
         * @return {[type]} [description]
         */
        pause: function() {
            this.ispause = true;
            this.state = 'stop';
        },
        /**
         * 停止并回到第一帧或cover帧
         */
        stop: function() {
            clearInterval(this.timer);
            this.state = 'stop';
            this.plusNum = 0;
            this.plusCount = 0;
            this.ispause = false;
            //重置记录
            this.recordFrom = 0;
            this.recordTo = this.imgsLen - 1;
            this.recordInf = this.options.loop;

            //初始状态的封面帧
            drawImg(this, this.options.cover);
        },
        /**
         * 从当前位置播放动画，会继承上次使用fromTo、form或to的属性
         */
        play: function(callback) {
            if (this.state === 'play') {
                return;
            }
            if (!this.ispause) {
                this.fromTo(this.recordFrom, this.recordTo, this.recordInf, callback)
            } else {
                this.ispause = false;
            }
        },
        /**
         * 销毁对象
         */
        destroy: function() {
            clearInterval(this.timer);
            this.timer = null;
            this.ctx = null;
            this.canvas.remove();
            this.canvas = null;

            for (var key in this) {
                delete this[key];
            }
        }
    }

    // Add support for AMD (Asynchronous Module Definition) libraries such as require.js.
    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return CanvasKeyFrames;
        })
    }
    //Add support form CommonJS libraries such as browserify.
    if (typeof exports !== 'undefined') {
        exports.CanvasKeyFrames = CanvasKeyFrames;
    }
    //Define globally in case AMD is not available or unused
    if (typeof window !== 'undefined') {
        window.CanvasKeyFrames = CanvasKeyFrames;
    }
})();
