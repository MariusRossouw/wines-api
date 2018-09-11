var async = require('async');
var _ = require('underscore');
var http = require('http');
var https = require('https');
var request = require("request");
var querystring = require("querystring");
var moment = require("moment");
var pgp = require('pg-promise')({
    // Initialization Options
});
var childProcess = require('child_process');

var exec_action = require("../includes/action.js");

exports.pdb_proc = pdb_proc;
function pdb_proc(pdb, name, values, callback) {
    //console.log('postgress function name:' + name);
    var q = pdb.proc(name, values);
    q.then(function(data) {
        console.log('DATA: ',data);
        //console.log('postgress function result:');
        //console.log(JSON.stringify(data));
        callback(null, data);
    });
    q.catch(function(error) {
        console.log('ERROR', error);
        //console.log('postgress function error:');
        //console.error(error);
        callback(error, {});
    });
};

exports.create_req_object = create_req_object;
function create_req_object(req){
    var req_obj = {};

    req_obj.params = {};
    for (k in req.params) {
        req_obj.params[k] = req.params[k];
    };
    req_obj.query = req.query;
    req_obj.body = req.body;
    req_obj.method = req.method;
    req_obj.url = req.url;
    req_obj.auth = req.headers['authorization'];

    req_obj.other = {};
    req_obj.other.app = req.app;
    req_obj.other.baseUrl = req.baseUrl;
    req_obj.other.hostname = req.hostname;
    req_obj.other.headers = req.headers;
    req_obj.other.hostname = req.hostname;
    req_obj.other.app = req.app;
    req_obj.other.baseUrl = req.baseUrl;
    req_obj.other.cookies = req.cookies;
    req_obj.other.ip = req.ip;
    req_obj.other.ips = req.ips;
    req_obj.other.path = req.path;
    req_obj.other.host = req.headers.host;
    req_obj.other.cfray = req.headers['cf-ray'];
    req_obj.other.cfipcountry = req.headers['cf-ipcountry'];
    req_obj.other.useragent = req.headers['user-agent'];
    req_obj.other.xforwardedfor = req.headers['x-forwarded-for'];

    if (req.session && req.session.auth && req.session.auth.profile_id) {
        req_obj.other.session_profile_id = req.session.auth.profile_id;
        //console.log('Session: create_req_object', req.url, 'profile_id:', req.session.auth.profile_id);
    } else {
        req_obj.other.session_profile_id = '';
    }

    return req_obj;
};

exports.pg_http_gen_new = function(req, res, api_name) {
    //different from action of type 'stored_function'

    var req_obj = create_req_object(req);
    req_obj.api_name = api_name;

    //send to specific stored procedure
    var action = {};
    action.type = 'stored_function';
    action.name = 'http_api_method';
    action.data = req_obj;
    exec_action.do_action(req.pdb, action, function(err, data){
        gen_result(res, err, 200, data);
    });
};


exports.gen_result = gen_result;
function gen_result(res, err, http_code, result) {
    var r = gen_result_check(err, http_code, result);
    //console.log('http_code: ' + r.http_code);
    console.log('result: ' + JSON.stringify(r));
    res.status(http_code).json(r.http_code, r);
};

exports.gen_result_check = gen_result_check;
function gen_result_check(err, http_code, result){
    if (!http_code) {
        http_code = 500;
        result = {};
        result.http_code = 500;
        result.error_code = "invalid_http_code";
        result.message = "Invalid http code";
    };
    if (!result) {
        result = {};
        result.http_code = 500;
        result.error_code = "invalid_result";
        result.message = "Invalid result";
    };

    if (err) {
        if (err && err.http_code) { //we made this error
            result.http_code = err.http_code;
            if (err.message) {
                result.error_code = err.message;
                result.message = err.message;
            }
        } else {
            console.error(err);
            res.send(500, 'system_error');
            result.http_code = 500;
            result.error_code = 'system_error';
            result.message = 'System Error';
        }
    }

    if (!result.http_code) { result.http_code = http_code };
    if (!result.error_code) { result.error_code = '' };
    if (!result.message) { result.message = '' };
    if (!result.data) {
        result.data = {};
    };
    if (!result.errors) { result.errors = [] };
    return result;
}


