// index.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const multer = require('multer');
const uuid = require('uuid').v4;
const { format } = require('timeago.js');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const { unlink } = require('fs-extra');

// Inicializaciones
const app = express();
require('./database');
require('./config/passport');

// Configuraciones
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'secretKey',
  resave: true,
  saveUninitialized: true
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Configuración de Multer para la carga de imágenes
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'public/img/uploads'),
  filename: (req, file, cb) => {
    cb(null, uuid() + path.extname(file.originalname));
  }
});
app.use(multer({ storage }).single('image'));

// Variables Globales
app.use((req, res, next) => {
  res.locals.format = format;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Modelos
const Image = require('./models/Image');

// Rutas principales de la aplicación

// Ruta principal para mostrar todas las imágenes
app.get('/', async (req, res) => {
  const images = await Image.find();
  res.render('index', { images });
});

// Ruta para mostrar el formulario de carga de imágenes
app.get('/upload', (req, res) => {
  res.render('upload');
});

// Ruta para procesar la carga de una nueva imagen
app.post('/upload', async (req, res) => {
  const image = new Image();
  image.title = req.body.title;
  image.description = req.body.description;
  image.filename = req.file.filename;
  image.path = '/img/uploads/' + req.file.filename;
  image.originalname = req.file.originalname;
  image.mimetype = req.file.mimetype;
  image.size = req.file.size;

  await image.save();
  res.redirect('/');
});

// Ruta para ver el perfil de una imagen específica
app.get('/image/:id', async (req, res) => {
  const { id } = req.params;
  const image = await Image.findById(id);
  res.render('imageProfile', { image }); // Asegúrate de que `imageProfile.ejs` está bien configurado
});

// Ruta para eliminar una imagen específica
app.get('/image/:id/delete', async (req, res) => {
  const { id } = req.params;
  const imageDeleted = await Image.findByIdAndDelete(id);
  await unlink(path.resolve('./src/public' + imageDeleted.path));
  res.redirect('/');
});

// Ruta para mostrar el formulario de edición de una imagen
app.get('/image/:id/edit', async (req, res) => {
  const { id } = req.params;
  const image = await Image.findById(id);
  res.render('edit', { image });
});

// Ruta para procesar la edición de una imagen
app.post('/image/:id/edit', async (req, res) => {
  const { title, description } = req.body;
  const imageId = req.params.id;

  try {
    await Image.findByIdAndUpdate(imageId, { title, description });
    res.redirect(`/image/${imageId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al editar la imagen');
  }
});

// Ruta de búsqueda
app.get('/search', async (req, res) => {
  const query = req.query.query;
  
  let images;
  if (query) {
    images = await Image.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });
  } else {
    images = await Image.find();
  }

  res.render('index', { images, query });
});

// Rutas de usuarios
app.use(require('./routes/userRoutes'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Iniciar servidor
app.listen(app.get('port'), () => {
  console.log(`Server on port ${app.get('port')}`);
});
