var express = require('express');
var router = express.Router();
var app = express();
var userController = require('../controllers/UserController')

//---- 5/22 Session Add ----
var commonController = require('../controllers/CommonController.js')

console.log('START USER ROUTES');
router.post('/menu', userController.doMenu);
//router.get('/menu', userController.doMenu);

router.get('/menu', userController.menuByGet);

app.use(express.static('views/css'));
app.use(express.static('views/js'));
app.use(express.static('views/images'));

module.exports = router;