const multer = require('multer')
const storage = multer.memoryStorage()

const singleUpload = multer({storage}).single('image')
const uploads = multer({storage}).any()

module.exports = {singleUpload, uploads}