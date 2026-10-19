from common import *
a=receive();require(a,'customerId');customer=load('customers').get(a['customerId'])
if customer is None:fail('CUSTOMER_NOT_FOUND')
emit(customerId=a['customerId'],customerEmail=customer.get('email'))
