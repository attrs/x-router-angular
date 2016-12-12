var angular = require('angular');

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
    var parent = options.parent;
    var controller = options.controller;
    var flat = options.flat || defaults.flat;
    
    
    if( controller && typeof controller === 'string' ) {
      var el = document.createElement('div');
      el.setAttribute('ng-controller', controller);
      
      target.innerHTML = '';
      target.appendChild(el);
      //pack(parent || parentelement(target) || root(), el);
      parent = target = el;
    }
    
    if( !('parent' in options) ) {
      parent = defaults.parent;
      if( !parent && !flat ) parent = parentelement(target);
    }
    
    if( !parent ) parent = root();
    
    // load
    if( src ) {
      var singleton = options.singleton;
      if( !('singleton' in options) ) singleton = defaults.singleton;
      
      if( singleton && cache[src] ) {
        return (function() {
          target.innerHTML = '';
          [].forEach.call(cache[src].els, function(node) {
            try {
              target.appendChild(node);
            } catch(e) {
              console.warn('[x-router-angular] dom append error', e);
            }
          });
          done(null, cache[src].scopes);
        })();
      } else {
        cache[src] = null;
        delete cache[src];
      }
      
      this.util.ajax(src, function(err, html) {
        if( err ) return done(err);
        
        var dom = document.createElement('div');
        dom.innerHTML = html;
        
        var els = [].slice.call(dom.childNodes);
        
        target.innerHTML = '';
        els.forEach(function(node) {
          try {
            target.appendChild(node);
          } catch(e) {
            console.warn('[x-router-angular] dom append error', e);
          }
        });
        
        pack(parent, els, function(err) {
          if( err ) return done(err);
          
          var sc = scopes(target);
          if( singleton ) cache[src] = {
            els: els,
            scopes: sc
          };
          done(null, sc);
        });
      });
    } else if( html ) {
      var dom = document.createElement('div');
      dom.innerHTML = html;
        
      var els = [].slice.call(dom.childNodes);
      
      target.innerHTML = '';
      [].forEach.call(dom.childNodes, function(node) {
        try {
          target.appendChild(node);
        } catch(e) {
          console.warn('[x-router-angular] dom append error', e);
        }
      });
      
      setTimeout(function() {
        pack(parent, els, function(err) {
          if( err ) return done(err);
          done(null, scopes(target));
        });
      }, 1);
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