const fs = require('fs');


console.log('START LOGIN MODEL');

// 有効期限チェック（期間対応）
function isAccountExpired(expiryStartDate, expiryEndDate) {
    // 開始日と終了日が両方nullの場合は無期限
    if (!expiryStartDate && !expiryEndDate) {
        return false;
    }
    
    const now = new Date();
    
    // 開始日チェック
    if (expiryStartDate) {
        const startDate = new Date(expiryStartDate);
        startDate.setHours(0, 0, 0, 0);
        if (now < startDate) {
            return true; // まだ有効期間開始前
        }
    }
    
    // 終了日チェック
    if (expiryEndDate) {
        const endDate = new Date(expiryEndDate);
        endDate.setHours(23, 59, 59, 999);
        if (now > endDate) {
            return true; // 有効期間終了後
        }
    }
    
    return false; // 有効期間内
}

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
                    // 有効期限チェック（期間対応）
                    if (isAccountExpired(userData.expiryStartDate, userData.expiryEndDate)) {
                        resolve("EXPIRED");
                    } else {
                        resolve(userData);
                    }
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