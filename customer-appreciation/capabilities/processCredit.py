from common import *
a=receive();oid,cid,_=existing_operation(a);require(a,'creditAmount','currency')
with lock():
 rec=ensure_record(oid,cid)
 if rec.get('creditAmount')!=cents(a['creditAmount']):fail('OPERATION_CONFLICT: credit amount')
 if rec.get('invoiceBasis',{}).get('currency')!=a['currency']:fail('OPERATION_CONFLICT: currency')
 credits=load('credits');amount=money(a['creditAmount'])
 if amount==0:
  if oid in credits:fail('OPERATION_CONFLICT: unexpected credit')
  rec['creditStatus']='NOT_APPLICABLE';save_record(oid,rec)
  emit(creditStatus='NOT_APPLICABLE');sys.exit(0)
 if oid in credits:
  old=credits[oid]
  if old['customerId']!=cid or old['amount']!=cents(amount):fail('OPERATION_CONFLICT: posted credit')
  rec['creditStatus']='ALREADY_APPLIED';save_record(oid,rec)
  emit(creditStatus='ALREADY_APPLIED');sys.exit(0)
 credits[oid]={'customerId':cid,'amount':cents(amount),'currency':a['currency'],'status':'APPLIED'}
 save('credits',credits)
 rec['creditStatus']='APPLIED';save_record(oid,rec)
 emit(creditStatus='APPLIED')
