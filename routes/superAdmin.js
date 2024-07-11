const {Router} = require('express')
const { createAdmin } = require('../controllers/superAdminController')
const { singleUpload } = require('../middleware/multer')
const router = Router()

router.post('/createAdmin', singleUpload, createAdmin)

module.exports = router