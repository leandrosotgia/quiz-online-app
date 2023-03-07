"use strict";

require("dotenv").config();

let express = require("express");
const HTTPS = require("https");
const bcrypt = require('bcrypt');
let nodemailer = require("nodemailer");
let tokenAdministration = require("./tokenAdministration");
let mongoFunctions = require("./mongoFunctions");
let app = express();

const port = process.env.PORT || 8080;
const address = process.env.ADDRESS || "127.0.0.1";

const HTTPSCredentials = require('./config/HTTPSCredentials');
require('./config/expressMiddlewares')(app);


let httpsServer = HTTPS.createServer(HTTPSCredentials.Get(), app);
httpsServer.listen(port, address, function () {
    console.log("[SERVER] Server running on port %s...", port);
});

app.use(express.static("static"));

let codiciRecupero = [];


app.post('/api/clearCode', function(req, res){
    let cod = req.body.id;
    const index = codiciRecupero.indexOf(cod);
    if (index > -1) { 
        codiciRecupero.splice(index, 1);
    }
    console.log("Code Cleared");
    res.send({ msg: "Undo changes" });
});

app.post('/api/recuperoCodice', function (req, res) {
    let codice = req.body.codice;
    let cod = codiciRecupero.find(cod => cod.code == codice)
    console.log(cod);
    if (cod) {
        // Genero pwd
        console.log('Generating pwd + email');
        let password = generatePassword();
        console.log("new password: " + password);
        let email = cod.email;
        let query = { email: email };
        let pwd = { password: bcrypt.hashSync(password, 12) }
        mongoFunctions.updatePwd(req, "test", "users", query, pwd, function (err, data) {
            if (err.codeErr == 200) {
                console.log('cambiamento pwd db ok');
                res.send({ msg: "Password changed" });

                let pwd = process.env.PWD_EMAIL;
                let email_server = process.env.EMAIL_SERVER;
                let transport = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: email_server,
                        pass: pwd
                    }
                });
                process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

                let bodyHtml = "<html><body><br /><br /><h1>Recupero Password</h1>" +
                    "<h3 style='font-weight: normal; font-size: 18pt;'>password: " + password + "</h3>" +
                    "<br><br><h4>Inserisci questo codice nella casella di testo sul sito per generare una nuova password</h4>"
                "</body></html>";
                const message = {
                    from: email_server,
                    to: email,
                    subject: "Nuova Password Vallauri Quiz",
                    html: bodyHtml
                };
                transport.sendMail(message, function (err, info) {
                    if (err) {
                        console.log("Errore di invio mail!");
                        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;

                        error(req, res, { code: err.codeErr, message: err.message });
                    }
                    else {
                        console.log("Mail inviata correttamente!");
                        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
                        res.send({ msg: "Email nuova password inviata" });
                    }
                });
            }
            else {
                error(req, res, { code: err.codeErr, message: err.message });
            }
        });
    }
    else {
        error(req, res, { code: 404, message: "Codice invalido" });
    }
    const index = codiciRecupero.indexOf(cod);
    if (index > -1) { 
        codiciRecupero.splice(index, 1);
    }
    console.log(codiciRecupero);

});

app.post('/api/recuperoEmail', function (req, res) {
    console.log('Invio Email Recupero')
    let email = req.body.email;
    let query = { email: email };
    mongoFunctions.findEmail(req, "test", "users", query, function (err, data) {
        if (err.codeErr == 200) {
            console.log("EMAIL OK");

            let codice = Math.random().toString(36).substring(2, 7).toUpperCase();
            let id = codiciRecupero.length + 1;
            console.log('ID: ' + id);
            codiciRecupero.push({ id: id, code: codice, email: email });
            console.log("Codice pwd generato: " + codice + " per email: " + email);
            console.log(codiciRecupero);
            let pwd = process.env.PWD_EMAIL;
            let email_server = process.env.EMAIL_SERVER;
            let transport = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: email_server,
                    pass: pwd
                }
            });
            process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

            let bodyHtml = "<html><body><br /><br /><h1>Recupero Password</h1>" +
                "<h3 style='font-weight: normal; font-size: 18pt;'>Codice: " + codice + "</h3>" +
                "<br><br><h4>Inserisci questo codice nella casella di testo sul sito per generare una nuova password</h4>"
            "</body></html>";
            const message = {
                from: email_server,
                to: email,
                subject: "Recupero Password Vallauri Quiz",
                html: bodyHtml
            };
            transport.sendMail(message, function (err, info) {
                if (err) {
                    console.log("Errore di invio mail!");
                    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;

                    error(req, res, { code: err.codeErr, message: err.message });
                }
                else {
                    console.log("Mail inviata correttamente! id: " + id);
                    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
                    res.send({ msg: "Email di recupero inviata", id: id });
                }
            });
        }
        else {
            error(req, res, { code: err.codeErr, message: err.message });
        }

    });
});

