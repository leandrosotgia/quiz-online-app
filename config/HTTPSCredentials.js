const fs = require('fs');

const privateKey = fs.readFileSync("keys/privateKey.pem", "utf8");
const certificate = fs.readFileSync("keys/certificate.crt", "utf8");

exports.Get = function(){
    return { key: privateKey, cert: certificate };
}