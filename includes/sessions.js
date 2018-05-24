var express = require('express');
var cookieParser = require('cookie-parser');
var nconf = require('nconf');
var path = require('path');
var session = require('express-session');

var utils = require("./utils.js");

var app = module.exports = express();

/* Configure sessions on startup */

/*   Per-application configuration (below):
 *    timeout: session cookie lifetime (minutes)
 *    enforce: respond with 401 for invalid session token
 *    memory_store: store sessions in memory (not for production use)
 *    ignore_localhost:
 *        true disables sessions when the server is running remotely but the pages
 *        are being served from localhost
 *    login: auth endpoint for creating sessions
 *    autologin: auth endpoint for re-creating user sessions
 */
const config = {
    'canserve': {
        enable: true,
        timeout: 10,
        enforce: true,
        memory_store: true,
        redis_db: 0,
        key: 'canserve_api',
        ignore_localhost: true,
        login: 'http_login',
        register_verify: 'http_register_verify',
        profile_get_one: 'http_profile_get_one',
        autologin: 'http_autologin',
        register_verify: 'http_register_verify'
    },
    // 'business': {
    //     enable: true,
    //     timeout: 30,
    //     enforce: true,
    //     memory_store: false,
    //     redis_db: 1,
    //     key: 'jando_api_bus',
    //     ignore_localhost: true,
    //     login: 'http_business_login',
    //     yubikey_check_function: 'http_business_login_yubikey_check',
    //     autologin: 'http_business_autologin'
    // },
    // 'consumer': {
    //     enable: true,
    //     timeout: 30,
    //     enforce: true,
    //     memory_store: false,
    //     redis_db: 2,
    //     key: 'jando_api_con',
    //     ignore_localhost: true,
    //     login: 'http_consumer_login',
    //     yubikey_check_function: '',
    //     autologin: 'http_consumer_autologin'
    // }
};
const stage_proxies = 2; // no. of proxies in front of staging server
const prod_proxies = 3; // no. of proxies in front of production server
const dev_timeout = true; // usually for working on sessions

// Common session settings
var sess = {
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
        path: '/',
        secure: false,
        httpOnly: false
    }
};

// Environment-specific settings
var node_env = nconf.get('NODE_ENV');

var server = 'canserve';

if (node_env == 'staging' || node_env == 'production') {
    var proc = nconf.get('name');
    // var server = proc.split('-')[1];



    if (node_env == 'production') {
        sess.cookie.domain = '.canserve.co.za';
        sess.cookie.maxAge = config[server].timeout * 60 * 1000;
        app.set('trust proxy', prod_proxies);
        var redis_server = 'production-redis.te1g5o.ng.0001.euw1.cache.amazonaws.com';
    } else if (node_env == 'staging') {
        // sess.cookie.domain = '.stratech.co.za';
        sess.cookie.domain = '';
        sess.cookie.maxAge = config[server].timeout * 60 * 1000;
        app.set('trust proxy', stage_proxies);
        var redis_server = 'redisstage.sewlyi.0001.euw1.cache.amazonaws.com';
    }

} else {
    var proc = path.basename(process.argv[1], '.js');
    // var server = proc.split('-')[1];
    var redis_server = 'localhost';

    node_env = 'development';
    app.set('trust proxy', false);
    if (dev_timeout) {
        sess.cookie.maxAge = config[server].timeout * 60 * 1000;
    }
}

// Enable sessions for this server?
console.log('Sessions enabled:', config[server].enable);
if (!config[server].enable) return;

sess.key = config[server].key;

console.log('Sessions node_env:', node_env);
console.log('Sessions server:', server);
console.log('Sessions enforce:', config[server].enforce);
console.log('Sessions trust proxy:', app.get('trust proxy'));
console.log('Sess config:\n', sess);


// Set up the session store
if (config[server].memory_store) {
    var sessionStore = sess.store = new express.session.MemoryStore();
} else {
    var redis_opts = {
        host: redis_server,
        port: '6379',
        db: config[server].redis_db,
        logErrors: true
    };

    var RedisStore = require('connect-redis')(session);
    var sessionStore = sess.store = new RedisStore(redis_opts);

    console.log('Sessions redis address:', sessionStore.client.address);
    console.log('Sessions redis selected_db:', sessionStore.client.selected_db);
}

sess.secret = nconf.get('SESSION_SECRET');

app.use(cookieParser());
app.use(session(sess));


/* Validate client sessions */

