var async = require('async');
var _ = require('underscore');
var https = require('https');
var querystring = require("querystring");
var moment = require("moment");
var request = require("request");

var utils = require("../includes/utils.js");

var email = require("../includes/email.js");


var fs = require('fs');
var helper = require('sendgrid').mail;

exports.verification_email = function(req, res) {

    var req_params_obj = {};
    for (k in req.params) {
        req_params_obj[k] = req.params[k];
    };

    var req_obj = {};
    req_obj.params = req_params_obj;
    req_obj.query = req.query;
    req_obj.body = req.body;
    // console.log('AAAAAA: ' + req_obj.body.email_template);
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
    console.log('req_body: ' + JSON.stringify(req_obj.body, null, 2));

    var result_fin = {
        http_code : 200,
        error_code : "",
        message : "",
        data : {},
        errors : []
    };

    var function1 = 'http_profile_get_one';
    var result1 = {};

    async.waterfall(
        [
            function(callback) {
                utils.pdb_proc(req.pdb, function1, [req_obj_string], callback);
            },
            function(data, callback) {
                result1 = utils.gen_result_check(null,200,data[function1]);
                if(result1.http_code != 200){
                    result_fin = result1;
                    callback(result1, {});
                } else {
                    callback(null, {});
                }
            },
            function(data, callback) {
                if(req_obj.body.bool == 'false'){
                    callback(null,{});
                } else {
                    var email_metadata = {};
                    var template_name = 'canserve-registration'; // 'GoSureGetLegal';
                    var to_address = result1.data.email;
                    var template_data = {};
                    template_data.url = req_obj.body.url + result1.data.uuid;
                    template_data.name = result1.data.name;
                    email_metadata.template_name = template_name;
                    email_metadata.to_address = to_address;
                    email_metadata.template_data = template_data;
                    email.email_spooler_add(email_metadata,function(err,email_log){
                      console.log(err);
                      console.log(email_log);
                      callback(null,{});
                    });
                }
            }
        ],
        function(err, data) {
            console.log('result_fin: ' + JSON.stringify(result_fin));
            utils.gen_result(res, err, 200, result_fin);
        }
    );

};




exports.change_verification_email = function(req, res) {

        var req_params_obj = {};
        for (k in req.params) {
            req_params_obj[k] = req.params[k];
        };

        var req_obj = {};
        req_obj.params = req_params_obj;
        req_obj.query = req.query;
        req_obj.body = req.body;
        // console.log('AAAAAA: ' + req_obj.body.email_template);
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
        console.log('req_body: ' + JSON.stringify(req_obj.body, null, 2));

        var result_fin = {
            http_code : 200,
            error_code : "",
            message : "",
            data : {},
            errors : []
        };

        var function1 = 'http_profile_get_one';
        var result1 = {};

        async.waterfall(
            [
                function(callback) {
                    utils.pdb_proc(req.pdb, function1, [req_obj_string], callback);
                },
                function(data, callback) {
                    result1 = utils.gen_result_check(null,200,data[function1]);
                    if(result1.http_code != 200){
                        result_fin = result1;
                        callback(result1, {});
                    } else {
                        callback(null, {});
                    }
                },
                function(data, callback) {
                    if(req_obj.body.bool == 'false'){
                        callback(null,{});
                    } else {
                        var email_metadata = {};
                        var template_name = 'canserve-email-change'; // 'GoSureGetLegal';
                        var to_address = result1.data.new_email;
                        var template_data = {};
                        template_data.url = req_obj.body.url + result1.data.uuid;
                        template_data.name = result1.data.name;
                        email_metadata.template_name = template_name;
                        email_metadata.to_address = to_address;
                        email_metadata.template_data = template_data;
                        email.email_spooler_add(email_metadata,function(err,email_log){
                          console.log(err);
                          console.log(email_log);
                          callback(null,{});
                        });
                    }
                }
            ],
            function(err, data) {
                console.log('result_fin: ' + JSON.stringify(result_fin));
                utils.gen_result(res, err, 200, result_fin);
            }
        );

    };




