var angular = require('angular');
var ajax = require('tinyajax');
var crypto = require('crypto');

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

function ensure(scope, done) {
  done = done || function(err) { if( err ) console.error(err) };
  if( isElement(scope) ) scope = angular.element(scope).scope();
  if( !scope ) return done(new TypeError('not found scope'));
  if( !scope.$root ) return done(new TypeError('invalid scope (scope.$root not found)'));
  if( !scope.$apply ) return done(new TypeError('invalid scope (scope.$apply not found)'));
  
  if( scope.$$phase == '$apply' || scope.$$phase == '$digest' || scope.$root.$$phase == '$apply' || scope.$root.$$phase == '$digest' ) {
    done(null, scope);
  } else {
    scope.$apply(function() {
      done(null, scope);
    });
  }
}

function pack(parent, elements, done) {
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
      compile(el)(parentscope || root);
      root.$digest();
    }]);
  });
  
  done(null, elements);
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
      /*[].forEach.call(target.childNodes, function(node) {
        target.removeChild(node);
      });*/
      target.innerHTML = '';
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
      var els = [];
      [].forEach.call(target.childNodes, function(node) {
        els.push(node);
      });
      return els;
    }
  }
}

var cache = {};
function engine(defaults) {
  defaults = defaults || {};
  
  var root = function() {
    return defaults.app ? document.querySelector('[ng-app="' + defaults.app + '"]') : document.querySelector('[ng-app]');
  };
  
  return function(options, done) {
    var src = options.src;
    var html = options.html;
    var target = options.target;
    var parent = options.parent || options.parentscope;
    var controller = options.controller;
    var flat = options.flat || defaults.flat;
    var cacheid = src || crypto.createHash('md5').update(html).digest("hex");
    
    if( controller && typeof controller === 'string' ) {
      var el = document.createElement('div');
      el.setAttribute('ng-controller', controller);
      target.innerHTML = '';
      target.appendChild(el);
      target = el;
    }
    
    if( typeof parent === 'string' ) parent = document.querySelector(parent);
    
    if( !parent ) {
      if( !flat ) parent = parentelement(target);
      else parent = root();
      
      // parent 와 defaults.app 의 스코프가 다를 경우
      if( defaults.app ) {
        var appnode = document.querySelector('[ng-app="' + defaults.app + '"]');
        if( appnode !== parent && !appnode.contains(parent) ) parent = root();
      }
    }
    
    var write = function(els) {
      pack(parent, els, function(err) {
        if( err ) return done(err);
        
        var sc = scopes(target);
        if( singleton ) cache[cacheid] = {
          els: els,
          scopes: sc
        };
        done(null, sc);
      });
    }
    
    // find cache if singleton
    var singleton = options.singleton;
    if( !('singleton' in options) ) singleton = defaults.singleton;
    
    if( singleton && cache[cacheid] ) {
      return (function() {
        domutil(target).clear().append(cache[cacheid].els);
        done(null, cache[cacheid].scopes);
      })();
    } else {
      cache[cacheid] = null;
      delete cache[cacheid];
    }
    
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
  var app = options.app;
  
  var root = function() {
    return app ? document.querySelector('[ng-app="' + app + '"]') : document.querySelector('[ng-app]');
  };
  
  return function(req, res, next) {
    res.ensure = function(scope, done) {
      ensure(scope, done);
      return this;
    };
    
    res.pack = function(elements, done) {
      pack(root(), elements, done);
      return this;
    };
    
    res.scope = function(el, controller) {
      if( !arguments.length ) return scope(root());
      return scope(el, controller);
    };
    
    res.scopes = function(el) {
      return scopes(el);
    };
    
    next();
  };
};


engine.ensure = ensure;
engine.pack = pack;
engine.scope = scope;
engine.scopes = scopes;
engine.parentelement = parentelement;
engine.parentscope = parentscope;
engine.middleware = middleware;
engine.cache = cache;
engine.clearCache = function() {
  cache = {};
};

module.exports = engine;

angular.module('xRouterAngular', [])
.service('xRouterAngular', function() {
  return {
    ensure: ensure,
    pack: pack,
    scope: scope,
    scopes: scopes,
    parentelement: parentelement,
    parentscope: parentscope,
    cache: cache,
    clearCache: function() {
      cache = {};
    }
  };
});