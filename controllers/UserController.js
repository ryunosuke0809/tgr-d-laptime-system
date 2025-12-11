require('date-utils');
const iconv = require("iconv-lite");
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');

const express = require('express');
//const userModel = require('../models/UserModel');
const msg = require('../config/msg')
const Views = '../views/'

const loginModel = require('../models/LoginModel');
const userModel = require('../models/UserModel');

// Multer設定：CSV/Excelアップロード用
const upload = multer({
    dest: path.join(__dirname, '../uploads/csv/'),
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedTypes.includes(file.mimetype) || 
            file.originalname.endsWith('.csv') || 
            file.originalname.endsWith('.xlsx') ||
            file.originalname.endsWith('.xls')) {
            cb(null, true);
        } else {
            cb(new Error('CSVまたはExcelファイルのみアップロード可能です'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

console.log('START USER CONTROLLER');

module.exports = {
    doMenu: function (req, res, next) {
        var name = req.body.username;
        var pwd = req.body.password;

        console.log('POST doCheck -> ' + name + ":" + pwd);

        loginModel.getUserData(name, pwd).then((result) => {
            if (result == "NG") {
                res.render(Views + 'login.ejs', { "msg": msg.login_check });
            } else if (result == "EXPIRED") {
                res.render(Views + 'login.ejs', { "msg": "アカウントの有効期限が切れています。管理者にお問い合わせください。" });
            } else {
                req.session.username = name;
                req.session.userRole = result.role || 'user';  // ← ロールをセッションに保存
                const sid = req.sessionID;
                res.render(Views + 'user_menu.ejs', {
                    id: name,
                    sid: sid,
                    role: result.role || 'user'  // ← ロールを渡す
                });
            }
            console.log("doCheck Result -> [ " + name + " : " + JSON.stringify(result) + " ]");

        });
    },
    // ====== GET /user/menu : 戻る導線（u/s 付き or 既存セッション） ======
    menuByGet: function (req, res, next) {
        const name = req.query.u;         // uid
        const sid = req.query.s || '';   // sid（署名トークン等にするのが理想）

        if (name) {
            // u/s で来た → ユーザー情報を取得してセッション補完
            loginModel.getUserData(name, '').then((result) => {
                if (result == "NG" || result == "EXPIRED") {
                    return res.redirect('/login/init');
                }
                req.session.username = name;
                req.session.sid = sid;
                req.session.userRole = result.role || 'user';
                return res.render(Views + 'user_menu.ejs', { 
                    id: name, 
                    sid: sid,
                    role: result.role || 'user'
                });
            }).catch(() => {
                return res.redirect('/login/init');
            });
            return;
        }

        // u/s なし → 既存セッションが生きていればそのまま
        if (req.session && req.session.username) {
            // セッションにロールがない場合は取得
            if (!req.session.userRole) {
                loginModel.getUserData(req.session.username, '').then((result) => {
                    if (result == "NG" || result == "EXPIRED") {
                        return res.redirect('/login/init');
                    }
                    req.session.userRole = result.role || 'user';
                    return res.render(Views + 'user_menu.ejs', {
                        id: req.session.username,
                        sid: req.session.sid || '',
                        role: result.role || 'user'
                    });
                }).catch(() => {
                    return res.redirect('/login/init');
                });
            } else {
                return res.render(Views + 'user_menu.ejs', {
                    id: req.session.username,
                    sid: req.session.sid || '',
                    role: req.session.userRole
                });
            }
            return;
        }

        // どれも無ければログインへ
        return res.redirect('/login/init');
    },

    //---- 6/1 shidara add PASSWORD change -----
    doPassChange: function (req, res, next) {
        var name = req.body.username;
        var old_pwd = req.body.old_password;
        var new_pwd = req.body.new_password;
        var check_pwd = req.body.check_password;
        //console.log('POST doPassChange -> ' + name + ":" + old_pwd + ":" + new_pwd + ":" + check_pwd);
        loginModel.getUserPwdUp(name, old_pwd, new_pwd).then((result) => {
            //console.log('pass_chenge -> ' + result);
            if (result.changedRows == 0) {
                res.render(Views + 'password_change.ejs', { "msg": msg.pwd_update_ng });
            } else {
                res.render(Views + 'login.ejs', { "msg": msg.pwd_update_ok });
            }
        });

    },

    doGetTimeChart: function (req, res, next) {
        var param = req.body;
        var delimiter = ",";
        var speedLen = 0;
        var courceLen = 0;

        var beforLapTime = 0;
        var brkKey = "";

        userModel.getlapHeadData(param).then((result) => {

            if (result.length < 1) {
                console.log("no data! -- timeChart header");
                res.send("NG");
                return;
            }
            speedLen = result[0].SPEED_LEN / 100;
            courceLen = result[0].COURCE_LEN / 100;

            // 不要プロパティを削除
            delete result[0].SPEED_LEN;
            delete result[0].COURCE_LEN;

            // json -> csvに変換する
            var csvHeadData = jsonToCsv(result, delimiter);

            userModel.getlapPassingData(param).then((result2) => {

                //console.log("param = " + JSON.stringify(param));
                //console.log("param = " + JSON.stringify(result2));

                if (result2.length < 1) {
                    console.log("no data! -- timeChart detail");
                    res.send("NG");
                    return;
                }
                var passingList = []; // for download
                var topicList = [];  // Best Datas

                var topicObj = "";
                for (var row of result2) {
                    //console.log(JSON.stringify(row));
                    var id = row.TEAM_ID + "-" + row.DRIVER_NO
                    topicObj = topicList.find((v) => v.ID === id);
                    if (topicObj == undefined) {
                        topicObj = new TopicData();
                        topicObj.ID = id;
                        topicList.push(topicObj);
                        topicObj = topicList.find((v) => v.ID === id);
                    }
                    // get Passing Type
                    var passingType = getLoopToSector(row.LOOP_ID);

                    lapData = new LapData();
                    //lapData.NO = row.TEAM_ID;
                    lapData.NO = row.NO;
                    lapData.Team = row.TEAM_NAME_J;
                    lapData.Driver = row.DRIVER_NAME_J;
                    lapData.Lap = topicObj.Lap;

                    if (passingType == "Speed1") {
                        topicObj.Speed1Total = timeFormat(row.PASSING_TIME);
                        continue;
                    } else if (passingType == "Speed2") {
                        var speedTime = timeFormat(row.PASSING_TIME) - topicObj.Speed1Total;
                        var speed = numberFloor(speedLen / 1000 / speedTime * 3600, 100);

                        if (speed > topicObj.BestMaxSpeed) {
                            topicObj.BestMaxSpeed = speed;
                            topicObj.BestMax_FLAG = true;
                        }
                        topicObj.MaxSpeed = speed;
                        continue;
                    } else if (passingType == "OUT") {
                        topicObj.OutLap_FLAG == true;
                        continue;
                    } else if (passingType == "Sec1Time") {
                        lapData.Sector = "S1";
                        topicObj.Sec1Total = timeFormat(row.PASSING_TIME);
                        var sec1Time = timeFormat(row.PASSING_TIME) - timeFormat(row.LAST_PASSING_TIME);
                        sec1Time = Number(sec1Time.toFixed(3));
                        if (topicObj.OutLap_FLAG == true) {
                            lapData.Topic = "OUTLAP";
                            topicObj.OutLap_FLAG = false;
                        } else if (sec1Time < topicObj.BestSec1Time) {
                            topicObj.BestSec1Time = sec1Time;
                            lapData.Topic = "BEST";
                        }
                        lapData.SectorTime = numberFloor(sec1Time, 1000).toFixed(3);
                        lapData.Time = doubleToTime2(sec1Time).toString(10);
                        passingList.push(lapData);
                    } else if (passingType == "Sec2Time") {
                        lapData.Sector = "S2";
                        topicObj.Sec2Total = timeFormat(row.PASSING_TIME);
                        var sec2Time = timeFormat(row.PASSING_TIME) - topicObj.Sec1Total;
                        sec2Time = Number(sec2Time.toFixed(3));
                        if (sec2Time < topicObj.BestSec2Time) {
                            topicObj.BestSec2Time = sec2Time;
                            lapData.Topic = "BEST";
                        }
                        lapData.SectorTime = numberFloor(sec2Time, 1000).toFixed(3);
                        lapData.Time = doubleToTime2(sec2Time);
                        passingList.push(lapData);

                    } else if (passingType == "Sec3Time") {
                        lapData.Sector = "S3";
                        topicObj.Sec3Total = timeFormat(row.PASSING_TIME);
                        var sec3Time = timeFormat(row.PASSING_TIME) - topicObj.Sec2Total;
                        sec3Time = Number(sec3Time.toFixed(3));

                        if (sec3Time < topicObj.BestSec3Time) {
                            topicObj.BestSec3Time = sec3Time;
                            lapData.Topic = "BEST";
                        }
                        lapData.SectorTime = numberFloor(sec3Time, 1000).toFixed(3);
                        lapData.Time = doubleToTime2(sec3Time);
                        passingList.push(lapData);

                    } else if (passingType == "LastLap" || passingType == "PITLAP") {
                        // S4処理 
                        lapData.Sector = "S4";
                        if (passingType == "PITLAP") {
                            lapData.Topic = "PIT-IN";
                        }
                        var sec4Time = timeFormat(row.PASSING_TIME) - topicObj.Sec3Total;
                        sec4Time = Number(sec4Time.toFixed(3));
                        if (sec4Time < topicObj.BestSec4Time) {
                            topicObj.BestSec4Time = sec4Time;
                            lapData.Topic = "BEST";
                        }
                        lapData.SectorTime = numberFloor(sec4Time, 1000).toFixed(3);
                        lapData.Time = doubleToTime2(sec4Time);
                        passingList.push(lapData);

                        //var lapTime = timeFormat(row.PASSING_TIME - row.LAST_PASSING_TIME);

                        // Lap処理
                        lapData = new LapData();
                        lapData.NO = row.NO;
                        lapData.Team = row.TEAM_NAME_J;
                        lapData.Driver = row.DRIVER_NAME_J;
                        lapData.Lap = topicObj.Lap;

                        lapData.Sector = "LAP";

                        if (brkKey != row.TEAM_ID) {
                            brkKey = row.TEAM_ID;
                            beforLapTime = 0;
                        }

                        var lapTime = timeFormat(row.PASSING_TIME) - beforLapTime;
                        lapTime = Number(lapTime.toFixed(3));

                        lapData.SectorTime = numberFloor(lapTime, 1000).toFixed(3);
                        //console.log("lapData == " + JSON.stringify(lapData));

                        lapData.Topic = "";
                        if (lapTime < topicObj.BestLapTime) {
                            lapData.Topic = "BEST";
                            topicObj.BestLapTime = lapTime;
                        }
                        lapData.Time = doubleToTime2(lapTime);
                        passingList.push(lapData);

                        // Ave処理
                        lapData = new LapData();
                        lapData.NO = row.NO;
                        lapData.Team = row.TEAM_NAME_J;
                        lapData.Driver = row.DRIVER_NAME_J;
                        lapData.Lap = topicObj.Lap;

                        lapData.Sector = "AVE(km/h)";
                        //var speed = numberFloor(courceLen / 1000 / timeFormat(row.PASSING_TIME - row.LAST_PASSING_TIME) * 3600, 1000);
                        var speed = numberFloor(courceLen / 1000 / (timeFormat(row.PASSING_TIME) - beforLapTime) * 3600, 1000).toFixed(2);

                        lapData.SectorTime = speed;
                        lapData.Topic = "";

                        if (Number(speed) > Number(topicObj.BestAveSpeed)) {
                            lapData.Topic = "BEST";
                            topicObj.BestAveSpeed = speed;
                        }
                        lapData.Time = "";
                        passingList.push(lapData);

                        // Max処理
                        lapData = new LapData();
                        lapData.NO = row.NO;
                        lapData.Team = row.TEAM_NAME_J;
                        lapData.Driver = row.DRIVER_NAME_J;
                        lapData.Lap = topicObj.Lap;

                        lapData.Sector = "Max(km/h)";
                        lapData.SectorTime = topicObj.MaxSpeed;
                        lapData.Topic = "";
                        if (topicObj.BestMax_FLAG) {
                            lapData.Topic = "BEST";
                            topicObj.BestMax_FLAG = false;
                        }
                        lapData.Time = "";
                        passingList.push(lapData);
                        topicObj.Lap += 1;
                        beforLapTime = timeFormat(row.PASSING_TIME);

                    }
                }
                // json -> csvに変換する
                var csvListData = jsonToCsv(passingList, delimiter);
                var csvData = csvHeadData + "\n" + csvListData
                const data = iconv.encode(csvData, "Shift_JIS");
                res.setHeader('Content-disposition', 'attachment; filename=data.csv');
                res.setHeader('Content-Type', 'text/csv; charset=Shift_JIS');
                res.send(data);
            });
        });
    },


    doGetStandingChart: function (req, res, next) {
        var param = req.body;
        var delimiter = ",";
        var raceType = "";
        //console.log(param);
        userModel.getlapHeadData(param).then((result) => {
            if (result.length < 1) {
                console.log("no data! -- StandingChart header");
                res.send("NG");
                return;
            }
            speedLen = result[0].SPEED_LEN / 100;
            courceLen = result[0].COURCE_LEN / 100;
            raceType = result[0].RACE_TYPE;

            // 不要プロパティを削除
            delete result[0].SPEED_LEN;
            delete result[0].COURCE_LEN;
            delete result[0].RACE_TYPE;

            // json -> csvに変換する
            var csvHeadData = jsonToCsv(result, delimiter);

            userModel.getChartData(param).then((result2) => {
                if (result2.length < 1) {
                    console.log("no data! -- StandingChart detail");
                    res.send("NG");
                    return;
                }
                //2022.5.12 add --------------------------------------- 
                //ポジション順に
                result2.sort(function (a, b) {
                    if (a.Lap !== b.Lap) {
                        return (a.Lap - b.Lap)
                    }
                    if (raceType != 'L') {
                        if (a.LapTime !== b.LapTime) {
                            return (a.LapTime - b.LapTime)
                        }
                    }
                    if (raceType != 'L') {
                        if (a.LastTime !== b.LastTime) {
                            return (a.LastTime - b.LastTime)
                        }
                    }
                    return 0
                })
                //順位セット
                var lap = 0;
                var pos = 0;
                for (row of result2) {
                    if (raceType != 'L') {
                        if (lap != row.Lap) {
                            lap = row.Lap;
                            pos = 1;
                        }
                        row.Pos = pos;
                        pos += 1;
                    }
                    // 不要プロパティを削除
                    delete row.LapTime;
                    delete row.LastTime;
                }
                //車両ナンバー順にソート
                result2.sort(function (a, b) {
                    if (a.Lap !== b.Lap) {
                        return (a.Lap - b.Lap)
                    }
                    if (a.No !== b.No) {
                        return (a.No - b.No)
                    }
                    return 0
                })
                //2022.5.12 add end --------------------------------------- 


                var csvListData = jsonToCsv(result2, delimiter);
                var csvData = csvHeadData + "\n" + csvListData
                var data = iconv.encode(csvData, "Shift_JIS");
                res.setHeader('Content-disposition', 'attachment; filename=data.csv');
                res.setHeader('Content-Type', 'text/csv; charset=Shift_JIS');
                res.send(data);
            });
        });

    },

    doGetResultPdf: function (req, res, next) {
        var param = req.body;
        userModel.getResultPdf(param).then((result) => {
            if (result.length < 1) {
                console.log("no data! -- StandingChart header");
                res.send("NG");
                return;
            }

            //res.setHeader('Content-Type', 'application/pdf');
            //res.setHeader('Content-Type', 'application/force-download');
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', 'attachment; filename=result.pdf');
            res.send(result[0].CONTENTS);
        });
    },

    // ============ ユーザー管理機能 ============
    
    // ユーザー管理画面を表示
    showAdminPage: function (req, res, next) {
        if (!req.session || !req.session.username) {
            return res.redirect('/login/init');
        }

        loginModel.getUserData(req.session.username, '').then((userData) => {
            if (userData === "NG" || userData === "EXPIRED") {
                return res.redirect('/login/init');
            }
            
            // 管理者権限チェック
            if (userData.role !== 'admin') {
                return res.status(403).render(Views + 'session_error.ejs', { 
                    msg: '管理者権限が必要です' 
                });
            }
            
            const sid = req.sessionID;
            res.render(Views + 'user_admin.ejs', {
                id: req.session.username,
                sid: sid,
                currentUser: userData
            });
        }).catch((err) => {
            console.error('Error:', err);
            res.status(500).send('Internal Server Error');
        });
    },

    // 全ユーザー一覧を取得（API）
    getAllUsersAPI: async function (req, res, next) {
        try {
            if (!req.session || !req.session.username) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const currentUserData = await new Promise((resolve, reject) => {
                loginModel.getUserData(req.session.username, '').then(resolve).catch(reject);
            });

            if (currentUserData === "NG" || currentUserData === "EXPIRED") {
                return res.status(401).json({ success: false, message: 'Unauthorized or expired account' });
            }

            // 管理者権限チェック
            if (currentUserData.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Admin access required' });
            }

            const users = await userModel.getAllUsers();
            res.json({ success: true, users: users });
        } catch (err) {
            console.error('Error getting users:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // ユーザーを作成（API）
    createUserAPI: async function (req, res, next) {
        try {
            if (!req.session || !req.session.username) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const currentUserData = await new Promise((resolve, reject) => {
                loginModel.getUserData(req.session.username, '').then(resolve).catch(reject);
            });

            if (currentUserData === "NG" || currentUserData === "EXPIRED") {
                return res.status(401).json({ success: false, message: 'Unauthorized or expired account' });
            }

            // 管理者権限チェック
            if (currentUserData.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Admin access required' });
            }

            const { id, password, name, company, role, expiryStartDate, expiryEndDate } = req.body;

            if (!id || !password || !name) {
                return res.status(400).json({ success: false, message: 'Required fields are missing' });
            }

            const result = await userModel.createUser({ 
                id, 
                password, 
                name,
                company: company || null,
                role: role || 'user',
                expiryStartDate: expiryStartDate || null,
                expiryEndDate: expiryEndDate || null
            });
            res.json(result);
        } catch (err) {
            console.error('Error creating user:', err);
            
            // エラーメッセージに応じて適切なステータスコードを返す
            if (err.message && err.message.includes('already exists')) {
                return res.status(409).json({ success: false, message: err.message });
            }
            
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // ユーザーを更新（API）
    updateUserAPI: async function (req, res, next) {
        try {
            if (!req.session || !req.session.username) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const currentUserData = await new Promise((resolve, reject) => {
                loginModel.getUserData(req.session.username, '').then(resolve).catch(reject);
            });

            if (currentUserData === "NG" || currentUserData === "EXPIRED") {
                return res.status(401).json({ success: false, message: 'Unauthorized or expired account' });
            }

            // 管理者権限チェック
            if (currentUserData.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Admin access required' });
            }

            const userId = req.params.id;
            const { password, name, company, role, expiryStartDate, expiryEndDate } = req.body;

            const result = await userModel.updateUser(userId, { 
                password, 
                name,
                company,
                role,
                expiryStartDate: expiryStartDate,
                expiryEndDate: expiryEndDate
            });
            res.json(result);
        } catch (err) {
            console.error('Error updating user:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // ユーザーを削除（API）
    deleteUserAPI: async function (req, res, next) {
        try {
            if (!req.session || !req.session.username) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const currentUserData = await new Promise((resolve, reject) => {
                loginModel.getUserData(req.session.username, '').then(resolve).catch(reject);
            });

            if (currentUserData === "NG" || currentUserData === "EXPIRED") {
                return res.status(401).json({ success: false, message: 'Unauthorized or expired account' });
            }

            // 管理者権限チェック
            if (currentUserData.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Admin access required' });
            }

            const userId = req.params.id;

            // 自分自身を削除しようとしていないかチェック
            if (userId === req.session.username) {
                return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
            }

            const result = await userModel.deleteUser(userId);
            res.json(result);
        } catch (err) {
            console.error('Error deleting user:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // ユーザーのパスワードを取得（API）
    getUserPasswordAPI: async function (req, res, next) {
        try {
            if (!req.session || !req.session.username) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const currentUserData = await new Promise((resolve, reject) => {
                loginModel.getUserData(req.session.username, '').then(resolve).catch(reject);
            });

            if (currentUserData === "NG" || currentUserData === "EXPIRED") {
                return res.status(401).json({ success: false, message: 'Unauthorized or expired account' });
            }

            // 管理者権限チェック
            if (currentUserData.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Admin access required' });
            }

            const userId = req.params.id;
            const password = await userModel.getUserPassword(userId);
            
            if (password) {
                res.json({ success: true, password: password });
            } else {
                res.status(404).json({ success: false, message: 'User not found' });
            }
        } catch (err) {
            console.error('Error getting user password:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // CSVアップロード処理
    uploadCSV: [
        upload.single('csvfile'),
        async function (req, res, next) {
            try {
                if (!req.file) {
                    return res.status(400).json({ success: false, message: 'ファイルがアップロードされていません' });
                }

                const fileExtension = path.extname(req.file.originalname).toLowerCase();
                let records = [];

                // Excel形式の場合
                if (fileExtension === '.xlsx' || fileExtension === '.xls') {
                    console.log('[File Upload] Processing Excel file:', req.file.originalname);
                    
                    try {
                        const workbook = XLSX.readFile(req.file.path);
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                        
                        // ヘッダー行を探す（「会社」列を含む行）
                        let headerRowIndex = -1;
                        for (let i = 0; i < rawData.length; i++) {
                            if (rawData[i].some(cell => String(cell).includes('会社') || String(cell).includes('ユーザー'))) {
                                headerRowIndex = i;
                                break;
                            }
                        }
                        
                        if (headerRowIndex === -1) {
                            fs.unlinkSync(req.file.path);
                            return res.status(400).json({ success: false, message: 'Excelファイルにヘッダー行が見つかりません' });
                        }
                        
                        const headers = rawData[headerRowIndex].map(h => String(h).trim());
                        console.log('[Excel Upload] Headers:', headers);
                        
                        // データ行を解析
                        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                            const row = rawData[i];
                            if (!row || row.every(cell => !cell)) continue; // 空行はスキップ
                            
                            const record = {};
                            headers.forEach((header, index) => {
                                record[header] = row[index] ? String(row[index]).trim() : '';
                            });
                            records.push(record);
                        }
                        
                        console.log(`[Excel Upload] Parsed ${records.length} records`);
                        
                    } catch (err) {
                        console.error('[Excel Upload] Error:', err);
                        fs.unlinkSync(req.file.path);
                        return res.status(400).json({ success: false, message: 'Excelファイルの読み込みに失敗しました: ' + err.message });
                    }
                    
                } else {
                    // CSV形式の場合（既存の処理）
                    console.log('[File Upload] Processing CSV file:', req.file.originalname);
                    
                    // CSVファイルを読み込み（バッファとして読み込む）
                    const fileBuffer = fs.readFileSync(req.file.path);
                
                // 文字コード自動検出と変換
                let fileContent;
                let encoding = 'utf-8';
                
                // BOMをチェックして文字コードを判定
                if (fileBuffer.length >= 3 && 
                    fileBuffer[0] === 0xEF && 
                    fileBuffer[1] === 0xBB && 
                    fileBuffer[2] === 0xBF) {
                    // UTF-8 with BOM
                    encoding = 'utf-8';
                    fileContent = fileBuffer.toString('utf-8');
                } else if (fileBuffer.length >= 2 && 
                           fileBuffer[0] === 0xFF && 
                           fileBuffer[1] === 0xFE) {
                    // UTF-16 LE with BOM
                    encoding = 'utf-16le';
                    fileContent = iconv.decode(fileBuffer, 'utf-16le');
                } else {
                    // BOMがない場合は内容から推測
                    try {
                        fileContent = fileBuffer.toString('utf-8');
                        
                        // UTF-8として正しく読めているかチェック（置換文字 U+FFFD がないか）
                        if (fileContent.includes('\uFFFD')) {
                            // UTF-8で読めなかった場合、Shift-JISとして読み込み
                            encoding = 'Shift_JIS';
                            fileContent = iconv.decode(fileBuffer, 'Shift_JIS');
                        }
                    } catch (err) {
                        // UTF-8でエラーが出た場合もShift-JISで試行
                        encoding = 'Shift_JIS';
                        fileContent = iconv.decode(fileBuffer, 'Shift_JIS');
                    }
                }
                
                console.log(`[CSV Upload] Detected encoding: ${encoding}`);
                
                // BOM除去（文字列として読み込んだ後のBOM）
                if (fileContent.charCodeAt(0) === 0xFEFF) {
                    fileContent = fileContent.slice(1);
                }
                
                // CSVをパース（ネイティブJavaScript実装）
                // クォート付きフィールド対応の簡易CSVパーサー
                function parseCSVLine(line) {
                    const result = [];
                    let current = '';
                    let inQuotes = false;
                    
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        
                        if (char === '"') {
                            if (inQuotes && line[i + 1] === '"') {
                                current += '"';
                                i++;
                            } else {
                                inQuotes = !inQuotes;
                            }
                        } else if (char === ',' && !inQuotes) {
                            result.push(current.trim());
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    result.push(current.trim());
                    return result;
                }
                
                const lines = fileContent.split(/\r?\n/).filter(line => line.trim());
                
                if (lines.length < 2) { // ヘッダー + 最低1行のデータ
                    fs.unlinkSync(req.file.path); // 一時ファイル削除
                    return res.status(400).json({ success: false, message: 'CSVファイルが空です' });
                }
                
                // ヘッダー行を解析
                const headers = parseCSVLine(lines[0]);
                
                // データ行を解析
                const records = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = parseCSVLine(lines[i]);
                    const record = {};
                    headers.forEach((header, index) => {
                        record[header] = values[index] || '';
                    });
                    records.push(record);
                }

                    if (records.length === 0) {
                        fs.unlinkSync(req.file.path); // 一時ファイル削除
                        return res.status(400).json({ success: false, message: 'CSVファイルにデータがありません' });
                    }
                } // CSV処理の終わり

                // 共通: レコード数チェック
                if (records.length === 0) {
                    fs.unlinkSync(req.file.path);
                    return res.status(400).json({ success: false, message: 'ファイルにデータがありません' });
                }

                // ユーザーデータを一括登録
                const results = {
                    success: 0,
                    failed: 0,
                    errors: []
                };

                // 日付フォーマットを正規化する関数（2025/9/1 → 2025-09-01）
                function normalizeDateFormat(dateStr) {
                    if (!dateStr || dateStr.trim() === '') {
                        return null;
                    }
                    
                    // YYYY/M/D または YYYY/MM/DD 形式を YYYY-MM-DD に変換
                    const match = dateStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
                    if (match) {
                        const year = match[1];
                        const month = match[2].padStart(2, '0');
                        const day = match[3].padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    }
                    
                    // すでに YYYY-MM-DD 形式の場合はそのまま返す
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                        return dateStr;
                    }
                    
                    return null;
                }
                
                // 閲覧期間をパースする関数（Excel形式用）
                function parseExpiryPeriod(periodStr) {
                    if (!periodStr || periodStr.includes('無期限')) {
                        return { startDate: null, endDate: null };
                    }
                    
                    // "9/1-9/5" や "9/1-9/5\r\n期間のみ" 形式に対応
                    const match = periodStr.match(/(\d+)\/(\d+)\s*-\s*(\d+)\/(\d+)/);
                    if (match) {
                        const startMonth = match[1].padStart(2, '0');
                        const startDay = match[2].padStart(2, '0');
                        const endMonth = match[3].padStart(2, '0');
                        const endDay = match[4].padStart(2, '0');
                        
                        // 年は2025年として設定（仮）
                        return {
                            startDate: `2025-${startMonth}-${startDay}`,
                            endDate: `2025-${endMonth}-${endDay}`
                        };
                    }
                    
                    return { startDate: null, endDate: null };
                }

                for (const record of records) {
                    try {
                        // CSV/Excelの列名に対応
                        const userId = record.id || record.ID || record.ユーザーID || record[''];
                        const userName = record.name || record.NAME || record.名前 || record.ユーザー名;
                        const userPassword = record.password || record.PASSWORD || record.パスワード || record.PW;
                        const userCompany = record.company || record.COMPANY || record.会社区分 || record.会社;
                        
                        // 日付取得（CSVの直接指定を優先）
                        let expiryStartDate = record.expiryStartDate || record.EXPIRYSTARTDATE || record.開始日;
                        let expiryEndDate = record.expiryEndDate || record.EXPIRYENDDATE || record.終了日;
                        
                        // CSVに直接日付がある場合は正規化
                        if (expiryStartDate) {
                            expiryStartDate = normalizeDateFormat(expiryStartDate);
                        }
                        if (expiryEndDate) {
                            expiryEndDate = normalizeDateFormat(expiryEndDate);
                        }
                        
                        // 日付がない場合、閲覧期間文字列をパース（Excel形式）
                        if (!expiryStartDate && !expiryEndDate) {
                            const expiryPeriodStr = record.expiryDate || record.expiration_date || record.有効期限 || record.閲覧期間 || '';
                            const expiryPeriod = parseExpiryPeriod(expiryPeriodStr);
                            expiryStartDate = expiryPeriod.startDate;
                            expiryEndDate = expiryPeriod.endDate;
                        }
                        
                        const userData = {
                            id: userId,
                            name: userName,
                            password: userPassword,
                            company: userCompany || null,
                            role: record.role || record.ROLE || record.ロール || 'user',
                            expiryStartDate: expiryStartDate,
                            expiryEndDate: expiryEndDate
                        };

                        // 必須項目チェック
                        if (!userData.id || !userData.name || !userData.password) {
                            results.failed++;
                            results.errors.push(`行${results.success + results.failed}: 必須項目（ユーザーID, 名前, パスワード）が不足しています`);
                            continue;
                        }

                        // 会社区分のバリデーションと正規化
                        const validCompanies = ['TOYOTA', 'TGR-DC', '講師', 'TGR-D', 'aZillion', 'DAIHATSU', 'SUBARU'];
                        if (userData.company && !validCompanies.includes(userData.company)) {
                            // 会社名を標準化
                            const companyUpper = userData.company.toUpperCase();
                            if (companyUpper.includes('TOYOTA')) {
                                userData.company = 'TOYOTA';
                            } else if (companyUpper.includes('TGR-DC')) {
                                userData.company = 'TGR-DC';
                            } else if (companyUpper.includes('TGR-D') || companyUpper === 'TGRD') {
                                userData.company = 'TGR-D';
                            } else if (companyUpper.includes('DAIHATSU') || userData.company.includes('ダイハツ')) {
                                userData.company = 'DAIHATSU';
                            } else if (companyUpper.includes('SUBARU') || userData.company.includes('スバル')) {
                                userData.company = 'SUBARU';
                            } else if (userData.company.includes('講師')) {
                                userData.company = '講師';
                            } else if (companyUpper.includes('AZILLION')) {
                                userData.company = 'aZillion';
                            }
                        }

                        // ユーザー登録（userModelを使用）
                        try {
                            const result = await userModel.createUser(userData);
                            if (result.success) {
                                results.success++;
                            } else {
                                results.failed++;
                                results.errors.push(`行${results.success + results.failed}: ${userData.id} - 登録失敗`);
                            }
                        } catch (err) {
                            results.failed++;
                            results.errors.push(`行${results.success + results.failed}: ${userData.id} - ${err.message}`);
                        }

                    } catch (err) {
                        results.failed++;
                        results.errors.push(`行${results.success + results.failed}: ${err.message}`);
                    }
                }

                // 一時ファイル削除
                fs.unlinkSync(req.file.path);

                res.json({
                    success: true,
                    message: `登録完了: ${results.success}件成功, ${results.failed}件失敗`,
                    details: results
                });

            } catch (err) {
                console.error('CSV upload error:', err);
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                res.status(500).json({ success: false, message: err.message });
            }
        }
    ]
}


// 小数点４桁を小数点３桁でカット(元は小数点なし10000倍したデータ)
function timeFormat(num) {
    var res = Math.floor(num / 10) / 1000;
    //console.log("-----timeFormat---  num = " + num + "   ; res = " + res);
    return res;
}


// 小数点３桁でカット
function numberFloor(num, digit) {
    //console.log("-- numberFloor --");
    //var res = Math.floor(num * digit) / digit;
    var digitLen = String(digit).length;
    var strVal = String(num);
    var dotPos = 0;
    //　小数点が存在するか確認
    if (strVal.lastIndexOf('.') !== -1) {
        dotPos = strVal.lastIndexOf('.');
    }
    if (dotPos == 0) {
        return num;
    }
    var value = strVal.slice(0, dotPos + digitLen);
    var res = Number(value);
    return res;
}

function doubleToTime(dTime) {
    if (dTime <= 0) {
        return "";
    }
    // HH
    var hh = 0;
    var mi = 0;
    var ss = 0;
    if (dTime > 3600) {
        hh = Math.floor(dTime / 3600);
    }
    // MI
    var m1 = dTime - (hh * 3600);
    if (m1 > 60) {
        mi = Math.floor(m1 / 60);
    }
    // SS
    ss = m1 - (mi * 60);
    if (hh > 0) {
        return hh + ":" + ("00" + mi).substr(-2) + ":" + ss.toFixed(3);
    } else if (mi > 0) {
        return mi + ":" + ("00" + ss.toFixed(3)).substr(-6);
    } else {
        return numberFloor(ss.toFixed(3), 1000).toFixed(3);
    }
}
function doubleToTime2(dTime) {
    if (dTime <= 0) {
        return "";
    }
    // HH
    var hh = 0;
    var mi = 0;
    var ss = 0;
    if (dTime > 3600) {
        hh = Math.floor(dTime / 3600);
    } else {
        hh = "00"
    }
    // MI
    var m1 = dTime - (hh * 3600);
    if (m1 > 60) {
        mi = Math.floor(m1 / 60);
    } else {
        mi = "00"
    }
    // SS
    ss = m1 - (mi * 60);
    return ("00" + hh).substr(-2) + ":" + ("00" + mi).substr(-2) + ":" + ("00" + ss.toFixed(3)).substr(-6);
}

// Loop名称変換
function getLoopToSector(loopid) {
    var sec = "";
    if (loopid == "0") {
        sec = "LastLap";
    } else if (loopid == "1") {
        sec = "Sec1Time";
    } else if (loopid == "2") {
        sec = "Sec2Time";
    } else if (loopid == "3") {
        sec = "Sec3Time";
    } else if (loopid == "8") {
        sec = "Speed1";
    } else if (loopid == "9") {
        sec = "Speed2";
    } else if (loopid == "10") {
        sec = "OUT";
    } else if (loopid == "11") {
        sec = "IN";
    } else if (loopid == "20") {
        sec = "PITLAP";
    }
    return sec;
}

function TopicData() {
    this.ID = "";
    this.TeamID = "";
    this.DriverNo = "";
    this.Lap = 1;
    this.Sec1Total = 0;
    this.Sec2Total = 0;
    this.Sec3Total = 0;
    this.Speed1Total = 0;
    //this.Sec4Total = 0;
    this.BestLapTime = 99999;
    this.BestSec1Time = 99999;
    this.BestSec2Time = 99999;
    this.BestSec3Time = 99999;
    this.BestSec4Time = 99999;
    this.BestMaxSpeed = 0;
    this.BestAveSpeed = 0;
    this.OutLap_FLAG = true;
    this.Start_FLAG = false;
    this.BestMax_FLAG = false;
    this.MaxSpeed = 0;
    this.PitIN_FLAG = false;

}
function LapData() {
    this.NO = "";
    this.Team = "";
    this.Driver = "";
    this.Lap = "";
    this.Sector = "";
    this.SectorTime = 0;
    this.Topic = "";
    this.Time = "";
}


//jsonをcsv文字列に編集する
function jsonToCsv(json, delimiter) {
    var header = Object.keys(json[0]).join(delimiter) + "\n";
    var body = json.map(function (d) {
        return Object.keys(d).map(function (key) {
            return d[key];
        }).join(delimiter);
    }).join("\n");
    return header + body;
}