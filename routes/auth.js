var Evernote = require('evernote').Evernote;
var config = require('../config.json');
var UserModel = require('./../model/userModel');
var logger = require('./../libs/logger');
var utils = require('./../utils');


// Accounts {{{
function register(req, res){
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;
  UserModel.findByUsername(username)
    .then(function(user){
      if(user){
        req.flash('error', 'This username is already registered');
        return res.redirect('/auth/register');
      }
      var newUser = new UserModel();
      newUser.test();
      newUser.setDataOnAccountCreation(username, email, password)
        .then(function(){
          console.log('Account created!');
          return res.redirect('/auth/login');
        });
    });
}


function login(req, res){
  var username = req.body.username;
  var password = req.body.password;

  if(!username || !password){
    logger.error('Invalid parameters for login');
    req.flash('error', 'You need to specify a valid username/passsword.');
  }

  UserModel.checkAuthentication(username, password)
    .then(function(user){
      if(!user){
        req.flash('error', 'Wrong username/password combination');
        return res.redirect('/auth/login');
      }
      console.log(user._id);
      req.session.userId = user._id;
      return res.redirect('/');
    })
    .error(function(e){
      req.flash('error', 'Internal error');
      logger.error('Error in authenticateUser: ' + e);
      return res.redirect('/auth/login');
    });
}

function logout(req, res) {
  req.session.destroy();
  res.redirect('/auth/login');
}
// }}}


// Evernote OAuth {{{
function oauth(req, res) {
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

}

// OAuth callback
function oauthCallback(req, res) {
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

        if(!req.session.userId){
          throw new Error('This should never happen, we should have a user at this point');
        }
        UserModel.getUserById(req.session.userId)
          .then(function(user){
            user.bindEvernoteAccount(oauthAccessToken, results.edam_userId)
              .then(function(){
                // Should sync notebooks here..
                return res.redirect('/');
              })
              .error(function(e){
                req.flash('error', 'Internal error');
                logger.error('Cant bind evernote account, mongo error: ' + e);
                return res.redirect('/');
              });
          });
      }
    });
}

// }}}

var auth = exports;
var publicFunctions = [
  login,
  register,
  logout,
  oauth,
  oauthCallback
];

utils.registerModuleFunctions(auth, publicFunctions);

// vim: sw=2 ts=2 et
