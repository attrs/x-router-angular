var path = require('path');
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
  
  if( scope.$root.$$phase != '$digest' && scope.$root.$$phase != '$apply' ) {
    scope.$apply(function() {done && done(null, scope);});
  } else {
    done && done(null, scope);
  }
}

function pack(parent, elements, done) {
  done = done || function(err) { if( err ) console.error(err) };
  if( !elements ) return done(new TypeError('missing elements'));
  if( isNode(elements) ) elements = [elements];
  if( !isArrayLike(elements) ) return done(new TypeError('unknwon type of elements: ' +  elements));

  if( typeof parent === 'string' ) el = document.querySelector(parent);
  if( !parent ) return done('not found parent scope element', parent);
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
  if( !el ) return console.error('not found element', el);
  if( !isElement(el) ) return console.error('element must be an element or selector', arguments[0]);
  if( controller ) el = el.querySelector('*[ng-controller=\"' + controller + '\"]');
  if( !el ) return console.error('not found controller', controller);
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
  [].forEach.call(els, function(node) {
    var controller = node.getAttribute('ng-controller');
    var scope = angular.element(node).scope();
    scopes.push(scope);
    scopes[controller] = scope;
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
  
  return function(src, options, done) {
    var singleton = options.singleton;
    var target = options.target;
    var parent = options.parent;
    
    if( !('singleton' in options) ) singleton = defaults.singleton;
    if( !('parent' in options) ) parent = defaults.parent;
    
    if( singleton && cache[src] ) {
      return (function() {
        var els = cache[src].els;
        var sc = cache[src].scopes;
        target.innerHTML = '';
        [].forEach.call(els, function(node) {
          target.appendChild(node);
          done(null, sc);
        });
      })();
    }
    
    this.util.ajax(src, function(err, html) {
      if( err ) return done(err);
      
      var els = this.util.evalhtml(html);
      target.innerHTML = '';
      [].forEach.call(els, function(node) {
        target.appendChild(node);
      });
      
      pack(parent || parentelement(target), els, function(err) {
        if( err ) return done(err);
        
        var sc = scopes(target);
        if( singleton ) cache[src] = {
          els: els,
          scopes: sc
        };
        done(null, sc);
      });
    });
  };
};

function middleware(options) {
  options = options || {};
  var app = options.app;
  
  return function(req, res, next) {
    var root = app ? document.querySelector('[ng-app="' + app + '"]') : document.querySelector('[ng-app]');
    
    res.ensure = function(scope, done) {
      ensure(scope, done);
      return this;
    };
    
    res.pack = function(elements, done) {
      pack(root, elements, done);
      return this;
    };
    
    res.scope = function(el, controller) {
      if( !arguments.length ) return scope(root);
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
module.exports = engine;

angular.module('xRouterAngular', [])
.service('xRouterAngular', function() {
  return {
    ensure: ensure,
    pack: pack,
    scope: scope,
    scopes: scopes,
    parentelement: parentelement,
    parentscope: parentscope
  };
});