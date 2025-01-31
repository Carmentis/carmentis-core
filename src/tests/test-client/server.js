import * as http from "http";
import * as fs from "fs";

const PORT = 8080;

http.createServer((req, res) => {
  switch(req.url) {
    case "/": {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(fs.readFileSync("./index.html"));
      break;
    }
    case "/appWallet.html": {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(fs.readFileSync("./appWallet.html"));
      break;
    }
    case "/extWallet.html": {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(fs.readFileSync("./extWallet.html"));
      break;
    }
    case "/carmentis-sdk.js": {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.write(fs.readFileSync("../../../dist/client/index.js"));
      break;
    }
    case "/main.js": {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.write(fs.readFileSync("./main.js"));
      break;
    }
    case "/appWallet.js": {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.write(fs.readFileSync("./appWallet.js"));
      break;
    }
    case "/extWallet.js": {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.write(fs.readFileSync("./extWallet.js"));
      break;
    }
  }

  res.end();
})
.listen(PORT, () => {
  console.log(`App is running at http://localhost:${PORT}`);
});
