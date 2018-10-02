create or replace function http_report_omtd(req json) returns JSON as
$$
if (!plv8.ufn) {
	var sup = plv8.find_function("plv8_startup");
	sup();
}


// headerNamesOMTD: ["CHANNELS", "Sep18", "Sep17", "VAR(%)", "VAR(R)", "BSep18", "VAR(%)", "VAR(R)", "CSep18", "CSep17", "VAR(%)", "VAR(C)"],
// rowDataOMTD: [
//     {
//         code: "SCS",
//         type: "Month To Date",
//         m1sale: 120,
//         m2sale: 170,
//         m1budget: 140,
//         m1cases: 12,
//         m2cases: 15
//     },
// ],

var result = {
  http_code:200,
  message:'',
  data:{
  	rowDataOMTD:[],
  	headerNamesOMTD: []
  }
};

if(!req.body.month) {
  result.http_code = 403;
  result.message = 'month required';
  return(result);
}

if(!req.body.year) {
  result.http_code = 403;
  result.message = 'year required';
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

var month_abr = month.substr(0,3);
var year_str = year.toString()
var year_prev_str = year_prev.toString();
var year_abr = year_str.substr((year_str.length-2), (year_str.length - 1));
var year_prev_abr = year_prev_str.substr((year_prev_str.length - 2), (year_prev_str.length - 1));

// ["CHANNELS", "Sep18", "Sep17", "VAR(%)", "VAR(R)", "BSep18", "VAR(%)", "VAR(R)", "CSep18", "CSep17", "VAR(%)", "VAR(C)"]
var headings = [];
headings.push('CHANNELS');
headings.push(month_abr+year_abr);
headings.push(month_abr+year_prev_abr);
headings.push('VAR(%)');
headings.push('VAR(R)');
headings.push('B'+month_abr+year_abr);
headings.push('B'+month_abr+year_prev_abr);
headings.push('VAR(%)');
headings.push('VAR(R)');
headings.push('C'+month_abr+year_abr);
headings.push('C'+month_abr+year_prev_abr);
headings.push('VAR(%)');
headings.push('VAR(C)');


var s = `select mer.code ,
coalesce(sa1.sales,0) m1sale, coalesce(bu1.budgets,0) m1budget,
coalesce(sa2.sales,0) m2sale, coalesce(bu2.budgets,0) m2budget,
coalesce(ca1.cases,0) m1cases, coalesce(ca2.cases,0) m2cases
from (select distinct code from tb_merchant ) mer
left join (
	select m.code, sum(t.sale) sales
	from tb_transactions t
	inner join tb_merchant m on m.merchant_id = t.merchant_id
	where t.period = $3
	and transaction_month = $1
	group by m.code
) sa1 on sa1.code = mer.code
left join (
	select m.code, sum(b.budget_amount) budgets
	from tb_budget b
	inner join tb_merchant m on m.merchant_id = b.merchant_id
	where b.budget_month ~* $2
	and b.budget_period = $3
	group by m.code
) bu1 on bu1.code = mer.code
left join (
	select m.code, sum(t.sale) sales
	from tb_transactions t
	inner join tb_merchant m on m.merchant_id = t.merchant_id
	where t.period = $4
	and transaction_month = $1
	group by m.code
) sa2 on sa2.code = mer.code
left join (
	select m.code, sum(b.budget_amount) budgets
	from tb_budget b
	inner join tb_merchant m on m.merchant_id = b.merchant_id
	where b.budget_month ~* $2
	and b.budget_period = $4
	group by m.code
) bu2 on bu2.code = mer.code
left join (
	select m.code, sum(t.cases) cases
	from tb_transactions t
	inner join tb_merchant m on m.merchant_id = t.merchant_id
	where t.period = $3
	and transaction_month = $1
	group by m.code
) ca1 on ca1.code = mer.code
left join (
	select m.code, sum(t.cases) cases
	from tb_transactions t
	inner join tb_merchant m on m.merchant_id = t.merchant_id
	where t.period = $4
	and transaction_month = $1
	group by m.code
) ca2 on ca2.code = mer.code`;
var sres = plv8.execute(s,month,month_abr,period,period_prev);

result.data.rowDataOMTD = sres;
result.data.headerNamesOMTD = headings;

return (result);
$$ LANGUAGE plv8;