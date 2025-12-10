
var lang = "JP";
var webSocket = null;
var liveList = new Object();
var dispclass = "all";
var racemode = "B";
//let isLoop = true;
var reconnectDelay = 2000; // 2秒ごとにリトライ
var reconnectTimer = null;

var c = $.cookie("superformula");
if (c != null) {
    lang = c;
}
var ua = navigator.userAgent;
if (navigator.userAgent.indexOf('Android') > 0) {
    if (navigator.userAgent.indexOf('Chrome') < 0) {
        if (parseFloat(navigator.userAgent.slice(ua.indexOf("Android") + 8)) < 4.4) {
            alert("Android4.4以下の標準ブラウザは対応していません。Chromeブラウザを使用して下さい。");
        }
    }
}

$(function () {
    $(window).focus();
    $(window).bind("focus", function () {
        //location.reload();
    }).bind("blur", function () {
    });
});



// クッキー処理などは省略

function init() {
    try {
        console.log("[WS] connecting to", uri);
        webSocket = new WebSocket(uri);
        webSocket.onopen = onOpen;
        webSocket.onmessage = onMessage;
        webSocket.onclose = onClose;
        webSocket.onerror = onError;
    } catch (e) {
        console.error("[WS] init error:", e);
        scheduleReconnect();
    }
}

function onOpen(event) {
    console.log("[WS] connected.");
    // 接続できたのでリトライタイマー停止
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
}

function onMessage(event) {
    if (event && event.data) {
        try {
            var j = $.parseJSON(event.data);
            setData(j);
        } catch (e) {
            console.error("[WS] parse error:", e, event.data);
        }
    }
}

function onError(event) {
    console.error("[WS] error:", event);
}

function onClose(event) {
    console.warn("[WS] closed. code:", event.code, " reason:", event.reason);
    webSocket = null;
    scheduleReconnect();
}

function scheduleReconnect() {
    if (reconnectTimer) return; // 多重タイマー防止
    reconnectTimer = setTimeout(function () {
        reconnectTimer = null;
        location.reload();
        init();
    }, reconnectDelay);
}

function setData(j) {
    if (j.type == '0') {

        setListTitle();

        if (j.rows.length == 0) {
            return;
        }

        liveList = j.rows;
        for (var index in j.rows) {
            setRowData(j.rows[index]);
        }

        $('#Container').mixItUp('sort', 'sort:desc');
    } else if (j.type == 'R') {
        location.reload();
    } else if (j.type == '1' || j.type == '2' || j.type == '3' || j.type == 'L' || j.type == 'K') { // Passing

        //if (j.STATUS == "G" && (j.type == '1' || j.type == '2' || j.type == '3')) {
        //    return;
        //}
        setLineData(j);

        if (racemode != "B") {
            // Race mode: sort on lap complete
            if (j.type == 'L') {
                $('#Container').mixItUp('sort', 'sort:desc');
            }
        } else {
            // Best time mode: sort on every passing to update best time rankings
            $('#Container').mixItUp('sort', 'sort:desc');
        }
    } else if (j.type == 'U') { // UPDATE
        setLineData(j);
    } else if (j.type == 'I') { // PIT-IN
        setStatusData(j.CARNO, "P", j.PIT);
    } else if (j.type == 'O') { // PIT-OUT
        setStatusData(j.CARNO, "", "");
    } else if (j.type == 'D') { // DRIVER
        setDriverData(j);
    } else if (j.type == 'U') { // UPDATE
        setDriverData(j);
    } else if (j.type == 'S') { // SCHEDULE
        racemode = j.RACE_TYPE;
        $(".title").text(j.CATEGORY + " " + j.DESCR_J);
        var classList = j.CLASS_LIST.split(",");
        var liClass = '<ul class="classmenu" style="position:absolute;top:0px;left:230px;"><li class="current" id="class_all"><a href="javaScript:setFilter(\'all\');" data-hover="ALL">ALL</a></li>';
        for (i = 0; i < classList.length; i++) {
            liClass += '<li id="class_' + classList[i] + '"><a href="javaScript:setFilter(\'' + classList[i] + '\');" data-hover="' + classList[i] + '">' + classList[i] + '</a></li>';
        }
        liClass += '</ul>';

        $("#classfilter").html(liClass);
        setBestInfo(j);






    } else if (j.type == 'W') { // WEATHER
        $("#weather").attr("src", "/images/trd/" + j.weather + ".png");
        $("#condition").text(j.condition);
    } else if (j.type == 'T') { // TELOP
        $("#telop").text(j.msg);
    } else if (j.type == 'F') { // HARTBEAT
        if (racemode == "B") {
            if (j.flag == "F") {
                $(".laps").text("FINISH");
            } else {
                $(".laps").text(j.togo);
            }
        } else {
            if (j.flag == "F") {
                $(".laps").text("FINISH");
            } else {
                if (racemode == "R") {
                    $(".laps").text(j.togo + " LAPS TO GO");
                } else {
                    $(".laps").text(j.togo);
                }
            }
        }
        if (j.flag == "G") {
            $("#liveflag").attr("src", "/images/trd/green_on.png");
        } else if (j.flag == "R") {
            $("#liveflag").attr("src", "/images/trd/red_on.png");
        } else if (j.flag == "Y") {
            $("#liveflag").attr("src", "/images/trd/yellow_on.png");
        } else if (j.flag == "F") {
            $("#liveflag").attr("src", "/images/trd/cheker.png");
        } else {
            $("#liveflag").attr("src", "/images/trd/green_off.png");
        }
    }
}

$(init);

function setFilter(category) {
    dispclass = category;
    if (category == "all") {
        $('#Container').mixItUp('filter', 'all');
    } else {
        $('#Container').mixItUp('filter', '.category-' + category);
    }

    var list = $(".classmenu").children('li');

    for (var i = 0; i < list.length; i++) {
        var liId = list.eq(i).attr('id').substr(6);
        if (liId == category) {
            $('#class_' + liId).attr("class", "current");
        } else {
            $('#class_' + liId).removeAttr("class");
        }
    }

}

