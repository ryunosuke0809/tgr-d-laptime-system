var express = require('express');
var router = express.Router();
var app = express();
var loginController = require('../controllers/LoginController')

console.log('START LOGIN  ROUTES');

router.get('/init', loginController.doInit);

app.use(express.static('views/css'));
app.use(express.static('views/js'));
app.use(express.static('views/images'));

module.exports = router;
