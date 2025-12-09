const express = require('express');

const Views = '../views/'
const msg = require('../config/msg')

console.log('START COMMON CONTROLLER');
module.exports = {
  doSessionCheck: function (req, res, next) {
    var name = req.session.username;
        if (name == undefined ) {
            res.render(Views + 'session_error.ejs');
        }else {
            next();
        }
  },
}