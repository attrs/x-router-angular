var angular = require('angular');
var ajax = require('tinyajax');
var md5 = require('md5');
var series = require('async-each-series');
var ie = require('detectie')();
var $ = angular.element;

function isNode(node) {
  if( typeof Node === 'object' && node instanceof Node ) return true;
  if( typeof node.nodeType === 'number' && node.nodeName ) return true;
  return false;
}

function isElement(node) {
  if( !node || typeof node != 'object' ) return false;
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

function inject(scope, injector, elements, done) {
  series([].slice.call(elements), function(el, done) {
    if( el.__packed__ ) return done();
    
    el.__packed__ = true;
    injector.invoke(['$compile', '$rootScope', '$timeout', function(compile, root, timeout) {
      compile(el)(scope);
      
      timeout(function() {
        root.$digest();
        done();
      }, 0);
    }]);
  }, function() {
    setTimeout(function() {
      done && done();
    }, 0);
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
    inject: function(elements, parent, done) {
      var rootel = bootstrap();
      if( !rootel ) return console.error('[x-router-angular] module "' + app + '" is not boostrapped');
      if( !elements ) return console.error('[x-router-angular] illegal arguments, elements was null');
      if( typeof elements === 'string' ) elements = [document.querySelector(elements)];
      if( parent && typeof parent === 'string' ) parent = document.querySelector(parent);
      
      var rootscope = angular.element(rootel).scope();
      var injector = angular.element(rootel).injector();
      var scope = parent ? angular.element(parent).scope() : rootscope;
      
      inject(scope, injector, elements, done);
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
  var nodes = [];
  var scs = [];
  
  var cache = {
    get: function(id) {
      /*if( !expire || (time - cacheinfo.time) < expire ) {
        cacheinfo.time = time;
      }*/
      
      return map[id];
    },
    set: function(id, item, expire) {
      map[id] = item;
      
      [].forEach.call(item.nodes, function(node) {
        nodes.push(node);
      });
      
      [].forEach.call(item.scopes, function(scope) {
        scs.push(scope);
      });
      
      return this;
    },
    exists: function(scope) {
      return !!~scs.indexOf(scope);
    },
    remove: function(id) {
      var item = map[id];
      
      if( item ) {
        [].forEach.call(item.nodes, function(node) {
          nodes.splice(nodes.indexOf(node), 1);
        });
      
        [].forEach.call(item.scopes, function(scope) {
          try {
            scope.$destroy();
          } catch(e) {}
          scs.splice(scs.indexOf(scope), 1);
        });
      
        delete map[id];
      }
      
      return this;
    },
    clear: function() {
      for(var k in map) cache.remove(k);
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
    var expire = +options.expire;
    var reset = options.reset;
    var time = new Date().getTime();
    var sync = options.sync === true ? true : (defaults.sync === true ? true : false);
    
    if( !('cache' in options) && !('singleton' in options) )
      usecache = defaults.cache || defaults.singleton;
    
    if( ie && ie <= 11 ) usecache = false;
    
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
    
    // find cache if usecache
    if( !reset && usecache && cache.get(cacheid) ) {
      return (function(item) {
        target.innerHTML = '';
        $(target).append(item.nodes);
        done(null, item.scopes);
      })(cache.get(cacheid));
    }
    
    // load
    var write = function(html) {
      cache.remove(cacheid);
      
      // 현재 스코프 destroy
      scopes(target).forEach(function(scope) {
        if( cache.exists(scope) ) return;
        try {
          scope && scope.$destroy();
        } catch(e) {}
      });
      
      // html element 화
      var tmp = document.createElement('div');
      var nodes = $(tmp).html(html).contents();
      var scs;
      
      // inject
      util.inject(nodes, parent, function() {
        if( !sync ) {
          target.innerHTML = '';
          $(target).append(nodes);
          done(null, scs);
        }
      });
      
      scs = scopes(tmp);
      
      if( usecache ) {
        cache.set(cacheid, {
          nodes: nodes,
          scopes: scs
        }, expire);
      }
      
      if( sync ) {
        target.innerHTML = '';
        $(target).append(nodes);
        done(null, scs);
      }
    }
    
    if( src ) {
      ajax(src, function(err, html) {
        if( err ) return done(err);
        write(html);
      });
    } else if( html ) {
      write(html);
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

// @deprecated
angular.module('xRouterAngular', [])
.service('ensure', function() {
  console.warn && console.warn('xRouterAngular module is deprecated.');
  return safeApply;
})
.service('inject', function() {
  console.warn && console.warn('xRouterAngular module is deprecated.');
  return inject;
})
.run(['$rootScope', function(scope) {
  scope.safeApply = function(fn) {
    console.warn && console.warn('xRouterAngular/safeApply is deprecated.');
    safeApply(scope, fn);
  };
}]);