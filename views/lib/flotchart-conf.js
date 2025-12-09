var Script = function () {

//  tracking chart

    var plot;
    
//    selection chart

    $(function () {
        var data = [
            {
                label: "Normal",
                data: [[1, 20], [2, 23], [3, 21], [4, 20], [5, 21], [6, 22], [7, 20], [8, 0], [9, 0], [10, 0], [11, 20], [12, 21], [13, 20], [14, 21], [15, 22]]
            },
            {
                label: "Faild",
                data: [[1, 0], [2, 2], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0]]
            }
        ];

        var options = {
            series: {
                lines: { show: true },
                points: { show: true }
            },
            legend: { noColumns: 2 },
            xaxis: { tickDecimals: 0 },
            yaxis: { min: 0 },
            selection: { mode: "x" },
            colors: ["#5544FF", "#FF7070"]
        };

        var placeholder = $("#chart-2");

        placeholder.bind("plotselected", function (event, ranges) {
            $("#selection").text(ranges.xaxis.from.toFixed(1) + " to " + ranges.xaxis.to.toFixed(1));

            var zoom = $("#zoom").attr("checked");
            if (zoom)
                plot = $.plot(placeholder, data,
                    $.extend(true, {}, options, {
                        xaxis: { min: ranges.xaxis.from, max: ranges.xaxis.to }
                    }));
        });

        placeholder.bind("plotunselected", function (event) {
            $("#selection").text("");
        });

        var plot = $.plot(placeholder, data, options);

        $("#clearSelection").click(function () {
            plot.clearSelection();
        });

        $("#setSelection").click(function () {
            plot.setSelection({ xaxis: { from: 7, to: 8 } });
        });
    });
    
}();