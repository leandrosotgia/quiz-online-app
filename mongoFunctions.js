"use strict";

let mongo = require("mongodb");
let bcrypt = require("bcrypt");
const mongoClient = mongo.MongoClient;
const CONNECTIONSTRING = "mongodb://127.0.0.1:27017";

let mongoFunctions = function () { }

function setConnection(nomeDb, col, callback) {
    let errConn = { codeErr: 200, message: "" };
    let collection = null;
    let client = null;
    let mongoConnection = mongoClient.connect(CONNECTIONSTRING);
    mongoConnection.catch((err) => {
        console.log("Errore di connessione al server Mongo. " + err);
        errConn.codeErr = 503;
        errConn.message = "Errore di connessione al server Mongo";
        callback(errConn, collection, client);
    });
    mongoConnection.then((client) => {
        let db = client.db(nomeDb);
        collection = db.collection(col);
        callback(errConn, collection, client);
    });
}

mongoFunctions.prototype.updatePwd = function (req, nomeDb, collection, query, pwd, callback) {
    setConnection(nomeDb, collection, function (errConn, coll, conn) {
        if (errConn.codeErr == 200) {
            let errData;
            
            let updatePwd = coll.updateMany(query, {$set: pwd});
            updatePwd.then(function (data) {
                errData = { codeErr: 200, message: "" };
                callback(errData, {});
            });
            updatePwd.catch((err) => {
                let errQuery = { codeErr: 500, message: "Errore durante l'esecuzione della query" };
                callback(errQuery, {});
            });
        }
    });
}

mongoFunctions.prototype.getVoti = function (req, nomeDb, collection, query, callback) {
    setConnection(nomeDb, collection, function (errConn, coll, conn) {
        if (errConn.codeErr == 200) {
            let errData;
            console.log(query);
            let voti = coll.find(query).toArray();
            voti.then(function (data) {
                conn.close();
                if (data == null)
                    errData = { codeErr: 401, message: "Errore di lettura voti." };
                else
                    errData = { codeErr: 200, message: "" };
                callback(errData, data);
            });
            voti.catch((err) => {
                let errQuery = { codeErr: 500, message: "Errore durante l'esecuzione della query" };
                callback(errQuery, {});
            });

        }
        else
            callback(errConn, {});
    });
}

mongoFunctions.prototype.insertVoto = function (req, nomeDb, collection, query, callback) {
    setConnection(nomeDb, collection, function (errConn, coll, conn) {
        if (errConn.codeErr == 200) {

            let promise = coll.insertOne(query);
            promise.then(function (data) {
                conn.close();
                let errData = { codeErr: 200, message: "" };
                callback(errData, data);
            });
            promise.catch((err) => {
                let errQuery = { codeErr: 500, message: "Errore durante l'esecuzione della query" };
                callback(errQuery, {});
            });

        } else
            callback(errConn, {});
    });
}

mongoFunctions.prototype.getCorrect = function (req, nomeDb, collection, query, callback) {
    setConnection(nomeDb, collection, function (errConn, coll, conn) {
        if (errConn.codeErr == 200) {
            let domande = coll.find(query, { projection: { domanda: 0, _id: 0, risposte: 0 } }).toArray();
            domande.then(function (data) {
                let errData;
                conn.close();
                if (data == null)
                    errData = { codeErr: 401, message: "Errore di lettura domande." };
                else
                    errData = { codeErr: 200, message: "" };
                callback(errData, data);
            });
            domande.catch((err) => {
                let errQuery = { codeErr: 500, message: "Errore durante l'esecuzione della query" };
                callback(errQuery, {});
            })
        }
    })
}


mongoFunctions.prototype.getDomande = function (req, nomeDb, collection, query, callback) {
    setConnection(nomeDb, collection, function (errConn, coll, conn) {
        if (errConn.codeErr == 200) {
            let errData;
            let domande = coll.find(query, { projection: { correct: 0, _id: 0 } }).toArray();
            domande.then(function (data) {
                conn.close();
                if (data == null || data == [])
                    errData = { codeErr: 401, message: "Errore di lettura domande." };
                else
                    errData = { codeErr: 200, message: "" };
                callback(errData, data);
            });
            domande.catch((err) => {
                let errQuery = { codeErr: 500, message: "Errore durante l'esecuzione della query" };
                callback(errQuery, {});
            });

        }
        else
            callback(errConn, {});
    });
}

mongoFunctions.prototype.insertRegister = function (req, nomeDb, collection, query, callback) {
    setConnection(nomeDb, collection, function (errConn, coll, conn) {
        if (errConn.codeErr == 200) {

            let checkemail = coll.findOne({ email: query.email });
            checkemail.then(function (data) {
                let errData;
                // Email disponibile  
                if (data == null) {
                    let promise = coll.insertOne(query);
                    promise.then(function (data) {
                        conn.close();
                        let errData = { codeErr: 200, message: "" };
                        callback(errData, data);
                    });
                    promise.catch((err) => {
                        let errQuery = { codeErr: 500, message: "Errore durante l'esecuzione della query" };
                        callback(errQuery, {});
                    });
                }
                else {
                    errData = { codeErr: 401, message: "Errore di Login. Email già utilizzata!" }
                    callback(errData, {});
                }
            });
            checkemail.catch((err) => {
                let errQuery = { codeErr: 500, message: "Errore durante l'esecuzione della query" };
                callback(errQuery, {});
            });
        } else
            callback(errConn, {});
    });
}

mongoFunctions.prototype.findEmail = function (req, nomeDb, collection, query, callback) {
    setConnection(nomeDb, collection, function (errConn, coll, conn) {
        if (errConn.codeErr == 200) {
            let promise = coll.findOne(query);
            promise.then(function (data) {
                conn.close();
                let errData;
                if (data == null)
                    errData = { codeErr: 401, message: "Errore. Email non presente sul Database!" };
                else
                    errData = { codeErr: 200, message: "" };
                callback(errData, data);
            });
            promise.catch((err) => {
                let errQuery = { codeErr: 500, message: "Errore durante l'esecuzione della query" };
                callback(errQuery, {});
            });
        } else
            callback(errConn, {});
    });
}

mongoFunctions.prototype.findLogin = function (req, nomeDb, collection, query, callback) {
    setConnection(nomeDb, collection, function (errConn, coll, conn) {
        console.log(query);
        if (errConn.codeErr == 200) {
            let dataLogin = coll.findOne(query);
            dataLogin.then(function (data) {
                conn.close();
                let errData;
                if (data == null)
                    errData = { codeErr: 401, message: "Errore di Login. Username inesistente!" };
                else {
                    if (bcrypt.compareSync(req.body.password, data.password))
                        errData = { codeErr: 200, message: "" };
                    else
                        errData = { codeErr: 401, message: "Errore di Login. Password errata!" };
                }
                callback(errData, data);
            });
            dataLogin.catch((err) => {
                let errQuery = { codeErr: 500, message: "Errore durante l'esecuzione della query" };
                callback(errQuery, {});
            });
        } else
            callback(errConn, {});
    });
}

module.exports = new mongoFunctions();