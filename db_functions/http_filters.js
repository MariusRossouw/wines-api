create or replace function http_filters(http_req_text text) returns JSON as
$$
    if (!plv8.ufn) {
        var sup = plv8.find_function("plv8_startup");
        sup();
    }

    var result = {
        http_code:200,
        message:'',
        data:{
            years:[
                {year:"2014", selected:false},
                {year:"2015", selected:false},
                {year:"2016", selected:false},
                {year:"2017", selected:false},
                {year:"2018", selected:false}
            ],
            quarters:[
                {quarter:"Q1", selected:false},
                {quarter:"Q2", selected:false},
                {quarter:"Q3", selected:false},
                {quarter:"Q4", selected:false}
            ],
            months:[
                {month:"January", selected:false},
                {month:"February", selected:false},
                {month:"March", selected:false},
                {month:"April", selected:false},
                {month:"May", selected:false},
                {month:"June", selected:false},
                {month:"July", selected:false},
                {month:"August", selected:false},
                {month:"September", selected:false},
                {month:"October", selected:false},
                {month:"November", selected:false},
                {month:"December", selected:false}
            ],
            codes:[
                {code:"C1", selected:false},
                {code:"C2", selected:false},
                {code:"C3", selected:false},
                {code:"C4", selected:false}
            ],
            merchant_groups:[
                {id:"", merchant_group:"MG1", selected:false},
                {id:"", merchant_group:"MG2", selected:false},
                {id:"", merchant_group:"MG3", selected:false},
                {id:"", merchant_group:"MG4", selected:false}
            ],
            merchants:[
                {id:"", merchant:"M1", selected:false},
                {id:"", merchant:"M2", selected:false},
                {id:"", merchant:"M3", selected:false},
                {id:"", merchant:"M4", selected:false}
            ],
            wine_farms:[
                {id:"", wine_farm:"WF1", selected:false},
                {id:"", wine_farm:"WF2", selected:false},
                {id:"", wine_farm:"WF3", selected:false},
                {id:"", wine_farm:"WF4", selected:false}
            ],
            products:[
                {id:"", product:"P1", selected:false},
                {id:"", product:"P2", selected:false},
                {id:"", product:"P3", selected:false},
                {id:"", product:"P4", selected:false}
            ],
            types:[
                {type:"T1", selected:false},
                {type:"T2", selected:false},
                {type:"T3", selected:false},
                {type:"T4", selected:false}
            ],
            reps:[
                {id:"", rep:"R1", selected:false},
                {id:"", rep:"R2", selected:false},
                {id:"", rep:"R3", selected:false},
                {id:"", rep:"R4", selected:false}
            ],
            provinces:[
                {province:"P1", selected:false},
                {province:"P2", selected:false},
                {province:"P3", selected:false},
                {province:"P4", selected:false},
                {province:"P5", selected:false},
                {province:"P6", selected:false},
                {province:"P7", selected:false},
                {province:"P8", selected:false},
                {province:"P9", selected:false}
            ],
        }
    };

    var http_req = plv8.ufn.http_req_parse(http_req_text);
    if (http_req.err_message != '') {
        result.http_code = 403;
        result.message = http_req.err_message;
        return(result);
    }

    // ===== years =====
    var s = `select distinct transaction_year from tb_transactions;`;
    var sres = plv8.execute(s);
    var years = sres;

    result.data.years = years;

    // ===== codes =====
    var s = `select distinct code from tb_merchant;`;
    var sres = plv8.execute(s);
    var codes = sres;

    result.data.codes = codes;

    // ===== merchant_groups =====
    var s = `select merchant_group_id, group_name from tb_merchant_group;`;
    var sres = plv8.execute(s);
    var merchant_groups = sres;

    result.data.merchant_groups = merchant_groups;

    // ===== merchants =====
    var s = `select merchant_id, merchant_name from tb_merchant;`;
    var sres = plv8.execute(s);
    var merchants = sres;

    result.data.merchants = merchants;

    // ===== wine_farms =====
    var s = `select wine_farm_id, farm_name from tb_wine_farm;`;
    var sres = plv8.execute(s);
    var wine_farms = sres;

    result.data.wine_farms = wine_farms;

    // ===== products =====
    var s = `select product_id, description as product_name from tb_product;`;
    var sres = plv8.execute(s);
    var products = sres;

    result.data.products = products;

    // ===== types =====
    var s = `select product_type_id, product_type from tb_product_type;`;
    var sres = plv8.execute(s);
    var types = sres;

    result.data.types = types;

    // ===== reps =====
    var s = `select profile_id, rep_name from tb_profile where rep_name is not null;`;
    var sres = plv8.execute(s);
    var reps = sres;

    result.data.reps = reps;

    // ===== provinces =====
    var s = `select province_id, province_name from tb_province;`;
    var sres = plv8.execute(s);
    var provinces = sres;

    result.data.provinces = provinces;

    // var s0 = "select * from tb_merchant;";
    // plv8.elog(INFO, s0);
    // var query_result0 = plv8.execute(s0);
    // if (query_result0 && query_result0.length > 0) {
    //     result.data.merchants = query_result;
    // }

    // var s1 = "select * from tb_merchant_group;";
    // plv8.elog(INFO, s1);
    // var query_result1 = plv8.execute(s1);
    // if (query_result1 && query_result1.length > 0) {
    //     result.data.merchant_groups = query_result;
    // }

    // var s2 = "select * from tb_wine_farm;";
    // plv8.elog(INFO, s2);
    // var query_result2 = plv8.execute(s2);
    // if (query_result2 && query_result2.length > 0) {
    //     result.data.wine_farms = query_result;
    // }

    // var s3 = "select * from tb_product;";
    // plv8.elog(INFO, s3);
    // var query_result3 = plv8.execute(s3);
    // if (query_result3 && query_result3.length > 0) {
    //     result.data.products = query_result;
    // }

    // // white-wine, red-wine, whiskey, water, 
    // var s4 = "select * from tb_type;";
    // plv8.elog(INFO, s4);
    // var query_result4 = plv8.execute(s4);
    // if (query_result4 && query_result4.length > 0) {
    //     result.data.types = query_result;
    // }

    // var s5 = "select * from tb_profile where ;";
    // plv8.elog(INFO, s5);
    // var query_result5 = plv8.execute(s5);
    // if (query_result5 && query_result5.length > 0) {
    //     result.data.reps = query_result;
    // }

    // var s6 = "select * from tb_province;";
    // plv8.elog(INFO, s6);
    // var query_result6 = plv8.execute(s6);
    // if (query_result6 && query_result6.length > 0) {
    //     result.data.provinces = query_result;
    // }

    // var s7 = "select * from tb_transactions;";
    // plv8.elog(INFO, s7);
    // var query_result7 = plv8.execute(s7);
    // if (query_result7 && query_result7.length > 0) {
    //     result.data.years = query_result;
    // }

    // var s8 = "select * from tb_transactions;";
    // plv8.elog(INFO, s8);
    // var query_result8 = plv8.execute(s8);
    // if (query_result8 && query_result8.length > 0) {
    //     result.data.quarters = query_result;
    // }

    // var s9 = "select * from tb_transactions;";
    // plv8.elog(INFO, s9);
    // var query_result9 = plv8.execute(s9);
    // if (query_result9 && query_result9.length > 0) {
    //     result.data.months = query_result;
    // }

    // var s10 = "select * from tb_code;";
    // plv8.elog(INFO, s10);
    // var query_result10 = plv8.execute(s10);
    // if (query_result10 && query_result10.length > 0) {
    //     result.data.codes = query_result;
    // }

    




    return(result);
  
$$ LANGUAGE plv8;