function setLineData(data) {

    for (var index in liveList) {
        if (liveList[index].CARNO == data.CARNO) {
            liveList[index] = data;
            if (data.type == 'U') {
                $("#c" + liveList[index].CARNO + "_last").css('color', getLapColor(liveList[index].LAST_FLAG));
                if (sector >= 2) {
                    $("#c" + liveList[index].CARNO + "_sec1").css('color', getLapColor(liveList[index].SEC1_FLAG));
                    $("#c" + liveList[index].CARNO + "_sec2").css('color', getLapColor(liveList[index].SEC2_FLAG));
                }
                if (sector >= 3) {
                    $("#c" + liveList[index].CARNO + "_sec3").css('color', getLapColor(liveList[index].SEC3_FLAG));
                }
                if (sector >= 4) {
                    $("#c" + liveList[index].CARNO + "_sec4").css('color', getLapColor(liveList[index].SEC4_FLAG));
                }
                if (speed == "ON") {
                    $("#c" + liveList[index].CARNO + "_speed").css('color', getLapColor(liveList[index].SPEED_FLAG));
                }
                var tireImg = "/images/trd/dummy.gif";
                if (data.TIRE != null) {
                    if (data.TIRE.length > 0) {
                        tireImg = "/images/trd/" + data.TIRE + ".png";
                    }
                }
                //$("#c" + liveList[index].CARNO + "_tire").html('<img src="' + tireImg + '" width="16" border=0>');
            } else {
                setPassingLine(data);
            }
            break;
        }
    }
}

function setStatusData(carno, status, pit) {

    for (var index in liveList) {
        if (liveList[index].CARNO == carno) {
            liveList[index].STATUS = status;
            var pitImg = "/images/trd/dummy.gif";
            if (status == "P") {
                liveList[index].PIT = pit;
                $("#c" + carno + "_pit").text(pit);
                pitImg = "/images/trd/pit.png";
            } else if (status == "G") {
                pitImg = "/images/trd/checker.png";
            }
            $("#c" + carno + "_status").html('<img src="' + pitImg + '" width="16" border=0>');
            break;
        }
    }
}


function setDriverData(data) {

    for (var index in liveList) {
        if (liveList[index].CARNO == data.CARNO) {
            liveList[index].DRIVER_J = data.DRIVER_J;
            liveList[index].DRIVER_E = data.DRIVER_E;
            liveList[index].TEAM_J = data.TEAM_J;
            liveList[index].TEAM_E = data.TEAM_E;
            liveList[index].DRIVER_IDX = data.DRIVER_IDX;
            liveList[index].TIRE = data.TIRE;
            liveList[index].MAKER = data.MAKER;
            liveList[index].RACE_CLASS = data.RACE_CLASS;
            var c = "#c" + data.CARNO;
            var makerImg = "/images/trd/dummy.gif";
            if (data.MAKER != null) {
                if (data.MAKER.length > 0) {
                    makerImg = "/images/trd/" + data.MAKER + ".png";
                }
            }
            var tireImg = "/images/trd/dummy.gif";
            if (data.TIRE != null) {
                if (data.TIRE.length > 0) {
                    tireImg = "/images/trd/" + data.TIRE + ".png";
                }
            }
            if (lang == "EN") {
                $(c + "_driver").html('<div>' + data.DRIVER_J + '</div></td>');
            } else {
                $(c + "_driver").html('<div>' + data.DRIVER_J + '</div></td>');
            }
            //$(c + "_tire").html('<img src="' + tireImg + '" width="16" border=0>');
            $(c + "_maker").html('<img src="' + makerImg + '" width="16" border=0>');
            break;
        }
    }
}

function setListTitle() {

    var html = "";

    if (racemode == "B") {
        html = '<table class="listtable" style="table-layout: fixed;"><tr>' +
            '<th class="pos">POS</th>' +
            '<th class="no_title">No.</th>' +
            '<th class="info"></th>' +
            '<th class="driver">Driver</th>' +
            //'<th class="tire">T</th>' +
            //'<th class="maker">E</th>' +
            '<th class="time col-best">BestTime</th>' +
            '<th class="lap col-lapno">(L)</th>' +
            '<th class="time">Gap</th>' +
            '<th class="time col-diff">Diff</th>';
        if (sector >= 1) {
            html += '<th class="time col-sec">S1</th>';
        }
        if (sector >= 2) {
            html += '<th class="time col-sec">S2</th>';
        }
        if (sector >= 3) {
            html += '<th class="time col-sec">S3</th>';
        }
        if (sector >= 4) {
            html += '<th class="time col-sec">S4</th>';
        }
        if (speed == "ON") {
            html += '<th class="time col-speed">Speed</th>';
        }
        html += '<th class="time">LastLap</th>';
        html += '<th class="lap">Laps</th>' +
            '<th class="pit col-pit">PIT</th>' +
            '</tr></table>';
    } else {
        html = '<table class="listtable"><tr>' +
            '<th class="pos"></th>' +
            '<th class="pos">POS</th>' +
            '<th class="no_title">No.</th>' +
            '<th class="info"></th>' +
            '<th class="driver">Driver</th>' +
            //'<th class="tire">T</th>' +
            //'<th class="maker">E</th>' +
            '<th class="lap">Laps</th>' +
            '<th class="time">Gap</th>' +
            '<th class="time col-diff">Diff</th>';
        if (sector >= 1) {
            html += '<th class="time col-sec">S1</th>';
        }
        if (sector >= 2) {
            html += '<th class="time col-sec">S2</th>';
        }
        if (sector >= 3) {
            html += '<th class="time col-sec">S3</th>';
        }
        if (sector >= 4) {
            html += '<th class="time col-sec">S4</th>';
        }
        if (speed == "ON") {
            html += '<th class="time col-speed">Speed</th>';
        }
        html += '<th class="time">LastLap</th>';
        html += '<th class="time col-best">BestTime</th>' +
            '<th class="lap col-lapno">(L)</th>' +
            '<th class="pit col-pit">PIT</th>' +
            '</tr></table>';
    }
    $("#listtitle").html(html);
}