// ================ ACTIONS =================
exports.generic_json_httppost = generic_json_httppost;
function generic_json_httppost(options, data, content_length_yn, callback) {

    try {

        console.log("The http options: " + JSON.stringify(options));
        //var httpreqbody = querystring.stringify(data);
        var httpreqbody = JSON.stringify(data);
        console.log("The payload: " + httpreqbody);
        //var httpreqbodylength = Buffer.byteLength(httpreqbody);

        var httpresbody = '';
        // var options = {
        //     host: http_options.host,
        //     path: http_options.path,
        //     port: http_options.port,
        //     method: "POST",
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Content-Length': Buffer.byteLength(httpreqbody)

        //     }
        // };

        if(content_length_yn){
            options.headers['Content-Length'] = Buffer.byteLength(httpreqbody)
        }

                //'Accept': 'application/json'
                //'Content-Length': Buffer.byteLength(httpreqbodylength)

        // headers: {
        //     'Content-Type': 'application/soap+xml; charset=utf-8',
        //     'Content-Length': Buffer.byteLength(xml)
        // }
                //     'Authorization': json_req.authheader,
                // 'Accept': '*/*'


        httpreq = http.request(options, function(httpres) {
            httpres.on('error', function(err) {
                console.log("httpres error");
                console.error(err);
                callback(err, httpresbody);
            });
            httpres.on('data', function(chunk) {
                httpresbody = httpresbody + chunk;
            });
            httpres.on('end', function() {
                console.log("HTTP RESULT");
                console.log(httpresbody);
                callback(null, httpresbody);
            });
        });
        httpreq.on('error', function(err) {
            console.log("httpreq error");
            console.error(err);
            callback(err, httpresbody);
        });
        httpreq.write(httpreqbody);
        httpreq.end();

    } catch (err){
        console.error(err);
        callback(err, {});
    }

};

exports.childProcessSpawn = childProcessSpawn;
function childProcessSpawn(command,args,options,callback){
  if(!args){
    args = [];
  }
  if(!options){
    options = {
      cwd: undefined,
      env: process.env
    }
  }
  var result = {
    text:'',
    code:0
  }
  var sp = childProcess.spawn(command,args,options);
  sp.stdout.on('data', function (data) {
    result.text = result.text + data + '\n';
  });
  sp.stderr.on('data', function (data) {
    result.text = result.text + data + '\n';
  });
  sp.on('close', function (code) {
    result.code = code;
    callback(null,result);
  });
  sp.on('error', function (err) {
    result.text = result.text + err.toString() + '\n';
    callback(null,result);
  });
}



// =============== UTILS ==================


exports.plv8_modules_reload = function(pdb) {
    pdb_proc(pdb, 'plv8_util_module_load_all', [], function(err, data) {
        if (err) {
            console.error(err);
        } else {
            console.log('result' + JSON.stringify(data));
        };
    });
};

exports.plv8_modules_reload_http = function(req, res) {
    //console.log('plv8_modules_reload_http');
    var result = {};

    async.waterfall([
        function(callback) {
            pdb_proc(req.pdb, 'plv8_util_module_load_all', [], callback);
        },
        function(data, callback) {
            //console.log('result: ' + JSON.stringify(data));
            //result = data[function_name];
            callback(null, data);
        }
    ],
    function(err, data) {
        if (err) {
            console.error(err);
        } else {
            console.log('result: ' + JSON.stringify(data));
        };
        gen_result(res, null, 200, result);
    });
};

exports.concat_names = concat_names;
function concat_names(a) {
    var name = '';
    for (var i = 0; i < a.length; i++) {
        if (a[i] && a[i].length > 0) {
            if (name.length > 0) {
                name = name + ' ';
            }
            name = name + a[i];
        }
    }
    return name;
}


