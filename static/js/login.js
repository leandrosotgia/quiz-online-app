"use strict";

// LOGOUT = removetoken
$(() => {
    $(".registerCard").hide();
    $(".forgotPasswordCard").hide();
    $("#btnInserisciCodice").hide();

    function showAndDismissAlert(type, message) {
        var htmlAlert = '<div class="alert alert-' + type + '">' + message + '</div>';
        $(".alert-messages").empty();

        $(".alert-messages").prepend(htmlAlert);
        $(".alert-messages .alert").first().hide().fadeIn(200).delay(2000).fadeOut(1000, function () { $(this).remove(); });
    }

    $(".btnShowLogin").on('click', function () {
        $(".loginCard").show();
        $(".forgotPasswordCard").hide();
        $(".registerCard").hide();
    });

    $(".btnShowRegister").on('click', function () {
        $(".registerCard").show();
        $(".loginCard").hide();
    });

    $("#btnRegister").on("click", function () {
        let password = $("#r_txtPassword").val();
        let password2 = $("#r_txtPassword2").val();
        let username = $("#r_txtUsername").val();
        let email = $("#r_txtEmail").val();
        let nome = $("#r_txtNome").val();
        let cognome = $("#r_txtCognome").val();

        if (password != password2) {
            showAndDismissAlert("danger", "Errore: Le due password non coincidono");
            return;
        }
        if (password == "" || password2 == "" || username == "" || email == "" || nome == "" || cognome == "" || !ValidateEmail(email)) {
            showAndDismissAlert("danger", "Errore: Alcuni campi sono errati o mancanti");
            return;
        }

        let postData = { username: username, password: password, email: email, nome: nome, cognome: cognome };
        let register = sendRequestNoCallback("/api/register", "POST", postData);
        register.fail(function (jqXHR) {
            showAndDismissAlert("danger", "Errore" + jqXHR.status + " - " + jqXHR.responseText);
        });

        register.done(function (serverData) {
            serverData = JSON.parse(serverData);
            console.log("NEW TOKEN: " + serverData.token);
            localStorage.setItem("token", serverData.token);
            localStorage.setItem("email", serverData.email);
            localStorage.setItem("username", serverData.username);
            window.location.href = "index.html";
        });
    });

    $("#btnLogin").on("click", function () {
        let password = $("#l_txtPassword").val();
        let username = $("#l_txtUsername").val();

        if (password == "" || username == "") {
            showAndDismissAlert("danger", "Errore: Alcuni campi sono errati o mancanti");
        }
        else {
            let postData = { username: username, password: password }
            localStorage.removeItem("token");
            let loginTest = sendRequestNoCallback("/api/login", "POST", postData);
            loginTest.fail(function (jqXHR) {
                showAndDismissAlert("danger", "Errore: " + jqXHR.status + " - " + jqXHR.responseText)
            });
            loginTest.done(function (serverData) {
                serverData = JSON.parse(serverData);
                console.log("NEW TOKEN: " + serverData.token);
                localStorage.setItem("token", serverData.token);
                localStorage.setItem("email", serverData.email);
                window.location.href = "index.html";
            });
        }
    });

    $("#btnShowForgotPwd").on("click", function () {
        $(".loginCard").hide();
        $(".forgotPasswordCard").show();
        $("#rec_txtCodice").hide();
        $("#btnInserisciCodice").hide();
        $("#btnInviaEmailRecupero").show();
        $("#rec_txtEmail").show();
        $("#rec_message").text("Inserisci l'email per il recupero della password");
    });


    let id;

    $("#btnInviaEmailRecupero").on("click", function () {
        let email = $("#rec_txtEmail").val();

        let postData = { email: email };
        let recuperoEmail = sendRequestNoCallback("/api/recuperoEmail", "POST", postData);
        recuperoEmail.fail(function (jqXHR) {
            showAndDismissAlert("danger", "Errore: " + jqXHR.status + " - " + jqXHR.responseText)
        });
        recuperoEmail.done(function (serverData) {
            $("#btnInviaEmailRecupero").hide();
            $("#btnInserisciCodice").show();
            $("#rec_txtCodice").show();
            $("#rec_txtEmail").hide();

            $("#rec_message").text("Controlla la tua posta ed inserisci il codice che abbiamo inviato");
            console.log(serverData);
            id = serverData.id;
        });
    });

    $("#btnInserisciCodice").on("click", function () {
        let codice = $("#rec_txtCodice").val();

        let postData = { id: id, codice: codice };
        console.log(postData);
        let recuperoCodice = sendRequestNoCallback("/api/recuperoCodice", "POST", postData);
        recuperoCodice.fail(function (jqXHR) {
            showAndDismissAlert("danger", "Errore: " + jqXHR.status + " - " + jqXHR.responseText)
        });
        recuperoCodice.done(function (serverData) {
            console.log(serverData);
            $(".loginCard").show();
            $(".forgotPasswordCard").hide();
        });
    });

    $("#btnGoBack").on("click", function () {
        let postData = { id: id }
        let clearCode = sendRequestNoCallback("api/clearCode", "POST", postData);
        clearCode.fail(function (jqXHR) {
            showAndDismissAlert("danger", "Errore: " + jqXHR.status + " - " + jqXHR.responseText)
        });
        clearCode.done(function (serverData) {
            console.log(serverData);
        })
    });
});

function ValidateEmail(mail) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
        return true
    }
    return false
}