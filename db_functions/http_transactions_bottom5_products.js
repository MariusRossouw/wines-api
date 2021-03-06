create or replace function http_transactions_bottom5_products(http_req_text text) returns JSON as
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
      bottom5_products: []
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

  var months_abbrv = [];

// ====================== WHERE ======================

var where = ` `;

// merchant codes
var merchant_codes = false;
if(http_req.body.filters.codes){
  if(http_req.body.filters.codes.length > 0){
    var merchant_codes = true;
    var codes_str = '';
    for(var i = 0; i < http_req.body.filters.codes.length; i++){
      codes_str += `'`+http_req.body.filters.codes[i] + `',`;
    }
    codes_str = codes_str.substr(0, (codes_str.length-1));
  }
}
// merchant_groups
var merchant_groups = false;
if(http_req.body.filters.merchant_groups){
  if(http_req.body.filters.merchant_groups.length > 0){
    var merchant_groups = true;
    var groups_str = '';
    for(var i = 0; i < http_req.body.filters.merchant_groups.length; i++){
      groups_str += http_req.body.filters.merchant_groups[i].merchant_group_id + ',';
    }
    groups_str = groups_str.substr(0, (groups_str.length-1));
  }
}
// merchants
var merchant_filter = false;
if(http_req.body.filters.merchant_filter){
  if(http_req.body.filters.merchant_filter.length > 0){
    var merchant_filter = true;
    var merchants_str = '';
    for(var i = 0; i < http_req.body.filters.merchant_filter.length; i++){
      merchants_str += http_req.body.filters.merchant_filter[i].merchant_id + ',';
    }
    merchants_str = merchants_str.substr(0, (merchants_str.length-1));
  }
}
// wine_farms
var wine_farms = false;
if(http_req.body.filters.wine_farms){
  if(http_req.body.filters.wine_farms.length > 0){
    var wine_farms = true;
    var wine_farm_str = '';
    for(var i = 0; i < http_req.body.filters.wine_farms.length; i++){
      wine_farm_str += http_req.body.filters.wine_farms[i].wine_farm_id + ',';
    }
    wine_farm_str = wine_farm_str.substr(0, (wine_farm_str.length-1));
  }
}
// provinces
var province_filter = false;
if(http_req.body.filters.province_filter){
  if(http_req.body.filters.province_filter.length > 0){
    var province_filter = true;
    var province_str = '';
    for(var i = 0; i < http_req.body.filters.province_filter.length; i++){
      province_str += http_req.body.filters.province_filter[i].province_id + ',';
    }
    province_str = province_str.substr(0, (province_str.length-1));
  }
}
// products
var products = false;
if(http_req.body.filters.products){
  if(http_req.body.filters.products.length > 0){
    var products = true;
    var products_str = '';
    for(var i = 0; i < http_req.body.filters.products.length; i++){
      products_str += http_req.body.filters.products[i].product_id + ',';
    }
    products_str = products_str.substr(0, (products_str.length-1));
  }
}
// product_types
var product_types = false;
if(http_req.body.filters.product_types){
  if(http_req.body.filters.product_types.length > 0){
    var product_types = true;
    var product_types_str = '';
    for(var i = 0; i < http_req.body.filters.product_types.length; i++){
      product_types_str += http_req.body.filters.product_types[i].product_type_id + ',';
    }
    product_types_str = product_types_str.substr(0, (product_types_str.length-1));
  }
}
// reps
var reps = false;
if(http_req.body.filters.reps){
  if(http_req.body.filters.reps.length > 0){
    var reps = true;
    var reps_str = '';
    for(var i = 0; i < http_req.body.filters.reps.length; i++){
      reps_str += http_req.body.filters.reps[i].profile_id + ',';
    }
    reps_str = reps_str.substr(0, (reps_str.length-1));
  }
}

