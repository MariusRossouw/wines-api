var childProcess = require('child_process');

exports.childProcessSpawn = childProcessSpawn;
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
    result.http_code = code;
    callback(null,result);
  });
  sp.on('error', function (err) {
    result.text = result.text + err.toString() + '\n';
    callback(null,result);
  });
}


//https://nodejs.org/api/child_process.html#child_process_child_process
//http://www.hacksparrow.com/difference-between-spawn-and-exec-of-node-js-child_process.html
//http://www.hacksparrow.com/using-node-js-to-download-files.html#nodejs-curl
//https://docs.nodejitsu.com/articles/child-processes/how-to-spawn-a-child-process

//http://krasimirtsonev.com/blog/article/Nodejs-managing-child-processes-starting-stopping-exec-spawn
