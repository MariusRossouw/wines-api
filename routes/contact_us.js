var async = require('async');
var _ = require('underscore');
//var http = require('http');
var querystring = require("querystring");
var moment = require("moment");

var utils = require("../includes/utils.js");

exports.contact_us_post = function(req, res) {

    var req_params_obj = {};
    for (k in req.params) {
        req_params_obj[k] = req.params[k];
    };
    var req_params = JSON.stringify(req_params_obj);
    var req_query = JSON.stringify(req.query);
    var req_body = JSON.stringify(req.body);

    console.log('contact us:  ' + JSON.stringify(req.body, null, 2));

    // if(!http_req.query.corporate_name){
    //   http_req.query.corporate_name = '';
    // };
    // if(!http_req.query.first_name){
    //   http_req.query.first_name = '';
    // };
    // if(!http_req.query.last_name){
    //   http_req.query.last_name = '';
    // };
    // if(!http_req.query.amount){
    //   http_req.query.amount = 0;
    // };

    var save_resp = {};
    var result = {
        http_code: 200,
        message: '',
        data: {}
    };

    var reqobj = {body:req.body, query: req.query, params: req_params_obj};
    var reqobj_text = JSON.stringify(reqobj);

    async.waterfall(
        [
            function(callback) {
                utils.pdb_proc(req.pdb, 'contact_us_new', [reqobj_text], callback);
            },
            function(data, callback) {
                console.log('contact us db result:  ' + JSON.stringify(data, null, 2));
                save_resp = data;
                result.data = data;
                callback(null,{});
                //paysafe_new_http_test(amount_number, callback);
            },
            function(data,callback) {
                console.log('contact us req.body:  ' + JSON.stringify(req.body, null, 2));
                var template_data = {
                    "name" : req.body.name, 
                    "email" : req.body.email, 
                    "mobile" : req.body.phone, 
                    "message" : req.body.message
                };
                var spooler_data = {
                  template_name: 'JandoContactUs',
                  template_data: template_data,
                  to_address: 'jaco@jando.com; hratch@jando.com; jamiegodwin@gmail.com, marie-jo@jando.com'
                };
                console.log('contact us spooler_data:  ' + JSON.stringify(spooler_data, null, 2));
                console.log("Email A");
                utils.email_spooler_add(spooler_data, function(err,data){
                  console.log("Email A Add Result");
                  if(err){
                    console.error(err);
                  } else {
                    console.log(data);
                    var d = JSON.parse(data);
                    utils.email_spooler_one_by_id(d.id, function(err,data){
                      console.log("Email A Spool Result");
                      if(err){
                        console.error(err);
                      }
                      if(data){
                        console.log(data);
                      }
                    });
                  }
                });
              callback(null,{});
            },
        ],
        function(err, data) {
            if (err) {
                if (err.http_code) {
                    res.send(err.http_code, err);
                } else {
                    var api_err = { "http_code": "500", "message": "system error", "dump": err };
                    res.send(500, api_err);
                }
            } else {
                res.send(200, result);
            }
        }
    );

};

