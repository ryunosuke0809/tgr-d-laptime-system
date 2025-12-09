const fs = require('fs');


console.log('START LOGIN MODEL');

module.exports = {
    getUserData: function (name, pwd) {
        return new Promise ((resolve, reject) => {
            fs.readFile('data/user.json', 'utf8', function (err, text) {
                if (err) {
                    reject(err);
                    return;
                }
                userList = JSON.parse(text);
                // パスワードが空の場合は、IDのみでチェック（ロール確認用）
                var userData;
                if (pwd === '') {
                    userData = userList.find((v) => v.id == name);
                } else {
                    userData = userList.find((v) => v.id == name && v.password == pwd);
                }
                
                if (userData == undefined) {
                    resolve("NG");
                } else {
                    resolve(userData);
                }
            });            
        });
    },

   getUserInfo: function (name) {
        return new Promise ((resolve, reject) => {
            var para = [];
            para.push(name);  	
            connection.getConnection(function(err, conn){
                conn.query(sql.userInfo, para,  (err, result, fields) => {
                    conn.release();
                    if ( err ) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        });
    },

    //---- 5/27 shidara  add パスワードアップデート ----
    getUserPwdUp: function (name, old_pwd, new_pwd) {
        return new Promise ((resolve, reject) => {
            var para = [];
            para.push(new_pwd);
            para.push(name);  	
            para.push(old_pwd);
             connection.getConnection(function(err, conn){
                conn.query(sql.userPwdUp, para,  (err, result, fields) => {
                    conn.release();
                    if ( err ) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        });
    },





    
}