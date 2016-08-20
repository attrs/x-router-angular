# x-router-angular
> An angularjs renderer middleware for x-router (browser)

```sh
$ npm install x-router-angular --save
```

```sh
var angularrenderer = require('x-router-angular');
var router = require('x-router');
var path = require('path');

router.use(angularrenderer({defaultTarget:'#default-target-element'}))
.get('/a', function(req, res, next) {
    res.render(path.join(__dirname, 'partial', 'a.html'));
})
.get('/b', function(req, res, next) {
    res.render({
        html: require('./partial/b.html')
    });
})
.get('/c', function(req, res, next) {
    res.render(path.join(__dirname, 'partial', 'c.html'));
    res.render(path.join(__dirname, 'partial', 'side.html'), { target:'#sidebar' });
});

```