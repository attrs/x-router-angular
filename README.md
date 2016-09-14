# x-router-angular
angularjs view engine for x-router

## Install

```sh
$ npm install x-router-angular --save
```

```sh
$ bower install x-router-angular
```

## Usage
- See [`example`](./examples/vanilla)
- See [`example (browserify)`](./examples/browserify)

```javascript
angular.module(...);

xrouter()
.engine('html', xrouterangular())
.set('view target', '#page')
.set('views', '/partials/')
.get('/', function(req, res, next) {
    res.render('page.html');
});
```