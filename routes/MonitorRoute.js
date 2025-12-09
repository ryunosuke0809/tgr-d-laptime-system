var express = require('express');
var router = express.Router();
var app = express();
var monitorController = require('../controllers/MonitorController')
var commonController = require('../controllers/CommonController.js')
console.log('START MOITOR  ROUTES');

router.get('/view', commonController.doSessionCheck, monitorController.doView);
router.post('/view', commonController.doSessionCheck, monitorController.doView);
router.get('/header', commonController.doSessionCheck, monitorController.doHeader);
router.post('/header', commonController.doSessionCheck, monitorController.doHeader);
router.get('/header_sp', commonController.doSessionCheck, monitorController.doHeader_sp);
router.post('/header_sp', commonController.doSessionCheck, monitorController.doHeader_sp);
router.get('/live', commonController.doSessionCheck, monitorController.doLive);
router.post('/live', commonController.doSessionCheck, monitorController.doLive);
router.get('/live_sp', commonController.doSessionCheck, monitorController.doLive_sp);
router.post('/live_sp', commonController.doSessionCheck, monitorController.doLive_sp);
router.get('/track_fsw', commonController.doSessionCheck, monitorController.doTrack);
router.post('/track_fsw', commonController.doSessionCheck, monitorController.doTrack);
router.get('/gap', commonController.doSessionCheck, monitorController.doGap);
router.post('/gap', commonController.doSessionCheck, monitorController.doGap);
router.get('/live', commonController.doSessionCheck, function (req, res) {
    monitorController.viewLive(req, res);
    monitorController.viewLive(req, res, {
        username: req.query.name || req.session.username || ''
    });
});

app.use(express.static('views/css'));
app.use(express.static('views/js'));
app.use(express.static('views/images'));
app.use(express.static('views/font'));

module.exports = router;
