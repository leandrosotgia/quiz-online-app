const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const logger = require('../middleware/logger');

module.exports = (app) => {

    // SESSION? -> auth?

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(cors());

    app.use([logger]);

    app.use(express.static("static")); //commentare se si vuole usare routes
}