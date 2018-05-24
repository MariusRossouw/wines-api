var async = require('async');
var _ = require('underscore');
var http = require('http');
var querystring = require("querystring");
var moment = require("moment");
var utils = require("../includes/utils.js");
// var sms = require("../includes/sms.js");
//var pdf1 = require('../pdf_templates/pdf_getlegal.js');

var system_init_date = moment('2015-08-17T00:00:00.000+0000').toDate();






exports.pdf_spool_one = function(req, res) {
    console.log('req.body: ' + JSON.stringify(req.body,null,2));
    var req_params_obj = {};
    for (k in req.params) {
        req_params_obj[k] = req.params[k];
    };

    var req_obj = {};
    req_obj.params = req_params_obj;
    req_obj.query = req.query;
    req_obj.body = req.body;
    req_obj.headers = req.headers;

    req_obj.other = {};
    req_obj.other.httpVersion = req.httpVersion;
    req_obj.other.method = req.method;
    req_obj.other.rawHeaders = req.rawHeaders;
    req_obj.other.rawTrailers = req.rawTrailers;
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
    req_obj.other.signedCookies = req.signedCookies;
    req_obj.other.subdomains = req.subdomains;
    req_obj.other.xhr = req.xhr;

    var req_obj_string = JSON.stringify(req_obj, null, 2);

    var result_fin = {
        http_code : 200,
        error_code : "",
        message : "",
        data : {},
        errors : []
    };

    var function1 = 'http_policy_getone';
    var result1 = {};
    var code = {};
    async.waterfall(
        [
            function(callback) {
                utils.pdb_proc(req.pdb, function1, [req_obj_string], callback);
            },
            function(data, callback) {
                result1 = utils.gen_result_check(null,200,data[function1]);
                console.log('result1: ' + JSON.stringify(result1));
                if(result1.http_code != 200){
                    result_fin = result1;
                    callback(result1, {});
                } else {
                    var response = result1.data;
                    filename = response.policy_details.policy_schedule;
                    template_data = response;
                    result_fin = result1;
                    console.log('template_data: ' + JSON.stringify(template_data));
                    pdf1.makedoc(filename,template_data);
                    try{
                      callback(null,{});
                    } catch (err) {
                    }
                }
            }
        ],
        function(err, data) {
            utils.gen_result(res, err, 200, result_fin);
        }
    );

};





















// exports.pdf_spool_one = function(pdb, id, callback){
//   var result = {
//     http_code : 200,
//     error_code : "",
//     message : "",
//     data : {},
//     errors : []
//   };

//   var filename = "";
//   var response = {};
//   var template_data = {};
//   var req_obj = {};
//   req_obj.body = {}
//   req_obj.body.policy_id = id;

//   async.waterfall([
//     function(callback) {
//       utils.pdb_proc(req.pdb, 'http_policy_getone', [req_obj], function(err,data){
//         if(err){
//           console.log('Error:')
//           console.error(err);
//         };
//         if(data){
//           console.log('Data:')
//           console.log(JSON.stringify(data));
//         };
//         if(data && data.http_policy_get_one && data.http_policy_get_one.data){
//           response = data.http_policy_get_one.data;
//         }
//         filename = response.file_name;
//         template_data = response.template_data;
//         console.log('template_data: ' + JSON.stringify(template_data));
//         pdf1.makedoc(filename,template_data);
//         try{
//           callback(null,{});
//         } catch (err) {
//         }
//       });
//     },
//     function(data,callback) {
//       utils.pdb_proc(pdb, 'http_spooler_pdf_update_one', [req_obj], function(err,data){
//         if(err){
//           console.log('Error:')
//           console.error(err);
//         };
//         if(data){
//           console.log('Data:')
//           console.log(JSON.stringify(data));
//         };
//         if(data && data.http_spooler_pdf_update_one && data.http_spooler_pdf_update_one.data && data.http_spooler_pdf_update_one.data.response){
//           response = data.http_spooler_pdf_update_one.data.response;
//         }
//         callback(null,{});
//       });
//     }
//   ],
//   function(err,data) {
//     console.log("Last function");
//     if (err) {
//       console.error(err);
//     } else {
//       console.log("PDF Created Succesfully");
//      }
//     callback(err,{});
//   });
// };


