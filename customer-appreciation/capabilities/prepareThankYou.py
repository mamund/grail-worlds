from common import *
a=receive();oid,cid,_=existing_operation(a)
with lock():
 rec=ensure_record(oid,cid)
 if 'creditAmount' not in rec or 'creditStatus' not in rec:fail('CREDIT_NOT_PROCESSED')
 if money(rec['creditAmount'])==0:
  rec['messageStatus']='NOT_APPLICABLE';save_record(oid,rec)
  emit(messageStatus='NOT_APPLICABLE');sys.exit(0)
 customer=load('customers').get(cid)
 if not customer:fail('CUSTOMER_NOT_FOUND')
 if not customer.get('email'):fail('CUSTOMER_EMAIL_MISSING')
 if not rec.get('contactEmail'):fail('SALES_CONTACT_UNAVAILABLE')
 messages=load('messages')
 if oid in messages:
  msg=messages[oid]
  if msg['customerId']!=cid:fail('OPERATION_CONFLICT: message')
  rec['messageStatus']='ALREADY_PREPARED';save_record(oid,rec)
  emit(messageStatus='ALREADY_PREPARED');sys.exit(0)
 messages[oid]={'customerId':cid,'to':[customer['email'],rec['contactEmail']], 'subject':'Thank you for your business', 'body':'We have applied a '+rec['creditAmount']+' '+rec['invoiceBasis']['currency']+' appreciation credit to your account.', 'status':'PREPARED'}
 save('messages',messages)
 rec['messageStatus']='PREPARED';save_record(oid,rec)
 emit(messageStatus='PREPARED')
