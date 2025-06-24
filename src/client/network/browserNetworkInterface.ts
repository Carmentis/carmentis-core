// ============================================================================================================================ //
//  postRequest()                                                                                                               //
// ============================================================================================================================ //
export async function postRequest(url, data, callback, headers) {
  let netXhr = new XMLHttpRequest();

  let [ success, answer ] = await new Promise(function(resolve, reject) {
    netXhr.open("POST", url, true);

    Object.keys(headers).forEach(key => {
      netXhr.setRequestHeader(key, headers[key]);
    });

    netXhr.addEventListener("load", _ => {
      resolve([ true, netXhr.response ]);
    });

    netXhr.addEventListener("error", e => {
      resolve([ false, e ]);
    });

    netXhr.send(data);
  });

  callback(success, answer);
}
