// middlewares/auth.js
module.exports = {
    isAuthenticated: function(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      req.flash('error_msg', 'No autorizado');
      res.redirect('/users/login');
    }
  };
  