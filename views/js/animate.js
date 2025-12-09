/*!
 * css処理関係を外部へ
 * 2021/05/27 add shidara
 * Released under the MIT License.
 */
    function someMethodIThinkMightBeSlow() {
    const startTime = performance.now();

    // Do the normal stuff for this function

    const duration = performance.now() - startTime;
    console.log(`someMethodIThinkMightBeSlow took ${duration}ms`);
}


/* -- Color --*/
    function setBestTimeColor(prefix, row) {
        $('#' + prefix + row.ID + '_Sec1Time').css("color", getLapColor(row.Sec1Time_FLAG));
        $('#' + prefix + row.ID + '_Sec2Time').css("color", getLapColor(row.Sec2Time_FLAG));
        $('#' + prefix + row.ID + '_Sec3Time').css("color", getLapColor(row.Sec3Time_FLAG));
        $('#' + prefix + row.ID + '_Sec4Time').css("color", getLapColor(row.Sec4Time_FLAG));
        $('#' + prefix + row.ID + '_MaxSpeed').css("color", getLapColor(row.MaxSpeed_FLAG));
        $('#' + prefix + row.ID + '_LastLap').css("color", getLapColor(row.LastLap_FLAG));
        
        if( row.PASSING_TYPE == "Sec1Time" ) {
              $('#' + prefix + row.ID + '_Sec2Time').css("color", getLapColor("9"));
              $('#' + prefix + row.ID + '_Sec3Time').css("color", getLapColor("9"));
              $('#' + prefix + row.ID + '_Sec4Time').css("color", getLapColor("9"));
              $('#' + prefix + row.ID + '_MaxSpeed').css("color", getLapColor("9"));
              $('#' + prefix + row.ID + '_STATUS').html('<img src="/images/STATUS_.png" border="0" height="20" />');
            } else if( row.PASSING_TYPE == "Sec2Time" ) {
              $('#' + prefix + row.ID + '_Sec3Time').css("color", getLapColor("9"));
              $('#' + prefix + row.ID + '_Sec4Time').css("color", getLapColor("9"));
              $('#' + prefix + row.ID + '_MaxSpeed').css("color", getLapColor("9"));
              $('#' + prefix + row.ID + '_STATUS').html('<img src="/images/STATUS_.png" border="0" height="20" />');
            } else if( row.PASSING_TYPE == "Sec3Time" ) {
              $('#' + prefix + row.ID + '_Sec4Time').css("color", getLapColor("9"));
              $('#' + prefix + row.ID + '_MaxSpeed').css("color", getLapColor("9"));
              $('#' + prefix + row.ID + '_STATUS').html('<img src="/images/STATUS_.png" border="0" height="20" />');
            } else if( row.PASSING_TYPE == "MaxSpeed" ) {
              $('#' + prefix + row.ID + '_Sec4Time').css("color", getLapColor("9"));
              $('#' + prefix + row.ID + '_STATUS').html('<img src="/images/STATUS_.png" border="0" height="20" />');
          }
    }

