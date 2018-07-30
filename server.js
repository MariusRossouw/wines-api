var express = require('express');
var http = require('http');
var path = require('path');
var setup = require('./includes/setup.js');
var favicon = require('serve-favicon');
var bodyParser  = require('body-parser');
var methodOverride = require('method-override');
var nconf = require('nconf');
var pgp = require('pg-promise')({
    // Initialization Options
    query: function (e) {
        console.log('QUERY:', e.query);
        if (e.params) {
            console.log('PARAMS:', e.params);
        }
    }
});
var utils = require("./includes/utils.js");
var fileUpload = require('express-fileupload');
var moment = require('moment');

nconf.argv().env();
console.log(JSON.stringify(nconf.get(),null,2));

var port = nconf.get('NODE_SERVER_PORT');
if(!port){
    console.log('port not found');
    return;
}

var connection_obj = setup.pgp_connection_obj_from_env();
if(!connection_obj.host){
    console.log('db host not found');
    return;
}

console.log('Create DB connection object');
var postgress_connection = pgp(connection_obj);

var passInDBPG = function(req, res, next) {
    req.pdb = postgress_connection;
    next();
};

var logreq = function(req, res, next) {
    //log stuff of the request here
    console.log('HEADERS');
    console.log(JSON.stringify(req.headers));
    next();
};

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', true);
    next();
};
var dontcache = function(req, res, next) {
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
    next();
};

//create express instance and set it up
var app = express();
app.set('port', port);

app.use(favicon(path.join(__dirname,"/favicon.ico")));
app.use('/files',express.static(__dirname + '/uploads')); //will look for a static file here. If not will continue.
app.use('/pdfs',express.static(__dirname + '/pdf_docs')); //will look for a static file here. If not will continue.
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(methodOverride());
app.use(allowCrossDomain);
app.use(dontcache);
app.use(passInDBPG);
app.use(logreq);
app.use(fileUpload());


// ==================== sessions =======================

// var session_secret = 'c1a34dc217df3b23';
var session_secret = nconf.get('SESSION_SECRET');

if (typeof session_secret != 'undefined' && session_secret != '') {
    app.use(require('./includes/sessions.js'));
} else {
    console.error('No session secret - sessions disabled.');
}

// =============== route to functions =====================

function default_message(req, res){
   res.send(200,"<p>App API</p>");
}
app.get('/', default_message);


var email = require('./routes/email.js');
app.post('/verification_email', email.verification_email);
app.post('/change_verification_email', email.change_verification_email);
app.post('/welcome_email', email.welcome_email);
app.post('/forgot_password', email.forgot_password);

var pdf = require('./routes/pdf_one.js');
app.post('/add_one_spooler_pdf', pdf.pdf_spool_one);

var files = require('./includes/file_upload.js');
app.post('/file_upload', files.file_upload);
app.post('/file_upload_64', files.file_upload_64);

app.post('/uploads/wine_list', files.upload_wine_list);

app.get('/test_split', function(req,res){
    var str = 'BB Wine White   Chardonnay NV kosher 750 ml (6)';
    str = str.replace(/   +/g, ' - ');
    var answer = str.split(/[  ]+/);
    console.log(answer);

    var msr = '1,5'
    var vol = parseFloat(msr);

    var date = '2015/07/01 00:00:00';
    var new_date = moment(date);
    var day = new_date.format('DD')


    res.status(200).send({data: answer, vol: vol, new_date: day})

})

//API Methods: Lists

app.post('/*', function(req, res){ utils.pg_http_gen_new(req, res, '_'); });
app.get('/*', function(req, res){ utils.pg_http_gen_new(req, res, '_'); });

// ============== Start listening ===========================

http.createServer(app).listen(app.get('port'), function(){
  console.log('CanSERVE App API listening on port ' + app.get('port'));
});


