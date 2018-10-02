create or replace function http_report_reps(req json) returns JSON as
$$
if (!plv8.ufn) {
	var sup = plv8.find_function("plv8_startup");
	sup();
}

// headerNamesREPS: ["REPS", "Sep18", "Sep17", "VAR(%)", "VAR(R)", "BSep18", "VAR(%)", "VAR(R)", "ACTUAL", "CSep18", "CSep17", "VAR(%)", "VAR(C)", "LASTYEAR", "VAR(%)", "VAR(R)", "BUDGET", "VAR(%)", "VAR(R)", "C2018/2019", "C2017/2018", "VAR(%)", "VAR(C)"],
// rowDataREPS: [
//     {
//         rep: "John Williams",
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
  	rowDataREPS:[],
  	headerNamesREPS: []
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

//["REPS", "Sep18", "Sep17", "VAR(%)", "VAR(R)", "BSep18", "VAR(%)", "VAR(R)", "ACTUAL", "CSep18", "CSep17", "VAR(%)", "VAR(C)",
// "LASTYEAR", "VAR(%)", "VAR(R)", "BUDGET", "VAR(%)", "VAR(R)", "C2018/2019", "C2017/2018", "VAR(%)", "VAR(C)"]
var headings = [];
headings.push('REPS');

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

//         rep: "John Williams",
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


var s = `select x.rep_name as "rep" ,
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
  select distinct rep_name from tb_profile prof
) x
left join (
	select p.rep_name, sum(t.sale) sales
	from tb_transactions t
  inner join tb_profile p on p.profile_id = t.profile_id
  where t.period = $2
  and transaction_month = $1
	group by p.rep_name
) m1 on m1.rep_name = x.rep_name
left join (
	select p.rep_name, sum(t.sale) sales
	from tb_transactions t
  inner join tb_profile p on p.profile_id = t.profile_id
  where t.period = $3
  and transaction_month = $1
	group by rep_name
) m2 on m2.rep_name = x.rep_name
left join (
	select p.rep_name, sum(b.budget_amount) budgets
	from tb_budget b
  inner join tb_merchant_profile_map mpm on mpm.merchant_id = b.merchant_id
  inner join tb_profile p on p.profile_id = mpm.profile_id
	where b.budget_month ~* $5
	and b.budget_period = $2
	group by rep_name
) bu1 on bu1.rep_name = x.rep_name
left join (
	select p.rep_name, sum(t.cases) cases
	from tb_transactions t
  inner join tb_profile p on p.profile_id = t.profile_id
  where t.period = $2
  and transaction_month = $1
	group by p.rep_name
) mc1 on mc1.rep_name = x.rep_name
left join (
	select p.rep_name, sum(t.cases) cases
	from tb_transactions t
  inner join tb_profile p on p.profile_id = t.profile_id
  where t.period = $3
  and transaction_month = $1
	group by p.rep_name
) mc2 on mc2.rep_name = x.rep_name
left join (
	select p.rep_name, sum(t.sale) sales
	from tb_transactions t
  inner join tb_profile p on p.profile_id = t.profile_id
	where t.period = $2
	group by rep_name
) ys1 on ys1.rep_name = x.rep_name
left join (
	select p.rep_name, sum(t.sale) sales
	from tb_transactions t
  inner join tb_profile p on p.profile_id = t.profile_id
	where period = $3
  and (concat(t.transaction_year, '-' , t.transaction_month, '-', t.transaction_day))::timestamp < $4
	group by p.rep_name
) ys2 on ys2.rep_name = x.rep_name
left join (
	select p.rep_name, sum(b.budget_amount) budgets
	from tb_budget b
  inner join tb_merchant_profile_map mpm on mpm.merchant_id = b.merchant_id
  inner join tb_profile p on p.profile_id = mpm.profile_id
	where b.budget_month ~* $5
	and b.budget_period = $3
	group by rep_name
) bu2 on bu2.rep_name = x.rep_name
left join (
	select p.rep_name, sum(t.cases) cases
	from tb_transactions t
  inner join tb_profile p on p.profile_id = t.profile_id
	where t.period = $2
	group by p.rep_name
) yc1 on yc1.rep_name = x.rep_name
left join (
	select p.rep_name, sum(t.cases) cases
	from tb_transactions t
  inner join tb_profile p on p.profile_id = t.profile_id
	where t.period = $3
	group by p.rep_name
) yc2 on yc2.rep_name = x.rep_name
`;
var sres = plv8.execute(s,month,period,period_prev,query_date,month_abr);

result.data.rowDataREPS = sres;
result.data.headerNamesREPS = headings;

return (result);
$$ LANGUAGE plv8;