/* -- scroll --*/
    function setScrollArea() {
//console.log(areaInfo);
        if( areaInfo.scrollFrom == 0 ) {     
            return;
        }
        
        //try{ $('#scroll-monitor').slick("unslick");} catch (e) {}

        $("#scroll-monitor").remove();
        $("#scroll-area").append('<section id="scroll-monitor" class="scrollview slider" style="background-color: #000;"></section>');

        var scrollList = [];
        if( raceclass == "ALL" ) {
            scrollList = monitorList;
            scrollList = monitorList.filter(function(row, index){ if( row.SortKey != 999 && row.ID.indexOf("SC") != 0 && headerData.DISP_END > 0 && headerData.DISP_END >= row.SortKey ) return true; });
        } else {
            scrollList = monitorList.filter(function(row, index){ if( row.ClassName == raceclass && row.SortKey != 999 && row.ID.indexOf("SC") != 0 && headerData.DISP_END > 0 && headerData.DISP_END >= row.SortKey ) return true; });
        }
        if( scrollList.length == 0 ) {
            return false;
        }
//console.log(scrollList);
//console.log(raceclass + ":" + scrollList.length);
        for( i = areaInfo.scrollFrom - 1; i <  scrollList.length; i ++ ) {
            $("#scroll-monitor").append(createHtml('S', scrollList[i]));
            setBestTimeColor('S', monitorList[i]);
            if( scrollList[i].PASSING_FLAG == '1' && scrollList[i].PASSING_TYPE ==  'LastLap' ) {
                $('#S' + scrollList[i].ID +"_base").animate({'backgroundColor': '#029327'}, 1000).animate({'backgroundColor' : '#111'}, 1000);
            }
        }
        resetScrollArea();
        return true;        
    }
    
    function updateScrollArea(row) {
        
        updateHtml('S', row);
        
        //resetScrollArea();
        return true;                
    }    

    function resetScrollArea() {
//console.log( "SCROLL CNT = " + scrollCount + " : SCROLL POS = "  + scrollPos );
   	
//console.log("resetScrollArea");
        try{ $('#scroll-monitor').slick("unslick");} catch (e) {}
        if( headerData.SCROLL_START > 0 ) {     
            $("#scroll-monitor").slick({
                autoplay: true,
                arrows: false,
                dots: false,
                infinite: true,
                slidesToShow: scrollCount,
                slidesToScroll: 1,
                vertical: true,
                initialSlide : scrollPos,
                speed: 500,
                autoplaySpeed: 1200,
            });
            $("#scroll-monitor").slick('setPosition')	;
            $("#scroll-monitor").on('beforeChange', function(event, slick, currentSlide, nextSlide) {
                scrollPos = nextSlide;
            });
            $("#scroll-monitor").on('init',function() {
            });
            if( scrollPos > areaInfo.scrollTo - 1 ) {
                scrollPos = 0;
            }
        }
//console.log("resetScrollArea...........");          
   }

    function startMixItUp() {
//console.log("startMixItUp...........");          
          
      if( $('#ListArea').children().length > 1 ) {              
        if( !isMixItUpStarted )  {
        }         
        var fil = ".category-ON-TITLE, .category-ON-";
        if( raceclass == 'ALL' ) {
          raceClassList.forEach(function(row) {
//console.log(row);
            if( row.NameJ.length > 0 ) {
              if( fil.length > 0 ) {
                fil += ',';
              }
              fil += '.category-ON-' + row.NameJ.replace(' ','').replace('/','／');
            }
          });
        } else {
          fil += raceclass.replace(' ','').replace('/','／');
        }              
//console.log('FILTER ===============>>' + fil);                  
        $('#Container').mixItUp('multiMix', {
          animation: {
            enable: false		
          },
          callbacks: {
            onMixEnd: function() {
              var list = $("#ListArea").children('div');
              for(var i=0; i < list.length; i++) {
                if ( raceclass == 'ALL' ) {
                  $("#" +  list.eq(i).attr('id') + "_Pos").text(list.eq(i).attr('data-sort'));
                } else {
                  $("#" +  list.eq(i).attr('id') + "_Pos").text(list.eq(i).attr('class-pos'));
                }
              }
            }
          },
          filter: fil,
          sort: 'sort:asc'
        });
      }
      
    }

    function initMixItUp() {
      $('#Container').mixItUp({
        callbacks: {
          onMixLoad: function() {
          },
          onMixFail: function(state) {
          },
          onMixStart: function() {
            isMixItUpStarted = true;
          },
          onMixEnd: function() {
            isMixItUpStarted = false;
            var list = $("#ListArea").children('div');
            for(var i=0; i < list.length; i++) {
                if ( raceclass == 'ALL' ) {
                  $("#" +  list.eq(i).attr('id') + "_Pos").text(list.eq(i).attr('data-sort'));
                } else {
                  $("#" +  list.eq(i).attr('id') + "_Pos").text(list.eq(i).attr('class-pos'));
                }
            }
          }
        }
      });
    }

    function initFilter(classlist) {        

      raceClassList = classlist;

      var isClass = false;
      var select_class = $.cookie(token + "select_class");
      classlist.forEach(function(row) {
        if( row.NameJ.length > 0 ) {
          if( select_class ){
              if( row.NameJ == select_class ) {
                  isClass = true;
                  $('#raceclass').append($('<option selected>').html(row.NameJ).val(row.NameJ));
              } else {
                  $('#raceclass').append($('<option>').html(row.NameJ).val(row.NameJ));
              }
          } else {
            $('#raceclass').append($('<option>').html(row.NameJ).val(row.NameJ));
          }
        }
      });
        
      if( isClass ){
          raceclass = select_class;
      } else {
          raceclass = "ALL";
      } 


      $(".custom-select").each(function() {
          var classes = $(this).attr("class"),
                         id = $(this).attr("id"),
                   name = $(this).attr("name");
          var template =  '<div class="' + classes + '">';
          //template += '<span class="custom-select-trigger">' + $(this).attr("placeholder") + '</span>';
          template += '<span class="custom-select-trigger">' + raceclass + '</span>';
          template += '<div class="custom-options">';
          $(this).find("option").each(function() {
            template += '<span class="custom-option ' + $(this).attr("class") + '" data-value="' + $(this).attr("value") + '">' + $(this).html() + '</span>';
          });
          template += '</div></div>';

          $(this).wrap('<div class="custom-select-wrapper"></div>');
          $(this).hide();
          $(this).after(template);
      });
  
      $(".custom-option:first-of-type").hover(function() {
          $(this).parents(".custom-options").addClass("option-hover");
      }, function() {
          $(this).parents(".custom-options").removeClass("option-hover");
      });
  
      $(".custom-select-trigger").on("click", function() {
          $('html').one('click',function() {
              $(".custom-select").removeClass("opened");
          });
          $(this).parents(".custom-select").toggleClass("opened");
          event.stopPropagation();
      });
  
      $(".custom-option").on("click", function() {
          $(this).parents(".custom-select-wrapper").find("select").val($(this).data("value"));
          $(this).parents(".custom-options").find(".custom-option").removeClass("selection");
          $(this).addClass("selection");
          $(this).parents(".custom-select").removeClass("opened");
          $(this).parents(".custom-select").find(".custom-select-trigger").text($(this).text());
          raceclass = $(this).text();
          
          var fil = ".category-ON-TITLE,.category-ON-";
          $('#raceclass option').each(function(index, element){
              if( $(this).text() != 'ALL' ) {
                  if( fil.length > 0 ) {
                      fil += ',';
                  }
                  fil += '.category-ON-' + $(this).text().replace(' ','').replace('/','／');
              }
          });              
//console.log(raceclass);
          $.cookie(token + "select_class", raceclass);
          location.reload();
/*
          updateStandings();
          setScrollArea();
          if( raceclass == 'ALL' ) {
            $('#Container').mixItUp('filter',fil);               
          } else {
            $('#Container').mixItUp('filter','.category-ON-' + raceclass);               
          }
*/
      });
      
    }
