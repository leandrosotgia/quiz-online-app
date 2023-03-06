$(() => {
    $("#panelVoti").hide();

    $("#txtVisUsername").text(localStorage.getItem('username'));
    $("#txtVisEmail").text(localStorage.getItem('email'));

    $("#btnShowVoti").on("click", function () {
        $("#panelVoti").show();
        $("#panelSettings").hide();
    });

    $("#btnShowSettings").on("click", function () {
        $("#panelSettings").show();
        $("#panelVoti").hide();
    });

    function showAndDismissAlert(type, message) {
        var htmlAlert = '<div class="alert alert-' + type + '">' + message + '</div>';
        $(".alert-messages").empty();

        $(".alert-messages").prepend(htmlAlert);
        $(".alert-messages .alert").first().hide().fadeIn(200).delay(2000).fadeOut(1000, function () { $(this).remove(); });
    }

    createTableVoti(); function createTableVoti() {
        let voti = sendRequestNoCallback("/api/getVoti", "GET", {email: localStorage.getItem("email")});
        voti.done(function (serverData) {
            serverData = JSON.parse(serverData);
            console.log(serverData.data);;

            if(serverData.data.length == 0){
                $(".table-responsive").hide();
                $("#content-voti").append($("<h1></h1>").text("Non hai ancora nessun voto!"))
            }

            var tbody = $('#tableVoti').children('tbody').eq(0);

            
            serverData.data.forEach(function (voto) {
                var tr = $('<tr>');
                ['date', 'ore', 'voto', 'max'].forEach(function (attr) {
                    console.log(attr + " " + voto[attr]);
                    if (attr == 'voto') {
                        if (voto[attr] < 6)
                            tr.append('<td class="col-3 text-danger font-weight-bold">' + voto[attr] + '</td>');
                        else
                            tr.append('<td class="col-3 text-success font-weight-bold">' + voto[attr] + '</td>');
                    } else
                        tr.append('<td class="col-3">' + voto[attr] + '</td>');
                });
                tbody.append(tr);
            });


        });
        voti.fail(function (jqXHR, test_status, str_error) {
            error(jqXHR, test_status, str_error);
            window.location.href = "login.html";
        });
    }

    /*
                                                            <tr class="bg-danger">
                                                            <th scope="row" class="col-3">1</th>
                                                            <td class="col-3">Mark</td>
                                                            <td class="col-3">Otto</td>
                                                            <td class="col-3">@mdo</td>
                                                        </tr>
    
    */


});