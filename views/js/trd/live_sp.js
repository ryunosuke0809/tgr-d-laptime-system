var lang = "JP";
var webSocket = null;
var liveList = new Object();
var dispclass = "all";
var racemode = "B";
var c = $.cookie("superformula");
if (c != null) {
    lang = c;
}
let isVirtical = "";

var ua = navigator.userAgent;
if (navigator.userAgent.indexOf('Android') > 0) {
    if (navigator.userAgent.indexOf('Chrome') < 0) {
        if (parseFloat(navigator.userAgent.slice(ua.indexOf("Android") + 8)) < 4.4) {
            alert("Android4.4以下の標準ブラウザは対応していません。Chromeブラウザを使用して下さい。");
        }
    }
}

$(function () {
        $("#livetitle").css("width", window.innerWidth);
        $("#container-area").css("height", window.innerHeight - 86);
        $("#Container").css("width", window.innerWidth);
        $("#content").css("width", window.innerWidth);
});


window.addEventListener("orientationchange", () => {
    var direction = Math.abs(window.orientation);
    if (direction == 90) {
        isVirtical = false;
        localStorage.setItem('isVirtical', JSON.stringify(isVirtical));
    } else {
        isVirtical = true;
        localStorage.setItem('isVirtical', JSON.stringify(isVirtical));
    }
    location.reload();
});

let storage = localStorage.getItem('isVirtical');
if (storage == "false") {
    isVirtical = false;
} else {
    $("#livetitle").css("width", window.innerWidth - 200);
    isVirtical = true;
}






const resize = () => {

    let timeoutID = 0;
    let delay = 300;

    window.addEventListener("resize", () => {
        clearTimeout(timeoutID);
        timeoutID = setTimeout(() => {
            setResize();
        }, delay);
    }, false);
};

resize();

function setResize() {
    var innerHeight = window.innerHeight;
    var innerWidth = window.innerWidth;
    $("#container-area").css("height", innerHeight - 86);
}

$(function () {
    $(window).focus();
    $(window).bind("focus", function () {
        location.reload();
    }).bind("blur", function () {
    });
});

