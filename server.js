const fs = require("fs");
const express = require("express");
const http = require("http");
const https = require("https");

const secrets = require("./secrets.js");

const app = express();

const HTTP_PORT = 3080;
const HTTPS_PORT = 3443;

let options = {};
if (secrets) {
  options.key = fs.readFileSync(secrets[0]);
  options.cert = fs.readFileSync(secrets[1]);
}

http
  .createServer(app)
  .listen(HTTP_PORT, () =>
    console.log(`Dashboard Express server listening on port ${HTTP_PORT}`)
  );
https
  .createServer(options, app)
  .listen(HTTPS_PORT, () =>
    console.log(`Dashboard Express server listening port ${HTTPS_PORT}`)
  );

app.get("/", (_req, res) => {
  res.redirect(301, "/iterations/08-dashboard-with-detail-view/");
});

app.use(express.static("/public"));
