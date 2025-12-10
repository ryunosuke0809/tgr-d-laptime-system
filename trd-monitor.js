var express = require('express');
var ejs = require('ejs');
var app = express();

console.log('[SyncTest] trd-monitor.js loaded at', new Date().toISOString());

var bodyParser = require('body-parser');

var monitor_route = require('./routes/MonitorRoute');
var login_route = require('./routes/LoginRoute');
var user_route = require('./routes/UserRoute');
var session = require('express-session')

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    //maxage: 1000 * 60 * 30
  }
}));

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());


app.use("/css", express.static(__dirname + "/views/css"));
app.use("/js", express.static(__dirname + "/views/js"));
app.use("/images", express.static(__dirname + "/views/images"));
app.use("/font", express.static(__dirname + "/views/font"));
app.use("/jquery", express.static(__dirname + "/views/jquery"));
app.use("/lib", express.static(__dirname + "/views/lib"));

app.use('/login', login_route);
app.use('/monitor', monitor_route);
app.use('/user', user_route);

//テンプレートエンジンの指定
app.engine('ejs', ejs.renderFile);


app.get("/", function (req, res) {
  res.render('../views/login.ejs', {});
});

app.get('/monitor/live', (req, res) => {
  const { ws, sector, speed, circuit } = req.query;
  res.render('monitor/live', {
    title: 'TGR-D Timing Monitor',
    headerLabel: 'Practice2 - LIVE',
    wsUri: ws || 'ws://www.racelive.jp:8061/get',
    sector: sector || '3',
    speed: speed || 'ON',
    circuit: circuit || 'fsw',
    backTo: '/monitor/'      // ← 戻るボタンのフォールバック先（このメニューページのパス）
  });
});

// Direct access routes (without session check for development)
app.get('/timingmonitor', (req, res) => {
  res.render('../views/timingmonitor.ejs', {});
});

app.get('/track_fsw', (req, res) => {
  res.render('../views/track_fsw.ejs', {});
});

app.get('/track_temp', (req, res) => {
  res.render('../views/track_temp.ejs', {});
});

app.get('/live', (req, res) => {
  res.render('../views/live.ejs', {});
});

var server = app.listen(3000, function () {
  console.log('サーバを起動しました on http://localhost:3000');
});
