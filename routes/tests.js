var async = require('async');
var _ = require('underscore');
//var ObjectID = require('mongodb').ObjectID;
//var ISODate = require('mongodb').ISODate;
var http = require('http');
var querystring = require("querystring");
var moment = require("moment");
var utils = require("../includes/utils.js");
var sms = require("../includes/sms.js");

var system_init_date = moment('2015-08-17T00:00:00.000+0000').toDate();



exports.test_sms = function(req, res){
  //http://localhost:3554/demo/test_sms
  //'You have received €200'   //20ac003200300030
  //utils.send_sms_rest(req.db, '27791449586', 'You have received €200', 'testing', '0', '0');
  //79026964475

  sms.send_sms_rest(req.pdb, '27842407044', 'You have received €200 from  تابعهم‎', 'testing', '0', '0', true, function(err,data){
    if(err){
      console.error(err);
    };
    if(data){
      try {
        console.log(JSON.stringify(data));
      } catch(err){

      }
    };
    utils.gen_result(res,null,data.http_code,data);
  });
  //utils.send_sms_rest(req.db, '447539511220', 'You have received €200', 'testing', '0', '0', true);
};

exports.test_sms_temp = function(req, res){
  var message = '€200';
  var message_escaped = utils.jsescape_clickatell(message);
  console.log(message_escaped);
  var err = null;
  var data = 'Done';
  utils.gen_result(res,err,200,data);
};