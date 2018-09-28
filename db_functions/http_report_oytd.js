create or replace function http_report_oytd(req json) returns JSON as
$$
if (!plv8.ufn) {
	var sup = plv8.find_function("plv8_startup");
	sup();
}


// headerNamesOYTD: ["CHANNELS", "2018/2019", "2017/2018", "VAR(%)", "VAR(R)", "B2018/2019", "VAR(%)", "VAR(R)", "C2018/2019", "C2017/2018", "VAR(%)", "VAR(C)"],
// rowDataOYTD: [
//     {
//         code: "SCS",
//         type: "Year To Date",
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
  	rowDataOYTD:[],
  	headerNamesOYTD: []
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

//["CHANNELS","2018/2019","2017/2018","VAR(%)","VAR(R)","B2018/2019","VAR(%)","VAR(R)","C2018/2019","C2017/2018","VAR(%)","VAR(C)"]
var headings = [];
headings.push('CHANNELS');
headings.push(period);
headings.push(period_prev);
headings.push('VAR(%)');
headings.push('VAR(R)');
headings.push('B'+period);
headings.push('B'+period_prev);
headings.push('VAR(%)');
headings.push('VAR(R)');
headings.push('C'+period);
headings.push('C'+period_prev);
headings.push('VAR(%)');
headings.push('VAR(C)');


var s = `select mer.code , 'Year To Date' as "type",
coalesce(sa1.sales,0) y1sale, coalesce(sa2.sales,0) y2sale,
coalesce(bu1.budgets,0) y1budget, coalesce(ca1.cases,0) y1cases,
coalesce(ca2.cases,0) y2cases
from (select distinct code from tb_merchant ) mer
left join (
	select m.code, sum(t.sale) sales
	from tb_transactions t
	inner join tb_merchant m on m.merchant_id = t.merchant_id
	where t.period = $1
	group by m.code
) sa1 on sa1.code = mer.code
left join (
	select m.code, sum(t.sale) sales
	from tb_transactions t
	inner join tb_merchant m on m.merchant_id = t.merchant_id
  where t.period = $2
    and (concat(t.transaction_year, '-' , t.transaction_month, '-', t.transaction_day))::timestamp < $3
	group by m.code
) sa2 on sa2.code = mer.code
left join (
	select m.code, sum(b.budget_amount) budgets
	from tb_budget b
	inner join tb_merchant m on m.merchant_id = b.merchant_id
	where b.budget_period = $1
	group by m.code
) bu1 on bu1.code = mer.code
left join (
	select m.code, sum(t.cases) cases
	from tb_transactions t
	inner join tb_merchant m on m.merchant_id = t.merchant_id
	where t.period = $1
	group by m.code
) ca1 on ca1.code = mer.code
left join (
	select m.code, sum(t.cases) cases
	from tb_transactions t
	inner join tb_merchant m on m.merchant_id = t.merchant_id
	where period = $2
  and (concat(t.transaction_year, '-' , t.transaction_month, '-', t.transaction_day))::timestamp < $3
	group by m.code
) ca2 on ca2.code = mer.code`;
var sres = plv8.execute(s, period, period_prev, query_date);

result.data.rowDataOYTD = sres;
result.data.headerNamesOYTD = headings;

return (result);
$$ LANGUAGE plv8;