exports.validateNumber = function(n) {
    var r = { valid: false, value: 0 };
    if (!n) {
        return r;
    }
    // if(_.isString(n)){
    //   var num = parseFloat(n);
    //   if(!isNaN(num) && isFinite(num)){
    //     r.valid = true;
    //     r.value = num;
    //     return r;
    //   }
    // };
    // if(_.isNumber(n)){
    //   if(!isNaN(n) && isFinite(n)){
    //     r.valid = true;
    //     r.value = n;
    //     return r;
    //   }
    // }
    try {
        r.value = parseFloat(n);
        r.valid = true;
        return r;
    } catch (err) {
        r.valid = false;
        return r;
    }
    return r;
    //Math.round(parseFloat(yourString), 2)
};

  exports.validateAmount = function(n){
    var r = { valid: false, value: 0 };
    if (!n) {
        return r;
    }
    var n_str = n + '';
    if(n_str.length == 0){
      return r;
    };
    try {
        r.value = parseFloat(n_str);
    } catch (err) {
        return r;
    }
    if(r.value <= 0){
      return r;
    };
    r.valid = true;
    return r;
  }


  exports.validateId = function(n){
    var r = { valid: false, value: 0 };
    if (!n) {
        return r;
    }
    var n_str = n + '';
    if(n_str.length == 0){
      return r;
    };
    try {
        r.value = parseInt(n_str);
    } catch (err) {
        return r;
    }
    if(r.value <= 0){
      return r;
    };
    r.valid = true;
    return r;
  }

// =============== EMAIL SPOOLER STUFF ==================

var spooler_url = '41.71.77.236';
//var spooler_url = 'localhost';
var spooler_port = 3013;

exports.email_spooler_add = email_spooler_add;
function email_spooler_add(data, callback) {
    //var httpreqbody = 'jsonarr=' + JSON.stringify(data);
    var httpreqbody = JSON.stringify(data);
    var httpresbody = '';

    var options = {
        host: spooler_url,
        path: '/email_spooler',
        port: spooler_port,
        method: "POST",
        headers: {
            //'Content-Type': 'application/x-www-form-urlencoded; charset-utf-8',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(httpreqbody)
        }
    };

    httpreq = http.request(options, function(httpres) {
        //console.log(httpres.statusCode);
        //if (httpres.statusCode != 200){
        //    callback('http code ' + httpres.statusCode,{});
        //};
        httpres.on('error', function(err) {
            console.log("httpres error");
            console.error(err);
            callback(err, httpresbody);
        });
        httpres.on('data', function(chunk) {
            console.log(chunk);
            httpresbody = httpresbody + chunk;
        });
        httpres.on('end', function() {
            console.log(httpresbody);
            callback(null, httpresbody);
        });
    });
    httpreq.on('error', function(err) {
        console.log("httpreq error");
        console.error(err);
        callback(err, httpresbody);
    });
    console.log('httpreqbody: ' + httpreqbody);
    httpreq.write(httpreqbody);
    httpreq.end();
};


exports.email_spooler_one = email_spooler_one;
function email_spooler_one(callback) {
    var httpresbody = '';
    var options = {
        host: spooler_url,
        path: '/email_spooler/spoolone',
        port: spooler_port,
        method: "GET"
    };

    httpreq = http.request(options, function(httpres) {
        httpres.on('error', function(err) {
            console.log("httpres error");
            console.error(err);
            callback(err, httpresbody);
        });
        httpres.on('data', function(chunk) {
            httpresbody = httpresbody + chunk;
        });
        httpres.on('end', function() {
            console.log(httpresbody);
            callback(null, httpresbody);
        });
    });
    httpreq.on('error', function(err) {
        console.log("httpreq error");
        console.error(err);
        callback(err, httpresbody);
    });
    httpreq.end();
};

exports.email_spooler_one_by_id = email_spooler_one_by_id;
function email_spooler_one_by_id(_id, callback) {
    var httpresbody = '';
    var options = {
        host: spooler_url,
        path: '/email_spooler/spoolone/' + _id,
        port: spooler_port,
        method: "GET"
    };

    httpreq = http.request(options, function(httpres) {
        httpres.on('error', function(err) {
            console.log("httpres error");
            console.error(err);
            callback(err, httpresbody);
        });
        httpres.on('data', function(chunk) {
            httpresbody = httpresbody + chunk;
        });
        httpres.on('end', function() {
            console.log(httpresbody);
            callback(null, httpresbody);
        });
    });
    httpreq.on('error', function(err) {
        console.log("httpreq error");
        console.error(err);
        callback(err, httpresbody);
    });
    httpreq.end();
};



// =============== OLD STUFF ============================

