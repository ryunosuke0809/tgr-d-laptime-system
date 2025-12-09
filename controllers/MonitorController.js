require('date-utils');
const iconv = require("iconv-lite");
const fs = require('fs');
const express = require('express');
const msg = require('../config/msg')
const monitorModel = require('../models/MonitorModel');
const loginModel = require('../models/LoginModel');
const Views = '../views/'

console.log('START MONITOR  CONTROLLER');
module.exports = {
    doView: function (req, res, next) {
        //console.log(req.headers['user-agent']);
        var ua = req.headers['user-agent'];
        if (ua.indexOf('iPhone') > -1 || (ua.indexOf('Android') > -1 && ua.indexOf('Mobile') > -1)) {
            res.render(Views + 'trd_sp.ejs'); //smartphonen
        } else {
            res.render(Views + 'trd.ejs'); //PC
        }
    },
    doHeader: function (req, res, next) {
        res.render(Views + 'header.ejs');
    },
    doHeader_sp: function (req, res, next) {
        res.render(Views + 'header_sp.ejs');
    },
    doLive: function (req, res, next) {
        res.render(Views + 'live.ejs');
    },
    doLive_sp: function (req, res, next) {
        res.render(Views + 'live_sp.ejs');
    },
    doTrack: function (req, res, next) {
        res.render(Views + 'track_fsw.ejs');
    },
    doGap: function (req, res, next) {
        res.render(Views + 'personal.ejs', { "carno": req.query.carno, "team_j": req.query.team_j });
    },
    viewLive: function (req, res) {
        res.render(Views + 'live.ejs', {
            wsUri: req.query.ws,
            sector: req.query.sector,
            speed: req.query.speed,
            circuit: req.query.circuit,
            token: req.query.token,
            uid: req.query.u,
            sid: req.query.s,
            username: req.query.name || req.session.username || ''
        });
    }





}

