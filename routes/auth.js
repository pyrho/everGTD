var Evernote = require('evernote').Evernote;
var config = require('../config.json');
var evernoteClient = require('../libs/evernoteClient');
var userModel = require('./../libs/userModel');
var logger = require('./../libs/logger');

// Accounts {{{
exports.register = function(req, res){
  return res.render('register');
};
exports.registerPost = function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;

  if(!username || !password || !email){
    logger.error('Invalid parameters for createUser');
    req.flash('You need to specify a valid username/passsword/email.');
    return res.redirect('/auth/createAccount');
  }

  userModel.createUser(username, password, email)
    .then(function(userData){
      if(userData.found){
        req.session.messages.push('This username already exists');
        return res.redirect('/auth/createAccount');
      }

      req.session.loggedin = true;
      req.session.userId = userData.user._id;
      logger.info('Created user with id: ' + req.session.userId);
      return res.redirect('/');
    })
    .error(function(e){
      req.flash('Internal error.');
      logger.error('Error in createUser: ' + e);
      return res.redirect('/auth/createAccount');
    });
};

module.exports.login = function(req, res){
  return res.render('login');
};

module.exports.loginPost = function(req, res){
  var username = req.body.username;
  var password = req.body.password;

  if(!username || !password){
    logger.error('Invalid parameters for login');
    req.flash('You need to specify a valid username/passsword.');
  }

  userModel.authenticateUser(username, password)
    .then(function(user){
      if(user){
        req.session.loggedin = true;
        req.session.userId = user._id;
        req.session.evernoteAccountBound = user.evernoteAccountBound;
      }
      else{
        req.flash('Invalid username/password combination');
      }
      return res.redirect('/');
    })
    .error(function(e){
      req.flash('Internal error');
      logger.error('Error in authenticateUser: ' + e);
      return res.redirect('/auth/login');
    });
};

exports.logout = function(req, res) {
  req.session.destroy();
  res.redirect('/auth/login');
};
// }}}


// Evernote OAuth {{{
exports.oauth = function(req, res) {
  var client = new Evernote.Client({
    consumerKey: config.API_CONSUMER_KEY,
    consumerSecret: config.API_CONSUMER_SECRET,
    sandbox: config.SANDBOX
  });

  var callbackUrl = 'http://localhost:3000/auth/oauth_callback';
  client.getRequestToken(callbackUrl, function(error, oauthToken, oauthTokenSecret){
    if(error) {
      req.session.error = JSON.stringify(error);
      res.redirect('/');
    }
    else {
      // store the tokens in the session
      req.session.oauthToken = oauthToken;
      req.session.oauthTokenSecret = oauthTokenSecret;

      // redirect the user to authorize the token
      res.redirect(client.getAuthorizeUrl(oauthToken));
    }
  });

};

// OAuth callback
exports.oauthCallback = function(req, res) {
  var client = new Evernote.Client({
    consumerKey: config.API_CONSUMER_KEY,
    consumerSecret: config.API_CONSUMER_SECRET,
    sandbox: config.SANDBOX
  });

  client.getAccessToken(
    req.session.oauthToken,
    req.session.oauthTokenSecret,
    req.param('oauth_verifier'),
    function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
      if(error) {
        console.log('error');
        console.log(error);
        res.redirect('/');
      } else {
        // store the access token in the session
        req.session.oauthAccessToken = oauthAccessToken;
        req.session.oauthAccessTtokenSecret = oauthAccessTokenSecret;

        userModel.bindEvernoteAccount(req.session.userId, oauthAccessToken, results.edam_userId).error(function(e){
          logger.error(e);
        }).done(function(){
          // Should sync notebooks here..
          req.session.evernoteAccountBound = true;
          res.redirect('/');
        });
      }
    });
};
// }}}


// vim: sw=2 ts=2 et
