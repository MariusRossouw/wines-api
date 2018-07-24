create or replace function http_api_doc_section_list(http_req_text text) returns JSON as
$$

    if (!plv8.ufn) {
        var sup = plv8.find_function("plv8_startup");
        sup();
    }

    var result = {
        http_code:200,
        message:'',
        data:{
            records: []
        }
    };

    var http_req = plv8.ufn.http_req_parse(http_req_text);
    if (http_req.err_message != '') {
        result.http_code = 403;
        result.message = http_req.err_message;
        return(result);
    }


    var s = "select * from tb_api_doc_sections";
    plv8.elog(INFO, s);
    var query_result = plv8.execute(s);

    if(query_result.length == 0){
        result.http_code = 403;
        result.message = 'There are no section';
        return(result);
    } else {
        result.data.records = query_result;
    }

    return (result);

$$ LANGUAGE plv8;
