create or replace function giningain_xlsx_upload(input json) returns JSON as
$$
	if(!plv8.ufn){
	    var sup = plv8.find_function("plv8_startup");
	    sup();
	}

	var result = {
        http_code: 200, 
        message: 'Data stored',
        data: {

        }
    };

	var worksheet = input;
	var row = 2;
	var insert_count = 0;
    var anon_email = 'anonymous@anonymous.com';

	for (var key in worksheet) {
        if (worksheet.hasOwnProperty(key)) {
            var email = '';
            var gl_code = '';
            if(worksheet['E'+row]){
                
                if(worksheet['E'+row].v != email){
                    email = worksheet['E'+row].v;
                    var profile_id = "";
                    // Check to see if the email address already exists within the cansaOnline system.
                    // If it does not.....Add it
                    // If it does ..... link the profile's id to the transaction that is going to be added
                    var sql_req1 = `select id from tb_profile where email = $1;`;
                    var sql_res1 = plv8.execute(m_sql,email);
                    // It does not
                    if(sql_res1.length == 0){

                        // First go add the address' and link the address_id to the profile when it gets created
                        var physical_address = worksheet['W'+row] ? worksheet['W'+row].v : 'Other';
                        var physical_suburb = worksheet['Y'+row] ? worksheet['Y'+row].v : 'Other';
                        var physical_city_town = worksheet['X'+row] ? worksheet['X'+row].v : 'Other';
                        var physical_postal_code = worksheet['Z'+row] ? worksheet['Z'+row].v : 'Other';
                        var sql_req2 = "insert into tb_address (physical_address,physical_suburb,physical_city_town,physical_postal_code) \
                            values ($1,$2,$3,$4) \
                            RETURNING id";
                        var sql_res2 = plv8.execute(sql_req2, physical_address, physical_suburb, physical_city_town, physical_postal_code);
                        var address_id = sql_res2[0].id;

                        // Second go add the Profile and link the address to this profile
                        var first_name = worksheet['C'+row] ? worksheet['C'+row].v : 'Anonymous';
                        var last_name = worksheet['D'+row] ? worksheet['D'+row].v : 'Anonymous';
                        var email = worksheet['E'+row] ? worksheet['E'+row].v : 'anonymous@anonymous.com';
                        var name = first_name + " " + last_name;
                        var sql_req3 = "insert into tb_profile (address_id, first_name, last_name, email, name) values ($1, $2, $3, $4, $5) \
                            RETURNING id";
                        var sql_res3 = plv8.execute(sql_req3, address_id, first_name, last_name, email, name);

                        profile_id = sql_res3[0].id;
                    } else { // It does
                        profile_id = sql_res1[0].id;
                    }

                    // Get GL-CODE from campaign_id from tb_givengain_campaign_to_gl_code
                    var campaign_id = worksheet['K'+row] ? worksheet['K'+row].v : 'Other';
                    var sql_req4 = `select gl_code from tb_givengain_campaign_to_gl_code where campaign_id = $1;`;
                    var sql_res4 = plv8.execute(sql_req4, campaign_id);

                    if(sql_res4.length == 0){
                        gl_code = sql_res4[0].gl_code;
                        var payment_type = 'Givengain';
                        var paid = true;
                        var amount = worksheet['H'+row] ? worksheet['H'+row].v : 0;
                        var description = worksheet['S'+row] ? worksheet['S'+row].v : 0;
                        
                        var processing_gl_code = 'xxx';
                        var processing_fee = worksheet['J'+row] ? worksheet['J'+row].v : 0;

                        var sql_req5 = "insert into tb_transaction (gl_code, payment_type, paid, amount, description, profile_id) values ($1, $2, $3, $4, $5, $6) \
                            RETURNING id";
                        var sql_res5 = plv8.execute(sql_req5, gl_code, payment_type, paid, amount, description, profile_id);

                        var sql_req6 = "insert into tb_transaction (gl_code, payment_type, paid, amount, description, profile_id) values ($1, $2, $3, $4, $5, $6) \
                            RETURNING id";
                        var sql_res6 = plv8.execute(sql_req6, processing_gl_code, payment_type, paid, processing_fee, description, profile_id);
                    } else {
                        // Error message that there id an unrecognised Campaign ID
                    }


                }
            }



            row++;

        }
    }
    return result;

    $$ LANGUAGE plv8;