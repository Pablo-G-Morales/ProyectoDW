// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  googleId: { type: String }, // Campo para Google OAuth
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // No requerido si el usuario usa Google OAuth
}, { timestamps: true });

// Método para encriptar la contraseña
UserSchema.methods.encryptPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Método para comparar contraseñas
UserSchema.methods.matchPassword = async function(password) {
  if (!this.password) return false; // Si no hay contraseña (usuario de Google), retornar falso
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
