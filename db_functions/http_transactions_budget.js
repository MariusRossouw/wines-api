create or replace function http_transactions_budget(http_req_text text) returns JSON as
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

  var temp_str = ``;

  var budget_where = ` `;

// ****************** budget and sale ******************
  for(var a = 0; a < years.length; a++){
    year = {
        year: years[a]
    };
    budget = [];
    sale = [];
    budget_accum = [];
    sale_accum = [];
    sale_accum_sum = 0;
    budget_accum_sum = 0;
    for(var b = 0; b < graph_months.length; b++){

      var s = `select round(coalesce(sum(b.budget_amount),0),2) budget_total
        from tb_budget b
        where 
          b.budget_month ~* concat(substr($1, 0, 4), substr($2, (char_length($2)-1) , (char_length($2)-1))) `;
      if(merchant_codes){
        budget_where += ` and b.merchant_id in (select merchant_id from tb_merchant m where m.code in(`+codes_str+`) and m.merchant_id = b.merchant_id) `;
      }
      if(merchant_groups){
        budget_where += ` and b.merchant_id in (select merchant_id from tb_merchant m where m.merchant_group_id in(`+groups_str+`) and m.merchant_id = b.merchant_id) `;
      }
      if(merchant_filter){
        budget_where += ` and b.merchant_id in (select merchant_id from tb_merchant m where m.merchant_id in(`+merchants_str+`) and m.merchant_id = b.merchant_id) `;
      }
      if(wine_farms){
        budget_where += ` and b.merchant_id in (
          select t.merchant_id
          from tb_transactions t
          inner join tb_wine_farm_product_map wfpm on wfpm.product_id = t.product_id
          where t.merchant_id = b.merchant_id
          and wfpm.wine_farm_id in (`+wine_farm_str+`)
        ) `;
      }
      if(province_filter){
        budget_where += ` and b.merchant_id in (select merchant_id from tb_merchant m where m.province_id in(`+merchants_str+`) and m.merchant_id = b.merchant_id) `;
      }
      if(products){
        budget_where += ` and b.merchant_id in (
          select t.merchant_id
          from tb_transactions t
          where t.merchant_id = b.merchant_id
          and t.product_id in(`+products_str+`)
        ) `;
      }
      if(product_types){
        budget_where += ` and b.merchant_id in (
          select t.merchant_id
          from tb_transactions t
          inner join tb_product p on p.product_id = t.product_id
          where t.merchant_id = b.merchant_id
          and p.product_type_id in(`+product_types_str+`)
        ) `;
      }
      if(reps){
        budget_where += ` and b.merchant_id in (
          select t.merchant_id
          from tb_transactions t
          where t.merchant_id = b.merchant_id
          and t.profile_id in(`+reps_str+`)
        ) `;
      }
      s += budget_where;
      var budget_total = plv8.execute(s,graph_months[b], years[a])[0].budget_total;

      budget.push(budget_total);
      budget_accum_sum += (budget_total);
      budget_accum.push(Math.round(budget_accum_sum*100)/100);

      var transaction_where = ``;
      var s = `select round(coalesce(sum(t.sale),0),2) sale_total
        from tb_transactions t
        where 
          t.transaction_month = $1 and t.transaction_year = $2 `;

      if(merchant_codes){
        transaction_where += ` and t.merchant_id in (select merchant_id from tb_merchant m where m.code in(`+codes_str+`) and m.merchant_id = t.merchant_id) `;
      }
      if(merchant_groups){
        transaction_where += ` and t.merchant_id in (select merchant_id from tb_merchant m where m.merchant_group_id in(`+groups_str+`) and m.merchant_id = t.merchant_id) `;
      }
      if(merchant_filter){
        transaction_where += ` and t.merchant_id in(`+merchants_str+`)  `;
      }
      if(wine_farms){
        transaction_where += ` and t.product_id in (
          select wfpm.product_id
          from  tb_wine_farm_product_map wfpm
          where wfpm.product_id = t.product_id
          and wfpm.wine_farm_id in (`+wine_farm_str+`)
        ) `;
      }
      if(province_filter){
        transaction_where += ` and t.merchant_id in (select merchant_id from tb_merchant m where m.province_id in(`+merchants_str+`) and m.merchant_id = t.merchant_id) `;
      }
      if(products){
        transaction_where += ` and t.product_id in(`+products_str+`) `;
      }
      if(product_types){
        transaction_where += ` and t.product_id in (
          select p.product_id
          tb_product p 
          where p.product_id = t.product_id
          and p.product_type_id in(`+product_types_str+`)
        ) `;
      }
      if(reps){
        transaction_where += ` and t.profile_id in(`+reps_str+`) `;
      }
      s += transaction_where;
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
  };

  result.data.legend = legend.concat(legend_budget,legend_sale,legend_budget_accum,legend_sale_accum);
  result.data.years = result_years;
  result.data.graph_months = graph_months;


// ====================== YEARS END ======================
// {
//     graph_months:['April', 'May'],
//     years:[
//         {year:"2015", budget:[2100, 3200], sale:[2100, 3299], sale_accum:[2100, 5399], buget_accum:[2100, 5300]}
//     ],
//     types: [{name:"Whit wine", value: 1231231}, {name:"Red wine", value: 1231231}],
//     provinces: [{name:"Natal", value: 11232},{name:"Gauteng", value: 6546546}],
//     code: [{name:"code1", value: 11232},{name:"code2", value: 6546546}],
//     top5_products: [{name:"wine1", value: 11232}],
//     bottom5_products: [{name:"wine9", value: 2}],
//     top5_merchants: [{name:"pnp", value: 11232}],
//     bottom5_merchants: [{name:"spar", value: 1}],
//     records:[{all the transaction detail}]
// }


  return (result);

$$ LANGUAGE plv8;




