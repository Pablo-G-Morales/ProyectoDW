// src/routes/imageRoutes.js
const { Router } = require('express');
const router = Router();
const path = require('path');
const { unlink } = require('fs-extra');

// Modelo de Imagen
const Image = require('../models/Image');

// Ruta para ver el perfil de una imagen específica
router.get('/image/:id', async (req, res) => {
  const { id } = req.params;
  const image = await Image.findById(id);
  res.render('imageProfile', { image });
});

// Ruta para editar una imagen específica
router.get('/image/:id/edit', async (req, res) => {
  const { id } = req.params;
  const image = await Image.findById(id);
  res.render('edit', { image });
});

// Ruta para eliminar una imagen específica
router.get('/image/:id/delete', async (req, res) => {
  const { id } = req.params;
  const imageDeleted = await Image.findByIdAndDelete(id);
  await unlink(path.resolve('./src/public' + imageDeleted.path));
  res.redirect('/');
});

module.exports = router;
