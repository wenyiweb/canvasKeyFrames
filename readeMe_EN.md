# CanvasKeyFrames - The simplest sequence frame animation plugin of canvas![npm][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] 

[中文版](./readeMe.md)

# CanvasKeyFrames

The simplest sequence frame animation plugin of canvas,Manipulating picture animation with canvas, encapsulating common methods.


* el      [canvas container,must be a DOM object]
	 * type    [picture mode，'array' and 'sprite'，Array is an array of picture objects, sprite is based on the width of the single sprite]
	 * imgs    [Image frame object array or single image, corresponding to different modes]
	 * options {\
				cover: 10, //Specify the cover frame, default is 0 \
			    fps: 30, //default is24\
			    loop: 10 //Initialize the default number of loops, can be set in the formTo, the default is infinite\
			    width: 300, //Note that hidden elements can't get the width, so in special cases you need to specify the width\
			    height: 300,\
          _iw: 300, // The width of a single image in a sprite\
          _ih: 300, // The height of a single image in a sprite\
          framesCount: 10 // Sprite frame number\
               	}

## API

### CanvasKeyFrames(el, type, imgs, options)

- `el` canvas container,must be a DOM object
- `type` picture mode，'array' and 'sprite'，Array is an array of picture objects, sprite is based on the width of the single sprite
- `imgs` Image frame object array or single image, corresponding to different modes
- `options`
  - `cover` Specify the cover frame, default is 0
  - `fps` default is 24
  - `loop` Initialize the default number of loops, can be set in the formTo, the default is infinite
  - `width` Note that hidden elements can't get the width, so in special cases you need to specify the width
  - `height` Note that hidden elements can't get the width, so in special cases you need to specify the width
  - `_iw` The width of a single image in a sprite
  - `_ih` The height of a single image in a sprite
  - `framesCount` Sprite frame number

### Install

* base

your html

```html
<script src="canvas-keyframes.js"></script>

```

* npm

```bash
npm i canvaskeyframes
```

your app.js

```javascript

import CanvasKeyFrames from 'canvaskeyframes'

```


### Method introduction 

##### goto(n) Jump to a frame
##### next()  goto the next frame
##### prev()  goto the prev frame
##### fromTo(from, to, loop, callback) 
`
 from     [the start frame. default is 0]
  to       [the end frame]
  loop     [The number of loops, the default is infinite]
  callback [callback]
  `
##### toFrom(to, from, loop, callback)
`
to       [the start frame (start from high position)]
 from     [the end frame number (end from low position)]
 loop     [The number of loops, the default is infinite]
 callback [callback]
 `
##### repeatplay(from, to, loop, callback)
`
fromto  Play it again, then call back fromBack, broadcast it backwards, and then callback toBack to make a logical judgment
from     [the start frame. default is 0]
to       [the end frame]
loop     [The number of loops, the default is infinite. play direction: start->end->start...]
callback [callback]
`
##### from(from, loop, callback)
`
 from     [the start frame. default is 0]
 loop     [The number of loops, the default is infinite.]
 callback [callback]
`
##### to(to, loop, callback)
`
to       [end frame]
loop     [The number of loops, the default is infinite.]
callback [callback]
`
##### pause() pause animation
##### stop() stop animation and goto the first frame  
##### play() play from current frame, and will inherit the last attribute fromTo、from、to
##### destroy() destroy the instance


## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)



[travis-image]: https://api.travis-ci.org/wenyiweb/canvasKeyFrames.svg?branch=master
[travis-url]: https://travis-ci.org/wenyiweb/canvasKeyFrames

[npm-image]: https://img.shields.io/npm/v/canvaskeyframes.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/canvaskeyframes
