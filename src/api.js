exports.call = function(params, page, callback, filter) {
  var URL = 'http://hdserials.galanov.net/backend/model.php';
  var opts = {
    method: 'POST',
    headers: {
      'User-Agent': UA
    },
    args: [params || {}],
    debug: service.debug,
    noFail: true, // Don't throw on HTTP errors (400- status code)
    compression: true, // Will send 'Accept-Encoding: gzip' in request
    caching: true, // Enables Movian's built-in HTTP cache
  };
  log.p(URL);
  log.p(opts);
  http.request(URL, opts, function(err, result) {
    if (page) page.loading = false;
    if (err) {
      if (page) page.error(err);
    } else {
      try {
        var r = JSON.parse(result);
        if (r.error) {
          console.error("Request failed: " + URL);
          console.error(r.error.errors[0].message);
          if (page) page.error(r.error.errors[0].reason);
          throw (new Error("Request failed: " + r.error.errors[0].reason));
        }
        callback(r);
      } catch (e) {
        if (page) page.error(e);
        throw (e);
      }
    }
  });
};