app.get("/api/getVoti", function (req, res) {
    tokenAdministration.ctrlTokenLocalStorage(req, function (payload) {
        if (!payload.err_exp) {
            console.log("Token ok - Get Voti");
            let query = { email: req.query.email }
            mongoFunctions.getVoti(req, "test", "voti", query, function (err, data) {
                console.log("Getting voti");
                if (err.codeErr == 200) {
                    console.log("voti ok");
                    res.send({ msg: "Voti OK", token: tokenAdministration.token, data: data });
                }
                else
                    error(req, res, { code: err.codeErr, message: err.message });
            });
        } else {
            console.log(payload.message);
            error(req, res, { code: 403, message: payload.message });
        }
    });
});


app.get("/api/checkLogin", function (req, res) {
    tokenAdministration.ctrlTokenLocalStorage(req, function (payload) {
        if (!payload.err_exp) {
            res.send({ msg: "Token OK, Init pagina", data: {} });
        } else {
            console.log(payload.message);
            error(req, res, { code: 403, message: payload.message });
        }
    });
});

app.post("/api/checkTimerDomande", function (req, res) {
    tokenAdministration.ctrlTokenLocalStorage(req, function (payload) {
        console.log("Checking connection...")
        if (payload.err_exp) {
            error(req, res, { code: 403, message: "Tempo scaduto!" });
        }
        else {
            res.send({ msg: "Continuo sessione", data: {} });
        }
    });
});

app.get("/api/elencoDomande", function (req, res) {
    tokenAdministration.ctrlTokenLocalStorage(req, function (payload) {
        if (!payload.err_exp) {       // token è OK
            console.log("Token ok - Get Domande");
            mongoFunctions.getDomande(req, "test", "domande", {}, function (err, data) {
                console.log("Getting domande");
                if (err.codeErr == 200) {
                    console.log("domande ok");
                    let email = req.body.email;
                    let username = req.body.username;

                    tokenAdministration.createToken({ email: email, username: username });
                    res.send({ msg: "Domande OK", token: tokenAdministration.token, data: data, time: 120 });
                }
                else
                    error(req, res, { code: err.codeErr, message: err.message });
            });
        } else {
            console.log(payload.message);
            error(req, res, { code: 403, message: payload.message });
        }
    });
});

app.post("/api/login", function (req, res) {
    let query = { username: req.body.username };
    mongoFunctions.findLogin(req, "test", "users", query, function (err, data) {
        if (err.codeErr == 200) {
            console.log("Login OK");
            tokenAdministration.createToken(data);
            console.log("LOGIN tokenAdministration.token = " + tokenAdministration.token);

            console.log(data);

            res.send({ msg: "Login OK", token: tokenAdministration.token, email: data.email, username: data.username });
        }
        else
            error(req, res, { code: err.codeErr, message: err.message });
    });
});

app.post("/api/register", function (req, res) {
    let query = { username: req.body.username, password: bcrypt.hashSync(req.body.password, 12), email: req.body.email, nome: req.body.nome, cognome: req.body.cognome }
    mongoFunctions.insertRegister(req, "test", "users", query, function (err, data) {
        if (err.codeErr == 200) {
            console.log("Register OK");
            tokenAdministration.createToken(data);
            console.log("REGISTER tokenAdministration.token = " + tokenAdministration.token);
            res.send({ msg: "Register OK", token: tokenAdministration.token, email: query.email, username: query.username });
        }
        else
            error(req, res, { code: err.codeErr, message: err.message });
    });
});


