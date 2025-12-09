$(function() {
  const CLICK_EVENT_TYPE = 'ontouchstart' in window ? 'touchend' : 'click';

  var BASE_WIDTH  = Math.min($("body").outerWidth() - 10, 970);
  var BASE_HEIGHT = Math.min($("#ListArea").outerHeight() + $("#ListArea").position().top, 650);

  var jsonkey = null;
  var tireinfoTouchMoved = false;
  var pitLaps = null;
  var domObj = null;


  var uid = getParam('u');
  var sid = getParam('s');

  var saveEditFlg = false;
  $.post(
    "/exec/getgrant",
    {"s":sid,"u":uid},
    function(res){
      if( res.result != 'OK') {
        //openTimeoutDialog();
      } else {
        console.log("res.GRANT01 ==" + res.GRANT01);
          if( res.GRANT01 == '0' ) {
            saveEditFlg = true;
           } else {
            saveEditFlg = false;
          }
      }
    }
  );

  function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  $(document).on("touchmove", "*", function(e) {
    tireinfoTouchMoved = true;
  });
  $(document).on("touchstart", "*", function(e) {
    tireinfoTouchMoved = false;
  });

  var toJson = function(element) {
    let data = $(element).serializeArray();
    let json = {};
    $.each(data, function () {
      if (json[this.name] !== undefined) {
        if (!json[this.name].push) {
          json[this.name] = [json[this.name]];
        }
        json[this.name].push(this.value || '');
      } else {
        json[this.name] = this.value || '';
      }
    });
    return json;
  }

  $(document).on("focus", "input[readonly]", function() {
    $(this).blur();
  });

  // live2.jsp
  $(document).on(CLICK_EVENT_TYPE, 'td[id$="_setno"]', function(e) {
    e.preventDefault();
    if (tireinfoTouchMoved == true) {
      return false;
    }

    BASE_WIDTH  = Math.min($("#LiveArea").outerWidth() - 10, 970);
    BASE_HEIGHT = Math.min($("#LiveArea").outerHeight(), 650);

    let domId = $(this).attr('id');
    let carno = domId.replace(/^c(\d+)_.*/, '$1');
    pitLaps = ("" + tireinfoData["PIT_LAPS"][carno]).split(",");

    try {
      jsonkey = tireinfoData.current[carno]["TIREINFO_KEY"];
    } catch(e) {
      console.log(e);
    }

    //var tiData = tireinfoData.data[jsonkey];
    let startPitLaps = 0;
    let endPitLaps = 0;
    if (tireinfoData.data[tireinfoData["SCHEDULE_NO"]][jsonkey] === undefined) {
      //console.log("carno=" + carno + ", pitLaps=[" + pitLaps + "]" + ", length=[" + pitLaps.length + "]");
      if (pitLaps != "" && pitLaps != "undefined") {
        endPitLaps = 0;
      } else {
        for (let index in pitLaps) {
          endPitLaps = pitLaps[index];
          startPitLaps = Math.max(startPitLaps, endPitLaps);
        }
      }
    } else {
      startPitLaps = Math.max(parseInt(tireinfoData.data[tireinfoData["SCHEDULE_NO"]][jsonkey]["LAPS_FROM"]) - 1, 1);
      endPitLaps = parseInt(tireinfoData.data[tireinfoData["SCHEDULE_NO"]][jsonkey]["LAPS_TO"]);
    }
    //console.log("titleindex=" + currentTireInfo["TITLE_INDEX"] + ", startPitLaps=" + startPitLaps + ", endPitLaps=" + endPitLaps);

    createLapsList(tireinfoData.current[carno]["CARNO"], startPitLaps, endPitLaps);
    createTireinfoMainDialog(jsonkey, carno);

    return false;
  });

  // lapslist.html, timelist.html
  $(document).on(CLICK_EVENT_TYPE, 'td[class="time"]', function(e) {
    e.preventDefault();
    if (tireinfoTouchMoved == true) {
      return false;
    }

    let domId = $(this).attr('id');
    let laps = null;
    let titleindex = domId.replace(/.*_(\d+)$/, '$1');

    if ($("#LapsTitleArea").length > 0) {
      laps = domId.replace(/^l(\d+)_.*/, '$1');
    } else if ($("#TimeTitleArea").length > 0) {
      if (timeData.rows === undefined && timeData.rows.length < 0) {
        return;
      }

      let endtimes = parseInt(domId.replace(/t(\d+)_.*/, '$1'));
      laps = 0;
      let endloop = false;
      for (let timeindex in timeData.rows) {
        let timeJson = timeData.rows[timeindex];
        for (let key in timeJson) {
          if (parseInt(timeJson["times"].replace(":","")) > endtimes) {
            endloop = true;
            break;
          }
          if (key != ("time_" + (parseInt(titleindex) + 1)) || timeJson[key].length < 1) {
            continue;
          }
          laps++;
        }

        if (endloop == true) {
          break;
        }
      }
      laps = Math.max(laps, 1);
    }

    //console.log("laps=" + laps + ", titleindex=" + titleindex);
    let carno = titleData.rows[titleindex].carno;
    //console.log("carno=" + carno);
    //console.log("pitLaps=" + JSON.stringify(tireinfoData["PIT_LAPS"]));
    pitLaps = ("" + tireinfoData["PIT_LAPS"][carno]).split(",");
    //console.log("laps=" + laps + ", titleindex=" + titleindex + ", carno=" + carno + ", pitLaps=[" + pitLaps + "]");

    let startPitLaps = 0;
    let endPitLaps = 0;
    if (pitLaps != "" && pitLaps != "undefined") {
      for (let index in pitLaps) {
        endPitLaps = pitLaps[index];
        if (parseInt(endPitLaps) >= parseInt(laps)) {
          break;
        }
        startPitLaps = Math.max(startPitLaps, endPitLaps);
      }
      if (startPitLaps == endPitLaps) {
        endPitLaps = 0;
      }
    }
    //console.log("startPitLaps=" + startPitLaps + ", endPitLaps=" + endPitLaps);

    createLapsList(carno, startPitLaps, endPitLaps);
    jsonkey = Math.max(startPitLaps + 1, 1) + "_" + carno;
    createTireinfoMainDialog(jsonkey, carno);

    return false;
  });

  $(document).on(CLICK_EVENT_TYPE, ".ui-widget-overlay", function(e) {
    e.preventDefault();
    closeSubDialog(null);
    $(".ui-dialog-content").dialog("destroy");
    $(".ui-dialog").remove();
    return false;
  });

  $(document).on(CLICK_EVENT_TYPE, "td[id^='SET_NO_']", function(e) {
    e.preventDefault();
    setCursorPoint($(this));
    closeSubDialog(null);

    let domId = $(this).attr("id");
    $("#tireinfo-setno-value").text($("#" + domId + "-value").val());

    createTireinfoSetNoDialog($(this));

    // initiailize.
    inputTireinfoSetNo();

    return false;
  });

  $(document).on(CLICK_EVENT_TYPE, "input[id^='tireinfo-setno-input_']", function(e) {
    e.preventDefault();
    let domId = $(this).attr("id");
    let buttonValue = domId.replace("tireinfo-setno-input_", "");
    inputTireinfoSetNo(buttonValue);

    return false;
  });

  $(document).on("keydown", "#tireinfo-dialog-setno-input", function(e) {
    e.preventDefault();
    console.log("keyCode=" + e.keyCode);
    if (e.keyCode == 83/*S*/) {
      inputTireinfoSetNo("SET");
    } else if (e.keyCode == 87/*W*/) {
      inputTireinfoSetNo("WET");
    } else if (e.keyCode == 67/*C*/ || e.keyCode == 8/*Backspace*/ || e.keyCode == 46/*Delete*/) {
      inputTireinfoSetNo("C");
    } else if (e.keyCode >= 48/*0*/ && e.keyCode <= 57/*9*/) {
      inputTireinfoSetNo("" + (e.keyCode - 48));
    }
    return false;
  });

  $(document).on(CLICK_EVENT_TYPE, "#tireinfo-setno-prevcopy", function(e) {
    e.preventDefault();
    console.log("jsonkey=" + jsonkey + " pitLaps=" + pitLaps);
    try {
      let tikey_laps = jsonkey.split("_")[0];
      let tikey_carno = jsonkey.split("_")[1];

      for (let index in pitLaps) {
        let laps = pitLaps[index];
        if (parseInt(tikey_laps) == parseInt(laps) + 1) {
          laps = pitLaps[index - 1];
          laps = laps === undefined ? 0 : laps;
          let ti = tireinfoData.data[tireinfoData["SCHEDULE_NO"]][(parseInt(laps) + 1) + "_" + tikey_carno];
          $("input[name='SET_NO_FL']").val(ti["SET_NO_FL"]);
          $("input[name='SET_NO_FR']").val(ti["SET_NO_FR"]);
          $("input[name='SET_NO_RL']").val(ti["SET_NO_RL"]);
          $("input[name='SET_NO_RR']").val(ti["SET_NO_RR"]);

          //--------------- add ----phase2-----------
          var raceid = tireinfoData["raceinfo"]["RACE_ID"];
          var series = tireinfoData["raceinfo"]["SERIES"];
          var setno_fl = ti["SET_NO_FL"];
          var setno_fr = ti["SET_NO_FR"];
          var setno_rl = ti["SET_NO_RL"];
          var setno_rr = ti["SET_NO_RR"];
          $.post(
            "/exec/getAllSerial",
            {"series":series, "raceid":raceid, "carno":tikey_carno, "setno_fl":setno_fl, "setno_fr":setno_fr,"setno_rl":setno_rl,"setno_rr":setno_rr}, function(res){
              console.log("res.result===" + res.result);
              if( res.result != 'OK') {
                // Messageの表示
              } else {
                // Serial 情報の表示
                var serial_no_fl = (res.SERIAL_NO_FL==null) ? "" :res.SERIAL_NO_FL ;
                var serial_no_fr = (res.SERIAL_NO_FR==null) ? "" :res.SERIAL_NO_FR ;
                var serial_no_rl = (res.SERIAL_NO_RL==null) ? "" :res.SERIAL_NO_RL ;
                var serial_no_rr = (res.SERIAL_NO_RR==null) ? "" :res.SERIAL_NO_RR ;
                $("input[name='SERIAL_NO_FL']").val(serial_no_fl);
                $("input[name='SERIAL_NO_FR']").val(serial_no_fr);
                $("input[name='SERIAL_NO_RL']").val(serial_no_rl);
                $("input[name='SERIAL_NO_RR']").val(serial_no_rr);
              }
            }
          );
/*
          if (ti["SPEC_NAME_FL"] == undefined || ti["SPEC_NAME_FL"] =="") {
            $("input[name='SERIAL_NO_FL']").val(ti["SERIAL_NO_FL"]);
            $("input[name='SERIAL_NO_FR']").val(ti["SERIAL_NO_FR"]);
            $("input[name='SERIAL_NO_RL']").val(ti["SERIAL_NO_RL"]);
            $("input[name='SERIAL_NO_RR']").val(ti["SERIAL_NO_RR"]);
          } else {
            $("input[name='SERIAL_NO_FL']").val(ti["SPEC_NAME_FL"]);
            $("input[name='SERIAL_NO_FR']").val(ti["SPEC_NAME_FR"]);
            $("input[name='SERIAL_NO_RL']").val(ti["SPEC_NAME_RL"]);
            $("input[name='SERIAL_NO_RR']").val(ti["SPEC_NAME_RR"]);
          };
*/
          //--------------- add ---------------    
          break;
        }
      }
    } catch(e) {

      $("input[name='SET_NO_FL']").val("");
      $("input[name='SET_NO_FR']").val("");
      $("input[name='SET_NO_RL']").val("");
      $("input[name='SET_NO_RR']").val("");
      $("input[name='SERIAL_NO_FL']").val("");
      $("input[name='SERIAL_NO_FR']").val("");
      $("input[name='SERIAL_NO_RL']").val("");
      $("input[name='SERIAL_NO_RR']").val("");
    }

    return false;
  });

  $(document).on(CLICK_EVENT_TYPE, "#tireinfo-temp-detailchk", function(e) {
    e.preventDefault();
    setCursorPoint(null);
    closeSubDialog(null);
    if ($(this).attr("detail-checked") === undefined || $(this).attr("detail-checked") == "false") {
      $("[id*='SHOULDER']").parent().show();
      $("#tireinfo-comment").height("50px");
      $(this).attr("detail-checked", "true");
      $(this).text("すべて表示しない");
    } else {
      $("[id*='SHOULDER']").parent().hide();
      $("#tireinfo-comment").height("100px");
      $(this).attr("detail-checked", "false");
      $(this).text("すべて表示する");
    }

    setTableBorder($("#tireinfo-table-setno"));
    setTableBorder($("#tireinfo-table-temp"));
    setTableBorder($("#tireinfo-table-pressure_bf"));
    setTableBorder($("#tireinfo-table-pressure_af"));

    return false;
  });

  $(document).on(CLICK_EVENT_TYPE, "input[id^='tireinfo-info-input_']", function(e) {
    e.preventDefault();
    let domId = $(this).attr("id");
    let buttonValue = domId.replace("tireinfo-info-input_", "");
    inputTireinfoInfoValue(buttonValue);

    return false;
  });

  $(document).on("keydown", "#tireinfo-dialog-info-input", function(e) {
    e.preventDefault();
    console.log("keyCode=" + e.keyCode);
    if (e.keyCode == 190/*.*/) {
      inputTireinfoInfoValue(".");
    } else if (e.keyCode == 67/*C*/ || e.keyCode == 8/*Backspace*/ || e.keyCode == 46/*Delete*/) {
      inputTireinfoInfoValue("C");
    } else if (e.keyCode >= 48/*0*/ && e.keyCode <= 57/*9*/) {
      inputTireinfoInfoValue("" + (e.keyCode - 48));
    }
    return false;
  });

  function inputTireinfoInfoValue(buttonValue) {
    if (buttonValue == "C") {
      $("#tireinfo-info-value").text("");
    }
    let textValue = $("#tireinfo-info-value").text();
    if (textValue.length > 5) {
      return;
    }
    if (buttonValue == "." && textValue.indexOf(".") == -1 && textValue.length < 5) {
      if (textValue == "") {
        textValue = "0";
      }
      $("#tireinfo-info-value").text(textValue + buttonValue);
    } else if (buttonValue.match("[0-9]")) {
      $("#tireinfo-info-value").text(textValue + buttonValue);
    }
  }

  $(document).on(CLICK_EVENT_TYPE, "td[id^='TEMP_'], td[id^='PRESSURE_']", function(e) {
    e.preventDefault();

    setCursorPoint($(this));
    closeSubDialog(null);
    createTireinfoInputDialog($(this));

    return false;
  });

  function createTireinfoMainDialog(jsonkey, carno) {
    let dialogDomId = "tireinfo-dialog";

    $("#" + dialogDomId).dialog({
      title: "タイヤ情報",
      width: BASE_WIDTH,
      height: BASE_HEIGHT,
      resizable: false,
      modal: true,
      show: "clip",
      hide: "clip",
      position: { my: "left top", at: "left top", of: window },
      open: function(event, ui) {
        $(this).closest(".ui-dialog").find(".ui-widget").css("font-size", "2em");
        $("#tireinfo-setno-prevcopy").css("font-size", "13px");
        $(this).closest(".ui-dialog").find("[id$='-save']").css("color", "#ff0000");
        $(this).closest(".ui-dialog").find("[id$='-cancel']").css("color", "#ff0000");

        $("input[name^='SET_NO_']").val("");
        $("input[name^='TEMP_']").val("");
        $("input[name^='PRESSURE_']").val("");
        $("input[name='COMMENT']").val("");

        $("input[name^='SERIAL_NO_']").val("");

        let tireinfoData_ = tireinfoData.data[tireinfoData["SCHEDULE_NO"]];
        console.log(tireinfoData);
        console.log(tireinfoData_);

        if (jsonkey in tireinfoData_ ) {
          $("input[name='SET_NO_FL']").val(tireinfoData_[jsonkey]["SET_NO_FL"]);
          $("input[name='SET_NO_FR']").val(tireinfoData_[jsonkey]["SET_NO_FR"]);
          $("input[name='SET_NO_RL']").val(tireinfoData_[jsonkey]["SET_NO_RL"]);
          $("input[name='SET_NO_RR']").val(tireinfoData_[jsonkey]["SET_NO_RR"]);
          $("input[name='TEMP_OUT_FL']").val(tireinfoData_[jsonkey]["TEMP_OUT_FL"]);
          $("input[name='TEMP_CENTER_FL']").val(tireinfoData_[jsonkey]["TEMP_CENTER_FL"]);
          $("input[name='TEMP_IN_FL']").val(tireinfoData_[jsonkey]["TEMP_IN_FL"]);
          $("input[name='TEMP_OUT_FR']").val(tireinfoData_[jsonkey]["TEMP_OUT_FR"]);
          $("input[name='TEMP_CENTER_FR']").val(tireinfoData_[jsonkey]["TEMP_CENTER_FR"]);
          $("input[name='TEMP_IN_FR']").val(tireinfoData_[jsonkey]["TEMP_IN_FR"]);
          $("input[name='TEMP_OUT_RL']").val(tireinfoData_[jsonkey]["TEMP_OUT_RL"]);
          $("input[name='TEMP_CENTER_RL']").val(tireinfoData_[jsonkey]["TEMP_CENTER_RL"]);
          $("input[name='TEMP_IN_RL']").val(tireinfoData_[jsonkey]["TEMP_IN_RL"]);
          $("input[name='TEMP_OUT_RR']").val(tireinfoData_[jsonkey]["TEMP_OUT_RR"]);
          $("input[name='TEMP_CENTER_RR']").val(tireinfoData_[jsonkey]["TEMP_CENTER_RR"]);
          $("input[name='TEMP_IN_RR']").val(tireinfoData_[jsonkey]["TEMP_IN_RR"]);
          $("input[name='PRESSURE_BF_FL']").val(tireinfoData_[jsonkey]["PRESSURE_BF_FL"]);
          $("input[name='PRESSURE_BF_FR']").val(tireinfoData_[jsonkey]["PRESSURE_BF_FR"]);
          $("input[name='PRESSURE_BF_RL']").val(tireinfoData_[jsonkey]["PRESSURE_BF_RL"]);
          $("input[name='PRESSURE_BF_RR']").val(tireinfoData_[jsonkey]["PRESSURE_BF_RR"]);
          $("input[name='PRESSURE_AF_FL']").val(tireinfoData_[jsonkey]["PRESSURE_AF_FL"]);
          $("input[name='PRESSURE_AF_FR']").val(tireinfoData_[jsonkey]["PRESSURE_AF_FR"]);
          $("input[name='PRESSURE_AF_RL']").val(tireinfoData_[jsonkey]["PRESSURE_AF_RL"]);
          $("input[name='PRESSURE_AF_RR']").val(tireinfoData_[jsonkey]["PRESSURE_AF_RR"]);
          $("input[name='COMMENT']").val(tireinfoData_[jsonkey]["COMMENT"]);

//--------------- add ----phase2-----------

          if (tireinfoData_[jsonkey]["SPEC_NAME_FL"] == undefined || tireinfoData_[jsonkey]["SPEC_NAME_FL"] =="" || tireinfoData_[jsonkey]["SPEC_NAME_FL"] == null) {
            if (tireinfoData_[jsonkey]["SERIAL_NO_FL"] == undefined || tireinfoData_[jsonkey]["SERIAL_NO_FL"] == "" || tireinfoData_[jsonkey]["SERIAL_NO_FL"] == null){
              // シリアルデータ取得
              var raceid = tireinfoData["raceinfo"]["RACE_ID"];
              var series = tireinfoData["raceinfo"]["SERIES"];
              var setno_fl = tireinfoData_[jsonkey]["SET_NO_FL"];
              var setno_fr = tireinfoData_[jsonkey]["SET_NO_FR"];
              var setno_rl = tireinfoData_[jsonkey]["SET_NO_RL"];
              var setno_rr = tireinfoData_[jsonkey]["SET_NO_RR"];
              $.post(
                "/exec/getAllSerial",
                {"series":series, "raceid":raceid, "carno":carno, "setno_fl":setno_fl, "setno_fr":setno_fr,"setno_rl":setno_rl,"setno_rr":setno_rr}, function(res){
                  console.log("res.result===" + res.result);
                  if( res.result != 'OK') {
                    // Messageの表示
                  } else {
                    // Serial 情報の表示
                    var serial_no_fl = (res.SERIAL_NO_FL==null) ? "" :res.SERIAL_NO_FL ;
                    var serial_no_fr = (res.SERIAL_NO_FR==null) ? "" :res.SERIAL_NO_FR ;
                    var serial_no_rl = (res.SERIAL_NO_RL==null) ? "" :res.SERIAL_NO_RL ;
                    var serial_no_rr = (res.SERIAL_NO_RR==null) ? "" :res.SERIAL_NO_RR ;
                    $("input[name='SERIAL_NO_FL']").val(serial_no_fl);
                    $("input[name='SERIAL_NO_FR']").val(serial_no_fr);
                    $("input[name='SERIAL_NO_RL']").val(serial_no_rl);
                    $("input[name='SERIAL_NO_RR']").val(serial_no_rr);
                  }
                }
              );
            
            } else {
              $("input[name='SERIAL_NO_FL']").val(tireinfoData_[jsonkey]["SERIAL_NO_FL"]);
              $("input[name='SERIAL_NO_FR']").val(tireinfoData_[jsonkey]["SERIAL_NO_FR"]);
              $("input[name='SERIAL_NO_RL']").val(tireinfoData_[jsonkey]["SERIAL_NO_RL"]);
              $("input[name='SERIAL_NO_RR']").val(tireinfoData_[jsonkey]["SERIAL_NO_RR"]);
            }
          } else {
            $("input[name='SERIAL_NO_FL']").val(tireinfoData_[jsonkey]["SPEC_NAME_FL"]);
            $("input[name='SERIAL_NO_FR']").val(tireinfoData_[jsonkey]["SPEC_NAME_FR"]);
            $("input[name='SERIAL_NO_RL']").val(tireinfoData_[jsonkey]["SPEC_NAME_RL"]);
            $("input[name='SERIAL_NO_RR']").val(tireinfoData_[jsonkey]["SPEC_NAME_RR"]);
          };
//--------------- add ---------------

        }

        $("#tireinfo-comment").text($("input[name='COMMENT']").val());
      },
      close: function() {
        $(".ui-widget-overlay").trigger("click");
      },
      buttons: [
        { id: dialogDomId + "-clear",
          width: 150,
          height: 50,
          text: "Clear",
          click: function(e) {
            var datatype = $("#tireinfo-datatype").val();
            $("#tireinfo-dialog").find("input:not(#tireinfo-setno-prevcopy)").val("");
            $("#tireinfo-dialog").find("textarea").val("");
            $("#tireinfo-comment").text("");
            $("#tireinfo-datatype").val(datatype);
          }
        },
        { id: dialogDomId + "-save",
          width: 150,
          height: 50,
          text: "Save",
          disabled:saveEditFlg,
          click: function(e) {
            let json = toJson("#tireinfo-dialog-form");
            json["laps"] = jsonkey.split("_")[0];
            json["titleindex"] = jsonkey.split("_")[1];
            json["carno"] = carno;
            if ($("#tireinfo-datatype").val() == "history") {
              //console.log("tireinfoData.raceinfo=" + JSON.stringify(tireinfoData));
              json["raceinfo"] = tireinfoData["raceinfo"];
              json["SCHEDULE_NO"] = tireinfoData["SCHEDULE_NO"];
            }
            //console.log(JSON.stringify(json));
            socketio.emit("message", { "proc": "bsServer_tireinfo", "param": "set", "data": encodeURIComponent(JSON.stringify(json)) });

            setCursorPoint(null);
            $(this).dialog("close");
          }
        },
        { id: dialogDomId + "-cancel",
          width: 150,
          height: 50,
          text: "Cancel",
          click: function(e) {
            setCursorPoint(null);
            $(this).dialog("close");
          }
        }
      ]
    });

    // initiailize.
    $("input[type='button']").button();
    $("#tireinfo-info-value").text("");
    $("#tireinfo-temp-detailchk").prop("checked", false);
    $("[id*='SHOULDER']").parent().hide();
    $("#tireinfo-carno-label").text(carno);

    $("#tireinfo-point").remove();
    $("#tireinfo-dialog").append('<span id="tireinfo-point"></span>');
    $("#tireinfo-point").css("z-index", 9100);
    $("#tireinfo-point").css("position", "absolute");
    $("#tireinfo-point").hide();

    $("#tireinfo-dialog").dialog().css({"z-index": 9000});
    $("#tireinfo-dialog").css("font-family", $("body").css("font-family"));
    $("#tireinfo-dialog").show();

    $("[id^='borderline-']").remove();
    setTableBorder($("#tireinfo-table-setno"));
    setTableBorder($("#tireinfo-table-temp"));
    setTableBorder($("#tireinfo-table-pressure_bf"));
    setTableBorder($("#tireinfo-table-pressure_af"));
  }

  function createTireinfoSetNoDialog(elem) {
    let dialogDomId = "tireinfo-dialog-setno-input";
    $("#" + dialogDomId).dialog({
        //width: BASE_WIDTH,
        //height: BASE_HEIGHT,
        "z-index": 9100,
        resizable: false,
        modal: true,
        show: "blind",
        hide: "blind",
        //position: { my: "left top", at: "left top", of: window },
        position: { my: "left top", at: "left bottom", of: elem, offset: "0 0" },
        open: function(event, ui) {
          $(this).closest(".ui-dialog").find(".ui-widget").css("font-size", "2em");
          $(this).closest(".ui-dialog").find("[id$='-save']").css("color", "#ff0000");
          $(this).closest(".ui-dialog").find("[id$='-cancel']").css("color", "#ff0000");
          $(this).closest(".ui-dialog").find(".ui-dialog-titlebar:first").hide();
        },
        buttons: [
          { id: dialogDomId + "-save",
            width: isIE() ? 100 : 120,
            height: 50,
            text: "Save",
            click: function() {
              $("td[id^='SET_NO_']").each(function(index, elem) {
                if ($(elem).find("#tireinfo-point").length == 0) {
                  return true;
                }
                //console.log("id=" + $(elem).attr("id") + " border=" + $(elem).css("border"));
                let domId = $(elem).attr("id");
                let parts = domId.replace(/.*_([A-Z]+)$/, '$1');
                let subDomId = domId.substr(0, domId.length - parts.length);
                $("#tireinfo-setno-value").text(("" + $("#tireinfo-setno-value").text()).replace(/([SW])\.0+([1-9]+)/, "$1.$2"));
                $("#tireinfo-setno-value").text(("" + $("#tireinfo-setno-value").text()).replace(/([SW])\.0+$/, "$1.0"));
                //console.log("domId=" + domId + " parts=" + parts + " subDomId=" + subDomId);


                var setno = $("#tireinfo-setno-value").text();
                var carno = $("#tireinfo-carno-label").text();
                //console.log("carno = -------------------->>");
                //console.log(carno);                
                //console.log("-------- #tireinfo-setno-value = " + $("#tireinfo-setno-value").text())
                var front = "";
                var rear = "";
                var raceid = tireinfoData["raceinfo"]["RACE_ID"];
                var series = tireinfoData["raceinfo"]["SERIES"];
                //console.log(tireinfoData);
                //console.log(tireinfoData.data);
                //console.log(tireinfoData.raceinfo);
                //console.log(raceid);
                //console.log(series);

                $.post(
                  "/exec/getSerial",
                  {"series":series, "raceid":raceid, "carno":carno, "setno":setno},
                  function(res){
                    if( res.result != 'OK') {
                      // Messageの表示
                      window.alert(res.message);
                      return;
                    } else {
                      // Serial 情報の表示
                      front = res.SERIAL_FRONT;
                      rear = res.SERIAL_REAR;                      

                      if (parts == "FL") {
                        $("#" + subDomId + "FL-value").val($("#tireinfo-setno-value").text());
                        //if ($("#" + subDomId + "FL-value").val().length < 1) {
                        //  $("#" + subDomId + "FL-value").val($("#tireinfo-setno-value").text());
                        //}
                        $("#SERIAL_NO_FL-value").val(front);

                        if ($("#" + subDomId + "FR-value").val().length < 1) {
                          $("#" + subDomId + "FR-value").val($("#tireinfo-setno-value").text());
                          $("#SERIAL_NO_FR-value").val(front);
                        }
                        if ($("#" + subDomId + "RL-value").val().length < 1) {
                          $("#" + subDomId + "RL-value").val($("#tireinfo-setno-value").text());
                          $("#SERIAL_NO_RL-value").val(rear);
                        }
                        if ($("#" + subDomId + "RR-value").val().length < 1) {
                          $("#" + subDomId + "RR-value").val($("#tireinfo-setno-value").text());
                          $("#SERIAL_NO_RR-value").val(rear);
                        }
                      } else if (parts == "FR") {
                        $("#" + subDomId + "FR-value").val($("#tireinfo-setno-value").text());
                        $("#SERIAL_NO_FR-value").val(front);
                      } else if (parts == "RL") {
                        $("#" + subDomId + "RL-value").val($("#tireinfo-setno-value").text());
                        $("#SERIAL_NO_RL-value").val(rear);
                      } else if (parts == "RR") {
                        $("#" + subDomId + "RR-value").val($("#tireinfo-setno-value").text());
                        $("#SERIAL_NO_RR-value").val(rear);
                      }
      
                    }
                  }
                );
              });

              setCursorPoint(null);
              $(this).dialog("close");
            }
          },
          { id: dialogDomId + "-cancel",
            width: isIE() ? 100 : 120,
            height: 50,
            text: "Cancel",
            click: function() {;
              setCursorPoint(null);
              $(this).dialog("close");
            }
          }
        ]
      });
  }

  function createTireinfoInputDialog(elem) {
    let domId = elem.attr("id");
    $("#tireinfo-info-value").text($("#" + domId).find("input").val());

    let dialogDomId = "tireinfo-dialog-info-input";
    $("#" + dialogDomId).dialog({
        //width: BASE_WIDTH,
        //height: BASE_HEIGHT,
        "z-index": 9100,
        resizable: false,
        modal: true,
        show: "blind",
        hide: "blind",
        //position: { my: "left top", at: "left top", of: window },
        position: { my: "left right", at: "left" + (domId.match("^TEMP_") ? "+90" : "+130") + " bottom", of: elem, offset: "0 0" },
        open: function(event, ui) {
          $(this).closest(".ui-dialog").find(".ui-widget").css("font-size", "2em");
          $(this).closest(".ui-dialog").find(".ui-dialog-titlebar:first").hide();
          $(this).closest(".ui-dialog").find("[id$='-save']").css("color", "#ff0000");
          $(this).closest(".ui-dialog").find("[id$='-cancel']").css("color", "#ff0000");
        },
        buttons: [
          { id: dialogDomId + "-save",
            width: isIE() ? 100 : 120,
            height: 50,
            text: "Save",
            click: function() {
              let value = "" + $("#tireinfo-info-value").text();
              value = value.replace(/(\.[1-9]+)0+$/, "$1");
              value = value.replace(/\.0+$/, ".0");
              value = value.replace(/^0+/, "");
              $("input[name='" + domId + "']").val(value);

              setCursorPoint(null);
              $(this).dialog("close");
            }
          },
          { id: dialogDomId + "-cancel",
            width: isIE() ? 100 : 120,
            height: 50,
            text: "Cancel",
            click: function() {
              setCursorPoint(null);
              $(this).dialog("close");
            }
          }
        ]
      });
  }

  function createLapsList(carno, startPitLaps, endPitLaps) {
    let lapsDataRows = tireinfoData["laps"] ? tireinfoData["laps"].rows : lapsData.rows;
//console.log("lapsDataRows=" + JSON.stringify(lapsDataRows));
    let titleDataRows = tireinfoData["title"] ? tireinfoData["title"].rows : titleData.rows;
    let tiLapsSort = [];
    let targetTireInfo = null;

    //get targetTireinfo
    for (let tikey in tireinfoData.data[tireinfoData["SCHEDULE_NO"]]) {
      let tikey_carno = tikey.split("_")[1];
      if (tikey_carno != carno){
        continue;
      }
      var tiLaps = parseInt(tikey.replace("(\\d+)_.*", "$1"));
      if (tiLaps == startPitLaps + 1) {
        targetTireInfo = tireinfoData.data[tireinfoData["SCHEDULE_NO"]][tikey];
        break;
      }
    }
//console.log("targetTireInfo====" + JSON.stringify(targetTireInfo));
//console.log("tireinfoData.data=====" + JSON.stringify(tireinfoData.data));
    let tiLapsValue = 0;
    let tiLapsDiff = 0;
    if (targetTireInfo != null){
      for (let SCHEDULE_NO in tireinfoData.data) {

        if (Number(SCHEDULE_NO) > Number(tireinfoData["SCHEDULE_NO"])) {
          continue;
        }
//console.log("SCHEDULE_NO===" + SCHEDULE_NO)
        tiLapsSort = [];
        for (let tikey in tireinfoData.data[SCHEDULE_NO]) {
          let tikey_carno = tikey.split("_")[1];
          if (tikey_carno != carno){
            continue;
          }
          var tiLaps = parseInt(tikey.replace("(\\d+)_.*", "$1"));
          if (Number(SCHEDULE_NO) == Number(tireinfoData["SCHEDULE_NO"])) {
            //if (tiLaps == startPitLaps + 1) {
            //  //targetTireInfo = tireinfoData.data[tireinfoData["SCHEDULE_NO"]][tikey];
            //  targetTireInfo = tireinfoData.data[SCHEDULE_NO][tikey];
            //}
//console.log("tiLaps=" + tiLaps + " startPitLaps=" + startPitLaps + " " + endPitLaps);
            if (tiLaps == startPitLaps + 1 && tiLaps == endPitLaps && endPitLaps > 0) {
              tiLapsSort.push(tiLaps);
            } else if (tiLaps <= startPitLaps + 1 && (endPitLaps == 0 || tiLaps < endPitLaps)) {
              tiLapsSort.push(tiLaps);
            }
          } else {
            tiLapsSort.push(tiLaps);
          }
        }

        // Remove duplicate value.
        tiLapsSort = tiLapsSort.filter(function(item, pos, self) {
          return self.indexOf(item) == pos;
        })

        //let tiLapsValue = 0;
        //console.log("targetTireInfo=" + JSON.stringify(targetTireInfo));
        tiLapsSort.sort(function compareNumbers(a, b) { return a - b; });

        //console.log("tiLapsSort=" + JSON.stringify(tiLapsSort));
        for (let lapsSortindex in tiLapsSort) {
          let tiLaps = tiLapsSort[lapsSortindex];
          //console.log("tiLaps=" + tiLaps);
          let tikey = tiLaps + "_" + carno;

          //let tiData = tireinfoData.data[tireinfoData["SCHEDULE_NO"]][tikey];
          let tiData = tireinfoData.data[SCHEDULE_NO][tikey];

          //console.log("tikey======" + tikey);
          //console.log("tiData" + JSON.stringify(tiData));
          if (tiData === undefined) {
            continue;
          }
          if (targetTireInfo["SET_NO_FL"] != tiData["SET_NO_FL"] ||
              targetTireInfo["SET_NO_FR"] != tiData["SET_NO_FR"] ||
              targetTireInfo["SET_NO_RL"] != tiData["SET_NO_RL"] ||
              targetTireInfo["SET_NO_RR"] != tiData["SET_NO_RR"])
              {
                continue;
          }
          tiLapsValue = tiLapsDiff + 1;
          tiLapsDiff += parseInt(tiData["LAPS_TO"]) - parseInt(tiData["LAPS_FROM"]) + 1;
          console.log("tiLapsValue=" + tiLapsValue);
          console.log("tiLapsDiff=" + tiLapsDiff + " FROM=" + tiData["LAPS_FROM"] + " TO=" + tiData["LAPS_TO"]);
        }
      }
    }
    console.log("tiLapsValue=" + tiLapsValue);
    tiLapsValue = Math.max(tiLapsValue, 1);

    let dom = $("#tireinfo-lapslist").find("tbody");
    dom.html("");
    let lapsDipsIndex = 1;
    for (let index in lapsDataRows) {
      if (index < startPitLaps) {
        continue;
      }
      let titleindex = 0;
      for (var idx in titleDataRows) {
        if (titleDataRows[idx].carno == carno) {
          titleindex = idx;
          break;
        }
      }
      //console.log("lapsDataRows.index=" + index);
      let lapstime = lapsDataRows[index]["time_" + (parseInt(titleindex)+1)];
      if (!lapstime) {
        continue;
      }
      let html = '<tr>';
      html += '<td class="tireinfo-laps">' + (lapsDipsIndex) + '</td>';
      html += '<td class="tireinfo-historylaps">' + (tiLapsValue + lapsDipsIndex - 1) + '</td>';
      html += '<td class="tireinfo-lapstime">' + doubleToTime(lapstime) + '</td>';
      if (lapsDipsIndex == 1 && endPitLaps != 1) {
        html += '<td class="tireinfo-pit">' + "OUT" + '</td>';
      } else if (lapsDipsIndex == 1 && endPitLaps == 1) {
        html += '<td class="tireinfo-pit">' + (tireinfoData.raceinfo["CIRCUIT_PIT"] == "0" ? "IN" : "OUT") + '</td>';
      } else if ((startPitLaps + lapsDipsIndex) == endPitLaps) {
        html += '<td class="tireinfo-pit">' + "IN" + '</td>';
      } else {
        html += '<td class="tireinfo-pit"> </td>';
      }
      html += '</tr>';
      dom.append(html);

      // 最大50件
      if (lapsDipsIndex == 50) {
        break;
      }

      if ((startPitLaps + lapsDipsIndex) == endPitLaps) {
        break;
      }

      lapsDipsIndex++;
    }
  }

  function inputTireinfoSetNo(buttonValue) {
    if (buttonValue === undefined || buttonValue == "C") {
      $("input[id^='tireinfo-setno-input_']").css("opacity", "0.3");
      $("#tireinfo-setno-input_SET").css("opacity", "1.0");
      $("#tireinfo-setno-input_WET").css("opacity", "1.0");
      $("#tireinfo-setno-input_C").css("opacity", "1.0");
      buttonValue += "";
    }
    if (buttonValue == "C") {
      $("#tireinfo-setno-value").text("");
    }
    let textValue = $("#tireinfo-setno-value").text();
    if (buttonValue == "SET" || buttonValue == "WET") {
      buttonValue = buttonValue.slice(0, 1);
      $("#tireinfo-setno-value").text(buttonValue + ".");
      $("input[id^='tireinfo-setno-input_']").css("opacity", "1.0");
    } else if (buttonValue.match("[0-9]") && textValue.match("^[SW]\\.[0-9]{0,2}?$")) {
      $("#tireinfo-setno-value").text(textValue + buttonValue);
    }
  }

  $(document).on(CLICK_EVENT_TYPE, "#tireinfo-comment", function(e) {
    e.preventDefault();
    setCursorPoint(null);
    closeSubDialog(null);

    domObj = $("#tireinfo-dialog-comment-input").find("textarea");
    domObj.val($(this).text());
    domObj.width($(this).width());
    domObj.height($(this).height());
    domObj.css("font-size", $(this).css("font-size"));
    domObj[0].selectionStart = 0;
    domObj[0].selectionEnd = 0;

    let dialogDomId = "tireinfo-dialog-comment-input";
    $("#" + dialogDomId).dialog({
        width: domObj.width() + 30,
        //height: domObj.height(),
        "z-index": 9100,
        resizable: false,
        modal: true,
        show: "blind",
        hide: "blind",
        //position: { my: "left top", at: "left top", of: window },
        position: { my: "right bottom", at: "right top", of: $("#tireinfo-comment"), offset: "0 0" },
        open: function(event, ui) {
          $(this).closest(".ui-dialog").find(".ui-widget").css("font-size", "2em");
          $(this).closest(".ui-dialog").find("[id$='-save']").css("color", "#ff0000");
          $(this).closest(".ui-dialog").find("[id$='-cancel']").css("color", "#ff0000");
          $(this).closest(".ui-dialog").find(".ui-dialog-titlebar:first").hide();
        },
        buttons: [
          { id: dialogDomId + "-save",
            width: isIE() ? 100 : 120,
            height: 50,
            text: "Save",
            click: function(e) {
              $("#tireinfo-comment").text(domObj.val());
              $("input[name='COMMENT']").val(domObj.val());

              setCursorPoint(null);
              $(this).dialog("close");
            }
          },
          { id: dialogDomId + "-cancel",
            width: isIE() ? 100 : 120,
            height: 50,
            text: "Cancel",
            click: function(e) {
              setCursorPoint(null);
              $(this).dialog("close");
            }
          }
        ]
      });

    return false;
  });

  function setCursorPoint(elem) {
    if (elem == null) {
      $("#tireinfo-point").hide();
      return;
    }

    $("#tireinfo-point").appendTo("#" + elem.attr('id'));
    $("#tireinfo-point").hide();

    if (isIE()) {
      $("#tireinfo-point").width(elem.innerWidth() - 12);
      $("#tireinfo-point").height(elem.innerHeight() - 12);
      $("#tireinfo-point").css("top", elem.position().top + 5);
      $("#tireinfo-point").css("left", elem.position().left + 5);
    } else {
      $("#tireinfo-point").width(elem.outerWidth() - 12);
      $("#tireinfo-point").height(elem.outerHeight() - 12);
      $("#tireinfo-point").css("top", elem.position().top + 15);
      $("#tireinfo-point").css("left", elem.position().left + 5);
    }

    $("#tireinfo-point").css("border", "#ff0000 solid 2px");
    $("#tireinfo-point").css("border-radius", "4px");
    $("#tireinfo-point").show();
  }

  function closeSubDialog(elem) {
    let dialogs = [ "tireinfo-dialog-setno-input", "tireinfo-dialog-info-input", "tireinfo-dialog-comment-input" ];
    for (let index in dialogs) {
      let dialog = dialogs[index];
      if (elem == null || elem.attr("id") != dialog) {
        if ($("#" + dialog).dialog("instance")) {
          $("#" + dialog).dialog("destroy");
          //$("#" + dialog).remove();
        }
      }
    }
  }

  function setTableBorder(elem) {
    let domId = elem.attr("id");
    let domIdA = "borderline-setno-arrow" + "-" + domId;
    $("#" + domIdA).remove();
    let domIdH = "borderline-setno-horizontally" + "-" + domId;
    $("#" + domIdH).remove();
    let domIdV = "borderline-setno-verticality" + "-" + domId;
    $("#" + domIdV).remove();
    let parts = ''
              + '<span id="' + domIdA + '" class="arrow-up"></span>'
              + '<span id="' + domIdH + '" class="borderline"></span>'
              + '<span id="' + domIdV + '" class="borderline"></span>'
            ;
    $("#tireinfo-dialog").append(parts);

    $("#" + domIdA).css("z-index", 9100);
    $("#" + domIdH).css("z-index", 9000);
    $("#" + domIdV).css("z-index", 9000);

    if (isIE()) {
      // arrow
      $("#" + domIdA).css("top", elem.position().top - 5);
      $("#" + domIdA).css("left", elem.position().left + ((elem.outerWidth() - $("#tireinfo-dialog .arrow-up").outerWidth()) / 2));

      // horizontally
      $("#" + domIdH).css("top", elem.position().top + ((elem.outerHeight() + $("#tireinfo-dialog .borderline").outerHeight()) / 2) - 2);
      $("#" + domIdH).css("left", elem.position().left - 5);
      $("#" + domIdH).css("width", elem.outerWidth() + 10);

      // verticality
      $("#" + domIdV).css("top", elem.position().top + 5);
      $("#" + domIdV).css("left", elem.position().left + (elem.outerWidth() / 2) - 1);
      $("#" + domIdV).css("height", elem.outerHeight() + 5);
    } else {
      // arrow
      $("#" + domIdA).css("top", elem.position().top - 10);
      $("#" + domIdA).css("left", elem.position().left + ((elem.outerWidth() - $("#tireinfo-dialog .arrow-up").outerWidth()) / 2));

      // horizontally
      $("#" + domIdH).css("top", elem.position().top + ((elem.outerHeight() + $("#tireinfo-dialog .borderline").outerHeight()) / 2) - 1);
      $("#" + domIdH).css("left", elem.position().left - 5);
      $("#" + domIdH).css("width", elem.outerWidth() + 10);

      // verticality
      $("#" + domIdV).css("top", elem.position().top);
      $("#" + domIdV).css("left", elem.position().left + (elem.outerWidth() / 2) - 1);
      $("#" + domIdV).css("height", elem.outerHeight());
    }
  }

  function isReadOnly() {
    if (("readonly" in tireinfoData) == false) {
      return false;
    }
    return tireinfoData["readonly"] == 1;
  }

  function isIE() {
    let ua = window.navigator.userAgent.toLowerCase();
    //console.log("UA=" + ua);
    return (ua.indexOf("msie") != -1 || ua.indexOf("trident") != -1);
  }
});
