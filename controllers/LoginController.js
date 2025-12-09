const express = require('express');
const loginModel = require('../models/LoginModel');
const Views = '../views/'
const msg = require('../config/msg')

console.log('START LOGIN CONTROLLER');
module.exports = {

  doInit: function (req, res, next) {
        if (req.session.username == 0 ){
          res.render(Views + 'login.ejs',{"msg":msg.session_check});
        }else{ 
          res.render(Views + 'login.ejs',{"msg":""});
        }
      }, 
    doCheck: function (req, res, next) {
    var name = req.body.username;
    var pwd = req.body.password;
    	    	
    loginModel.getUserData(name, pwd).then((result) => {
    if( result == "NG" ) {
      res.render(Views + 'login.ejs',{"msg": msg.login_check});
    } else {
      req.session.username = name;
      res.render(Views + 'user_menu.ejs',{"session-id": req.session.username});
    }
    });
  }
  
  
}

