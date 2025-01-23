import * as http from "http";

// ============================================================================================================================ //
//  postRequest()                                                                                                               //
// ============================================================================================================================ //
export function postRequest(url, data, callback) {
  let urlObj = new URL(url);

  let options = {
    hostname: urlObj.hostname,
    port    : urlObj.port,
    path    : urlObj.pathname,
    method  : "POST",
    headers : {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  };

  let req = http.request(options, res => {
    res.on("data", answer => {
      callback(true, answer);
    });
  });

  req.on("error", answer => {
    callback(false, answer);
  });

  req.write(data);
  req.end();
}
