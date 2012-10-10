exports.index = function(req, res){
  res.render('index', { current_user: req.user });
};