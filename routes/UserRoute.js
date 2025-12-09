var express = require('express');
var router = express.Router();
var app = express();
var userController = require('../controllers/UserController')

//---- 5/22 Session Add ----
var commonController = require('../controllers/CommonController.js')

console.log('START USER ROUTES');

// メニュー関連
router.post('/menu', userController.doMenu);
router.get('/menu', userController.menuByGet);

// ユーザー管理画面
router.get('/admin', userController.showAdminPage);

// ユーザー管理 API
router.get('/api/users', userController.getAllUsersAPI);
router.post('/api/users', userController.createUserAPI);
router.put('/api/users/:id', userController.updateUserAPI);
router.delete('/api/users/:id', userController.deleteUserAPI);

app.use(express.static('views/css'));
app.use(express.static('views/js'));
app.use(express.static('views/images'));

module.exports = router;