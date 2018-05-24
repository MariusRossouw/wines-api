var async = require('async');
var _ = require('underscore');
var http = require('http');
var https = require('https');
var request = require("request");
var pgp = require('pg-promise')({
    // Initialization Options
});
var childProcess = require('child_process');

var utils = require("../includes/utils.js");

exports.do_wf = do_wf;
function do_wf(pdb, wf_id, callback) {
    console.log('---- WF -------- ' + wf_id + ' ----------------------');

    var job = {};

    utils.pdb_proc(pdb, 'wf_get', [wf_id], function(err, data){
        console.log(JSON.stringify(data, null, 2));
        wf = data.wf_get.wf;
        wf.id = wf_id;
        do_job(wf, function(err, data){
            console.log('WF Callback');
            callback(err, data);
        });
    });



    //var counter = 0;

    function do_job(wf, callback){

        function bail(save, error_code, message, http_code){
            console.log('BAIL');
            console.log('error code' + error_code);
            console.log('message' + message);

            wf.job_name = '';
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
            //if(wf.gen_result_check){
                wf.result = utils.gen_result_check(wf.err, http_code, wf.result);
            //}
            if(save){
                console.log('Bail - wf save pre');
                utils.pdb_proc(pdb, 'wf_update', [wf], function(err, data){
                    console.log('Bail - wf saved');
                    callback(null, wf.result);
                });
            } else {
                callback(null, wf.result);
            }
        }

        function wrapup(err) {
            if(!wf.errors){
                wf.errors = [];
            }
            wf.errors.push(err);

            if(err && !job.suppress_error){
                bail(true, 'job_error', 'Job Error', 403);
                return;
            }

            //do recursive
            if(job.refresh_from_db){
                utils.pdb_proc(pdb, 'wf_get', [wf_id], function(err, data){
                    console.log('--------- refresh wf from db ---------- ');
                    //console.log(JSON.stringify(data, null, 2));
                    var temp_job_name = wf.job_name;
                    wf = data.wf_get.wf;
                    wf.id = wf_id;
                    //get the job
                    job = {};
                    if(wf.jobs[temp_job_name]){
                        job = wf.jobs[temp_job_name];
                    }
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
                    var delay = 100;
                    if(job.delay){
                        delay = job.delay;
                    }
                    setTimeout(function() {
                        do_job(wf, callback);
                    }, delay);
                });
                return;
            }



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
            utils.pdb_proc(pdb, 'wf_update', [wf], function(err, data){
                var delay = 100;
                if(job.delay){
                    delay = job.delay;
                }
                setTimeout(function() {
                    do_job(wf, callback);
                }, delay);
            });


        };

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
        var max_count = 20;
        if(wf.code == 'payroll_batch_release'){
            max_count = 100;
        };
        if(wf.counter > max_count){
            console.log('Bailing - WF counter max reached');
            bail(true, 'WF counter max reached');
            return;
        };
        if(!wf.job_name || wf.job_name.length == 0){
            console.log('Bailing - no job name');
            bail(false);
            return;
        };
        if(wf.job_name_prev && wf.job_name == wf.job_name_prev){
            console.log('Bailing - Next job same as prev job');
            //bail(true, 'Next job same as prev job');
            bail(false);
            return;
        };
        wf.job_name_prev = wf.job_name;
        if(!wf.jobs){
            console.log('Bailing - No Jobs');
            bail(true, 'No jobs array');
            return;
        };
        if(!wf.jobs[wf.job_name]){
            console.log('Bailing - Job not found');
            bail(true, 'Job not found');
            return;
        };
        job = wf.jobs[wf.job_name];
        if(!job.type){
            console.log('Bailing - Job type not found');
            bail(true, 'Job type not found');
            return;
        };
        if(!job.input){
            job.input = {};
        }
        job.input._wf_id = wf.id;

        var match_job_type = false;


        function pdb_proc_wf(pdb, name, values, callback) {
            var q = pdb.proc(name, values);
            q.then(function(data) {
                // console.log('postgress function result:');
                // console.log(JSON.stringify(data));
                callback(null, data);
            });
            q.catch(function(error) {
                // console.log('postgress function error:');
                // console.error(error);
                callback(error, {});
            });
        };

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
                pdb_proc_wf(pdb, job.function_name, [data_string], function(err, data) {
                    if (err) {
                        console.error(err);
                        job.output_error = err;
                        wrapup(err);
                    };
                    if (data) {
                        console.log(JSON.stringify(data, null, 2));
                        job.output = data[job.function_name];
                        //console.log('debug job.output');
                        //console.log(JSON.stringify(job.output, null, 2));

                        //temp - first check for http error - many jobs still have that in
                        if(job.output.error_code && job.output.error_code.length > 0){
                            bail(true, job.output.error_code, job.output.message, 403);
                        } else {
                            wrapup(err);
                        }
                    };
                    //wrapup(err);
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
                pdb_proc_wf(pdb, job.function_name, [input], function(err, data) {
                    if (err) {
                        console.error(err);
                        job.output_error = err;
                    };
                    if (data) {
                        console.log(JSON.stringify(data, null, 2));
                        job.output = data[job.function_name];
                        if(!job.output){
                            job.output = {};  //might mean an error
                        }
                        console.log('debug job.output');
                        console.log(JSON.stringify(job.output, null, 2));

                        //temp - first check for http error - many jobs still have that in
                        if(job.output.error_code && job.output.error_code.length > 0){
                            console.log('We are bailing now');
                            bail(true, job.output.error_code, job.output.message, 403);
                        } else {
                            wrapup(err);
                        }
                    };
                });
            }
        };

        if (job.type == 'simple_test') {
            match_job_type = true;
            job.output = {simple_test: true};
            wrapup(null);
        };

        if (job.type == 'generic_json_httppost') {
            match_job_type = true;

            if(!job.input.content_length_yn){
                job.input.content_length_yn = false;
            };
            utils.generic_json_httppost(job.input.options, job.input.payload, job.input.content_length_yn, function(err,data){
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


        if (job.type == 'generic_json_http_request') {
            match_job_type = true;
            console.log('========== generic_json_http_request =================');
            console.log(JSON.stringify(job.input.request_obj));
            var req = request (
                job.input.request_obj,
                function (err, response, body) {
                    if (err) {
                        console.error(err);
                        job.output_error = err;
                    };
                    //Response has the body, headers, request etc
                    //console.log("------- response: " + JSON.stringify(response, null, 2))
                    //job.output.response = response;

                    //console.log("------- body: " + body);
                    job.output = {};
                    if(response && response.statusCode){
                        job.output.statusCode = response.statusCode;
                    }
                    try{
                        job.output.json = JSON.parse(body);
                    } catch(parse_err){
                        job.output.text = body;
                    }
                    wrapup(err);
                }
            )
        };

        if (job.type == 'child_process') {
            match_job_type = true;

            utils.childProcessSpawn(job.input.command, job.input.args, job.input.options, function(err,data){
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
        // if (job.type == 'sendgrid') {
        //     match_job_type = true;

        //     var helper = require('sendgrid').mail;
        //     console.log('api_key ' + job.input.sg.api_key);
        //     var sg = require('sendgrid')(job.input.sg.api_key);
        //     var subject = job.input.sg.subject;
        //     console.log('subject ' + subject);
        //     console.log('from_email ' + job.input.sg.from);
        //     console.log('to_email ' + job.input.sg.to);
        //     var from_email = new helper.Email(job.input.sg.from);
        //     var to_email = new helper.Email(job.input.sg.to);
        //     var content = new helper.Content('text/html', job.input.sg.content);
        //     var mail = new helper.Mail(from_email, subject, to_email, content);

        //     var sg_request = sg.emptyRequest({
        //         method: 'POST',
        //         path: '/v3/mail/send',
        //         body: mail //.toJSON()
        //     });
        //     console.log(JSON.stringify(sg_request));
        //     sg.API(request, function(err, data) {
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


};