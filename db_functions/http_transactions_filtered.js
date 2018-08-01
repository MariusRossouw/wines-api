create or replace function http_transactions_filtered(http_req_text text) returns JSON as
$$
if (!plv8.ufn){
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
  if (http_req.err_message !== ''){
    result.http_code = 403;
    result.message = http_req.err_message;
    return(result);
  }


  // get all info possible for the transaction based on the filters
// var filters = { 
//     "years": [ "2015", "2016", "2017" ],
//     "quarters": [ "Q1", "Q3", "Q2" ],
//     "months": [ "January", "February", "March" ], 
//     "codes": [ "C1", "C2", "C3" ], 
//     "merchant_groups": [ "MG4", "MG3" ], 
//     "merchants": [ "M2", "M3", "M4" ], 
//     "wine_farms": [ "WF1", "WF2", "WF3" ], 
//     "provinces": [ "P2", "P3", "P4" ], 
//     "products": [ "PR1", "PR2", "PR3" ], 
//     "types": [ "T1", "T2", "T3" ], 
//     "reps": [ "R2", "R4" ] 
// }

  var filters = {};

  if (http_req.body.filters){
    filters = http_req.body.filters;
  }

  var offset1 = 0
  if (http_req.body.offset){
    offset1 = http_req.body.offset;
  };
  var limit1 = 100000000;
  if (http_req.body.limit){
    limit1 = http_req.body.limit;
  };

  var available_records = 0;
  var count = 0;
  var ex = [];


  var where = "";
    if ((filters.years  && filters.years.length > 0 ) ||
        (filters.quarters  && filters.quarters.length > 0 ) ||
        (filters.months  && filters.months.length > 0 ) ||
        (filters.codes  && filters.codes.length > 0 ) ||
        (filters.reps  && filters.reps.length > 0 ) ||
        (filters.provinces  && filters.provinces.length > 0 ) ||
        (filters.merchant_groups  && filters.merchant_groups.length > 0 ) ||
        (filters.merchants  && filters.merchants.length > 0 ) ||
        (filters.wine_farms  && filters.wine_farms.length > 0 ) ||
        (filters.products  && filters.products.length > 0 ) ||
        (filters.types && filters.types.length > 0) ) {
            // ?? area_id - they might want to filters on that ??
            where = where + "WHERE ";
            count = 0;
            if (filters.years && filters.years.length > 0) {
                count = count + 1;
                if (count > 1) {
                    where = where + "AND ";
                }
                where = where + "p.years" in (filters.years) + count.toString() + " ";
                ex.push(filters.years);
            }
            if (filters.quarters && filters.quarters.length > 0) {
                count = count + 1;
                if (count > 1) {
                    where = where + "AND ";
                }
                where = where + "p.quarters ~* $" + count.toString() + " ";
                ex.push(filters.name);
            }

    where = where + " ";
  }
  count = count + 1;
  var limit = " order by concat(t.transaction_year,'-',t.transaction_month,'-',t.transaction_day) desc \
    limit $" + count.toString() + " ";

  count = count + 1;
  var offset = "offset $" + count.toString() + " ";

  var end = ";";

  var s_count = "select  \
		count(*) cnt \
		from tb_transactions t \
		inner join tb_merchant m on m.merchant_id = t.merchant_id \
		inner join tb_merchant_group mg on mg.merchant_group_id = m.merchant_group_id \
		inner join tb_province pr on pr.province_id = m.province_id \
		inner join tb_region r on r.region_id = m.region_id \
		inner join tb_product p on p.product_id = t.product_id \
    inner join tb_wine_farm_product_map wfpm on wfpm.product_id = t.product_id \
    inner join tb_wine_farm wf on wf.wine_farm_id = wfpm.wine_farm_id \
    inner join tb_profile prof on prof.profile_id = t.profile_id \
		" + where + end;

  var ex1 = [];
  ex1.push(s_count);
  ex1 = ex1.concat(ex);

  plv8.elog(INFO, JSON.stringify(ex1));
  var sqlres1 = plv8.execute.apply(this, ex1);
  available_records = sqlres1[0].cnt;

  var s_query = " select  \
    prof.profile_id, \
    t.product_id, \
    wf.wine_farm_id, \
    m.merchant_id, \
    mg.merchant_group_id, \
		pr.province_name, \
		r.region_name, \
		m.merchant_name, \
		mg.group_name, \
		t.transaction_year, \
		t.transaction_month, \
		t.sale, \
		t.litres, \
    wf.farm_name, \
    prof.rep_name \
		from tb_transactions t \
		inner join tb_merchant m on m.merchant_id = t.merchant_id \
		inner join tb_merchant_group mg on mg.merchant_group_id = m.merchant_group_id \
		inner join tb_province pr on pr.province_id = m.province_id \
		inner join tb_region r on r.region_id = m.region_id \
		inner join tb_product p on p.product_id = t.product_id \
    inner join tb_wine_farm_product_map wfpm on wfpm.product_id = t.product_id \
    inner join tb_wine_farm wf on wf.wine_farm_id = wfpm.wine_farm_id \
    inner join tb_profile prof on prof.profile_id = t.profile_id \
	" + where + limit + offset + end;

  var ex2 = [];
  ex2.push(s_query);
  ex2 = ex2.concat(ex);
  ex2.push(limit1);
  ex2.push(offset1);

  plv8.elog(INFO, JSON.stringify(ex2));
  var sqlres = plv8.execute.apply(this, ex2);
  var list = sqlres;


  result.data.records = list;
  result.data.offset = offset1;
  result.data.limit = limit1;
  result.data.available = available_records;

  return (result);

$$ LANGUAGE plv8;