exports.pg_http_gen_old = function(req, res, function_name) {
    var result = {};

    async.waterfall(
        [
            function(callback) {
                var action = {};
                action.type = 'stored_function';
                action.name = function_name;
                action.data = req_obj;
                exec_action.do_action(req.pdb, action, callback);
            },
            function(data, callback) {
                //console.log('result: ' + JSON.stringify(data));
                result = data;
                callback(null, {});
            }
        ],
        function(err, data) {
            //console.log('result2: ' + JSON.stringify(data));
            gen_result(res, err, 200, result);
        }
    );
};

exports.gen_result_old = gen_result_old;

function gen_result_old(res, err, http_code, result) {
    if (err) {
        if (err && err.http_code) {
            res.send(err.http_code, err.message);
        } else {
            console.error(err);
            res.send(500, 'system_error');
        }
    } else {
        console.log('http_code' + http_code);
        console.log('result' + JSON.stringify(result));

        if (result.http_code && result.http_code != 200) {
            http_code = result.http_code;
        }
        res.send(http_code, result);
    }
}


function create_req_object_old(req){
     //wierd stuff here. req.params is not an object. Is a kind of associative array.
    //change it in to an array
    //means we could have had duplicate keys in req.params, but will only now retain the last one
    var req_params_obj = {};
    for (k in req.params) {
        req_params_obj[k] = req.params[k];
    };

    //create simplified req obj to pass to stored function
    var req_obj = {};
    req_obj.method_name = function_name;
    req_obj.params = req_params_obj;
    req_obj.query = req.query;
    req_obj.body = req.body;
    req_obj.headers = req.headers;

    req_obj.other = {};
    req_obj.other.httpVersion = req.httpVersion;
    req_obj.other.method = req.method;
    //req_obj.other.rawHeaders = req.rawHeaders;
    //req_obj.other.rawTrailers = req.rawTrailers;
    req_obj.other.statusMessage = req.statusMessage;
    req_obj.other.trailers = req.trailers;
    req_obj.other.url = req.url;

    req_obj.other.app = req.app;
    req_obj.other.baseUrl = req.baseUrl;
    req_obj.other.cookies = req.cookies;
    req_obj.other.fresh = req.fresh;
    req_obj.other.hostname = req.hostname;
    req_obj.other.ip = req.ip;
    req_obj.other.ips = req.ips;
    req_obj.other.originalUrl = req.originalUrl;
    req_obj.other.path = req.path;
    req_obj.other.protocol = req.protocol;
    req_obj.other.route = req.route;
    //req_obj.other.secure = req.secure;
    req_obj.other.signedCookies = req.signedCookies;
    req_obj.other.subdomains = req.subdomains;
    req_obj.other.xhr = req.xhr;
     //for more
    //var util=require('util');
    //util.inspect(req)

    //var req_obj_string = JSON.stringify(req_obj, null, 2);
    //console.log('Function: ' + function_name);
    //console.log('req_obj: ' + req_obj_string);
    //console.log('req_body: ' + JSON.stringify(req_obj.body, null, 2));

    return req_obj;
}



exports.pg_http_gen = function(req, res, function_name) {
    //wierd stuff here. req.params is not an object. Is a kind of associative array.
    //change it in to an array
    //means we could have had duplicate keys in req.params, but will only now retain the last one
    var req_params_obj = {};
    for (k in req.params) {
        req_params_obj[k] = req.params[k];
    };

    //create simplified req obj to pass to stored function
    var req_obj = {};
    req_obj.method_name = function_name;
    req_obj.params = req_params_obj;
    req_obj.query = req.query;
    req_obj.body = req.body;
    req_obj.headers = req.headers;

    var req_obj_string = JSON.stringify(req_obj, null, 2);
    console.log('Function: ' + function_name);
    console.log('req_obj: ' + req_obj_string);

    var result = {};

    async.waterfall([
            function(callback) {
                pdb_proc(req.pdb, function_name, [req_obj_string], callback);
            },
            function(data, callback) {
                //console.log('result: ' + JSON.stringify(data));
                result = data[function_name];
                callback(null, {});
            }
        ],
        function(err, data) {
            gen_result_old(res, err, 200, result);
        });
};
