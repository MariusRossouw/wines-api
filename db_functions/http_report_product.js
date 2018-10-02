create or replace function http_report_product(req json) returns JSON as
$$
if (!plv8.ufn) {
	var sup = plv8.find_function("plv8_startup");
	sup();
}


// headerNamesPRODUCT: ["PRODUCT", "Sep18", "Sep17", "VAR(%)", "VAR(R)", "BSep18", "VAR(%)", "VAR(R)", "ACTUAL", "CSep18", "CSep17", "VAR(%)", "VAR(C)", "LASTYEAR", "VAR(%)", "VAR(R)", "BUDGET", "VAR(%)", "VAR(R)", "C2018/2019", "C2017/2018", "VAR(%)", "VAR(C)"],
// rowDataPRODUCT: [
//     {
//         product: "CHENIN BLANK",
//         m1sale: 120,
//         m2sale: 170,
//         m1budget: 140,
//         m1cases: 12,
//         m2cases: 15,
//         y1sale: 3420,
//         y2sale: 53423,
//         y1budget: 24234,
//         y1cases: 332,
//         y2cases: 223
//     }
// ],


var result = {
  http_code:200,
  message:'',
  data:{
  	rowDataPRODUCT:[],
  	headerNamesPRODUCT: []
  }
};

if(!req.body.year) {
  result.http_code = 403;
  result.message = 'year required';
  return(result);
}
if(!req.body.month) {
  result.http_code = 403;
  result.message = 'month required';
  return(result);
}

var month = req.body.month;

var year = req.body.year;
if(typeof year != 'number'){
	try{
		year = parseInt(year,10);
	}catch(err){
		result.http_code = 403;
		result.message = 'invalid year';
		return result;
	}
}

var year_prev = (year - 1);
var year_next = (year + 1);

var period = year + '/' + year_next;
var period_prev = year_prev + '/' + year;

// format text month into timestamp for query
var format_date = moment((year_prev+'-'+month));
// include the currenct month
var query_date = moment(format_date).add(1, 'M');

var month_abr = month.substr(0,3);
var year_str = year.toString()
var year_prev_str = year_prev.toString();
var year_abr = year_str.substr((year_str.length-2), (year_str.length - 1));
var year_prev_abr = year_prev_str.substr((year_prev_str.length - 2), (year_prev_str.length - 1));

//["PRODUCT", "Sep18", "Sep17", "VAR(%)", "VAR(R)", "BSep18", "VAR(%)", "VAR(R)", "ACTUAL", "CSep18", "CSep17", "VAR(%)", "VAR(C)",
// "LASTYEAR", "VAR(%)", "VAR(R)", "BUDGET", "VAR(%)", "VAR(R)", "C2018/2019", "C2017/2018", "VAR(%)", "VAR(C)"]
var headings = [];
headings.push('PRODUCT');

headings.push(month_abr+year_abr);
headings.push(month_abr+year_prev_abr);
headings.push('VAR(%)');
headings.push('VAR(R)');
headings.push('B'+month_abr+year_abr);
headings.push('VAR(%)');
headings.push('VAR(R)');
headings.push('ACTUAL');
headings.push('C'+month_abr+year_abr);
headings.push('C'+month_abr+year_prev_abr);
headings.push('VAR(%)');
headings.push('VAR(C)');
headings.push(period);
headings.push(period_prev);
headings.push('VAR(%)');
headings.push('VAR(R)');
headings.push('BUDGET');
headings.push('VAR(%)');
headings.push('VAR(R)');

headings.push('C'+period);
headings.push('C'+period_prev);
headings.push('VAR(%)');
headings.push('VAR(C)');

//         product: "CHENIN BLANK",
//         m1sale: 120,
//         m2sale: 170,
//         m1budget: 140,
//         m1cases: 12,
//         m2cases: 15,
//         y1sale: 3420,
//         y2sale: 53423,
//         y1budget: 24234,
//         y1cases: 332,
//         y2cases: 223


var s = `select x.product_name as "product" ,
coalesce(m1.sales,0) m1sale,
coalesce(m2.sales,0) m2sale,
coalesce(bu1.budgets,0) m1budget,
coalesce(mc1.cases,0) m1cases,
coalesce(mc2.cases,0) m2cases,
coalesce(ys1.sales,0) y1sale,
coalesce(ys2.sales,0) y2sale,
coalesce(bu2.budgets,0) y1budget,
coalesce(yc1.cases,0) y1cases,
coalesce(yc2.cases,0) y2cases
from (
  select distinct product_name from tb_product prod
) x
left join (
	select p.product_name, sum(t.sale) sales
	from tb_transactions t
  inner join tb_product p on p.product_id = t.product_id
  where t.period = $3
  and transaction_month = $1
	group by p.product_name
) m1 on m1.product_name = x.product_name
left join (
	select p.product_name, sum(t.sale) sales
	from tb_transactions t
  inner join tb_product p on p.product_id = t.product_id
  where t.period = $4
  and transaction_month = $1
	group by product_name
) m2 on m2.product_name = x.product_name
left join (
	select  distinct product_name, 0 as budgets
  from tb_budget b
  inner join tb_transactions t on t.merchant_id = b.merchant_id
  inner join tb_product p on p.product_id = t.product_id
	where b.budget_month ~* $2
	and b.budget_period = $3
	group by product_name
) bu1 on bu1.product_name = x.product_name
left join (
	select p.product_name, sum(t.cases) cases
	from tb_transactions t
  inner join tb_product p on p.product_id = t.product_id
  where t.period = $3
  and transaction_month = $1
	group by p.product_name
) mc1 on mc1.product_name = x.product_name
left join (
	select p.product_name, sum(t.cases) cases
	from tb_transactions t
  inner join tb_product p on p.product_id = t.product_id
  where t.period = $4
  and transaction_month = $1
	group by p.product_name
) mc2 on mc2.product_name = x.product_name
left join (
	select p.product_name, sum(t.sale) sales
	from tb_transactions t
  inner join tb_product p on p.product_id = t.product_id
  where t.period = $3
	group by product_name
) ys1 on ys1.product_name = x.product_name
left join (
	select p.product_name, sum(t.sale) sales
	from tb_transactions t
  inner join tb_product p on p.product_id = t.product_id
	where period = $4
  and (concat(t.transaction_year, '-' , t.transaction_month, '-', t.transaction_day))::timestamp < $5
	group by p.product_name
) ys2 on ys2.product_name = x.product_name
left join (
	select  distinct product_name, 0 as budgets
  from tb_budget b
  inner join tb_transactions t on t.merchant_id = b.merchant_id
  inner join tb_product p on p.product_id = t.product_id
) bu2 on bu2.product_name = x.product_name
left join (
	select p.product_name, sum(t.cases) cases
	from tb_transactions t
  inner join tb_product p on p.product_id = t.product_id
  where t.period = $3
	group by p.product_name
) yc1 on yc1.product_name = x.product_name
left join (
	select p.product_name, sum(t.cases) cases
	from tb_transactions t
  inner join tb_product p on p.product_id = t.product_id
  where t.period = $4
	group by p.product_name
) yc2 on yc2.product_name = x.product_name
`;
var sres = plv8.execute(s,month,month_abr,period,period_prev,query_date);

result.data.rowDataPRODUCT = sres;
result.data.headerNamesPRODUCT = headings;

return (result);
$$ LANGUAGE plv8;