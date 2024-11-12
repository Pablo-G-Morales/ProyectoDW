// src/routes/userRoutes.js
const { Router } = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = Router();

// Ruta para mostrar el formulario de registro
router.get('/users/register', (req, res) => {
  res.render('register', { errors: [] });
});

// Ruta para procesar el registro de usuario
router.post('/users/register', async (req, res) => {
  const { username, email, password, confirm_password } = req.body;
  const errors = [];

  // Validación de los campos
  if (!username || !email || !password || !confirm_password) {
    errors.push({ text: 'Por favor, completa todos los campos' });
  }

  // Validación de las contraseñas
  if (password !== confirm_password) {
    errors.push({ text: 'Las contraseñas no coinciden' });
  }
  if (password.length < 6) {
    errors.push({ text: 'La contraseña debe tener al menos 6 caracteres' });
  }

  if (errors.length > 0) {
    return res.render('register', { errors, username, email });
  } else {
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        req.flash('error_msg', 'El email ya está registrado');
        return res.redirect('/users/register');
      }

      const newUser = new User({ username, email, password });
      // Encriptar la contraseña
      newUser.password = await bcrypt.hash(password, 10);
      await newUser.save();

      req.flash('success_msg', 'Registro exitoso. Puedes iniciar sesión ahora.');
      res.redirect('/users/login');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Hubo un error durante el registro');
      res.redirect('/users/register');
    }
  }
});

// Ruta para mostrar el formulario de login
router.get('/users/login', (req, res) => {
  res.render('login');
});

// Ruta para procesar el login con Passport Local Strategy
router.post('/users/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',          // Redirige al home en caso de éxito
    failureRedirect: '/users/login', // Redirige al login en caso de error
    failureFlash: true             // Permite mostrar mensajes de error
  })(req, res, next);
});

// Ruta para inicio de sesión con Google
router.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

// Callback de Google
router.get('/auth/google/callback', 
  passport.authenticate('google', {
    successRedirect: '/',             // Redirige al home en caso de éxito
    failureRedirect: '/users/login',  // Redirige al login en caso de error
    failureFlash: true
  })
);

// Ruta para cerrar sesión
router.get('/users/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success_msg', 'Has cerrado sesión');
    res.redirect('/users/login');
  });
});

// Ruta para mostrar el perfil de usuario
router.get('/users/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error_msg', 'Debes iniciar sesión para ver tu perfil');
    return res.redirect('/users/login');
  }
  res.render('profile', { user: req.user });
});

module.exports = router;
