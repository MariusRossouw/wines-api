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
    },
    errors : []
  };

  var http_req = plv8.ufn.http_req_parse(http_req_text);
  if (http_req.err_message !== ''){
    result.http_code = 403;
    result.message = http_req.err_message;
    return(result);
  }

  var months_ordered = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  var graph_months = [];

  if(http_req.body.filters.months.length > 0){
    graph_months = http_req.body.filters.months.sort(function(a,b){
      return months_ordered.indexOf(a) > months_ordered.indexOf(b);
    });
  }else{
    graph_months = months_ordered;
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

 //  var filters = {};

 //  if (http_req.body.filters){
 //    filters = http_req.body.filters;
 //  }

 //  var offset1 = 0
 //  if (http_req.body.offset){
 //    offset1 = http_req.body.offset;
 //  };
 //  var limit1 = 100000000;
 //  if (http_req.body.limit){
 //    limit1 = http_req.body.limit;
 //  };

 //  var available_records = 0;
 //  var count = 0;
 //  var ex = [];


 //  var where = "";
 //    if ((filters.years  && filters.years.length > 0 ) ||
 //        (filters.quarters  && filters.quarters.length > 0 ) ||
 //        (filters.months  && filters.months.length > 0 ) ||
 //        (filters.codes  && filters.codes.length > 0 ) ||
 //        (filters.reps  && filters.reps.length > 0 ) ||
 //        (filters.provinces  && filters.provinces.length > 0 ) ||
 //        (filters.merchant_groups  && filters.merchant_groups.length > 0 ) ||
 //        (filters.merchants  && filters.merchants.length > 0 ) ||
 //        (filters.wine_farms  && filters.wine_farms.length > 0 ) ||
 //        (filters.products  && filters.products.length > 0 ) ||
 //        (filters.types && filters.types.length > 0) ) {
 //            // ?? area_id - they might want to filters on that ??
 //            where = where + "WHERE ";
 //            count = 0;
 //            if (filters.years && filters.years.length > 0) {
 //                count = count + 1;
 //                if (count > 1) {
 //                    where = where + "AND ";
 //                }
 //                where = where + "p.years" in (filters.years) + count.toString() + " ";
 //                ex.push(filters.years);
 //            }
 //            if (filters.quarters && filters.quarters.length > 0) {
 //                count = count + 1;
 //                if (count > 1) {
 //                    where = where + "AND ";
 //                }
 //                where = where + "p.quarters ~* $" + count.toString() + " ";
 //                ex.push(filters.name);
 //            }

 //    where = where + " ";
 //  }
 //  count = count + 1;
 //  var limit = " order by concat(t.transaction_year,'-',t.transaction_month,'-',t.transaction_day) desc \
 //    limit $" + count.toString() + " ";

 //  count = count + 1;
 //  var offset = "offset $" + count.toString() + " ";

 //  var end = ";";

 //  var s_count = "select  \
	// 	count(*) cnt \
	// 	from tb_transactions t \
	// 	inner join tb_merchant m on m.merchant_id = t.merchant_id \
	// 	inner join tb_merchant_group mg on mg.merchant_group_id = m.merchant_group_id \
	// 	inner join tb_province pr on pr.province_id = m.province_id \
	// 	inner join tb_region r on r.region_id = m.region_id \
	// 	inner join tb_product p on p.product_id = t.product_id \
 //    inner join tb_wine_farm_product_map wfpm on wfpm.product_id = t.product_id \
 //    inner join tb_wine_farm wf on wf.wine_farm_id = wfpm.wine_farm_id \
 //    inner join tb_profile prof on prof.profile_id = t.profile_id \
	// 	" + where + end;

 //  var ex1 = [];
 //  ex1.push(s_count);
 //  ex1 = ex1.concat(ex);

 //  plv8.elog(INFO, JSON.stringify(ex1));
 //  var sqlres1 = plv8.execute.apply(this, ex1);
 //  available_records = sqlres1[0].cnt;

 //  var s_query = " select  \
 //    prof.profile_id, \
 //    t.product_id, \
 //    wf.wine_farm_id, \
 //    m.merchant_id, \
 //    mg.merchant_group_id, \
	// 	pr.province_name, \
	// 	r.region_name, \
	// 	m.merchant_name, \
	// 	mg.group_name, \
	// 	t.transaction_year, \
	// 	t.transaction_month, \
	// 	t.sale, \
	// 	t.litres, \
 //    wf.farm_name, \
 //    prof.rep_name \
	// 	from tb_transactions t \
	// 	inner join tb_merchant m on m.merchant_id = t.merchant_id \
	// 	inner join tb_merchant_group mg on mg.merchant_group_id = m.merchant_group_id \
	// 	inner join tb_province pr on pr.province_id = m.province_id \
	// 	inner join tb_region r on r.region_id = m.region_id \
	// 	inner join tb_product p on p.product_id = t.product_id \
 //    inner join tb_wine_farm_product_map wfpm on wfpm.product_id = t.product_id \
 //    inner join tb_wine_farm wf on wf.wine_farm_id = wfpm.wine_farm_id \
 //    inner join tb_profile prof on prof.profile_id = t.profile_id \
	// " + where + limit + offset + end;

 //  var ex2 = [];
 //  ex2.push(s_query);
 //  ex2 = ex2.concat(ex);
 //  ex2.push(limit1);
 //  ex2.push(offset1);

 //  plv8.elog(INFO, JSON.stringify(ex2));
 //  var sqlres = plv8.execute.apply(this, ex2);
 //  var list = sqlres;


 //  result.data.records = list;
 //  result.data.offset = offset1;
 //  result.data.limit = limit1;
 //  result.data.available = available_records;

// ====================== WHERE ====================== 

var where = ` `;

// merchant codes
var merchant_codes = false;
if(http_req.body.filters.codes){
  var merchant_codes = true;
  var codes_str = '';
  for(var i = 0; i < http_req.body.filters.codes.length; i++){
    codes_str += http_req.body.filters.codes[i] + ',';
  }
  codes_str = codes_str.substr(0, (codes_str.length-1));
}
// merchant_groups
var merchant_groups = false;
if(http_req.body.filters.merchant_groups){
  var merchant_groups = true;
  var groups_str = '';
  for(var i = 0; i < http_req.body.filters.merchant_groups.length; i++){
    groups_str += http_req.body.filters.merchant_groups[i].merchant_group_id + ',';
  }
  groups_str = groups_str.substr(0, (groups_str.length-1));
}
// merchants
var merchants = false;
if(http_req.body.filters.merchants){
  var merchants = true;
  var merchants_str = '';
  for(var i = 0; i < http_req.body.filters.merchants.length; i++){
    merchants_str += http_req.body.filters.merchants[i].merchant_id + ',';
  }
  merchants_str = merchants_str.substr(0, (merchants_str.length-1));
}
// wine_farms
var wine_farms = false;
if(http_req.body.filters.wine_farms){
  var wine_farms = true;
  var wine_farm_str = '';
  for(var i = 0; i < http_req.body.filters.wine_farms.length; i++){
    wine_farm_str += http_req.body.filters.wine_farms[i].merchant_id + ',';
  }
  wine_farm_str = wine_farm_str.substr(0, (wine_farm_str.length-1));
}
// provinces
var provinces = false;
if(http_req.body.filters.provinces){
  var provinces = true;
  var province_str = '';
  for(var i = 0; i < http_req.body.filters.provinces.length; i++){
    province_str += http_req.body.filters.provinces[i].merchant_id + ',';
  }
  province_str = province_str.substr(0, (province_str.length-1));
}
// products
var products = false;
if(http_req.body.filters.products){
  var products = true;
  var products_str = '';
  for(var i = 0; i < http_req.body.filters.products.length; i++){
    products_str += http_req.body.filters.products[i].merchant_id + ',';
  }
  products_str = products_str.substr(0, (products_str.length-1));
}

// ====================== YEARS ======================
  var result_years = [];

  var years = http_req.body.filters.years ? http_req.body.filters.years : [];
  var budget = [];
  var budget_accum = [];
  var budget_accum_sum = 0;
  var sale = [];
  var sale_accum = [];
  var sale_accum_sum = 0;
  var year = {};
  var legend = [];
  var legend_budget = [];
  var legend_sale = [];
  var legend_budget_accum = [];
  var legend_sale_accum = [];

  var product_type_filter = ``;
  var temp_str = ``;
  var product_type_filter_month = ``;

  var budget_where = ` `;

  for(var a = 0; a < years.length; a++){
    year = {
        year: years[a]
    };
    budget = [];
    budget_accum = [];
    for(var b = 0; b < graph_months.length; b++){

      var s = `select round(coalesce(sum(b.budget_amount),0),2) budget_total
        from tb_budget b
        where 
          b.budget_month ~* concat(substr($1, 0, 4), substr($2, (char_length($2)-1) , (char_length($2)-1))) `;
      if(merchant_codes){
        budget_where += ` and merchant_id in (select merchant_id from tb_merchant m where m.codes in(`+codes_str+`) and m.merchant_id = b.merchant_id) `;
      }
      if(merchant_groups){
        budget_where += ` and merchant_id in (select merchant_id from tb_merchant m where m.merchant_group_id in(`+groups_str+`) and m.merchant_id = b.merchant_id) `;
      }
      if(merchants){
        budget_where += ` and merchant_id in (select merchant_id from tb_merchant m where m.merchant_id in(`+merchants_str+`) and m.merchant_id = b.merchant_id) `;
      }
      if(wine_farms){
        budget_where += ` and merchant_id in (
          select wfpm.wine_farm_id
          from tb_transactions t
          inner join tb_wine_farm_product_map wfpm on wfpm.product_id = t.product_id
          where t.merchant_id = b.merchant_id) 
          and wfpm.wine_farm_id in (`+wine_farm_str+`
        ) `;
      }
      if(provinces){
        budget_where += ` and merchant_id in (select merchant_id from tb_merchant m where m.province_id in(`+merchants_str+`) and m.merchant_id = b.merchant_id) `;
      }
      if(products){
        budget_where += ` and merchant_id in (
          select id
          from tb_transactions t
          where t.merchant_id = b.merchant_id
        ) `;
      }
      var budget_total = plv8.execute(s,graph_months[b], years[a])[0].budget_total;

      budget.push(budget_total);
      budget_accum_sum += (budget_total);
      budget_accum.push(Math.round(budget_accum_sum*100)/100);

      var s = `select round(coalesce(sum(sale),0),2) sale_total
        from tb_transactions 
        where 
          transaction_month = $1 and transaction_year = $2;`;
      var sale_total = plv8.execute(s,graph_months[b], years[a])[0].sale_total;

      sale.push(sale_total);
      sale_accum_sum += (sale_total);
      sale_accum.push(Math.round(sale_accum_sum*100)/100);

      temp_str += `'`+graph_months[b]+`',`;
    };
    year.budget = budget;
    year.budget_accum = budget_accum;
    year.sale = sale;
    year.sale_accum = sale_accum;
    result_years.push(year);
    legend_budget.push('budget'+years[a]);
    legend_sale.push('sale'+years[a]);
    legend_budget_accum.push('budget_accum'+years[a]);
    legend_sale_accum.push('sale_accum'+years[a]);

    product_type_filter_month = temp_str.substr(0, (temp_str.length-1));

    product_type_filter += ` and ( t.transaction_year = '`+years[a]+`' and t.transaction_month in (`+product_type_filter_month+`) ) `;
  };


  var sql = `select distinct concat(pt.product_type,' ',p.color) as name,
    (
      select round(coalesce(sum(t.sale),0),2) 
      from tb_transactions t
      inner join tb_product ip on t.product_id = ip.product_id
      inner join tb_product_type ipt on ipt.product_type_id = ip.product_type_id
      where concat(pt.product_type,' ',p.color) = concat(ipt.product_type,' ',ip.color)
      `+product_type_filter+`
    ) as value
    from tb_product p
    inner join tb_product_type pt on pt.product_type_id = p.product_type_id;
  `;
  var types = plv8.execute(sql);

  var sql = `select distinct province_name as name,
    (
      select round(coalesce(sum(t.sale),0),2) 
      from tb_transactions t
      inner join tb_product ip on t.product_id = ip.product_id
      inner join tb_product_type ipt on ipt.product_type_id = ip.product_type_id
      where concat(ipt.product_type,' ',ip.color) = concat(ipt.product_type,' ',ip.color)
      `+product_type_filter+`
    ) as value
    from tb_province p
  `;

  var types = plv8.execute(sql);


  // result.data.product_type_filter_month = product_type_filter_month;
  // result.data.product_type_filter = product_type_filter;
  result.data.legend = legend.concat(legend_budget,legend_sale,legend_budget_accum,legend_sale_accum);
  result.data.years = result_years;
  result.data.graph_months = graph_months;
  result.data.types = types;

// ====================== YEARS END ======================



  return (result);

$$ LANGUAGE plv8;