function init() {
    try {
        webSocket = new WebSocket(uri);
        webSocket.onopen = onOpen;
        webSocket.onmessage = onMessage;
        webSocket.onclose = onClose;
        webSocket.onerror = onError;
    } catch (e) { }
}
function onOpen(event) { }
function onMessage(event) {
    if (event && event.data) {
        try {
            var j = $.parseJSON(event.data);
            setData(j);
        } catch (e) {
            console.log(e);
        }
    }
}
function onError(event) { }
function onClose(event) {
    webSocket = null;
    setTimeout("init()", 10);
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
    } else if (j.type == '1' || j.type == '2' || j.type == '3' || j.type == 'L' || j.type == 'K') {
        setLineData(j);
        if (j.type == 'L') {
            $('#Container').mixItUp('sort', 'sort:desc');
        }
    } else if (j.type == 'U') {
        setLineData(j);
    } else if (j.type == 'I') {
        setStatusData(j.CARNO, "P", j.PIT);
    } else if (j.type == 'O') {
        setStatusData(j.CARNO, "", "");
    } else if (j.type == 'D') {
        setDriverData(j);
    } else if (j.type == 'U') {
        setDriverData(j);
    } else if (j.type == 'S') {
        racemode = j.RACE_TYPE;
        $(".title").text(j.DESCR_J);
        var classList = j.CLASS_LIST.split(",");
        var liClass = '<ul class="classmenu" style="position:absolute;top:0px;left:230px;"><li class="current" id="class_all"><a href="javaScript:setFilter(\'all\');" data-hover="ALL">ALL</a></li>';
        for (i = 0; i < classList.length; i++) {
            liClass += '<li id="class_' + classList[i] + '"><a href="javaScript:setFilter(\'' + classList[i] + '\');" data-hover="' + classList[i] + '">' + classList[i] + '</a></li>';
        }
        liClass += '</ul>';
        $("#classfilter").html(liClass);
        setBestInfo(j)
    } else if (j.type == 'W') {
        $("#weather").attr("src", "/images/trd/" + j.weather + ".png");
        $("#condition").text(j.condition);
    } else if (j.type == 'T') {
        $("#telop").text(j.msg);
    } else if (j.type == 'F') {
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
        var liId = list
            .eq(i)
            .attr('id')
            .substr(6);
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
                $("#c" + liveList[index].CARNO + "_tire").html('<img src="' + tireImg + '" width="16" border=0>');
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
                $(c + "_driver").html('<div style="width: 90px; overflow: hidden; text-overflow: ellipsis;">' + data.DRIVER_E + '<br><div style="font-size:0.8em;">' + data.TEAM_E + '</div></div></td>');
            } else {
                $(c + "_driver").html('<div style="width: 90px; overflow: hidden; text-overflow: ellipsis;">' + data.DRIVER_J + '<br><div style="font-size:0.8em;">' + data.TEAM_J + '</div></div></td>');
            }
            $(c + "_tire").html('<img src="' + tireImg + '" width="16" border=0>');
            //$(c + "_maker").html('<img src="' + makerImg + '" width="16" border=0>');
            break;
        }
    }
}
function setListTitle() {



    var html = "";
    if (racemode == "B") {
        html = '<table class="listtable" style="table-layout: fixed;"><tr>';
        html += '<th class="pos">POS</th>';
        html += '<th class="title_no">No.</th>';
        html += '<th class="info"></th>';
        html += '<th class="driver">Driver</th>';
        html += '<th class="time">BestTime</th>' + '<th class="lap">(L)</th>';
        html += '<th class="time">Gap</th>';
        if (!isVirtical) {
            html += '<th class="time">Diff</th>';
            if (sector >= 1) {
                html += '<th class="time">S1</th>';
            }
            if (sector >= 2) {
                html += '<th class="time">S2</th>';
            }
            if (sector >= 3) {
                html += '<th class="time">S3</th>';
            }
            if (sector >= 4) {
                html += '<th class="time">S4</th>';
            }
            if (speed == "ON") {
                html += '<th class="time">Speed</th>';
            }
        }

        html += '<th class="time">LastLap</th>';
        html += '<th class="lap">Laps</th>';
        if (!isVirtical) {
            //html += '<th class="pit">PIT</th>';
        }
        html += '</tr></table>';
    } else {
        html = '<table class="listtable"><tr>';
        html += '<th class="posup"></th>';
        html += '<th class="pos">POS</th>';
        html += '<th class="title_no">No.</th>';
        html += '<th class="info"></th>';
        html += '<th class="driver">Driver</th>';
        html += '<th class="lap">Laps</th>';
        html += '<th class="time">Gap</th>';
        html += '<th class="time">Diff</th>';
        if (sector >= 1) {
            html += '<th class="time">S1</th>';
        }
        if (sector >= 2) {
            html += '<th class="time">S2</th>';
        }
        if (sector >= 3) {
            html += '<th class="time">S3</th>';
        }
        if (sector >= 4) {
            html += '<th class="time">S4</th>';
        }
        if (speed == "ON") {
            html += '<th class="time">Speed</th>';
        }
        html += '<th class="time">LastLap</th>';
        html += '<th class="time">BestTime</th>' +
            '<th class="lap">(L)</th>' +
            '<th class="pit">PIT</th>';
        html += '</tr></table>';
    }
    $("#c-1").html(html);
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
            html += '<td class="driver" id="' + c + '_driver"><div style="width: 90px; overflow: hidden; text-overflow: ellipsis;">' + data.DRIVER_J + '</div></td>';
        } else {
            html += '<td class="driver" id="' + c + '_driver"><div style="width: 90px; overflow: hidden; text-overflow: ellipsis;">' + data.DRIVER_J + '</div></td>';
        }
        //html += '<td class="tire" id="' + c + '_tire"><img src="' + tireImg + '" width="16" border=0></td>' +
        //html += '<td class="maker" id="' + c + '_maker"><img src="' + makerImg + '" width="16" border=0></td>' +
        html += '<td class="time" id="' + c + '_best" style="font-weight:bold;">' + data.BEST_DISP + '</td>' +
            '<td class="lap" id="' + c + '_bestlap">' + data.BEST_LAPS + '</td>' +
            '<td class="time" id="' + c + '_gap"></td>';
        if (!isVirtical) {
            html += '<td class="time" id="' + c + '_diff"></td>';

            if (sector >= 1) {
                html += '<td class="time" id="' + c + '_sec1" style="font-weight:bold;color:' + getLapColor(data.SEC1_FLAG) + ';"><div style="width: 120px; overflow: hidden;">' + data.SEC1_DISP + '</div></td>';
            }
            if (sector >= 2) {
                html += '<td class="time" id="' + c + '_sec2" style="font-weight:bold;color:' + getLapColor(data.SEC2_FLAG) + ';"><div style="width: 120px; overflow: hidden;">' + data.SEC2_DISP + '</div></td>';
            }
            if (sector >= 3) {
                html += '<td class="time" id="' + c + '_sec3" style="font-weight:bold;color:' + getLapColor(data.SEC3_FLAG) + ';"><div style="width: 120px; overflow: hidden;">' + data.SEC3_DISP + '</div></td>';
            }
            if (sector >= 4) {
                html += '<td class="time" id="' + c + '_sec4" style="font-weight:bold;color:' + getLapColor(data.SEC4_FLAG) + ';"><div style="width: 120px; overflow: hidden;">' + data.SEC4_DISP + '</div></td>';
            }
            if (speed == 'ON') {
                html += '<td class="time" id="' + c + '_speed" style="font-weight:bold;color:' + getLapColor(data.SPEED_FLAG) + ';"><div style="width: 120px; overflow: hidden;">' + doubleToSpeed(data.SPEED) + '</div></td>';
            }
        }
        html += '<td class="time" id="' + c + '_last" style="font-weight:bold;color:' + getLapColor(data.LAST_FLAG) + ';"><div style="width: 120px; overflow: hidden;">' + data.LAST_DISP + '</div></td>';
        html += '<td class="lap" id="' + c + '_laps">' + data.LAPS + '</td>';
        if (!isVirtical) {
            //html += '<td class="pit" id="' + c + '_pit">' + data.PIT + '</td>';
        }
        html += '</tr></table>';
    } else {
        html = '<table class="listtable" style="table-layout: fixed;"><tr>' +
            '<td class="posup" id="' + c + '_posup"></td>' +
            '<td class="pos" id="' + c + '_pos"></td>' +
            '<td class="no" id="' + c + '_no">' + data.CARNO + '</td>' +
            '<td class="info" id="' + c + '_status"><img src="' + pitImg + '" width="16" border=0></td>';
        if (lang == "EN") {
            html += '<td class="driver" id="' + c + '_driver"><div style="width: 90px; overflow: hidden; text-overflow: ellipsis;">' + data.DRIVER_J + '</div></td>';
        } else {
            html += '<td class="driver" id="' + c + '_driver"><div style="width: 90px; overflow: hidden; text-overflow: ellipsis;">' + data.DRIVER_J + '</div></td>';
        }
        //html += '<td class="tire" id="' + c + '_tire"><img src="' + tireImg + '" width="16" border=0></td>' +
        //html += '<td class="maker" id="' + c + '_maker"><img src="' + makerImg + '" width="16" border=0></td>' +
        html += '<td class="lap" id="' + c + '_laps">' + data.LAPS + '</td>' +
            '<td class="time" id="' + c + '_gap"></td>' +
            '<td class="time" id="' + c + '_diff"></td>';
        if (sector >= 1) {
            html += '<td class="time" id="' + c + '_sec1" style="font-weight:bold;color:' + getLapColor(data.SEC1_FLAG) + ';"><div style="width: 120px; overflow: hidden;">' + data.SEC1_DISP + '</div></td>';
        }
        if (sector >= 2) {
            html += '<td class="time" id="' + c + '_sec2" style="font-weight:bold;color:' + getLapColor(data.SEC2_FLAG) + ';"><div style="width: 120px; overflow: hidden;">' + data.SEC2_DISP + '</div></td>';
        }
        if (sector >= 3) {
            html += '<td class="time" id="' + c + '_sec3" style="font-weight:bold;color:' + getLapColor(data.SEC3_FLAG) + ';"><div style="width: 120px; overflow: hidden;">' + data.SEC3_DISP + '</div></td>';
        }
        if (sector >= 4) {
            html += '<td class="time" id="' + c + '_sec4" style="font-weight:bold;color:' + getLapColor(data.SEC4_FLAG) + ';"><div style="width: 120px; overflow: hidden;">' + data.SEC4_DISP + '</div></td>';
        }
        if (speed == 'ON') {
            html += '<td class="time" id="' + c + '_speed" style="font-weight:bold;color:' + getLapColor(data.SPEED_FLAG) + ';"><div style="width: 120px; overflow: hidden;">' + doubleToSpeed(data.SPEED) + '</div></td>';
        }
        html += '<td class="time" id="' + c + '_last" style="font-weight:bold;color:' + getLapColor(data.LAST_FLAG) + ';"><div style="width: 120px; overflow: hidden;">' + data.LAST_DISP + '</div></td>';
        html += '<td class="time" id="' + c + '_best" style="font-weight:bold;">' + data.BEST_DISP + '</td>' +
            '<td class="lap" id="' + c + '_bestlap">' + data.BEST_LAPS + '</td>' +
            '<td class="pit" id="' + c + '_pit">' + data.PIT + '</td>' +
            '</tr></table>';
    }

    $(id).html(html);

}

