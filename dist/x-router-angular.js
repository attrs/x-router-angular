!function(e,n){"object"==typeof exports&&"object"==typeof module?module.exports=n(require("angular")):"function"==typeof define&&define.amd?define("xrouterangular",["angular"],n):"object"==typeof exports?exports.xrouterangular=n(require("angular")):e.xrouterangular=n(e.angular)}(this,function(e){return function(e){function n(t){if(r[t])return r[t].exports;var o=r[t]={exports:{},id:t,loaded:!1};return e[t].call(o.exports,o,o.exports,n),o.loaded=!0,o.exports}var r={};return n.m=e,n.c=r,n.p="",n(0)}([function(e,n,r){function t(e){return"object"==typeof Node&&e instanceof Node||!("number"!=typeof e.nodeType||!e.nodeName)}function o(e){return"object"==typeof Element&&e instanceof Element||!(1!==e.nodeType||!e.tagName||"function"!=typeof e.setAttribute)}function u(e){return!(!e||"object"!=typeof e||"number"!=typeof e.length)}function c(e,n){return n=n||function(e){e&&console.error(e)},o(e)&&(e=y.element(e).scope()),e?e.$root?e.$apply?void("$apply"==e.$$phase||"$digest"==e.$$phase||"$apply"==e.$root.$$phase||"$digest"==e.$root.$$phase?n(null,e):e.$apply(function(){n(null,e)})):n(new TypeError("invalid scope (scope.$apply not found)")):n(new TypeError("invalid scope (scope.$root not found)")):n(new TypeError("not found scope"))}function l(e,n,r){if(r=r||function(e){e&&console.error(e)},!n)return r(new TypeError("missing elements"));if(t(n)&&(n=[n]),!u(n))return r(new TypeError("unknwon type of elements: "+n));if("string"==typeof e&&(el=document.querySelector(e)),!e)return r(new Error("not found parent scope element"));if(!o(e))return r(new Error("parent must be an element"));e=y.element(e);var c=e.scope(),l=e.injector();return c?l?([].forEach.call(n,function(e){e.__packed__||(e.__packed__=!0,l.invoke(["$compile","$rootScope",function(n,r){n(e)(c||r),r.$digest()}]))}),void r(null,n)):r(new Error("not found parent scope injector")):r(new Error("not found parent scope"))}function i(e,n){return"string"==typeof e&&(e=document.querySelector(e)),e?o(e)?(n&&(e=e.querySelector('*[ng-controller="'+n+'"]')),e?y.element(e).scope():null):console.error("element must be an element or selector",arguments[0]):console.error("missing element",e)}function p(e){if("string"==typeof e&&(e=document.querySelector(e)),!e)return console.error("not found element",e);if(!o(e))return console.error("element must be an element or selector",arguments[0]);var n=e.querySelectorAll("*[ng-controller]"),r=[],t=r.elements=[];return[].forEach.call(n,function(e){var n=e.getAttribute("ng-controller"),o=y.element(e).scope();r.push(o),r[n]=o,t.push(e),t[n]=e}),r}function a(e){function n(){if(!e)return null;var r=y.element(e).scope();return r?e:(e=e.parentNode,void n())}return n()}function s(e){var n=a(e);return n&&y.element(n).scope()}function f(e){return{clear:function(){return[].forEach.call(e.childNodes,function(n){e.removeChild(n)}),this},append:function(n){return n.forEach(function(n){if(3===n.nodeType){if(!n.nodeValue)return;n=document.createTextNode(n.nodeValue)}else if(1!==n.nodeType)return;e.appendChild(n)}),this},html:function(n){return e.innerHTML=n,this},contents:function(){var n=[];return[].forEach.call(e.childNodes,function(e){n.push(e)}),n}}}function d(e){e=e||{};var n=function(){return e.app?document.querySelector('[ng-app="'+e.app+'"]'):document.querySelector("[ng-app]")};return function(r,t){var o=r.src,u=r.html,c=r.target,i=r.parent,s=r.controller,d=r.flat||e.flat;if(s&&"string"==typeof s){var m=document.createElement("div");m.setAttribute("ng-controller",s),c.innerHTML="",c.appendChild(m),i=c=m}if("parent"in r||(i=e.parent,i||d||(i=a(c))),i||(i=n()),o){var y=r.singleton;if("singleton"in r||(y=e.singleton),y&&h[o])return function(){f(c).clear().append(h[o].els),t(null,h[o].scopes)}();h[o]=null,delete h[o],this.util.ajax(o,function(e,n){if(e)return t(e);var r=f(c).html(n).contents();l(i,r,function(e){if(e)return t(e);var n=p(c);y&&(h[o]={els:r,scopes:n}),t(null,n)})})}else{if(!u)return t(new Error("src or html must be defined"));var g=f(c).html(u).contents();setTimeout(function(){l(i,g,function(e){return e?t(e):void t(null,p(c))})},1)}}}function m(e){e=e||{};var n=e.app,r=function(){return n?document.querySelector('[ng-app="'+n+'"]'):document.querySelector("[ng-app]")};return function(e,n,t){n.ensure=function(e,n){return c(e,n),this},n.pack=function(e,n){return l(r(),e,n),this},n.scope=function(e,n){return arguments.length?i(e,n):i(r())},n.scopes=function(e){return p(e)},t()}}var y=r(1),h={};d.ensure=c,d.pack=l,d.scope=i,d.scopes=p,d.parentelement=a,d.parentscope=s,d.middleware=m,d.cache=h,d.clearCache=function(){h={}},e.exports=d,y.module("xRouterAngular",[]).service("xRouterAngular",function(){return{ensure:c,pack:l,scope:i,scopes:p,parentelement:a,parentscope:s,cache:h,clearCache:function(){h={}}}})},function(n,r){n.exports=e}])});