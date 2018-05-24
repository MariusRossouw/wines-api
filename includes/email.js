var async = require('async');
var _ = require('underscore');
var http = require('http');
var querystring = require("querystring");
var moment = require("moment");


var spooler_url = '52.50.190.20';

exports.email_spooler_add = email_spooler_add;
function email_spooler_add(data, callback){
  var httpreqbody = JSON.stringify(data);
  var httpresbody = '';

  var options = {
    host: spooler_url,
    path: '/email_send',
    port: 31014,
    method: "POST",
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(httpreqbody)
    }
  };

  httpreq = http.request(options,function(httpres){
    httpres.on('error',function(err){
      console.log("httpres error");
      console.error(err);
      callback(err,httpresbody);
    });
    httpres.on('data',function(chunk){
      console.log(chunk);
      httpresbody = httpresbody + chunk;
    });
    httpres.on('end',function(){
      console.log(httpresbody);
      callback(null,httpresbody);
    });
  });
  httpreq.on('error',function(err){
    console.log("httpreq error");
    console.error(err);
    callback(err,httpresbody);
  });
  httpreq.write(httpreqbody);
  httpreq.end();
};


exports.email_spooler_one = email_spooler_one;
function email_spooler_one(callback){
  var httpresbody = '';
  var options = {
    host: spooler_url,
    path: '/email_spooler/spoolone',
    port: 31014,
    method: "GET"
  };

  httpreq = http.request(options,function(httpres){
    httpres.on('error',function(err){
      console.log("httpres error");
      console.error(err);
      callback(err,httpresbody);
    });
    httpres.on('data',function(chunk){
      httpresbody = httpresbody + chunk;
    });
    httpres.on('end',function(){
      console.log(httpresbody);
      callback(null,httpresbody);
    });
  });
  httpreq.on('error',function(err){
    console.log("httpreq error");
    console.error(err);
    callback(err,httpresbody);
  });
  httpreq.end();
};

exports.email_spooler_one_by_id = email_spooler_one_by_id;
function email_spooler_one_by_id(_id, callback){
  var httpresbody = '';
  var options = {
    host: spooler_url,
    path: '/email_spooler/spoolone/' + id,
    port: 31014,
    method: "GET"
  };

  httpreq = http.request(options,function(httpres){
    httpres.on('error',function(err){
      console.log("httpres error");
      console.error(err);
      callback(err,httpresbody);
    });
    httpres.on('data',function(chunk){
      httpresbody = httpresbody + chunk;
    });
    httpres.on('end',function(){
      console.log(httpresbody);
      callback(null,httpresbody);
    });
  });
  httpreq.on('error',function(err){
    console.log("httpreq error");
    console.error(err);
    callback(err,httpresbody);
  });
  httpreq.end();
};