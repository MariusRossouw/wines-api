var async = require('async');
var _ = require('underscore');
var http = require('http');
var https = require('https');
var querystring = require("querystring");
var moment = require("moment");
var pgp = require('pg-promise')({
    // Initialization Options
});
var childProcess = require('child_process');

exports.pdb_proc = pdb_proc;
function pdb_proc(pdb, name, values, callback) {
    var q = pdb.proc(name, values);
    q.then(function(data) {
        callback(null, data);
    });
    q.catch(function(error) {
        callback(error, {});
    });
};

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
    do_action(req.pdb, action, function(err, data){
        gen_result(res, err, 200, data);
    });
};


exports.gen_result = gen_result;
function gen_result(res, err, http_code, result) {
    var r = gen_result_check(err, http_code, result);
    console.log('http_code: ' + r.http_code);
    console.log('result: ' + JSON.stringify(r));
    res.send(r.http_code, r);
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






exports.do_action = do_action;
function do_action(pdb, action, callback) {
    console.log('------ ' + action.type + ' ------ ' + action.name + ' ----------------------');
    console.log(JSON.stringify(action, null, 2));
    var result = {};

    //1. do an action based on type and name
    //2. if the result has an action in the result, call recursively
    //3. else, check if there is an action.next_action. Add the result.data into next_action.prev_result and call the action

    var match_action = false;

    if (action.type == 'stored_function') {
        match_action = true;
        //assume the stored function have only one variable of type text and expects it to be json
        var data_string = JSON.stringify(action.data);
        pdb_proc(pdb, action.name, [data_string], function(err, data) {
            if (err) {
                console.error(err);
            };
            if (data) {
                console.log(JSON.stringify(data, null, 2));
            };
            result = gen_result_check(err, 200, data[action.name]);
            wrapup(err);
        });
    };

    if (action.type == 'simple_test') {
        match_action = true;
        //simly take the data in the action and send it back. Adding a test value.
        result.data = action.data;
        result.data.simple_test = true;
        wrapup(null);
    };

    // if (action.type == 'gps_ws_call') {
    //     match_action = true;
    //     //the pack is action.data
    //     gps_ws.action_gps_ws_call(pdb, action.data, function(err, data){
    //         result.data = data;
    //         wrapup(err);
    //     });
    // };

    if (action.type == 'do_wf') {
        match_action = true;
        do_wf(pdb, action.data.wf_id, function(err, data){
            result = data;
            wrapup(err);
        });
    };

    // if (action.type == 'ispiral_spool_one') {
    //     match_action = true;
    //     if(!action.data.id){
    //         wrapup(err);
    //     } else {
    //         ispiral_db.ispiral_spool_one(pdb, action.data.id, function(err, data){
    //             result.data = data;
    //             wrapup(err);
    //         });            
    //     }
    // };

    if (action.type == 'generic_json_httppost') {
        match_action = true;

        /*
            needs:
            http_options 
            payload
        */

        result.data = {};
        // result.data = {
        //     http_code:200,
        //     message:'',
        //     data:{}
        // };

        if(!action.data.content_length_yn){
            action.data.content_length_yn = false;
        }

        generic_json_httppost(action.data.options, action.data.payload, action.data.content_length_yn, function(err,data){
            if(err){
                console.error(err);
                result.data.http_error = err;
            }
            if(data){
                console.log(JSON.stringify(data));
                result.data.http_result = data;
            }
            wrapup(null);
        });
        //could do wrapup here, which means we will ignore the result
    };

    if (action.type == 'child_process') {
        match_action = true;

        result.data = {};
        childProcessSpawn(action.data.command, action.data.args, action.data.options, function(err,data){
            if(err){
                console.error(err);
                result.data.http_error = err;
            }
            if(data){
                console.log(JSON.stringify(data));
                result.data.http_result = data;
            }
            wrapup(null);
        });
    };

    // if (action.type == 'yubikeyotp_parse') {
    //     match_action = true;

    //     result.data = yubikeyotp.parseOTP(action.data.otp, action.data.aeskey);


    //     wrapup(null);
    // };

    // if (action.type == 'transaction_download_list') {
    //     match_action = true;
    //     console.log(action.type);
    //     download_list.transaction_download_list(action.data);
    //     wrapup(null);
    // }

    if(!match_action){
        var r = {
            http_code : 403,
            error_code : "action_not_defined",
            message : "action not defined"
        };
        callback(null,r);
    }

    function wrapup(err) {
        if (err) { //we are done
            callback(null, result);
            return;
        }

        if (result.action) { 
            //if the result of the action just taken, have an "action"
            //do that action now
            //this overrides any "next_action" 
            do_action(pdb, result.action, callback); 
        } else if(action.next_action){
            //if there is a "next_action" call that action
            //the next action data is supplied
            //add result of current data as data.prev_result
            action.next_action.data.prev_result = result.data;
            do_action(pdb, action.next_action, callback);
        } else {
            //else no actions, simply give back the result
            callback(null, result);
        }
    };
};





exports.do_wf = do_wf;
function do_wf(pdb, wf_id, callback) {
    console.log('---- WF -------- ' + wf_id + ' ----------------------');

    var wf = {};
    var job = {};

    pdb_proc(pdb, 'wf_get', [wf_id], function(err, data){
        console.log(JSON.stringify(data, null, 2));
        wf = data.wf_get.wf;
        wf.id = wf_id;
        do_job();
    });

    function bail(save, error_code, message, http_code){
        console.log('save_and_return');
        if(error_code){
            wf.result.error_code = error_code;
        }
        if(message){
            wf.result.message = message;
        }
        if(!wf.result.message && wf.result.error_code){
            wf.result.message = wf.result.error_code;
        }
        if(!http_code){
            http_code = 200;
        }
        wf.result = gen_result_check(wf.err, http_code, wf.result);    
        if(save){
            pdb_proc(pdb, 'wf_update', [wf], function(err, data){
                callback(null, wf.result);
            });
        } else {
            callback(null, wf.result);
        }
    }

    //var counter = 0;

    function do_job(){
        if(!wf.counter){
            wf.counter = 0;
        }
        wf.counter = wf.counter + 1;
        console.log('-------- do_job ' + wf.counter + ' ' + (wf.job_name ? wf.job_name : '') + ' --------------------');
        if(!wf.result){
            wf.result = {};
        };
        if(!wf.result.data){
            wf.result.data = {};
        };
        if(!wf.job_name || wf.job_name.length == 0){
            bail(false);
            return;
        };
        if(wf.job_name_prev && wf.job_name == wf.job_name_prev){
            bail(true, 'Next job same as prev job');
            return;           
        };
        wf.job_name_prev = wf.job_name;
        if(!wf.jobs){
            bail(true, 'No jobs array');
            return;
        };
        if(!wf.jobs[wf.job_name]){
            bail(true, 'Job not found');
            return;
        };
        job = wf.jobs[wf.job_name];
        if(!job.type){
            bail(true, 'Job type not found');
            return;
        };
        if(!job.input){
            job.input = {};
        }
        job.input._wf_id = wf.id;

        var match_job_type = false;

        if (job.type == 'stored_function') {
            match_job_type = true;
            //assume the stored function have only one variable of type text and expects it to be json
            if(!job.function_name || job.function_name.length == 0){
                job.output_error = 'No stored function name';
                wrapup(null);
            } else {
                var input = job.input;
                if(job.add_wf_to_input){
                    input = wf;
                }
                var data_string = JSON.stringify(input);
                pdb_proc(pdb, job.function_name, [data_string], function(err, data) {
                    if (err) {
                        console.error(err);
                        job.output_error = err;
                    };
                    if (data) {
                        console.log(JSON.stringify(data, null, 2));
                        job.output = data[job.function_name];
                    };
                    wrapup(err);
                });
            }

        };

        if (job.type == 'stored_function_json') {
            match_job_type = true;
            //assume the stored function have only one variable of type json
            if(!job.function_name || job.function_name.length == 0){
                job.output_error = 'No stored function name';
                wrapup(null);
            } else {
                var input = job.input;
                if(job.add_wf_to_input){
                    input = wf;
                }
                pdb_proc(pdb, job.function_name, [input], function(err, data) {
                    if (err) {
                        console.error(err);
                        job.output_error = err;
                    };
                    if (data) {
                        console.log(JSON.stringify(data, null, 2));
                        job.output = data[job.function_name];
                    };
                    wrapup(err);
                });
            }        
        };

        if (job.type == 'gps_ws_call_v2') {
            match_job_type = true;
            gps_ws.action_gps_ws_call_v2(pdb, job.input, function(err, data){
                if (err) {
                    console.error(err);
                    job.output_error = err;
                };
                if (data) {
                    console.log(JSON.stringify(data, null, 2));
                    job.output = data;
                };
                wrapup(err);
            });
        };

        if (job.type == 'simple_test') {
            match_job_type = true;
            job.output = {simple_test: true};
            wrapup(null);
        };

        if (job.type == 'yubikeyotp_parse') {
            match_job_type = true;
            job.output = yubikeyotp.parseOTP(job.input.otp, job.input.aeskey);
            wrapup(null);
        };

        if (job.type == 'ispiral_spool_one') {
            match_job_type = true;
            if(!job.input.id){
                wrapup(null);
            } else {
                ispiral_db.ispiral_spool_one(pdb, job.input.id, function(err, data){
                    if (err) {
                        console.error(err);
                        job.output_error = err;
                    };
                    if (data) {
                        console.log(JSON.stringify(data, null, 2));
                        job.output = data;
                    };
                    wrapup(err);
                });            
            }
        };

        if (job.type == 'generic_json_httppost') {
            match_job_type = true;

            if(!job.input.content_length_yn){
                job.input.content_length_yn = false;
            };
            generic_json_httppost(job.input.options, job.input.payload, job.input.content_length_yn, function(err,data){
                if (err) {
                    console.error(err);
                    job.output_error = err;
                };
                if (data) {
                    console.log(JSON.stringify(data, null, 2));
                    job.output = data;
                };
                wrapup(err);
            });
        };


        if (job.type == 'child_process') {
            match_job_type = true;

            result.data = {};
            childProcessSpawn(job.input.command, job.input.args, job.input.options, function(err,data){
                if (err) {
                    console.error(err);
                    job.output_error = err;
                };
                if (data) {
                    console.log(JSON.stringify(data, null, 2));
                    job.output = data;
                };
                wrapup(err);
            });
        };

        // if (job.type == 'ispiral_mssql') {
        //     match_job_type = true;

        //     result.data = {};
        //     ispiral_mssql.ispiral_mssql_call(pdb, job.input.sql, function(err,data){
        //         if (err) {
        //             console.error(err);
        //             job.output_error = err;
        //         };
        //         if (data) {
        //             console.log(JSON.stringify(data, null, 2));
        //             job.output = data;
        //         };
        //         wrapup(err);
        //     });
        // };


        if (!match_job_type){
            bail(true, 'Job type not found');
            return;
        }

    }

    function wrapup(err) {
        if(err && !job.suppress_error){
            bail(true, 'job_error', 'Job Error', 403)
        }

        //do recursive 
        if(job.refresh_from_db){
            pdb_proc(pdb, 'wf_get', [wf_id], function(err, data){
                console.log('--------- refresh wf from db ---------- ');
                //console.log(JSON.stringify(data, null, 2));
                wf = data.wf_get.wf;
                wf.id = wf_id;
                do_job();
            });
        } else {
            wf.job_name = '';
            if(job.next_job){
                wf.job_name = job.next_job;
            }
            if(job.output_to_result_data){
                if(!job.output){
                    job.output = {};
                }
                wf.result = job.output;
            }
            if(job.output_to_input){
                if(!job.output){
                    job.output = {};
                }
                if(!wf.jobs[job.output_to_input]){
                    wf.jobs[job.output_to_input].input = job.output;
                }
            }
            pdb_proc(pdb, 'wf_update', [wf], function(err, data){
                do_job();
            });
        }

    };
};










// ================ ACTIONS =================

function generic_json_httppost(options, data, content_length_yn, callback) {
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
};


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

exports.randomStr = function(n) {
    var n = n || 9; s = '', r = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i=0; i < n; i++) { s += r.charAt(Math.floor(Math.random()*r.length)); }
    return s;
  };


exports.objHasData = function(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        return true;
      }
    }
    return false;
  };

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
                do_action(req.pdb, action, callback);
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