app.post("/api/inviarisposte", function (req, res) {

    let email = req.body.email;
    console.log("email: " + email);
    tokenAdministration.ctrlTokenLocalStorage(req, function (payload) {
        //if (!payload.err_exp) {       // token è OK
        //console.log("Token ok - Elaborando risposte");

        let array = req.body.risposte;
        console.log(array);
        mongoFunctions.getCorrect(req, "test", "domande", {}, function (err, data) {
            console.log("Getting domande corrette");
            if (err.codeErr == 200) {
                let risp = data;
                console.log(risp);

                let cont = 0;

                for (let key in array) {
                    console.log("Controllando (Risposta server) " + (risp[key].correct + 1) + "==" + array[key].value + " (Risposta client)")
                    if (risp[key].correct + 1 == array[key].value) {
                        console.log("Risposta " + array[key].key + " giusta")
                        cont++;
                    }
                    else
                        console.log("Risposta " + array[key].key + " sbagliata");
                }
                console.log("Punti totali: " + cont + "/" + risp.length);

                const date = new Date();

                let day = date.getDate();
                let month = date.getMonth() + 1;
                let year = date.getFullYear();

                var seconds = date.getSeconds();
                var minutes = date.getMinutes();
                var hour = date.getHours();

                let currentDate = `${day}/${month}/${year}`;
                let currentHour = `${hour}:${minutes}:${seconds}`

                let query = { email: email, voto: cont, max: risp.length, date: currentDate, ore: currentHour };
                mongoFunctions.insertVoto(req, "test", "voti", query, function (err, data) {
                    if (err.codeErr == 200) {
                        console.log("Register OK");
                        //res.send({ msg: "Insert voto OK", data: {}});

                        res.send({ msg: "Quiz finito", data: { punti: cont, lunghezza: risp.length } });

                    }
                    else
                        error(req, res, { code: err.codeErr, message: err.message });
                });

                //res.send({ msg: "Quiz finito", data: { punti: cont, lunghezza: risp.length } });

                let pwd = process.env.PWD_EMAIL;
                let email_server = process.env.EMAIL_SERVER;
                let transport = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: email_server,
                        pass: pwd
                    }
                });
                process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
                //PASTEBIN.COM/XMC65iLb
                let bodyHtml = "<html><body><br /><br /><h1>Ecco la tua valutazione al Quiz</h1><img src='/static/img/vallauri.jpg'>" +
                    "<h3 style='font-weight: normal; font-size: 18pt; color:red'><table><tr><td width='250px'>Data e ora</td><td width='400px'>" + currentDate + ' ' + currentHour + "</td></tr>" +
                    "<tr><td width='250px'>Punteggio fatto</td><td width='400px'>" + cont + "</td></tr>" +
                    "<tr><td width='250px'>Punteggio massimo</td><td width='400px'>" + risp.length + "</td></tr>" +
                    "</table></h3>" +
                    "<br><br><h2>Grazie per aver fatto il Quiz</h2>"
                "</body></html>";
                const message = {
                    from: email_server,
                    to: email,
                    subject: "Risultati Quiz Vallauri",
                    html: bodyHtml
                };
                transport.sendMail(message, function (err, info) {
                    if (err) {
                        console.log("Errore di invio mail!");
                        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;

                        error(req, res, { code: err.codeErr, message: err.message });
                    }
                    else {
                        console.log("Mail inviata correttamente!");
                        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
                        res.send({ msg: "Email inviata" });
                    }
                });
            }
            else
                error(req, res, { code: err.codeErr, message: err.message });
        });
    });
});

function error(req, res, err) {
    res.status(err.code).send(err.message);
}

app.use(function (req, res) {
    res.status(404);
    console.log("Pagina errore da static");
    res.sendFile("error.html", { root: "./static" });
});

app.use(function (req, res, next) {
    console.log("Pagina errore from root");
    res.status(404).sendFile(__dirname + '/static/error.html');
});

function generatePassword() {
    var length = 12,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}