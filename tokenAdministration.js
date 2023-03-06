const jwt = require("jsonwebtoken");
const fs = require("fs");

require("dotenv").config();

let tokenAdministration = function () {
    this.payload = "";
    this.token = "";
    this.valoreCookie = "";
    this.privateKey = fs.readFileSync("keys/private.key", "UTF8");
}


tokenAdministration.prototype.ctrlTokenLocalStorage = function (req, callback) {
    const token = req.headers["token"].split(' ')[1];
    if (token != "null") {
        jwt.verify(token, this.privateKey, function (err, data) {
            if (!err)
                this.payload = data;
            else
                this.payload = { err_exp: true, message: "Token scaduto o corrotto" };
            callback(this.payload);
        });
    } else {
        this.payload = { err_exp: true, message: "Token inesistente" };
        callback(this.payload);
    }
}

tokenAdministration.prototype.ctrlToken = function (req, callback) {
    this.payload = "";
    this.token = this.readCookie(req, "token");
    let errToken = { codErr: 200, message: "" };
    if (this.token == "")  // primo accesso, token inesistente
        errToken = { codeErr: 403, message: "Token inesistente" };
    else {
        try {
            this.payload = jwt.verify(this.token, this.privateKey);
            console.log("Token OK!");
        } catch (err) {
            errToken = { codeErr: 403, message: "Token scaduto o corrotto" };
        }
    }
    callback(errToken);
}

tokenAdministration.prototype.readCookie = function (req, name) {
    this.valoreCookie = "";
    if (req.headers.cookie) {
        let cookies = req.headers.cookie.split("; ");
        for (let i = 0; i < cookies.length; i++) {
            cookies[i] = cookies[i].split("=");
            if (cookies[i][0] == name) {
                this.valoreCookie = cookies[i][1];
                break;
            }
        }
    }
    return this.valoreCookie;
}


tokenAdministration.prototype.createToken = function (user) {

    console.log("CREATING COOKIE FROM:")
    console.log(user.username + " " + user.email);

    this.token = jwt.sign({
        "_id": user._id,
        "user": user.username,
        "exp": Math.floor(Date.now() / 1000 + 120 + 2)
    },
        this.privateKey
    );
    console.log("Creato nuovo token: " + this.token);
    console.log(millisToMinutesAndSeconds(Date.now() / 1000 + 10));
}
function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}
module.exports = new tokenAdministration();