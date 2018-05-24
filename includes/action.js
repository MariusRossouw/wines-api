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
var utils = require("../includes/utils.js");
var wf = require("../includes/wf.js");


exports.do_action = do_action;
function do_action(pdb, action, callback) {
    console.log('-- Action: ' + action.type + ' ------ ' + action.name + ' ----------------------');
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
        utils.pdb_proc(pdb, action.name, [data_string], function(err, data) {
            if (err) {
                console.error(err);
            };
            if (data) {
                //console.log(JSON.stringify(data, null, 2));
            };
            result = utils.gen_result_check(err, 200, data[action.name]);
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


    if (action.type == 'do_wf') {
        match_action = true;
        wf.do_wf(pdb, action.data.wf_id, function(err, data){
            result = data;
            wrapup(err);
        });
    };

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

        utils.generic_json_httppost(action.data.options, action.data.payload, action.data.content_length_yn, function(err,data){
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
        utils.childProcessSpawn(action.data.command, action.data.args, action.data.options, function(err,data){
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

    if (action.type == 'transaction_download_list') {
        match_action = true;
        console.log(action.type);
        download_list.transaction_download_list(action.data);
        wrapup(null);
    }

    if(!match_action){
        var r = {
            http_code : 403,
            error_code : "action_not_defined",
            message : "action not defined"
        };
        callback(null,r);
    }

    function wrapup(err) {
        console.log('----------- Action Wrapup ---------------');
        if (err) { //we are done
            console.log('Error exit:');
            console.log('Err ' + JSON.stringify(err));
            callback(null, result);
            return;
        }

        if (result.action) {
            console.log('Action exits:');
            console.log('Action ' + JSON.stringify(result.action));
            //if the result of the action just taken, have an "action"
            //do that action now
            //this overrides any "next_action"
            do_action(pdb, result.action, callback);
        } else if(action.next_action){
            console.log('Next Action exits:');
            console.log('Next Action ' + JSON.stringify(result.next_action));
            //if there is a "next_action" call that action
            //the next action data is supplied
            //add result of current data as data.prev_result
            action.next_action.data.prev_result = result.data;
            do_action(pdb, action.next_action, callback);
        } else {
            console.log('Returning result');
            //else no actions, simply give back the result
            callback(null, result);
        }
    };
};