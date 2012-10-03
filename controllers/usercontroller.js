module.exports = function (app, service) {
  var model = service.useModel('user'),
      passport = require('passport'),
      LocalStrategy = require('passport-local').Strategy;

  app.get('/register', function(req, res) {
    res.render('users/register', { user: req.user });
  });

  app.post('/register', function(req, res) {
    var user = new model.User();
    user.email = req.param('email');
    user.hashword = req.param('password');
    user.save(function(err) {
      if (err) {
        console.log(err);
        console.trace();
      }
      res.redirect('/login');
    });
  });

  app.get('/login', function(req, res) {
    var returnUrl = req.param('returnUrl');
    console.log(returnUrl);
    res.render('users/login', { user: req.user, returnUrl: returnUrl });
  });

  app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
    var returnUrl = req.param('returnUrl');
    console.log(returnUrl);
    if (returnUrl && returnUrl !== 'undefined')
      res.redirect(returnUrl);
    else
      res.redirect('/');
  });

  app.get('/logout', function(req, res) {
    req.logOut();
    res.redirect('/');
  });

  passport.use(new LocalStrategy(function(username, password, done) {
    model.User.findOne({ email: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false, { message: 'Unknown user' }); }
      if (user.hashword !== password) { return done( null, false, { message: 'Invalid Password' }); }
      return done(null, user);
    });
  }));

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    model.User.findById(id, function(err, user) {
      done(err, user);
    });
  });

};