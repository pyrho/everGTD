// home page
exports.index = function(req, res) {
  console.log(req.session.userId);
  res.render('index');
};

// vim: sw=2 ts=2 et
