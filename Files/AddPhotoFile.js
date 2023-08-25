const multer = require('multer')

const Storage1 = multer.diskStorage({
    destination: "uploads",
    filename: function (req, file, cb) {
        cb(null, file.originalname)
      }
})
const uploads = multer({
    storage: Storage1
})
const photoUpload = uploads.fields([{name: 'photo'}])
module.exports = photoUpload;