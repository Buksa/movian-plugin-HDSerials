function logData(data, logFunction, depth) {
  if (!depth) depth = 0;

  var body = "";
  for (var i = 0; i < depth; i++) body += "  ";
  if (depth > 0) body += "'-> ";

  if (data === null) logFunction(body + "NULL");
  else if (data === undefined) logFunction(body + "UNDEFINED");
  else if (typeof (data) === 'boolean') logFunction(body + data);
  else if (typeof (data) === 'number') logFunction(body + data);
  else if (typeof (data) === 'string') logFunction(body + data);
  else if (Array.isArray(data)) logFunction(JSON.stringify(data, null, 4));
  else if (typeof (data) === 'object') logFunction(JSON.stringify(data, null, 4));
  else if (typeof (data) === 'function') logFunction(body + "Function()");
  else logFunction(body + "Unknown data type");
}

exports.d = function (data) {
  logData(data, console.log);
};

exports.e = function (data) {
  logData(data, console.error);
};

exports.p = function (data) {
  logData(dump(data), print);
};

function dump(c, d) {
    var a = "";
    d || (d = 0);
    for (var e = "", b = 0; b < d + 1; b++) {
        e += "    ";
    }
    if ("object" == typeof c) {
        for (var f in c) {
            b = c[f], "object" == typeof b ? (a += e + "'" + f + "' ...\n", a += dump(b, d + 1)) : a += e + "'" + f + "' => \"" + b + '"\n';
        }
    } else {
        a = "===>" + c + "<===(" + typeof c + ")";
    }
    return a;
}