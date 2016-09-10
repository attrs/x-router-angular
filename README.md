# x-router-angular
> An angularjs render engine for x-router

```sh
$ npm install x-router-angular --save
```

```sh
var router = require('x-router');
var xrouterangular = require('x-router-angular');

router()
  .engine('angular', xrouterangular.engine({
    singleton: true
  }))
  .set('view engine', 'angular')
  .set('view target', '#page')
  .set('views', '/')
  .use(xrouterangular())
  .get('/', function(req, res, next) {
    res.render('sidebar.html', '#sidebar');
    res.render('page.html', function(err) {
      if( err ) return next(err);
      res.end();
    });
  });

```