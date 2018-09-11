create or replace function http_user_profile_rep_list(http_req_text text) returns JSON as
$$
if (!plv8.ufn) {
  var sup = plv8.find_function("plv8_startup");
  sup();
 }

 var result = {
    http_code : 200,
    error_code : "",
    message : "",
    data : {
      records: []
    },
    errors : []
  };

  var http_req = plv8.ufn.http_req_parse(http_req_text);
  if (http_req.err_message != '') {
    result.http_code = 403;
    result.message = http_req.err_message;
    return(result);
  }

  var manager_id = 0;

  if(http_req.body.manager_id){
    manager_id = http_req.body.manager_id;
  }

  var s = `select p.* , 
    coalesce( 
      (
        select case when manager_rep_id is not null then true else false end from tb_manager_rep_map m 
          where m.rep_id = p.profile_id 
        and m.manager_id = $1 
        and m.is_active = true
      ) 
      ,false
    ) as selected
  from tb_profile p where p.type = $2
  `;
  var query_result = plv8.execute(s, manager_id, 'Rep');

  if (query_result && query_result.length > 0) {
    result.data.records = query_result;
  }

  return(result);
  
  $$ LANGUAGE plv8;