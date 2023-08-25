const multer = require('multer')

const Storage2 = multer.diskStorage({
    destination: "uploads",
    filename: function (req, file, cb) {
        cb(null, file.originalname)
      }
})
const uploads = multer({
    storage: Storage2
})
const profileUpload = uploads.fields([{name: 'photo'}])
module.exports = profileUpload;