// ====================== YEARS ======================
  var years = http_req.body.filters.years ? http_req.body.filters.years : [];

  var product_type_filter = ``;
  var temp_str = ``;
  var temp_str2 = ``;
  var product_type_filter_month = ``;
  var type_where = '';
  var budget_where = ` `;

  if(merchant_codes){
    type_where += ` and t.merchant_id in (select merchant_id from tb_merchant m where m.code in(`+codes_str+`) and m.merchant_id = t.merchant_id) `;
    budget_where += ` and b.merchant_id in (select merchant_id from tb_merchant m where m.code in(`+codes_str+`) and m.merchant_id = b.merchant_id) `;
  }
  if(merchant_groups){
    type_where += ` and t.merchant_id in (select merchant_id from tb_merchant m where m.merchant_group_id in(`+groups_str+`) and m.merchant_id = t.merchant_id) `;
    budget_where += ` and b.merchant_id in (select merchant_id from tb_merchant m where m.merchant_group_id in(`+groups_str+`) and m.merchant_id = b.merchant_id) `;
  }
  if(merchant_filter){
    type_where += ` and t.merchant_id in(`+merchants_str+`)  `;
    budget_where += ` and b.merchant_id in (select merchant_id from tb_merchant m where m.merchant_id in(`+merchants_str+`) and m.merchant_id = b.merchant_id) `;
  }
  if(wine_farms){
    type_where += ` and t.product_id in (
      select wfpm.product_id
      from  tb_wine_farm_product_map wfpm
      where wfpm.product_id = t.product_id
      and wfpm.wine_farm_id in (`+wine_farm_str+`)
    ) `;
    budget_where += ` and b.merchant_id in (
      select t.merchant_id
      from tb_transactions t
      inner join tb_wine_farm_product_map wfpm on wfpm.product_id = t.product_id
      where t.merchant_id = b.merchant_id
      and wfpm.wine_farm_id in (`+wine_farm_str+`)
    ) `;
  }
  if(province_filter){
    type_where += ` and t.merchant_id in (select merchant_id from tb_merchant m where m.province_id in(`+merchants_str+`) and m.merchant_id = t.merchant_id) `;
    budget_where += ` and b.merchant_id in (select merchant_id from tb_merchant m where m.province_id in(`+merchants_str+`) and m.merchant_id = b.merchant_id) `;
  }
  if(products){
    type_where += ` and t.product_id in(` + products_str + `) `;
    budget_where += ` and b.merchant_id in (
      select t.merchant_id
      from tb_transactions t
      where t.merchant_id = b.merchant_id
      and t.product_id in(`+products_str+`)
    ) `;
  }
  if(product_types){
    type_where += ` and t.product_id in (
      select p.product_id
      tb_product p
      where p.product_id = t.product_id
      and p.product_type_id in(`+product_types_str+`)
    ) `;
    budget_where += ` and b.merchant_id in (
      select t.merchant_id
      from tb_transactions t
      inner join tb_product p on p.product_id = t.product_id
      where t.merchant_id = b.merchant_id
      and p.product_type_id in(`+product_types_str+`)
    ) `;
  }
  if(reps){
    type_where += ` and t.profile_id in(` + reps_str + `) `;
    budget_where += ` and b.merchant_id in (
      select t.merchant_id
      from tb_transactions t
      where t.merchant_id = b.merchant_id
      and t.profile_id in(`+reps_str+`)
    ) `;
  }

// ****************** budget and sale ******************
  var years_filter = ``;
  var temp_years = ``;
  var budget_date_filter = '';
  for(var a = 0; a < years.length; a++){
    for(var b = 0; b < graph_months.length; b++){
      temp_str += `'`+graph_months[b]+`',`;
      temp_str2 += ` budget_month ~* '`+graph_months[b].substr(0,3)+years[a].substr(2,3) + `' or`;
    }

    product_type_filter_month = temp_str.substr(0, (temp_str.length-1));
    temp_years += `'`+years[a] + `',`;
  };
  years_filter = temp_years.substr(0, (temp_years.length-1));
  budget_date_filter = ` and (` + temp_str2.substr(0, (temp_str2.length-2)) + `) `;
  product_type_filter += ` and ( t.transaction_year in( `+years_filter+` ) and t.transaction_month in (`+product_type_filter_month+`) ) `;

// ****************** bottom5 merchants ******************
  var sql = `select * from (
    select distinct mer.merchant_name as name,
    mer.merchant_id,
    (
      select round(coalesce(sum(t.sale),0),2)
      from tb_transactions t
      where mer.merchant_id = t.merchant_id
      `+product_type_filter+`
  `;

  sql += type_where;

  sql += `) as value,
  (
    select round(coalesce(sum(b.budget_amount),0),2)
    from tb_budget b
    where mer.merchant_id = b.merchant_id 
    `+budget_date_filter+`
  `;

  sql += budget_where;

  sql += `) as budget,
  case when   (
    select round(coalesce(sum(b.budget_amount),0),2)
    from tb_budget b
    where mer.merchant_id = b.merchant_id
     `+budget_date_filter+`
  ) > 0 then
  round(
  ((
    (
      select round(coalesce(sum(t.sale),0),2)
      from tb_transactions t
      where mer.merchant_id = t.merchant_id
    `+product_type_filter+` `;

  sql += type_where;

  sql += `
  )
  /
    (
      select round(coalesce(sum(b.budget_amount),0),2)
      from tb_budget b
      where mer.merchant_id = b.merchant_id
    `+budget_date_filter+`
  `;

  sql += budget_where;

  sql += `
  )
  ) * 100)
  ,2
  ) else 0 end  AS perform
  from tb_merchant mer ) x order by x.perform asc limit 5;`;

result.query = sql;
// return (result);
  var products_bottom = plv8.execute(sql);

  result.data.bottom5_products = products_bottom;

  return (result);

$$ LANGUAGE plv8;




