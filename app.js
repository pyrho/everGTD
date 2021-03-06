// Module dependencies
var express = require('express'),
    mainRoutes = require('./routes'),
    authRoutes = require('./routes/auth'),
    taskRoutes = require('./routes/tasks'),
    http = require('http'),
    MongoStore = require('connect-mongo')(express),
    path = require('path');

var app = express();

// Configurations
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.set('layout', 'layout');
  app.enable('view cache');
  app.engine('html', require('hogan-express'));
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('secret'));
  app.use(express.session({
    secret: 'mwwaahhaahha this is very secret indeed ! 25',
    store: new MongoStore({
      db: 'everGTD'
    })
  }));

  app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
  });

  app.use(function(req, res, next) {
    var session = req.session;
    var messages = session.messages || (session.messages = {});

    req.flash = function(type, message) {
      if(messages.hasOwnProperty(type)){
        messages[type].push(message);
      }
      else{
        messages[type] = [message];
      }
    };
    res.locals.messages = req.session.messages;
    req.session.messages = {};
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
  if(req.session.loggedin){
    next();
  }
  else{
    res.redirect('/auth/login');
  }
}

// Routes {{{
app.get('/', restrict, mainRoutes.index);


// Auth
app.get('/auth/login', authRoutes.login);
app.post('/auth/login', authRoutes.loginPost);

app.get('/auth/logout', restrict, authRoutes.logout);

app.get('/auth/register', authRoutes.register);
app.post('/auth/register', authRoutes.registerPost);
//  Evernote
app.get('/auth/oauth', restrict, authRoutes.oauth);
app.get('/auth/oauth_callback', restrict, authRoutes.oauthCallback);

// Tasks
app.get('/tasks/syncNotebooks', restrict, taskRoutes.syncNotebooks);
app.get('/tasks/view/nextActions', restrict, taskRoutes.viewNextActions);
app.get('/tasks/moveUp/:noteGuid', restrict, taskRoutes.moveUp);
app.get('/tasks/moveDown/:noteGuid', restrict, taskRoutes.moveDown);
app.get('/tasks/deleteCachedNotes', restrict, taskRoutes.deleteCache);
// }}}

// Run
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// vim: sw=2 ts=2 et
