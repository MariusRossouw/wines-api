create or replace function http_api_doc_req_res_list(http_req_text text) returns JSON as
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


    var s = "select * from tb_api_doc_sections where projectName = $1";
    plv8.elog(INFO, s);
    var query_result = plv8.execute(s, http_req.body.projectName);

    if(query_result.length == 0){
        result.http_code = 403;
        result.message = 'There are no sections for the project';
        return(result);
    } else {
        for(var i = 0; i < query_result.length; i++){
            var s1 = "select * from tb_api_docs_endpoint where api_doc_section_id = $1";
            plv8.elog(INFO, s1);
            var query_result1 = plv8.execute(s1, query_result[i].api_doc_section_id);

            if(query_result1.length > 0){
                query_result[i].subSections = query_result1;
                for(var j = 0; j < query_result[i].subSections.length; j++){
                    var s2 = "select * from tb_api_docs_req_res where api_doc_endpoint_id = $1";
                    plv8.elog(INFO, s2);
                    var query_result2 = plv8.execute(s2, query_result[i].subSections[j].api_doc_endpoint_id);

                    if(query_result2.length > 0){
                        query_result[i].subSections[j].reqres = query_result2;
                    }
                }
            }
        }
        result.data.records = query_result;
    }

    return (result);

$$ LANGUAGE plv8;
