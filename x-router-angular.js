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
function render(options, done) {
  done = done || function(err) { if( err ) console.error(err) };
  if( !options ) return done(new Error('missing options'));
  if( !options.src ) return done(new Error('missing src'));
  if( !options.target ) return done(new Error('missing target'));
  
  var src = options.src;
  var controller = options.controller;
  var target = options.target;
  var targetel = document.querySelector(target);
  var onload = options.onload;
  var onrender = options.onrender;
  //console.log('parentscope', src, parent, angular.element(parent).scope());
  
  if( !targetel ) return done(new TypeError('cannot find target:' + target));
  if( controller && typeof controller !== 'string' ) return done(new TypeError('controller must be a string'));
  if( options.singleton && cache[src] ) {
    var els = cache[src];
    targetel.innerHTML = '';
    [].forEach.call(els, function(node) {
      targetel.appendChild(node);
    });
    
    onrender && onrender(null, els);
    return done(null, targetel, els);
  }
  
  var parent = options.parent || parentScopeElement(targetel);
  function render(els) {
    if( controller ) [].forEach.call(els, function(node) {
      if( isElement(node) && !node.hasAttribute('ng-controller') )
        node.setAttribute('ng-controller', controller);
    })
    
    pack(parent, els, function(err) {
      if( err ) return done(err);
      
      targetel.innerHTML = '';
      [].forEach.call(els, function(node) {
        targetel.appendChild(node);
      });
      
      onrender && onrender(null, els);
      done(null, targetel, els);
      
      if( options.singleton ) cache[src] = els;
    });
  }
  
  if( typeof src === 'string' ) ajax(src, function(err, html) {
    if( err ) return done(err), onload && onload(err);
    var els = evalhtml(html);
    onload && onload(null, els);
    render(els);
  });
  else if( isNode(src) ) render([src]);
  else if( isArrayLike(src) ) render(src);
  else return done(new TypeError('unknwon type of src: ' + src));
}

function renderer(options) {
  options = options || {};
  
  var base = options.base || '/';
  var app = options.app;
  var defaults = options.defaults || {};
  
  return function(req, res, next) {
    var root = app ? document.querySelector('[ng-app="' + app + '"]') : document.querySelector('[ng-app]');
  
    res.apply = function(scope, done) {
      apply(scope, done);
      return this;
    };
    
    res.pack = function(elements, done) {
      pack(root, elements, function(err, elements) {
        if( err ) return done(err);
        defaults.onpack && defaults.onpack(null, elements);
      });
      return this;
    };
    
    res.scope = function(el, controller) {
      if( !el ) el = root;
      if( !el ) return null;
      return scope(el, controller);
    };
    
    res.render = function(src, target, done) {
      done = done || function(err) { if( err ) console.error(err) };
      
      var options = {};
      for(var k in defaults) options[k] = defaults[k];
      
      if( !src ) return done(new TypeError('missing src'));
      else if( typeof src === 'object' ) for(var k in src) options[k] = src[k];
      else if( typeof src === 'string' ) options.src = src;
      if( typeof target === 'function' ) done = target, target = null;
      else if( typeof target === 'string' ) options.target = target;
      else if( typeof target === 'object' ) for(var k in target) options[k] = target[k];
      
      options.src = path.join(base, options.src);
      render(options, done);
      return this;
    };
    
    next();
  };
};

renderer.apply = apply;
renderer.pack = pack;
renderer.scope = scope;
renderer.render = render;
module.exports = renderer;