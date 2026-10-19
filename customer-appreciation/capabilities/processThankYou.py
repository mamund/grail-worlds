from common import *
a=receive();oid,cid,_=existing_operation(a)
with lock():
 rec=ensure_record(oid,cid)
 if 'messageStatus' not in rec:fail('MESSAGE_NOT_PREPARED')
 if money(rec['creditAmount'])==0:
  rec['deliveryStatus']='NOT_APPLICABLE';save_record(oid,rec)
  emit(deliveryStatus='NOT_APPLICABLE');sys.exit(0)
 messages=load('messages');msg=messages.get(oid)
 if not msg or msg['customerId']!=cid:fail('MESSAGE_NOT_PREPARED')
 if msg['status']=='SENT':
  rec['deliveryStatus']='ALREADY_SENT';save_record(oid,rec)
  emit(deliveryStatus='ALREADY_SENT');sys.exit(0)
 if msg['status']!='PREPARED':fail('MESSAGE_STATUS_UNKNOWN')
 # SIMULATED send: persistent status is the delivery record; no network call.
 msg['status']='SENT';messages[oid]=msg;save('messages',messages)
 rec['deliveryStatus']='SENT';save_record(oid,rec)
 emit(deliveryStatus='SENT')
