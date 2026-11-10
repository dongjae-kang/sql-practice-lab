export const schema = {
 counties: [['county','text'],['population','integer']],
 products: [['item_no','integer PRIMARY KEY'],['category_name','text'],['item_description','text'],['vendor','integer'],['vendor_name','text'],['bottle_size','integer'],['pack','integer'],['inner_pack','integer'],['age','text'],['proof','text'],['list_date','timestamp'],['upc','text'],['scc','text'],['bottle_price','money'],['shelf_price','numeric(10,2)'],['case_cost','numeric(10,2)']],
 stores: [['store','integer PRIMARY KEY'],['name','text'],['store_status','text'],['store_address','text'],['address_info','text']],
 sales: [['date','timestamp'],['convenience_store','text'],['store','integer'],['county_number','text'],['county','text'],['category','text'],['category_name','text'],['vendor_no','text'],['vendor','text'],['item','integer'],['description','text'],['pack','integer'],['liter_size','integer'],['state_btl_cost','money'],['btl_price','money'],['bottle_qty','integer'],['total','numeric(10,2)']]
};
export const notes = {proof:'Text. Use CAST for numbers.',category_name:'Stored in upper case. 117 products have NULL category_name.',bottle_price:'Money. Cast to numeric for AVG.',state_btl_cost:'Money. Cast to numeric for AVG.',btl_price:'Money. Cast to numeric for AVG.',store_status:"'A' = active. 'I' = inactive."};