function setPassingLine(data) {


    var c = "#c" + data.CARNO;

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
        //        if( data.LAPS == 0 ) {
        //            sort = 1000000 + (data.PASSING_SECTOR * 100000) - data.PASSING_TOTAL;
        //        } else {
        //            sort = (data.LAPS * 10000000) + (data.PASSING_SECTOR * 100000) - data.PASSING_TOTAL;
        //        }    
        //}
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

    $(c + "_status").html('<img src="' + pitImg + '" width="16" border=0>');
    if (lang == "EN") {
        //$(c + "_driver").html('<div style="width: 170px; overflow: hidden;">' + data.DRIVER_J + '<br><div style="font-size:0.8em;">' + data.TEAM_J + '</div></div></td>');
        $(c + "_driver").html('<div style="width: 90px; overflow: hidden; text-overflow: ellipsis;">' + data.DRIVER_J + '</div></td>');
    } else {
        //$(c + "_driver").html('<div style="width: 170px; overflow: hidden;">' + data.DRIVER_J + '<br><div style="font-size:0.8em;">' + data.TEAM_J + '</div></div></td>');
        $(c + "_driver").html('<div style="width: 90px; overflow: hidden; text-overflow: ellipsis;">' + data.DRIVER_J + '</div></td>');
    }
    //$(c + "_tire").html('<img src="' + tireImg + '" width="16" border=0>');
    //$(c + "_maker").html('<img src="' + makerImg + '" width="16" border=0>');
    $(c + "_best").text(data.BEST_DISP);
    $(c + "_bestlap").text(data.BEST_LAPS);

    if (!isVirtical) {
        if (sector >= 1) {
            $(c + "_sec1").text(data.SEC1_DISP);
            $(c + "_sec1").css('color', getLapColor(data.SEC1_FLAG));
        }
        if (sector >= 2) {
            $(c + "_sec2").text(data.SEC2_DISP);
            $(c + "_sec2").css('color', getLapColor(data.SEC2_FLAG));
        }
        if (sector >= 3) {
            $(c + "_sec3").text(data.SEC3_DISP);
            $(c + "_sec3").css('color', getLapColor(data.SEC3_FLAG));
        }
        if (sector >= 4) {
            $(c + "_sec4").text(data.SEC4_DISP);
            $(c + "_sec4").css('color', getLapColor(data.SEC4_FLAG));
        }
        if (speed == 'ON') {
            $(c + "_speed").text(doubleToSpeed(data.SPEED));
            $(c + "_speed").css('color', getLapColor(data.SPEED_FLAG));
        }
    }
    $(c + "_last").text(data.LAST_DISP);
    $(c + "_laps").text(data.LAPS);
    if (!isVirtical) {
        //$(c + "_pit").text(data.PIT);
    }
    $(c + "_last").css('color', getLapColor(data.LAST_FLAG));

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
        $(c).css('animation', sec + " 1s 1");
        $(c).css('-webkit-animation', sec + " 1s 1");
        $(c).on('webkitAnimationEnd', function () {
            $(c).css('-webkit-animation', "none");
            //            $(c).css('-webkit-animation-play-state', "paused");
            $(c).css('background-color', "#111");
        });

        $(c).on('animationend', function () {
            $(c).css('animation', sec + " 0s 0");
            //            $(c).css('animation-play-state', "paused");
            $(c).css('background-color', "#111");
        });
    }

    $(c).attr("data-sort", sort);

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
            onMixLoad: function () { },
            onMixStart: function () { },
            onMixEnd: function () {
                var list = $("#ListArea").children('div');
                var toplap = 0;
                var beforelap = 0;
                var toptime = 0;
                var beforetime = 0;
                var gap = "";
                var diff = "";
                var pos = 1;
                for (var i = 0; i < list.length; i++) {
                    var id = list.eq(i).attr('id');
                    var data = getLineData(id.substr(1));
                    if (data == null) {
                        continue;
                    }
                    var rclass = list
                        .eq(i)
                        .attr('class')
                        .substr(13);
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
                            toptime = data.TOTAL_TIME;
                            beforetime = data.TOTAL_TIME;
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
                            } beforetime = data.BEST_TIME;
                        } else {
                            if (toplap > data.LAPS) {
                                gap = (toplap - laps).toString() + " LAP";
                            } else {
                                gap = (data.TOTAL_TIME - toptime).toFixed(3);
                            }
                            if (beforelap > data.LAPS) {
                                diff = (beforelap - laps).toString() + " LAP";
                            } else {
                                diff = (data.TOTAL_TIME - beforetime).toFixed(3);
                            } beforetime = data.TOTAL_TIME;
                            beforelap = laps;
                        }
                        if (gap <= "0.000") {
                            gap = "";
                        }
                        if (diff <= "0.000") {
                            diff = "";
                        }
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
                    if (!isVirtical) {
                        $("#" + id + "_diff").text(diff);
                    }
                    $("#" + id).css('animation', "none");
                    pos++;
                }
            }
        }
    })
});
function personalClick(c, d, t, r) {
    var url = 'personal?carno=' + c + '&team_j=' + encodeURIComponent(t) + '&raceclass=' + r;
    //window.open(url, 'LivePersonal', 'width=900px,height=800px,location=no,resizable=yes,scrollbars=yes');
    window.open("/monitor/gap?carno="+c+"&team_j="+encodeURIComponent(t)+ "&raceclass=" + r,"width=900px,height=800px,location=no,resizable=yes,scrollbars=yes");
}
var trackwin = null;
$(function () {
    $(".course").click(function (e) {
        var top = e.screenY - 200;
        var left = e.screenX - 250;
        if (trackwin == null) {
            trackwin = window.open('track?circuit=superformula', 'TrackPosition', 'top=' + top + ', left=' + left + ',width=400,height=800,location=no,resizable=yes');
        } else if (trackwin.closed) {
            trackwin = window.open('track?circuit=superformula', 'TrackPosition', 'top=' + top + ', left=' + left + ',width=400,height=800,location=no,resizable=yes');
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
    var dSpeed = + sSpeed;
    if (dSpeed <= 0) {
        return "";
    }
    return dSpeed.toFixed(2);
}
function doubleToTime(dTime) {
    if (dTime <= 0) {
        return "";
    }
    var hh = 0;
    var mi = 0;
    var ss = 0;
    if (dTime > 3600) {
        hh = Math.floor(dTime / 3600);
    }
    var m1 = dTime - (hh * 3600);
    if (m1 > 60) {
        mi = Math.floor(m1 / 60);
    }
    ss = m1 - (mi * 60);
    if (hh > 0) {
        return hh + ":" + (
            "00" + mi
        ).substr(-2) + ":" + ss.toFixed(3);
    } else if (mi > 0) {
        return mi + ":" + (
            "00" + ss.toFixed(3)
        ).substr(-6);
    } else {
        return ("00" + ss.toFixed(3)).substr(-6);
    }
}

function getNow() {
    var dateObj = new Date();
    timeHour = dateObj.getHours();
    timeMinutes = dateObj.getMinutes();
    timeSeconds = dateObj.getSeconds();

    // 一桁の場合は0を追加
    if (timeHour < 10) {
        timeHour = '0' + timeHour;
    };
    if (timeMinutes < 10) {
        timeMinutes = '0' + timeMinutes;
    };
    if (timeSeconds < 10) {
        timeSeconds = '0' + timeSeconds;
    };

    // 文字列の結合
    result = timeHour + ':' + timeMinutes + ':' + timeSeconds;
    //console.log(result);
    $(".now").text(result);
};
setInterval('getNow()', 1000);
