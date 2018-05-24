(function (root) {
  if(!plv8.ufn){
    return;
  }

  plv8.ufn.http_req_parse = function(http_req_text){
    var result = {};

    try {
      result = JSON.parse(http_req_text);
    } catch(e){
      result.err_message = 'Invalid http request';
    };

    if(!result.err_message){result.err_message = ''};
    if(!result.params){result.params = {}};
    if(!result.query){result.query = {}};
    if(!result.body){result.body = {}};
    if(!result.header){result.header = {}};
    return result;
  };

}(this));