var path = require('path');
var angular = require('angular');

function isNode(node) {
  if( typeof Node === 'object' && node instanceof Node ) return true;
  if( typeof node.nodeType === 'number' && node.nodeName ) return true;
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


module.exports = function(options) {
  options = options || {};
  
  var base = options.base || '/';
  var parent = options.parent || document.documentElement;
  var defaultTarget = options.target || options.defaultTarget;
  var onload = options.onload;
  var onrender = options.onrender;
  var onpack = options.onpack;
  
  return function(req, res, next) {
    res.apply = function(scope, done) {
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
      
      return this;
    };
    
    res.pack = function(target, done) {
      done = done || function(err) { if( err ) console.error(err) };
      if( !target ) return done(new TypeError('missing target'));
      if( isNode(target) ) target = [target];
      if( !isArrayLike(target) ) return done(new TypeError('unknwon type of target: ' +  target));
      
      var root = angular.element(parent);
      var injector = root.injector();
      
      [].forEach.call(target, function(el) {
        if( el.__packed__ ) return;
        el.__packed__ = true;
        
        injector.invoke(function($compile, $rootScope) {
          $compile(el)($rootScope);
          $rootScope.$digest();
        });
      });
      
      onpack && onpack(null, target);
      done(null, target);
      return this;
    };
    
    res.scope = function(el) {
      if( el.length ) return angular.element(el[0]).scope();
      return angular.element(el).scope();
    };
    
    res.render = function(src, options, done) {
      done = done || function(err) { if( err ) console.error(err) };
      if( !src ) return done(new TypeError('missing src'));
      if( typeof options === 'string' ) options = {target:options};
      if( typeof options === 'function' ) done = options, options = null;
      
      options = options || {};
      var target = options.target || defaultTarget;
      var targetel = document.querySelector(target);
      if( !targetel ) return done(new Error('undefined target:' + target));
      
      function render(els) {
        res.pack(els, function(err) {
          if( err ) return done(err);
          
          targetel.innerHTML = '';
          [].forEach.call(els, function(node) {
            targetel.appendChild(node);
          });
          
          onrender && onrender(null, els);
          done(null, els);
        });
      }
      
      if( typeof src === 'string' ) ajax(path.join(base, src), function(err, html) {
        if( err ) return done(err), onload && onload(err);
        var els = evalhtml(html);
        onload && onload(null, els);
        render(els);
      });
      else if( isNode(src) ) render([src]);
      else if( isArrayLike(src) ) render(src);
      else return done(new TypeError('unknwon type of src: ' + src));
    };
    
    next();
    return this;
  };
};