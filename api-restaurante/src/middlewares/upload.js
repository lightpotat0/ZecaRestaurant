import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const formatosAceitos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (formatosAceitos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato inválido. Envie apenas JPG, PNG ou WEBP.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;