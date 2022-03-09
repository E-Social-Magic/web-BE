import multer from "multer";
import path from "path";
const __dirname = path.resolve();

// SET STORAGE
export const storageImages = multer.diskStorage({
  destination: function (req, file, done) {
    done(null, 'public/uploads/')
  },
  filename: function (req, file, done) {
    done(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});

export const fileFilter = (req, file, cb) => {
  if ((file.mimetype).includes('jfif') || (file.mimetype).includes('jpeg') || (file.mimetype).includes('png') || (file.mimetype).includes('jpg') || (file.mimetype).includes('mp4')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
