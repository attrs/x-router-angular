/*!
* x-router-angular
* https://github.com/attrs/x-router-angular
*
* Copyright attrs and others
* Released under the MIT license
* https://github.com/attrs/x-router-angular/blob/master/LICENSE
*/
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("angular"));
	else if(typeof define === 'function' && define.amd)
		define("xrouterangular", ["angular"], factory);
	else if(typeof exports === 'object')
		exports["xrouterangular"] = factory(require("angular"));
	else
		root["xrouterangular"] = factory(root["angular"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	var angular = __webpack_require__(1);
	var ajax = __webpack_require__(2);
	var md5 = __webpack_require__(3);

	function isNode(node) {
	  if( typeof Node === 'object' && node instanceof Node ) return true;
	  if( typeof node.nodeType === 'number' && node.nodeName ) return true;
	  return false;
	}

	function isElement(node) {
	  if( typeof Element === 'object' && node instanceof Element ) return true;
	  if( node.nodeType === 1 && node.tagName && typeof node.setAttribute === 'function' ) return true;
	  return false;
	}

	function isArrayLike(o) {
	  if( o && typeof o === 'object' && typeof o.length === 'number' ) return true;
	  return false;
	}

	function safeApply(scope, done) {
	  done = done || function(err) { if( err ) console.error(err) };
	  if( isElement(scope) ) {
	    scope = angular.element(scope).scope();
	    if( !scope ) return done(new TypeError('not found scope'));
	  }
	  
	  var phase = (scope.$root || scope).$$phase;
	  if(phase == '$apply' || phase == '$digest') scope.$eval(function() {
	    done(null, scope);
	  });
	  else scope.$apply(function() {
	    done(null, scope);
	  });
	}

	/* deprecated */
	function pack(parent, elements, done) {
	  console.warn('[x-router-angular] pack is deprecated, use inject(scope, injector, elements) instead');
	  done = done || function(err) { if( err ) console.error(err) };
	  if( !elements ) return done(new TypeError('missing elements'));
	  if( isNode(elements) ) elements = [elements];
	  if( !isArrayLike(elements) ) return done(new TypeError('unknwon type of elements: ' +  elements));
	  
	  if( typeof parent === 'string' ) el = document.querySelector(parent);
	  if( !parent ) return done(new Error('not found parent scope element'));
	  if( !isElement(parent) ) return done(new Error('parent must be an element'));
	  
	  parent = angular.element(parent);
	  var parentscope = parent.scope();
	  var injector = parent.injector();
	  
	  if( !parentscope ) return done(new Error('not found parent scope'));
	  if( !injector ) return done(new Error('not found parent scope injector'));
	  
	  [].forEach.call(elements, function(el) {
	    if( el.__packed__ ) return;
	    el.__packed__ = true;
	    
	    injector.invoke(['$compile', '$rootScope', function(compile, root) {
	      console.log('compile', parentscope, parentscope.$root, root);
	      compile(el)(parentscope);
	      root.$digest();
	    }]);
	  });
	  
	  done(null, elements);
	}

	function inject(scope, injector, elements) {
	  [].forEach.call(elements, function(el) {
	    if( el.__packed__ ) return;
	    el.__packed__ = true;
	    
	    injector.invoke(['$compile', '$rootScope', function(compile, root) {
	      compile(el)(scope);
	      root.$digest();
	    }]);
	  });
	}

	function scope(el, controller) {
	  if( typeof el === 'string' ) el = document.querySelector(el);
	  if( !el ) return console.error('missing element', el);
	  if( !isElement(el) ) return console.error('element must be an element or selector', arguments[0]);
	  if( controller ) el = el.querySelector('*[ng-controller=\"' + controller + '\"]');
	  if( !el ) return null;
	  //if( !el.hasAttribute('ng-app') && !el.hasAttribute('ng-controller') ) el = el.querySelector('*[ng-controller]');
	  //if( !el ) return console.error('not found scoped element', arguments[0]);
	  
	  return angular.element(el).scope();
	}

	function scopes(el) {
	  if( typeof el === 'string' ) el = document.querySelector(el);
	  if( !el ) return console.error('not found element', el);
	  if( !isElement(el) ) return console.error('element must be an element or selector', arguments[0]);
	  
	  var els = el.querySelectorAll('*[ng-controller]');
	  var scopes = [];
	  var elements = scopes.elements = [];
	  [].forEach.call(els, function(node) {
	    var controller = node.getAttribute('ng-controller');
	    var scope = angular.element(node).scope();
	    scopes.push(scope);
	    scopes[controller] = scope;
	    
	    elements.push(node);
	    elements[controller] = node;
	  });
	  return scopes;
	}

	function parentelement(el) {
	  function find() {
	    if( !el ) return null;
	    var scope = angular.element(el).scope();
	    if( scope ) return el;
	    el = el.parentNode;
	    find();
	  }
	  
	  return find();
	}

	function parentscope(el) {
	  var pel = parentelement(el);
	  return pel && angular.element(pel).scope();
	}


	function domutil(target) {
	  return {
	    clear: function() {
	      [].slice.call(target.childNodes).forEach(function(node) {
	        target.removeChild(node);
	      });
	      return this;
	    },
	    append: function(els) {
	      els.forEach(function(node) {
	        if( node.nodeType === 3 ) {
	          if( !node.nodeValue ) return;
	          node = document.createTextNode(node.nodeValue);
	        } else if( node.nodeType !== 1 ) {
	          return;
	        }
	        target.appendChild(node);
	      });
	      return this;
	    },
	    html: function(html) {
	      /*var dom = document.createElement('div');
	      dom.innerHTML = html;
	      
	      var els = [];
	      [].forEach.call(dom.childNodes, function(node) {
	        els.push(node);
	      });
	      
	      target.innerHTML = '';
	      [].forEach.call(dom.childNodes, function(node) {
	        if( node.nodeType === 3 ) {
	          if( !node.nodeValue ) return;
	          node = document.createTextNode(node.nodeValue);
	        } else if( node.nodeType !== 1 ) {
	          return;
	        }
	        target.appendChild(node);
	      });*/
	      target.innerHTML = html;
	      
	      return this;
	    },
	    contents: function() {
	      return [].slice.call(target.childNodes);
	    }
	  }
	}

	function angularutil(app) {
	  app = app || 'app';
	  
	  var root = function() {
	    return document.querySelector('[ng-app="' + app + '"]');
	  };
	  
	  var rootscope = function() {
	    return angular.element(root()).scope();
	  };
	  
	  var bootstrap = function() {
	    var rootnode = root();
	    if( !rootnode ) {
	      rootnode = document.createElement('div');
	      rootnode.setAttribute('ng-app', app);
	      rootnode.style.display = 'none';
	      angular.bootstrap(rootnode, [app]);
	      document.body.appendChild(rootnode);
	      //console.warn('[x-router-angular] module bootstrapped:', app);
	    }
	    return rootnode;
	  };
	  
	  return {
	    root: root,
	    apply: function(scope, done) {
	      if( typeof scope === 'function' ) safeApply(rootscope(), scope);
	      else safeApply(scope, done);
	      return this;
	    },
	    bootstrap: bootstrap,
	    inject: function(elements, parent) {
	      var rootel = bootstrap();
	      if( !rootel ) return console.error('[x-router-angular] module "' + app + '" is not boostrapped');
	      if( !elements ) return console.error('[x-router-angular] illegal arguments, elements was null');
	      if( typeof elements === 'string' ) elements = [document.querySelector(elements)];
	      if( parent && typeof parent === 'string' ) parent = document.querySelector(parent);
	      
	      var rootscope = angular.element(rootel).scope();
	      var injector = angular.element(rootel).injector();
	      var scope = parent ? angular.element(parent).scope() : rootscope;
	      
	      inject(scope, injector, elements);
	      return this;
	    },
	    scope: function(el, controller) {
	      var rootel = bootstrap();
	      if( !rootel ) return console.error('[x-router-angular] module "' + app + '" is not boostrapped');
	      
	      if( !arguments.length ) return scope(rootel);
	      return scope(el, controller);
	    },
	    scopes: function(el) {
	      return scopes(el);
	    }
	  };
	}

	var cache = (function() {
	  var map = {};
	  var scopes = [];
	  
	  var cache = {
	    get: function(id) {
	      return map[id];
	    },
	    set: function(id, item) {
	      map[id] = item;
	      
	      (item.scopes || []).forEach(function(scope) {
	        if( !~scopes.indexOf(scope) ) scopes.push(scope);
	      });
	      
	      return this;
	    },
	    exists: function(scope) {
	      return !!~scopes.indexOf(scope);
	    },
	    remove: function(id) {
	      var item = map[id];
	      if( item ) {
	        (item.scopes || []).forEach(function(scope) {
	          scope.$destroy();
	          if( !~scopes.indexOf(scope) ) scopes.splice(scopes.indexOf(scope), 1);
	        });
	        
	        map[id] = null;
	        delete map[id];
	      }
	      
	      return this;
	    },
	    clear: function() {
	      for(var k in map) {
	        cache.remove(k);
	      }
	      map = {};
	      scopes = [];
	      return this;
	    }
	  };
	  
	  return cache;
	})();

	function engine(defaults) {
	  defaults = defaults || {};
	  
	  var util = angularutil(defaults.app);
	  var activenodes = [];
	  
	  var gc = function() {
	    var unstaged = [];
	    activenodes.forEach(function(node) {
	      if( !document.body.contains(node) ) unstaged.push(node);
	    });
	    
	    unstaged.forEach(function(node) {
	      var scope = angular.element(node).scope();
	      if( !scope ) return;
	      
	      if( scope && !cache.exists(scope) ) {
	        activenodes.splice(activenodes.indexOf(node), 1);
	        scope.$destroy();
	      }
	    });
	  };
	  
	  return function(options, done) {
	    var src = options.src;
	    var html = options.html;
	    var target = options.target;
	    var parent = options.parent || options.parentscope;
	    var controller = options.controller;
	    var flat = options.flat || defaults.flat;
	    var cacheid = src || md5(html);
	    var root = util.bootstrap();
	    var response = options.response;
	    var usecache = options.cache || options.singleton;
	    var expire = +options.expire || 0;
	    var reset = options.reset;
	    var time = new Date().getTime();
	    
	    if( !('cache' in options) && !('singleton' in options) )
	      usecache = defaults.cache || defaults.singleton;
	    
	    if( response ) {
	      response.angular = response.angular || util;
	    }
	    
	    if( controller && typeof controller === 'string' ) {
	      var el = document.createElement('div');
	      el.setAttribute('ng-controller', controller);
	      target.innerHTML = '';
	      target.appendChild(el);
	      target = el;
	    }
	    
	    if( typeof parent === 'string' ) {
	      parent = document.querySelector(parent);
	    }
	    
	    if( !parent ) {
	      if( !flat ) parent = parentelement(target);
	      else parent = root;
	    }
	    
	    var rootscope = angular.element(root).scope();
	    var injector = angular.element(root).injector();
	    var parentscope = angular.element(parent).scope();
	    if( rootscope !== parentscope || (parentscope && parentscope.$root) !== rootscope ) {
	      parent = root;
	      parentscope = rootscope;
	    }
	    
	    var write = function(els) {
	      gc();
	      util.inject(els, parent);
	      
	      [].forEach.call(target.querySelectorAll('[ng-controller]'), function(node) {
	        activenodes.push(node);
	      });
	      
	      var sc = scopes(target);
	      if( usecache ) cache.set(cacheid, {
	        els: els,
	        scopes: sc,
	        time: time
	      });
	      
	      done(null, sc);
	    }
	    
	    // find cache if usecache
	    if( !reset && usecache && cache.get(cacheid) ) {
	      var cacheinfo = cache.get(cacheid);
	      if( !expire || (time - cacheinfo.time) < expire ) {
	        cacheinfo.time = time;
	        return (function() {
	          var els = cacheinfo.els;
	          if( !(target.children.length === els.length && target.children[0] === els[0]) ) {
	            domutil(target).clear().append(cacheinfo.els);
	          }
	        
	          done(null, cacheinfo.scopes);
	        })();
	      }
	    }
	    
	    cache.remove(cacheid);
	    
	    // load
	    if( src ) {
	      ajax(src, function(err, html) {
	        if( err ) return done(err);
	        write(domutil(target).html(html).contents());
	      });
	    } else if( html ) {
	      write(domutil(target).html(html).contents());
	    } else {
	      return done(new Error('src or html must be defined'));
	    }
	  };
	};

	function middleware(options) {
	  options = options || {};
	  
	  return function(req, res, next) {
	    res.angular = res.angular || angularutil(options.app);
	    
	    // @deprecated
	    res.ensure = res.ensure || function(scope, done) {
	      console.warn('[x-router-angular] res.ensure is deprecated, use res.angular.apply instead');
	      res.angular.apply.apply(res.angular, arguments);
	      return this;
	    };
	    
	    res.pack = res.pack || function(elements, done) {
	      console.warn('[x-router-angular] res.pack is deprecated, use res.angular.inject(elements[, parent]) instead');
	      pack(res.angular.root(), elements, done);
	      return this;
	    };
	    
	    res.scope = res.scope || function(el, controller) {
	      console.warn('[x-router-angular] res.scope is deprecated, use res.angular.scope instead');
	      return res.angular.scope.apply(res.angular, arguments);
	    };
	    
	    res.scopes = res.scopes || function(el) {
	      console.warn('[x-router-angular] res.scopes is deprecated, use res.angular.scopes instead');
	      return res.angular.scopes.apply(res.angular, arguments);
	    };
	    
	    next();
	  };
	};

	engine.middleware = middleware;
	engine.ensure = safeApply;      // @deprecated
	engine.safeApply = safeApply;
	engine.pack = pack;
	engine.scope = scope;
	engine.scopes = scopes;
	engine.parentelement = parentelement;
	engine.parentscope = parentscope;
	engine.middleware = middleware;

	module.exports = engine;

	angular.module('xRouterAngular', [])
	.service('ensure', function() { return safeApply; }) // @deprecated
	.service('inject', function() { return inject; })
	.run(['$rootScope', function(scope) {
	  scope.safeApply = function(fn) {
	    safeApply(scope, fn);
	  };
	}]);

/***/ }),
/* 1 */
/***/ (function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

	module.exports = function(src, done, options) {
	  if( !src ) throw new Error('missing src');
	  if( arguments.length == 2 && typeof done !== 'function' ) options = done, done = null;
	  if( typeof options == 'boolean' ) options = {sync:options};
	  
	  var text,
	    error,
	    sync = (options && options.sync) === true ? true : false,
	    method = (options && options.method) || 'GET';
	    scope = (options && options.scope) || this;
	  
	  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
	  xhr.open(method, src, !sync);
	  
	  if( options ) {
	    for(var k in options.headers) xhr.setRequestHeader(k, options.headers);
	    if( options.mimetype ) xhr.overrideMimeType(options.mimetype);
	  }
	  
	  xhr.onreadystatechange = function(e) {
	    if( this.readyState == 4 ) {
	      if( this.status == 0 || (this.status >= 200 && this.status < 300) ) {
	        text = this.responseText;
	        done && done.call(scope, null, text, xhr);
	      } else {
	        error = new Error('[' + this.status + '] ' + this.responseText);
	        done && done.call(scope, error, null, xhr);
	      }
	    }
	  };
	  
	  if( options && options.payload ) xhr.send(JSON.stringify(options.payload));
	  else xhr.send();
	  
	  if( error ) throw error;
	  return text;
	};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	(function(){
	  var crypt = __webpack_require__(4),
	      utf8 = __webpack_require__(5).utf8,
	      isBuffer = __webpack_require__(6),
	      bin = __webpack_require__(5).bin,

	  // The core
	  md5 = function (message, options) {
	    // Convert to byte array
	    if (message.constructor == String)
	      if (options && options.encoding === 'binary')
	        message = bin.stringToBytes(message);
	      else
	        message = utf8.stringToBytes(message);
	    else if (isBuffer(message))
	      message = Array.prototype.slice.call(message, 0);
	    else if (!Array.isArray(message))
	      message = message.toString();
	    // else, assume byte array already

	    var m = crypt.bytesToWords(message),
	        l = message.length * 8,
	        a =  1732584193,
	        b = -271733879,
	        c = -1732584194,
	        d =  271733878;

	    // Swap endian
	    for (var i = 0; i < m.length; i++) {
	      m[i] = ((m[i] <<  8) | (m[i] >>> 24)) & 0x00FF00FF |
	             ((m[i] << 24) | (m[i] >>>  8)) & 0xFF00FF00;
	    }

	    // Padding
	    m[l >>> 5] |= 0x80 << (l % 32);
	    m[(((l + 64) >>> 9) << 4) + 14] = l;

	    // Method shortcuts
	    var FF = md5._ff,
	        GG = md5._gg,
	        HH = md5._hh,
	        II = md5._ii;

	    for (var i = 0; i < m.length; i += 16) {

	      var aa = a,
	          bb = b,
	          cc = c,
	          dd = d;

	      a = FF(a, b, c, d, m[i+ 0],  7, -680876936);
	      d = FF(d, a, b, c, m[i+ 1], 12, -389564586);
	      c = FF(c, d, a, b, m[i+ 2], 17,  606105819);
	      b = FF(b, c, d, a, m[i+ 3], 22, -1044525330);
	      a = FF(a, b, c, d, m[i+ 4],  7, -176418897);
	      d = FF(d, a, b, c, m[i+ 5], 12,  1200080426);
	      c = FF(c, d, a, b, m[i+ 6], 17, -1473231341);
	      b = FF(b, c, d, a, m[i+ 7], 22, -45705983);
	      a = FF(a, b, c, d, m[i+ 8],  7,  1770035416);
	      d = FF(d, a, b, c, m[i+ 9], 12, -1958414417);
	      c = FF(c, d, a, b, m[i+10], 17, -42063);
	      b = FF(b, c, d, a, m[i+11], 22, -1990404162);
	      a = FF(a, b, c, d, m[i+12],  7,  1804603682);
	      d = FF(d, a, b, c, m[i+13], 12, -40341101);
	      c = FF(c, d, a, b, m[i+14], 17, -1502002290);
	      b = FF(b, c, d, a, m[i+15], 22,  1236535329);

	      a = GG(a, b, c, d, m[i+ 1],  5, -165796510);
	      d = GG(d, a, b, c, m[i+ 6],  9, -1069501632);
	      c = GG(c, d, a, b, m[i+11], 14,  643717713);
	      b = GG(b, c, d, a, m[i+ 0], 20, -373897302);
	      a = GG(a, b, c, d, m[i+ 5],  5, -701558691);
	      d = GG(d, a, b, c, m[i+10],  9,  38016083);
	      c = GG(c, d, a, b, m[i+15], 14, -660478335);
	      b = GG(b, c, d, a, m[i+ 4], 20, -405537848);
	      a = GG(a, b, c, d, m[i+ 9],  5,  568446438);
	      d = GG(d, a, b, c, m[i+14],  9, -1019803690);
	      c = GG(c, d, a, b, m[i+ 3], 14, -187363961);
	      b = GG(b, c, d, a, m[i+ 8], 20,  1163531501);
	      a = GG(a, b, c, d, m[i+13],  5, -1444681467);
	      d = GG(d, a, b, c, m[i+ 2],  9, -51403784);
	      c = GG(c, d, a, b, m[i+ 7], 14,  1735328473);
	      b = GG(b, c, d, a, m[i+12], 20, -1926607734);

	      a = HH(a, b, c, d, m[i+ 5],  4, -378558);
	      d = HH(d, a, b, c, m[i+ 8], 11, -2022574463);
	      c = HH(c, d, a, b, m[i+11], 16,  1839030562);
	      b = HH(b, c, d, a, m[i+14], 23, -35309556);
	      a = HH(a, b, c, d, m[i+ 1],  4, -1530992060);
	      d = HH(d, a, b, c, m[i+ 4], 11,  1272893353);
	      c = HH(c, d, a, b, m[i+ 7], 16, -155497632);
	      b = HH(b, c, d, a, m[i+10], 23, -1094730640);
	      a = HH(a, b, c, d, m[i+13],  4,  681279174);
	      d = HH(d, a, b, c, m[i+ 0], 11, -358537222);
	      c = HH(c, d, a, b, m[i+ 3], 16, -722521979);
	      b = HH(b, c, d, a, m[i+ 6], 23,  76029189);
	      a = HH(a, b, c, d, m[i+ 9],  4, -640364487);
	      d = HH(d, a, b, c, m[i+12], 11, -421815835);
	      c = HH(c, d, a, b, m[i+15], 16,  530742520);
	      b = HH(b, c, d, a, m[i+ 2], 23, -995338651);

	      a = II(a, b, c, d, m[i+ 0],  6, -198630844);
	      d = II(d, a, b, c, m[i+ 7], 10,  1126891415);
	      c = II(c, d, a, b, m[i+14], 15, -1416354905);
	      b = II(b, c, d, a, m[i+ 5], 21, -57434055);
	      a = II(a, b, c, d, m[i+12],  6,  1700485571);
	      d = II(d, a, b, c, m[i+ 3], 10, -1894986606);
	      c = II(c, d, a, b, m[i+10], 15, -1051523);
	      b = II(b, c, d, a, m[i+ 1], 21, -2054922799);
	      a = II(a, b, c, d, m[i+ 8],  6,  1873313359);
	      d = II(d, a, b, c, m[i+15], 10, -30611744);
	      c = II(c, d, a, b, m[i+ 6], 15, -1560198380);
	      b = II(b, c, d, a, m[i+13], 21,  1309151649);
	      a = II(a, b, c, d, m[i+ 4],  6, -145523070);
	      d = II(d, a, b, c, m[i+11], 10, -1120210379);
	      c = II(c, d, a, b, m[i+ 2], 15,  718787259);
	      b = II(b, c, d, a, m[i+ 9], 21, -343485551);

	      a = (a + aa) >>> 0;
	      b = (b + bb) >>> 0;
	      c = (c + cc) >>> 0;
	      d = (d + dd) >>> 0;
	    }

	    return crypt.endian([a, b, c, d]);
	  };

	  // Auxiliary functions
	  md5._ff  = function (a, b, c, d, x, s, t) {
	    var n = a + (b & c | ~b & d) + (x >>> 0) + t;
	    return ((n << s) | (n >>> (32 - s))) + b;
	  };
	  md5._gg  = function (a, b, c, d, x, s, t) {
	    var n = a + (b & d | c & ~d) + (x >>> 0) + t;
	    return ((n << s) | (n >>> (32 - s))) + b;
	  };
	  md5._hh  = function (a, b, c, d, x, s, t) {
	    var n = a + (b ^ c ^ d) + (x >>> 0) + t;
	    return ((n << s) | (n >>> (32 - s))) + b;
	  };
	  md5._ii  = function (a, b, c, d, x, s, t) {
	    var n = a + (c ^ (b | ~d)) + (x >>> 0) + t;
	    return ((n << s) | (n >>> (32 - s))) + b;
	  };

	  // Package private blocksize
	  md5._blocksize = 16;
	  md5._digestsize = 16;

	  module.exports = function (message, options) {
	    if (message === undefined || message === null)
	      throw new Error('Illegal argument ' + message);

	    var digestbytes = crypt.wordsToBytes(md5(message, options));
	    return options && options.asBytes ? digestbytes :
	        options && options.asString ? bin.bytesToString(digestbytes) :
	        crypt.bytesToHex(digestbytes);
	  };

	})();


/***/ }),
/* 4 */
/***/ (function(module, exports) {

	(function() {
	  var base64map
	      = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',

	  crypt = {
	    // Bit-wise rotation left
	    rotl: function(n, b) {
	      return (n << b) | (n >>> (32 - b));
	    },

	    // Bit-wise rotation right
	    rotr: function(n, b) {
	      return (n << (32 - b)) | (n >>> b);
	    },

	    // Swap big-endian to little-endian and vice versa
	    endian: function(n) {
	      // If number given, swap endian
	      if (n.constructor == Number) {
	        return crypt.rotl(n, 8) & 0x00FF00FF | crypt.rotl(n, 24) & 0xFF00FF00;
	      }

	      // Else, assume array and swap all items
	      for (var i = 0; i < n.length; i++)
	        n[i] = crypt.endian(n[i]);
	      return n;
	    },

	    // Generate an array of any length of random bytes
	    randomBytes: function(n) {
	      for (var bytes = []; n > 0; n--)
	        bytes.push(Math.floor(Math.random() * 256));
	      return bytes;
	    },

	    // Convert a byte array to big-endian 32-bit words
	    bytesToWords: function(bytes) {
	      for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
	        words[b >>> 5] |= bytes[i] << (24 - b % 32);
	      return words;
	    },

	    // Convert big-endian 32-bit words to a byte array
	    wordsToBytes: function(words) {
	      for (var bytes = [], b = 0; b < words.length * 32; b += 8)
	        bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
	      return bytes;
	    },

	    // Convert a byte array to a hex string
	    bytesToHex: function(bytes) {
	      for (var hex = [], i = 0; i < bytes.length; i++) {
	        hex.push((bytes[i] >>> 4).toString(16));
	        hex.push((bytes[i] & 0xF).toString(16));
	      }
	      return hex.join('');
	    },

	    // Convert a hex string to a byte array
	    hexToBytes: function(hex) {
	      for (var bytes = [], c = 0; c < hex.length; c += 2)
	        bytes.push(parseInt(hex.substr(c, 2), 16));
	      return bytes;
	    },

	    // Convert a byte array to a base-64 string
	    bytesToBase64: function(bytes) {
	      for (var base64 = [], i = 0; i < bytes.length; i += 3) {
	        var triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
	        for (var j = 0; j < 4; j++)
	          if (i * 8 + j * 6 <= bytes.length * 8)
	            base64.push(base64map.charAt((triplet >>> 6 * (3 - j)) & 0x3F));
	          else
	            base64.push('=');
	      }
	      return base64.join('');
	    },

	    // Convert a base-64 string to a byte array
	    base64ToBytes: function(base64) {
	      // Remove non-base-64 characters
	      base64 = base64.replace(/[^A-Z0-9+\/]/ig, '');

	      for (var bytes = [], i = 0, imod4 = 0; i < base64.length;
	          imod4 = ++i % 4) {
	        if (imod4 == 0) continue;
	        bytes.push(((base64map.indexOf(base64.charAt(i - 1))
	            & (Math.pow(2, -2 * imod4 + 8) - 1)) << (imod4 * 2))
	            | (base64map.indexOf(base64.charAt(i)) >>> (6 - imod4 * 2)));
	      }
	      return bytes;
	    }
	  };

	  module.exports = crypt;
	})();


/***/ }),
/* 5 */
/***/ (function(module, exports) {

	var charenc = {
	  // UTF-8 encoding
	  utf8: {
	    // Convert a string to a byte array
	    stringToBytes: function(str) {
	      return charenc.bin.stringToBytes(unescape(encodeURIComponent(str)));
	    },

	    // Convert a byte array to a string
	    bytesToString: function(bytes) {
	      return decodeURIComponent(escape(charenc.bin.bytesToString(bytes)));
	    }
	  },

	  // Binary encoding
	  bin: {
	    // Convert a string to a byte array
	    stringToBytes: function(str) {
	      for (var bytes = [], i = 0; i < str.length; i++)
	        bytes.push(str.charCodeAt(i) & 0xFF);
	      return bytes;
	    },

	    // Convert a byte array to a string
	    bytesToString: function(bytes) {
	      for (var str = [], i = 0; i < bytes.length; i++)
	        str.push(String.fromCharCode(bytes[i]));
	      return str.join('');
	    }
	  }
	};

	module.exports = charenc;


/***/ }),
/* 6 */
/***/ (function(module, exports) {

	/*!
	 * Determine if an object is a Buffer
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */

	// The _isBuffer check is for Safari 5-7 support, because it's missing
	// Object.prototype.constructor. Remove this eventually
	module.exports = function (obj) {
	  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
	}

	function isBuffer (obj) {
	  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
	}

	// For Node v0.10 support. Remove this eventually.
	function isSlowBuffer (obj) {
	  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
	}


/***/ })
/******/ ])
});
;