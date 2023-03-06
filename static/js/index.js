"use strict";

$(() => {
    let end = true;
    $("#btnInvia").hide();
    $("#progressbar").hide();
    let checkLogin = sendRequestNoCallback("/api/checkLogin", "GET", {});
    checkLogin.done(function (serverData) {
        serverData = JSON.parse(serverData);
    });
    checkLogin.fail(function (jqXHR, test_status, str_error) {
        error(jqXHR, test_status, str_error);
        window.location.href = "login.html";
    });

    $("#btnLogOut").on("click", function () {
        if(!end) inviaDati();
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        localStorage.removeItem("username");
        window.location.href = "login.html";
    });

    $("#btnInizia").on("click", function () {
        $("#btnInizia").prop("disabled", true);
        let questions = sendRequestNoCallback("/api/elencoDomande", "GET", { email: localStorage.getItem("email"), username: localStorage.getItem("email") });
        questions.done(function (serverData) {
            $("#btnInvia").show();
            $("#progressbar").show();
            serverData = JSON.parse(serverData);
            console.log(serverData);
            localStorage.setItem("token", serverData.token);
            createQuestionsFromData(serverData.data);
            end = false;
            let seconds = serverData.time;

            window.addEventListener("beforeunload", function(event) {
                if(!end)
                    inviaDati();
            });

            location.href = "#container-domande";
            
            var counterBack = setInterval(function () {
                if (seconds >= 0) {
                    $(".progress").html("<h1 class='text-center'>" + seconds + ' secondi rimanenti' + "</h1>")
                    console.log(seconds);
                    seconds--;
                }

                let checkTimer = sendRequestNoCallback("/api/checkTimerDomande", "POST", {});
                checkTimer.fail(function (jqXHR) {
                    end = true;
                    alert("Errore " + jqXHR.status + " - " + jqXHR.responseText);
                    clearInterval(counterBack);
                    inviaDati();
                });
                checkTimer.done(function (serverData) {
                    serverData = JSON.parse(serverData);
                    console.log(serverData);
                });

            }, 1000);
        });
        questions.fail(function (jqXHR, test_status, str_error) {
            error(jqXHR, test_status, str_error);
            window.location.href = "login.html";
        });
    });



    function inviaDati() {
        var arr = [];

        $("[type='radio']").each(function () {
            console.log($(this).attr("name").split("q_answer")[1]);
            if ($(this).is(':checked'))
                arr.push({
                    key: $(this).closest('.quiz').attr("question"),
                    value: $(this).val()
                });
        });


        let postData = { risposte: arr, email: localStorage.getItem("email") };
        let risposte = sendRequestNoCallback("/api/inviarisposte", "POST", postData);
        risposte.fail(function (jqXHR) {
            alert("Errore " + jqXHR.status + " - " + jqXHR.responseText);
        });

        risposte.done(function (serverData) {
            serverData = JSON.parse(serverData);

            alert("Punteggio fatto: " + serverData.data.punti + "/" + serverData.data.lunghezza);

            window.location.href = "login.html";
        });
    }


    $("#btnInvia").on("click", function () {
        end = true;
        inviaDati();
    });


    function createQuestionsFromData(data) {
        let k = 1;
        data.forEach(question => {

            let container = $("#container-domande");

            let modal_dialog = $("<div></div>").addClass("modal-dialog mb-5");
            modal_dialog.appendTo(container);
            let modal_content = $("<div></div>").addClass("modal-content");
            modal_content.appendTo(modal_dialog);
            let modal_header = $("<div></div>").addClass("modal-header");
            modal_header.appendTo(modal_content);
            let h4 = $("<h4></h4>").addClass("text-white");
            let strong = $("<strong></strong>").text("Domanda " + k + ". " + capitalizeFirstLetter(question.domanda))
            strong.appendTo(h4);
            h4.appendTo(modal_header);


            let modal_body = $("<div></div>").addClass("modal-body");
            modal_body.appendTo(modal_content);

            let quiz = $("<div></div>").addClass("quiz").attr("id", "quiz").attr("data-toggle", "buttons").attr("question", k)

            let i = 1;
            question.risposte.forEach(risposta => {
                let label = $("<label></label>").addClass("element-animation" + i + " btn btn-primary w-100 text-start");
                // let label = $("<label></label>").addClass("element-animation" + i + " btn btn-lg btn-primary btn-block");

                let span = $("<span></span>").addClass("btn-label");
                $("<i></i>").addClass("glyphicon glyphicon-chevron-right").appendTo(span);
                span.appendTo(label);
                let input = $("<input></input>");
                input.attr("type", "radio").attr("name", "q_answer" + k).val(i)
                input.appendTo(label);
                label.append(" " + risposta);
                label.appendTo(quiz);
                i++;

            });
            k++;
            quiz.appendTo(modal_body);
        });
    }
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