app.all('*', function(req, res, next) {

  // All endpoints that do not need a session
    var whitelist = [
        '/login',
        '/register',
        '/forgot_password',
        '/verification_email',
        '/email_update',
        '/register_verify'
    ];

    var basepath = req.url.split('?')[0];
    var origin = req.headers.origin;

    if (whitelist.indexOf(basepath) >= 0) {
        console.log('Session: ignore whitelist', basepath);
        next();
    } else if (req.method == 'OPTIONS') {
        //console.log('Session: ignore pre-flight', basepath);
        next();
    } else if (config[server].ignore_localhost && node_env != 'development' && origin == 'http://localhost') {
        next();
        console.log('Session: ignore localhost', basepath);
    } else {
        // Examine token
        var cookie = config[server].key;
        var sessionToken = req.cookies[cookie];
        if (typeof sessionToken == 'undefined' || sessionToken == '') {
            console.log('Session: token absent', basepath, '401 enforced:', config[server].enforce);
            if (config[server].enforce) {
                req.session.destroy(function(err) {
                    // TODO error handling
                });
                res.status(401).send({ "message": "Your session has expired." });
            } else {
                next();
            }
        } else {
            sessionStore.get(req.sessionID, function(err, session) {
              var validSession = false;
              if (err) {
                  console.log('Session:', req.session.id, basepath, 'token error 401 enforced:', config[server].enforce);
              }
              if (session && session.auth && session.auth.email) {
                  validSession = true;
                  console.log('Session:', req.session.id, 'token valid:', session.auth.email, basepath);
                  req.session.touch();
                  if (req.session.cookie.expires == null) req.session.cookie.expires = 0;
                  res.setHeader('X-' + config[server].key + '-expires', req.session.cookie.expires);
              } else {
                  console.log('Session:', req.session.id, basepath, 'session auth error enforced:', config[server].enforce);
              }
              if (!validSession && config[server].enforce) {
                  res.status(401).send({ "message": "Your session has expired." });
              } else {
                  next();
              }
            });
        }
    }

});


/* Authenticate and store session */

app.post('/login', function (req, res, next) {

      var req_proc = config[server].login;

      var req_obj = {
          headers: req.headers,
          body: req.body
      }

      // Run login db function
      req.pdb.func(req_proc, req_obj)
      .then(result => {
          var reply = result[0][req_proc];
          res.send(reply.http_code, reply);
          if(reply.http_code == 200) {
              req.session.auth = {
                  email: req.body.email,
                  password: req.body.password,
                  profile_id: reply.data.profile_id
              };
              req.session.save();
              console.log('Session: token issue:', req.session.id, '/login');
          } else {
              req.session.destroy(function(err) {
                  console.log('Session: login failed (session cleared)');
              });
          }
      })
      .catch(error => {
          console.log('Session: login error:', error);
      });

      next();

  });



//   ====================================
/* Authenticate and store session */

app.post('/register_verify', function (req, res, next) {

          var req_proc = config[server].register_verify;

          var req_obj = {
              headers: req.headers,
              body: req.body
          }

          // Run register_verify db function
          req.pdb.func(req_proc, req_obj)
          .then(result => {
              var reply = result[0][req_proc];
              res.send(reply.http_code, reply);
              if(reply.http_code == 200) {
                  req.session.auth = {
                      email: reply.data.email,
                      password: reply.data.password,
                      profile_id: reply.data.profile_id
                  };
                  req.session.save();
                  console.log('Session: token issue:', req.session.id, '/register_verify');
              } else {
                  req.session.destroy(function(err) {
                      console.log('Session: register_verify failed (session cleared)');
                  });
              }
          })
          .catch(error => {
              console.log('Session: register_verify error:', error);
          });

          next();

      });
//   ====================================




  app.post('/profile_get_one', function (req, res, next) {

          var req_proc = config[server].profile_get_one;

          var req_obj = {
              headers: req.headers,
              body: req.body
          }

          // Run login db function
          req.pdb.func(req_proc, req_obj)
          .then(result => {
              var reply = result[0][req_proc];
              res.send(reply.http_code, reply);
              if(reply.http_code == 200) {
                  req.session.profile = {
                      name: reply.data.name,
                      profile_id: reply.data.id
                  };
                  req.session.save();
                  console.log('Session: token issue:', req.session.id, '/profile_get_one');
              } else {
                  // req.session.destroy(function(err) {
                      console.log('Sorry could not read profile');
                  // });
              }
          })
          .catch(error => {
              console.log('Session: login error:', error);
          });

          next();

      });







  app.post('/auto-login', function (req, res, next) {

        if (typeof req.session.auth == 'undefined') {
            if (config[server].enforce) res.send(401);
            console.log('Session: autologin auth undefined: ', req.session.id, '[401] enforced:', config[server].enforce);
        }

        var req_proc = config[server].autologin;
        console.log('App POST: /auto-login: Looking For: ' + req_proc);
        req.pdb.func(req_proc, req.session.auth)
        .then(result => {
            var reply = result[0][req_proc];
            var httpCode = reply.http_code;
            if (httpCode == 200) {
                // req.session.auth = reply.data;
                // req.session.auth.password = req.body.password;
                req.session.save();
                res.send(200, reply);
                console.log('Session:', req.session.id, 'auto-login success, profile id', session.auth.profile_id);
            } else {
                if (config[server].enforce) res.send(401);
                console.log('Session: autologin: ', req.session.id, '[401] enforced:', config[server].enforce);
                if (!config[server].enforce) next();
            }
        })
        .catch(error => {
            console.log('Session: autologin error:', error);
            next();
        });

    });
