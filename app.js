// Module dependencies
var express = require('express'),
    RedisStore = require('connect-redis')(express),
    redis = require("redis").createClient(),
    mainRoutes = require('./routes'),
    authRoutes = require('./routes/auth'),
    taskRoutes = require('./routes/tasks'),
    http = require('http'),
    config = require("./config"),
    path = require('path');

var app = express();

// Configurations
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('secret'));
  app.use(express.session({
    secret: "mwwaahhaahha this is very secret indeed ! 25",
    store: new RedisStore({
      "host": config.redis.host, port: config.redis.port, client: redis
    })
  }));
  app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
  });

  app.use(app.router);
  app.use(require('less-middleware')({src: __dirname + '/public'}));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


function restrict(req, res, next){
  if(req.session.oauthAccessToken){
    next();
  }
  else{
    req.session.error = 'Access Denied!';
    res.redirect("/auth/oauth");
  }
};

// Routes
app.get('/', mainRoutes.index);


// Auth
app.get('/auth/oauth', authRoutes.oauth);
app.get('/auth/oauth_callback', authRoutes.oauth_callback);
app.get('/auth/logout', authRoutes.logout);

// Tasks
app.get('/tasks/view/nextActions', restrict, taskRoutes.viewNextActions);

// Run
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// vim: sw=2 ts=2 et
