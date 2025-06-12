import * as http from "http";

const PORT = process.env.PORT || 3000;
const BLOCK_DELAY = 500;

const MESSAGES = {
  START: "Starting Carmentis node...",
  READY: `Carmentis node is ready and listening on port ${PORT}`
};

function start() {
  console.log(MESSAGES.START);

  // Start the HTTP server
  http
    .createServer(handleRequest)
    .listen(PORT, () => console.log(MESSAGES.READY));

  // Start the scheduler
  setInterval(processMempool, BLOCK_DELAY);
}

function handleRequest(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.setHeader("Access-Control-Max-Age", 2592000);
  res.setHeader("Content-Type", "application/json");

  if(req.method == "OPTIONS") {
    res.end();
    return;
  }

  let body = [];

  req.on("data", (chunk) => body.push(chunk));

  req.on("end", async () => {
    let response;

    try {
      const completeBody = Buffer.concat(body);
      const object = JSON.parse(completeBody.toString());
    }
    catch(e) {
      console.error(e);
    }

    response = JSON.stringify({});

    res.end(response);
  });
}

async function processMempool() {
}

start();