exports.welcome_email = function(req, res) {

    var req_params_obj = {};
    for (k in req.params) {
        req_params_obj[k] = req.params[k];
    };

    var req_obj = {};
    req_obj.params = req_params_obj;
    req_obj.query = req.query;
    req_obj.body = req.body;
    // console.log('AAAAAA: ' + req_obj.body.email_template);
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
    console.log('req_body: ' + JSON.stringify(req_obj.body, null, 2));

    var result_fin = {
        http_code : 200,
        error_code : "",
        message : "",
        data : {},
        errors : []
    };

    var function1 = 'http_profile_get_one';
    var result1 = {};

    async.waterfall(
        [
            function(callback) {
                utils.pdb_proc(req.pdb, function1, [req_obj_string], callback);
            },
            function(data, callback) {
                result1 = utils.gen_result_check(null,200,data[function1]);
                if(result1.http_code != 200){
                    result_fin = result1;
                    callback(result1, {});
                } else {
                    callback(null, {});
                }
            },
            function(data, callback) {
                if(req_obj.body.bool == 'false'){
                    callback(null,{});
                } else {
                    var email_metadata = {};
                    var template_name = 'canserve-welcome'; // 'GoSureGetLegal';
                    var to_address = result1.data.email;
                    var template_data = {};
                    template_data.url = req_obj.body.url + result1.data.id;
                    template_data.name = result1.data.name;
                    email_metadata.template_name = template_name;
                    email_metadata.to_address = to_address;
                    email_metadata.template_data = template_data;
                    email.email_spooler_add(email_metadata,function(err,email_log){
                      console.log(err);
                      console.log(email_log);
                      callback(null,{});
                    });
                }
            }
        ],
        function(err, data) {
            console.log('result_fin: ' + JSON.stringify(result_fin));
            utils.gen_result(res, err, 200, result_fin);
        }
    );

};





exports.forgot_password = function(req, res) {

        var req_params_obj = {};
        for (k in req.params) {
            req_params_obj[k] = req.params[k];
        };

        var req_obj = {};
        req_obj.params = req_params_obj;
        req_obj.query = req.query;
        req_obj.body = req.body;
        // console.log('AAAAAA: ' + req_obj.body.email_template);
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
        console.log('req_body: ' + JSON.stringify(req_obj.body, null, 2));

        var result_fin = {
            http_code : 200,
            error_code : "",
            message : "",
            data : {},
            errors : []
        };

        var function1 = 'http_profile_get_one_by_email';
        var result1 = {};

        async.waterfall(
            [
                function(callback) {
                    utils.pdb_proc(req.pdb, function1, [req_obj_string], callback);
                },
                function(data, callback) {
                    result1 = utils.gen_result_check(null,200,data[function1]);
                    if(result1.http_code != 200){
                        result_fin = result1;
                        callback(result1, {});
                    } else {
                        callback(null, {});
                    }
                },
                function(data, callback) {
                    if(req_obj.body.bool == 'false'){
                        callback(null,{});
                    } else {
                        var email_metadata = {};
                        var template_name = 'canserve-forgot-password'; // 'GoSureGetLegal';
                        var to_address = result1.data.email;
                        var template_data = {};
                        template_data.password = result1.data.password;
                        template_data.name = result1.data.name;
                        email_metadata.template_name = template_name;
                        email_metadata.to_address = to_address;
                        email_metadata.template_data = template_data;
                        email.email_spooler_add(email_metadata,function(err,email_log){
                          console.log(err);
                          console.log(email_log);
                          callback(null,{});
                        });
                    }
                }
            ],
            function(err, data) {
                console.log('result_fin: ' + JSON.stringify(result_fin));
                utils.gen_result(res, err, 200, result_fin);
            }
        );

    };

