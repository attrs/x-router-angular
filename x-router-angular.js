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

var container = document.createElement('div');
function evalhtml(html) {
  container.innerHTML = html;
  var children = [].slice.call(container.childNodes);
  container.innerHTML = '';
  return children;
}

function ajax(src, done) {
  if( !src ) throw new Error('missing src');
  
  var text, error;
  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  xhr.open('GET', src, true);
  xhr.onreadystatechange = function(e) {
    if( this.readyState == 4 ) {
      if( this.status == 0 || (this.status >= 200 && this.status < 300) ) done(null, this.responseText);
      else done(new Error('[' + this.status + '] ' + this.responseText));
    }
  };
  xhr.send();
}

function apply(scope, done) {
  done = done || function(err) { if( err ) console.error(err) };
  if( isNode(scope) ) scope = angular.element(scope).scope();
  if( !scope ) return done(new TypeError('not found angular scope'));
  if( !scope.$root ) return done(new TypeError('invalid angular scope (scope.$root not found)'));
  if( !scope.$apply ) return done(new TypeError('invalid angular scope (scope.$apply not found)'));
  
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
  
  if( !parent ) return done(new Error('missing parent scope element'));
  var parentElement = angular.element(parent);
  var injector = parentElement.injector();
  if( !injector ) return done(new Error('not found parent scope element'));
  
  var parentScope = parentElement.scope();
  [].forEach.call(elements, function(el) {
    if( el.__packed__ ) return;
    el.__packed__ = true;
    
    injector.invoke(['$compile', '$rootScope', function($compile, $rootScope) {
      $compile(el)(parentScope);
      $rootScope.$digest();
    }]);
  });
  
  done(null, elements);
}

function scope(el, controller) {
  if( typeof el === 'string' ) el = document.querySelector(el);
  if( !isElement(el) ) return console.error('element must be an element or selector', arguments[0]);
  if( controller ) el = el.querySelector('*[ng-controller=\"' + controller + '\"]');
  if( !el ) return console.error('not found element', arguments[0]);
  if( !el.hasAttribute('ng-app') && !el.hasAttribute('ng-controller') ) el = el.querySelector('*[ng-controller]');
  if( !el ) return console.error('not found scoped element', arguments[0]);
  
  return angular.element(el).scope();
}

function parentScopeElement(el) {
  function find() {
    if( !el ) return null;
    var scope = angular.element(el).scope();
    if( scope ) return el;
    el = el.parentNode;
    find();
  }
  
  return find();
}

var cache = {};
function render(src, options, done) {
  if( arguments.length == 2 && typeof options === 'function' ) done = options, options = null;
  done = done || function(err) { if( err ) console.error(err) };
  if( !src ) return done(new Error('missing src'));
  if( !options ) return done(new Error('missing options'));
  if( !options.target ) return done(new Error('missing target'));
  
  var singleton = options.singleton;
  var target = options.target;
  
  var doit = function(target, els, done) {
    target.innerHTML = '';
    [].forEach.call(els, function(node) {
      target.appendChild(node);
    });
    
    pack(options.parent || parentScopeElement(target), els, function(err) {
      if( err ) return done(err);
      done(null, target, els);
    });
  };
  
  if( singleton && cache[src] ) {
    doit(target, cache[src], function(err, target, els) {
      if( err ) return done(err);
      done(null, target, els);
    });
    return;
  }
  
  ajax(src, function(err, html) {
    if( err ) return done(err);
    doit(target, evalhtml(html), function(err, target, els) {
      if( err ) return done(err);
      if( singleton ) cache[src] = els;
      done(null, target, els);
    });
  });
}

function middleware(options) {
  options = options || {};
  var app = options.app;
  var defaults = options.defaults;
  
  return function(req, res, next) {
    var root = app ? document.querySelector('[ng-app="' + app + '"]') : document.querySelector('[ng-app]');
    
    res.apply = function(scope, done) {
      apply(scope, done);
      return this;
    };
    
    res.pack = function(elements, done) {
      pack(root, elements, function(err, elements) {
        if( err ) return done(err);
      });
      return this;
    };
    
    res.scope = function(el, controller) {
      if( !el ) el = root;
      if( !el ) return null;
      return scope(el, controller);
    };
    
    if( !('render' in res) ) {
      res.render = function(src, options, done) {
        if( !('singleton' in options) ) options.singleton = defaults.singleton;
        render(src, options, done);
      };
    }
    
    next();
  };
};

function engine(defaults) {
  defaults = defaults || {};
  
  return function(src, options, done) {
    if( !('singleton' in options) ) options.singleton = defaults.singleton;
    render(src, options, done);
  };
};


middleware.engine = engine;
middleware.apply = apply;
middleware.pack = pack;
middleware.scope = scope;
middleware.render = render;
module.exports = middleware;

angular.module('xRouterAngular', []).service('xRouterAngular', function() {
  return {
    apply: apply,
    pack: pack,
    scope: scope,
    render: render
  };
});