function setRowData(data) {


    var c = "c" + data.CARNO;
    var id = "#" + c;
    var sort = 0;
    if (racemode == "B") {
        if (data.RUN_FLAG == "1") {
            sort = data.BEST_TIME * -1;
        } else {
            sort = -99999 - data.START_POS;
        }
    } else {
        //if ( !isLoop ) {
        if (data.RUN_FLAG == "1") {
            sort = (data.LAPS * 10000000) - data.TOTAL_TIME;
        } else {
            sort = -99999 - data.START_POS;
        }
        //} else {
        //      if( data.LAPS == 0 ) {
        //          sort = 1000000 + (data.PASSING_SECTOR * 100000) - data.PASSING_TOTAL;
        //      } else {
        //          sort = (data.LAPS * 10000000) + (data.PASSING_SECTOR * 100000) - data.PASSING_TOTAL;
        //      }
        //}


    }

    if ($(c).size() == 0) {
        if (lang == "EN") {
            $("#ListArea").append('<div id="c' + data.CARNO + '" class="mix category-' + data.RACE_CLASS + '"  data-sort="' + sort + '" onClick="personalClick(\'' + data.CARNO + '\',\'' + data.DRIVER_E + '\',\'' + data.TEAM_E + '\',\'' + data.RACE_CLASS + '\');"></div>');
        } else {
            var tt = data.TEAM_J.toString();
            var t = tt.replace(/'/g, "");
            $("#ListArea").append('<div id="c' + data.CARNO + '" class="mix category-' + data.RACE_CLASS + '"  data-sort="' + sort + '" onClick="personalClick(\'' + data.CARNO + '\',\'' + data.DRIVER_J + '\',\'' + t + '\',\'' + data.RACE_CLASS + '\');"></div>');
            //$("#ListArea").append('<div id="c' + data.CARNO + '" class="mix category-' + data.RACE_CLASS + '"  data-sort="' + sort + '" onClick="personalClick(\'' + data.CARNO + '\',\'' + data.DRIVER_J + '\',\'' + data.TEAM_J + '\',\'' + data.RACE_CLASS + '\');"></div>');
        }
    }

    var pitImg = "/images/trd/dummy.gif";
    if (data.STATUS == "P") {
        pitImg = "/images/trd/pit.png";
    } else if (data.STATUS == "G") {
        pitImg = "/images/trd/checker.png";
    }

    var tireImg = "/images/trd/dummy.gif";
    if (data.TIRE != null) {
        if (data.TIRE.length > 0) {
            tireImg = "/images/trd/" + data.TIRE + ".png";
        }
    }

    var makerImg = "/images/trd/dummy.gif";
    if (data.MAKER != null) {
        if (data.MAKER.length > 0) {
            makerImg = "/images/trd/" + data.MAKER + ".png";
        }
    }

    var html = "";
    var t = ((sort * 1000) / 1000);

    if (racemode == "B") {
        html = '<table class="listtable" style="table-layout: fixed;"><tr>' +
            '<td class="pos" id="' + c + '_pos"></td>' +
            '<td class="no" id="' + c + '_no">' + data.CARNO + '</td>' +
            '<td class="info" id="' + c + '_status"><img src="' + pitImg + '" width="16" border=0></td>';
        if (lang == "EN") {
            html += '<td class="driver" id="' + c + '_driver"><div>' + data.DRIVER_J + '</div></td>';
        } else {
            html += '<td class="driver" id="' + c + '_driver"><div>' + data.DRIVER_J + '</div></td>';
        }
        //html += '<td class="tire" id="' + c + '_tire"><img src="' + tireImg + '" width="16" border=0></td>' +
        //html += '<td class="maker" id="' + c + '_maker"><img src="' + makerImg + '" width="16" border=0></td>' +
        html += '<td class="time col-best" id="' + c + '_best" style="font-weight:bold;">' + data.BEST_DISP + '</td>' +
            '<td class="lap col-lapno" id="' + c + '_bestlap">' + data.BEST_LAPS + '</td>' +
            '<td class="time" id="' + c + '_gap"></td>' +
            '<td class="time col-diff" id="' + c + '_diff"></td>';
        if (sector >= 1) {
            html += '<td class="time col-sec" id="' + c + '_sec1" style="font-weight:bold;color:' + getLapColor(data.SEC1_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC1_DISP + '</div></td>';
        }
        if (sector >= 2) {
            html += '<td class="time col-sec" id="' + c + '_sec2" style="font-weight:bold;color:' + getLapColor(data.SEC2_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC2_DISP + '</div></td>';
        }
        if (sector >= 3) {
            html += '<td class="time col-sec" id="' + c + '_sec3" style="font-weight:bold;color:' + getLapColor(data.SEC3_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC3_DISP + '</div></td>';
        }
        if (sector >= 4) {
            html += '<td class="time col-sec" id="' + c + '_sec4" style="font-weight:bold;color:' + getLapColor(data.SEC4_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC4_DISP + '</div></td>';
        }
        if (speed == 'ON') {
            html += '<td class="time col-speed" id="' + c + '_speed" style="font-weight:bold;color:' + getLapColor(data.SPEED_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + doubleToSpeed(data.SPEED) + '</div></td>';
        }
        html += '<td class="time" id="' + c + '_last" style="font-weight:bold;color:' + getLapColor(data.LAST_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.LAST_DISP + '</div></td>';
        html += '<td class="lap" id="' + c + '_laps">' + data.LAPS + '</td>' +
            '<td class="pit col-pit" id="' + c + '_pit">' + data.PIT + '</td>' +
            '</tr></table>';
    } else {
        html = '<table class="listtable" style="table-layout: fixed;"><tr>' +
            '<td class="posup" id="' + c + '_posup"></td>' +
            '<td class="pos" id="' + c + '_pos"></td>' +
            '<td class="no" id="' + c + '_no">' + data.CARNO + '</td>' +
            '<td class="info" id="' + c + '_status"><img src="' + pitImg + '" width="16" border=0></td>';
        if (lang == "EN") {
            html += '<td class="driver" id="' + c + '_driver"><div>' + data.DRIVER_J + '</div></td>';
        } else {
            html += '<td class="driver" id="' + c + '_driver"><div>' + data.DRIVER_J + '</div></td>';
        }
        //html += '<td class="tire" id="' + c + '_tire"><img src="' + tireImg + '" width="16" border=0></td>' +
        //html += '<td class="maker" id="' + c + '_maker"><img src="' + makerImg + '" width="16" border=0></td>' +
        html += '<td class="lap" id="' + c + '_laps">' + data.LAPS + '</td>' +
            '<td class="time" id="' + c + '_gap"></td>' +
            '<td class="time col-diff" id="' + c + '_diff"></td>';
        if (sector >= 1) {
            html += '<td class="time col-sec" id="' + c + '_sec1" style="font-weight:bold;color:' + getLapColor(data.SEC1_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC1_DISP + '</div></td>';
        }
        if (sector >= 2) {
            html += '<td class="time col-sec" id="' + c + '_sec2" style="font-weight:bold;color:' + getLapColor(data.SEC2_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC2_DISP + '</div></td>';
        }
        if (sector >= 3) {
            html += '<td class="time col-sec" id="' + c + '_sec3" style="font-weight:bold;color:' + getLapColor(data.SEC3_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC3_DISP + '</div></td>';
        }
        if (sector >= 4) {
            html += '<td class="time col-sec" id="' + c + '_sec4" style="font-weight:bold;color:' + getLapColor(data.SEC4_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC4_DISP + '</div></td>';
        }
        if (speed == 'ON') {
            html += '<td class="time col-speed" id="' + c + '_speed" style="font-weight:bold;color:' + getLapColor(data.SPEED_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + doubleToSpeed(data.SPEED) + '</div></td>';
        }
        html += '<td class="time" id="' + c + '_last" style="font-weight:bold;color:' + getLapColor(data.LAST_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.LAST_DISP + '</div></td>';
        html += '<td class="time col-best" id="' + c + '_best" style="font-weight:bold;">' + data.BEST_DISP + '</td>' +
            '<td class="lap col-lapno" id="' + c + '_bestlap">' + data.BEST_LAPS + '</td>' +
            '<td class="pit col-pit" id="' + c + '_pit">' + data.PIT + '</td>' +
            '</tr></table>';
    }

    $(id).html(html);

}

function setPassingLine(data) {

    var c = "c" + data.CARNO;
    var id = "#" + c;

    var sort = 0;
    if (racemode == "B") {
        if (data.RUN_FLAG == "1") {
            sort = data.BEST_TIME * -1;
        } else {
            sort = -99999 - data.START_POS;
        }
    } else {
        if (data.RUN_FLAG == "1") {
            sort = (data.LAPS * 10000000) - data.TOTAL_TIME;
        } else {
            sort = -99999 - data.START_POS;
        }
    }

    var pitImg = "/images/trd/dummy.gif";
    if (data.STATUS == "P") {
        pitImg = "/images/trd/pit.png";
    } else if (data.STATUS == "G") {
        pitImg = "/images/trd/checker.png";
    }

    var tireImg = "/images/trd/dummy.gif";
    if (data.TIRE != null) {
        if (data.TIRE.length > 0) {
            tireImg = "/images/trd/" + data.TIRE + ".png";
        }
    }

    var makerImg = "/images/trd/dummy.gif";
    if (data.MAKER != null) {
        if (data.MAKER.length > 0) {
            makerImg = "/images/trd/" + data.MAKER + ".png";
        }
    }

    // Rebuild the full HTML table to ensure consistent layout
    var html = "";
    if (racemode == "B") {
        html = '<table class="listtable" style="table-layout: fixed;"><tr>' +
            '<td class="pos" id="' + c + '_pos"></td>' +
            '<td class="no" id="' + c + '_no">' + data.CARNO + '</td>' +
            '<td class="info" id="' + c + '_status"><img src="' + pitImg + '" width="16" border=0></td>';
        if (lang == "EN") {
            html += '<td class="driver" id="' + c + '_driver"><div>' + data.DRIVER_J + '</div></td>';
        } else {
            html += '<td class="driver" id="' + c + '_driver"><div>' + data.DRIVER_J + '</div></td>';
        }
        html += '<td class="time col-best" id="' + c + '_best" style="font-weight:bold;">' + data.BEST_DISP + '</td>' +
            '<td class="lap col-lapno" id="' + c + '_bestlap">' + data.BEST_LAPS + '</td>' +
            '<td class="time" id="' + c + '_gap"></td>' +
            '<td class="time col-diff" id="' + c + '_diff"></td>';
        if (sector >= 1) {
            html += '<td class="time col-sec" id="' + c + '_sec1" style="font-weight:bold;color:' + getLapColor(data.SEC1_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC1_DISP + '</div></td>';
        }
        if (sector >= 2) {
            html += '<td class="time col-sec" id="' + c + '_sec2" style="font-weight:bold;color:' + getLapColor(data.SEC2_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC2_DISP + '</div></td>';
        }
        if (sector >= 3) {
            html += '<td class="time col-sec" id="' + c + '_sec3" style="font-weight:bold;color:' + getLapColor(data.SEC3_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC3_DISP + '</div></td>';
        }
        if (sector >= 4) {
            html += '<td class="time col-sec" id="' + c + '_sec4" style="font-weight:bold;color:' + getLapColor(data.SEC4_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC4_DISP + '</div></td>';
        }
        if (speed == 'ON') {
            html += '<td class="time col-speed" id="' + c + '_speed" style="font-weight:bold;color:' + getLapColor(data.SPEED_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + doubleToSpeed(data.SPEED) + '</div></td>';
        }
        html += '<td class="time" id="' + c + '_last" style="font-weight:bold;color:' + getLapColor(data.LAST_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.LAST_DISP + '</div></td>';
        html += '<td class="lap" id="' + c + '_laps">' + data.LAPS + '</td>' +
            '<td class="pit col-pit" id="' + c + '_pit">' + data.PIT + '</td>' +
            '</tr></table>';
    } else {
        html = '<table class="listtable" style="table-layout: fixed;"><tr>' +
            '<td class="posup" id="' + c + '_posup"></td>' +
            '<td class="pos" id="' + c + '_pos"></td>' +
            '<td class="no" id="' + c + '_no">' + data.CARNO + '</td>' +
            '<td class="info" id="' + c + '_status"><img src="' + pitImg + '" width="16" border=0></td>';
        if (lang == "EN") {
            html += '<td class="driver" id="' + c + '_driver"><div>' + data.DRIVER_J + '</div></td>';
        } else {
            html += '<td class="driver" id="' + c + '_driver"><div>' + data.DRIVER_J + '</div></td>';
        }
        html += '<td class="lap" id="' + c + '_laps">' + data.LAPS + '</td>' +
            '<td class="time" id="' + c + '_gap"></td>' +
            '<td class="time col-diff" id="' + c + '_diff"></td>';
        if (sector >= 1) {
            html += '<td class="time col-sec" id="' + c + '_sec1" style="font-weight:bold;color:' + getLapColor(data.SEC1_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC1_DISP + '</div></td>';
        }
        if (sector >= 2) {
            html += '<td class="time col-sec" id="' + c + '_sec2" style="font-weight:bold;color:' + getLapColor(data.SEC2_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC2_DISP + '</div></td>';
        }
        if (sector >= 3) {
            html += '<td class="time col-sec" id="' + c + '_sec3" style="font-weight:bold;color:' + getLapColor(data.SEC3_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC3_DISP + '</div></td>';
        }
        if (sector >= 4) {
            html += '<td class="time col-sec" id="' + c + '_sec4" style="font-weight:bold;color:' + getLapColor(data.SEC4_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.SEC4_DISP + '</div></td>';
        }
        if (speed == 'ON') {
            html += '<td class="time col-speed" id="' + c + '_speed" style="font-weight:bold;color:' + getLapColor(data.SPEED_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + doubleToSpeed(data.SPEED) + '</div></td>';
        }
        html += '<td class="time" id="' + c + '_last" style="font-weight:bold;color:' + getLapColor(data.LAST_FLAG) + ';"><div style="width: 60px; overflow: hidden;">' + data.LAST_DISP + '</div></td>';
        html += '<td class="time col-best" id="' + c + '_best" style="font-weight:bold;">' + data.BEST_DISP + '</td>' +
            '<td class="lap col-lapno" id="' + c + '_bestlap">' + data.BEST_LAPS + '</td>' +
            '<td class="pit col-pit" id="' + c + '_pit">' + data.PIT + '</td>' +
            '</tr></table>';
    }

    $(id).html(html);

    // Apply animation for sector passing
    var sec = "";
    if (data.type == "L") {
        sec = "s4";
    } else if (data.type == "1") {
        sec = "s1";
    } else if (data.type == "2") {
        sec = "s2";
    } else if (data.type == "3") {
        sec = "s3";
    }

    if (sec.length > 0) {
        $(id).css('animation', sec + " 1s 1");
        $(id).css('-webkit-animation', sec + " 1s 1");
        $(id).on('webkitAnimationEnd', function () {
            $(id).css('-webkit-animation', "none");
            $(id).css('background-color', "#111");
        });

        $(id).on('animationend', function () {
            $(id).css('animation', sec + " 0s 0");
            $(id).css('background-color', "#111");
        });
    }

    // Update sort attribute for mixItUp
    $(id).attr("data-sort", sort);

}

function getLapColor(colorCode) {
    var res = "#fff";
    if (colorCode == "1") {
        res = "#0f0";
    } else if (colorCode == "2") {
        res = "#F0F";
    }
    return res;
}

$(function () {
    $('#Container').mixItUp({
        callbacks: {
            onMixLoad: function () {
            },
            onMixStart: function () {
            },
            onMixEnd: function () {
                var list = $("#ListArea").children('div');
                var toplap = 0;
                var beforelap = 0;
                var toptime = 0;
                var beforetime = 0;
                var gap = "";
                var diff = "";
                var pos = 1;

                //LoopMode
                var topsector = 0;
                var topsec1 = 0;
                var topsec2 = 0;
                var topsec3 = 0;
                var toplaptime = 0;
                var beforetimesec1 = 0;
                var beforetimesec2 = 0;
                var beforetimesec3 = 0;
                var beforetimefl = 0;

                var beforetopsec1 = 0;
                var beforetopsec2 = 0;
                var beforetopsec3 = 0;
                var beforetoplaptime = 0;
                var beforesector = 0;






                for (var i = 0; i < list.length; i++) {
                    var id = list.eq(i).attr('id');
                    var data = getLineData(id.substr(1));
                    if (data == null) {
                        continue;
                    }
                    var rclass = list.eq(i).attr('class').substr(13);
                    if (dispclass != "all") {
                        if (dispclass != rclass) {
                            continue;
                        }
                    }
                    var laps = 0;
                    if (data.LAPS.length > 0) {
                        laps = parseInt(data.LAPS, 10);
                    }
                    if (pos == 1) {
                        gap = "-";
                        diff = "-";
                        if (racemode == "B") {
                            toptime = data.BEST_TIME;
                            beforetime = data.BEST_TIME;
                        } else {
                            toplap = laps;

                            //if ( !isLoop ) {  //NormalMode
                            toptime = data.TOTAL_TIME;
                            beforetime = data.TOTAL_TIME;
                            //} else {  //LoopMode
                            //    toptime = data.PASSING_TOTAL;
                            //    beforetime = data.PASSING_TOTAL;
                            //    topsector = data.PASSING_SECTOR;                                
                            //    topsec1 = data.SEC1_SEQ;
                            //    topsec2 = data.SEC2_SEQ;                        
                            //    topsec3 = data.SEC3_SEQ;
                            //    toplaptime = data.TOTAL_TIME; 
                            //    beforetimesec1 = data.SEC1_SEQ;
                            //    beforetimesec2 = data.SEC2_SEQ;
                            //    beforetimesec3 = data.SEC3_SEQ;
                            //    beforetimefl = data.TOTAL_TIME;
                            //  }


                            //beforetopsec1 = topsec1;
                            //beforetopsec2 = topsec2;
                            //beforetopsec3 = topsec3;
                            //beforetoplaptime = toplaptime;

                            beforelap = laps;


                        }
                    } else {
                        if (racemode == "B") {
                            if (data.BEST_TIME == 9999999999) {
                                gap = "";
                                diff = "";
                            } else {
                                gap = (data.BEST_TIME - toptime).toFixed(3);
                                if (gap >= 60) {
                                    gap = doubleToTime(gap);
                                }
                                diff = (data.BEST_TIME - beforetime).toFixed(3);
                                if (diff >= 60) {
                                    diff = doubleToTime(diff);
                                }
                            }
                            beforetime = data.BEST_TIME;
                        } else {

                            //Gap
                            if (toplap > data.LAPS) {
                                //if ( !isLoop ) {  //NormalMode
                                gap = (toplap - laps).toString() + " LAP";
                                //} else {  //LoopMode
                                /*
                                                                           if ( data.PASSING_SECTOR == "1" ) {
                                                                               if ((toplap - laps) > 1 ){
                                                                                   gap = (toplap - laps).toString() + " LAP";
                                                                               } else {
                                                                                   //if ((data.PASSING_TOTAL - toptime) >= 0 ) {
                                                                                   //     gap = (toplap - laps).toString() + " LAP";
                                                                                   //} else {
                                                                                   if ( (toplap - laps) == 1 &&  topsector >= data.PASSING_SECTOR ){
                                                                                       gap = (toplap - laps).toString() + " LAP";
                                                                                   } else {
                                                                                       gap = ( data.PASSING_TOTAL - beforetopsec1 ).toFixed(3);
                                                                                       if( gap >= 60 ) {
                                                                                           gap = doubleToTime(gap);
                                                                                       }
                                                                                   }
                                                                               }
                                                                           } else if ( data.PASSING_SECTOR == "2" ) {
                                                                               if ((toplap - laps) > 1 ){
                                                                                   gap = (toplap - laps).toString() + " LAP";
                                                                               } else {
                                                                                   //if ((data.PASSING_TOTAL - toptime) >= 0 ) {
                                                                                   //     gap = (toplap - laps).toString() + " LAP";
                                                                                   //} else {
                                                                                   if ( (toplap - laps) == 1 &&  topsector >= data.PASSING_SECTOR ){ 
                                                                                       gap = (toplap - laps).toString() + " LAP";
                                                                                   } else {
                                                                                        gap = ( data.PASSING_TOTAL - beforetopsec2 ).toFixed(3);
                                                                                        if( gap >= 60 ) {
                                                                                            gap = doubleToTime(gap);
                                                                                        }
                                                                                   }
                                                                               }
                                                                           } else if ( data.PASSING_SECTOR == "3" ) {
                                                                               if ((toplap - laps) > 1 ){
                                                                                   gap = (toplap - laps).toString() + " LAP";
                                                                               } else {
                                                                                   //if ((data.PASSING_TOTAL - toptime) >= 0 ) {
                                                                                   //     gap = (toplap - laps).toString() + " LAP";
                                                                                   //} else {
                                                                                   if ( (toplap - laps) == 1 &&  topsector >= data.PASSING_SECTOR ){ 
                                                                                       gap = (toplap - laps).toString() + " LAP";
                                                                                   } else {
                                                                                       gap = ( data.PASSING_TOTAL - beforetopsec3 ).toFixed(3);
                                                                                       if( gap >= 60 ) {
                                                                                           gap = doubleToTime(gap);
                                                                                       }
                                                                                   }
                                                                               }
                                                                           } else if ( data.PASSING_SECTOR == "0" ) {
                                                                               if ((toplap - laps) > 1 ){
                                                                                //if ( (data.PASSING_TOTAL - toplaptime) <= 0 ) {
                                                                                    gap = (toplap - laps).toString() + " LAP";
                                                                                //}
                                                                               } else {
                                                                                   //if ((data.PASSING_TOTAL - toptime) >= 0 ) {
                                                                                   //    gap = (toplap - laps).toString() + " LAP";
                                                                                   //} else {
                                                                                    if ( (toplap - laps) == 1 && topsector >= data.PASSING_SECTOR ){ 
                                                                                       gap = (toplap - laps).toString() + " LAP";
                                                                                   } else {
                                                                                        gap = ( data.PASSING_TOTAL - beforetoplaptime ).toFixed(3);
                                                                                        if( gap >= 60 ) {
                                                                                           gap = doubleToTime(gap);
                                                                                        }
                                                                                   }
                                                                               }
                                                                           }                                           
                                                                        }
                                 */

                            } else {
                                //if ( !isLoop ) {  //NormalMode
                                gap = (data.TOTAL_TIME - toptime).toFixed(3);
                                if (gap >= 60) {
                                    gap = doubleToTime(gap);
                                }
                                //} else {  //LoopMode
                                //    if ( data.PASSING_SECTOR == "1" ) {
                                //        gap = ( data.PASSING_TOTAL - topsec1 ).toFixed(3);
                                //            if( gap >= 60 ) {
                                //               gap = doubleToTime(gap);
                                //           }
                                //    } else if ( data.PASSING_SECTOR == "2" ) {
                                //        gap = ( data.PASSING_TOTAL - topsec2 ).toFixed(3);
                                //            if( gap >= 60 ) {
                                //                gap = doubleToTime(gap);
                                //            }
                                //    } else if ( data.PASSING_SECTOR == "3" ) {
                                //        gap = ( data.PASSING_TOTAL - topsec3 ).toFixed(3);
                                //            if( gap >= 60 ) {
                                //                gap = doubleToTime(gap);
                                //            }
                                //    } else if ( data.PASSING_SECTOR == "0" ) { 
                                //        gap = ( data.TOTAL_TIME - toplaptime ).toFixed(3);
                                //            if( gap >= 60 ) {
                                //                gap = doubleToTime(gap);
                                //        }
                                //    }

                                //}

                            }

                            //Diff
                            if (beforelap > data.LAPS) {
                                //if ( !isLoop ) {  //NormalMode
                                diff = (beforelap - laps).toString() + " LAP";

                                /*                                    
                                                                    } else {  //LoopMode
                                                                         if ( data.PASSING_SECTOR == "1" ) {
                                                                            if ((beforelap - laps) > 1 ){
                                                                                 diff = (beforelap - laps).toString() + " LAP";
                                                                            } else {
                                                                                if ( (beforelap - laps) == 1 && beforesector >= data.PASSING_SECTOR ){
                                                                                    diff = (beforelap - laps).toString() + " LAP";
                                                                                } else {
                                                                                    diff = (data.PASSING_TOTAL - beforetimesec1).toFixed(3);
                                                                                              if( diff >= 60 ) {
                                                                                            diff = doubleToTime(diff);
                                                                                              }
                                                                                }
                                                                            }
                                                                        } else if ( data.PASSING_SECTOR == "2" ) {
                                                                            if ((beforelap - laps) > 1 ){
                                                                                 diff = (beforelap - laps).toString() + " LAP";
                                                                            } else {
                                                                                if ( (beforelap - laps) == 1 && beforesector >= data.PASSING_SECTOR ){
                                                                                        diff = (beforelap - laps).toString() + " LAP";
                                                                                } else {
                                                                                        diff = (data.PASSING_TOTAL - beforetimesec2).toFixed(3);
                                                                                        if( diff >= 60 ) {
                                                                                                diff = doubleToTime(diff);
                                                                                        }
                                                                                }
                                                                            }   
                                                                        } else if ( data.PASSING_SECTOR == "3" ) {
                                                                                if ((beforelap - laps) > 1 ){
                                                                                 diff = (beforelap - laps).toString() + " LAP";
                                                                            } else {
                                                                                if ( (beforelap - laps) == 1 && beforesector >= data.PASSING_SECTOR ){
                                                                                        diff = (beforelap - laps).toString() + " LAP";
                                                                                } else {
                                                                                        diff = (data.PASSING_TOTAL - beforetimesec3).toFixed(3);
                                                                                        if( diff >= 60 ) {
                                                                                                diff = doubleToTime(diff);
                                                                                        }
                                                                                }
                                                                            }
                                                                        } else if ( data.PASSING_SECTOR == "0" ) {
                                                                            if ((beforelap - laps) > 1 ){
                                                                                diff = (beforelap - laps).toString() + " LAP";
                                                                            } else {
                                                                                if ( (beforelap - laps) == 1 && beforesector >= data.PASSING_SECTOR ){
                                                                                        diff = (beforelap - laps).toString() + " LAP";
                                                                                } else {
                                                                                        diff = (data.PASSING_TOTAL - beforetimefl).toFixed(3);
                                                                                        if( diff >= 60 ) {
                                                                                                diff = doubleToTime(diff);
                                                                                        }
                                                                                } 
                                                                            }
                                                                        }
                                                                   }
                                */

                            } else {

                                //if ( !isLoop ) {//NormalMode
                                diff = (data.TOTAL_TIME - beforetime).toFixed(3);
                                if (diff >= 60) {
                                    diff = doubleToTime(diff);
                                }
                                //} else {  //LoopMode
                                //	if ( data.PASSING_SECTOR == "1" ) {
                                //        diff = (data.PASSING_TOTAL - beforetimesec1).toFixed(3);
                                //        if( diff >= 60 ) {
                                //            diff = doubleToTime(diff);
                                //        }
                                //    } else if ( data.PASSING_SECTOR == "2" ) {
                                //        diff = (data.PASSING_TOTAL - beforetimesec2).toFixed(3);
                                //            if( diff >= 60 ) {
                                //                diff = doubleToTime(diff);
                                //            }
                                //    } else if ( data.PASSING_SECTOR == "3" ) {
                                //        diff = (data.PASSING_TOTAL - beforetimesec3).toFixed(3);
                                //            if( diff >= 60 ) {
                                //                diff = doubleToTime(diff);
                                //           }
                                //    } else if ( data.PASSING_SECTOR == "0" ) {
                                //        diff = (data.PASSING_TOTAL - beforetimefl).toFixed(3);
                                //            if( diff >= 60 ) {
                                //                diff = doubleToTime(diff);
                                //            }
                                //    }

                                //}

                            }

                            //if ( !isLoop ) {  //NormalMode
                            beforetime = data.TOTAL_TIME;
                            //} else {  //LoopMode
                            //    beforetimesec1 = data.SEC1_SEQ;
                            //    beforetimesec2 = data.SEC2_SEQ;
                            //    beforetimesec3 = data.SEC3_SEQ;
                            //    beforetimefl = data.TOTAL_TIME;
                            //    beforesector = data.PASSING_SECTOR;
                            //}

                            beforelap = laps;



                        }
                        if (gap <= "0.000") {
                            gap = "";
                        }
                        // else if (gap < "0.000"){
                        //    gap = "--.---";
                        //}

                        if (diff <= "0.000") {
                            diff = "";
                        }
                        // else if(diff < "0.000"){
                        //    diff = "--.---";
                        //    gap = "--.---";
                        //}
                    }
                    if (racemode != "B") {
                        var posup = data.START_POS - pos;
                        if (posup == 0) {
                            $("#" + id + "_posup").text("");
                            $("#" + id + "_posup").css('background-image', 'url("/images/trd/dummy.gif")');
                        } else if (posup < 0) {
                            posup *= -1;
                            $("#" + id + "_posup").text(posup);
                            $("#" + id + "_posup").css('background-image', 'url("/images/trd/posdown.png")');
                        } else if (posup > 0) {
                            $("#" + id + "_posup").text(posup);
                            $("#" + id + "_posup").css('background-image', 'url("/images/trd/posup.png")');
                        }
                    }
                    $("#" + id + "_pos").text(pos);
                    $("#" + id + "_gap").text(gap);
                    $("#" + id + "_diff").text(diff);
                    $("#" + id).css('animation', "none");
                    pos++;
                }
            }
        }
    })
});

function personalClick(c, d, t, r) {
    console.log(c);
    console.log(d);
    console.log(t);
    console.log(r);
    console.log(racemode);
    //var url = 'personal?carno=' + c + '&team_j=' + encodeURIComponent(t) + '&raceclass=' + r;
    //var url = 'gap.html?carno=' + c + '&team_j=' + encodeURIComponent(t) + '&raceclass=' + r + '&racemode=' + racemode;
    //var param = {"carno":c , "team": encodeURIComponent(t)};
    //var url = '/monitor/gap, param';

    //window.open(url, 'LivePersonal', 'width=900px,height=800px,location=no,resizable=yes,scrollbars=yes');
    window.open("/monitor/gap?carno=" + c + "&team_j=" + encodeURIComponent(t) + "&raceclass=" + r, "width=900px,height=800px,location=no,resizable=yes,scrollbars=yes");

}

var trackwin = null;

$(function () {
    //        $(".course").on('click',function(e){
    $(".course").click(function (e) {
        var top = e.screenY - 200;
        var left = e.screenX - 250;
        if (trackwin == null) {
            trackwin = window.open('/monitor/track_fsw', 'TrackPosition', 'top=' + top + ', left=' + left + ',width=400,height=800,location=no,resizable=yes');
        } else if (trackwin.closed) {
            trackwin = window.open('/monitor/track_fsw', 'TrackPosition', 'top=' + top + ', left=' + left + ',width=400,height=800,location=no,resizable=yes');
        } else {
            trackwin.focus();
        }

        return false;
    });
});

function getLineData(carno) {
    for (var index in liveList) {
        if (liveList[index].CARNO == carno) {
            return liveList[index];
        }
    }
    return null;
}

function setBestInfo(data) {
    $("#fastno").text(data.LAP_BEST_NO);
    $("#fastname").text(data.LAP_BEST_DRIVER_J);
    $("#fasttime").text(bestDisp(false, data.LAP_BEST_TIME, data.LAP_BEST_LAPS));
    if (sector >= 1) {
        $("#sec1no").text(data.S1_BEST_NO);
        $("#sec1name").text(data.S1_BEST_DRIVER_J);
        $("#sec1time").text(bestDisp(false, data.S1_BEST_TIME, data.S1_BEST_LAPS));
    }
    if (sector >= 2) {
        $("#sec2no").text(data.S2_BEST_NO);
        $("#sec2name").text(data.S2_BEST_DRIVER_J);
        $("#sec2time").text(bestDisp(false, data.S2_BEST_TIME, data.S2_BEST_LAPS));
    }
    if (sector >= 3) {
        $("#sec3no").text(data.S3_BEST_NO);
        $("#sec3name").text(data.S3_BEST_DRIVER_J);
        $("#sec3time").text(bestDisp(false, data.S3_BEST_TIME, data.S3_BEST_LAPS));
    }
    if (sector >= 4) {
        $("#sec4no").text(data.S4_BEST_NO);
        $("#sec4name").text(data.S4_BEST_DRIVER_J);
        $("#sec4time").text(bestDisp(false, data.S4_BEST_TIME, data.S4_BEST_LAPS));
    }
    if (speed == 'ON') {
        $("#spdno").text(data.SPD_BEST_NO);
        $("#spdname").text(data.SPD_BEST_DRIVER_J);
        $("#spdkm").text(bestDisp(true, data.SPD_BEST_KM, data.SPD_BEST_LAPS));
    }
}

function bestDisp(spd, time, laps) {
    if (laps.length == 0) {
        return "";
    } else {
        if (spd) {
            return doubleToSpeed(time) + " (" + laps + ")";
        } else {
            return doubleToTime(time) + " (" + laps + ")";
        }
    }

}

function doubleToSpeed(sSpeed) {

    if (sSpeed.length == 0) {
        return "";
    }

    var dSpeed = +sSpeed;

    if (dSpeed <= 0) {
        return "";
    }
    return dSpeed.toFixed(2);
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
        return ("00" + ss.toFixed(3)).substr(-6);
    }

}
