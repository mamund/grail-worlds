from common import *
a=receive();oid,cid,_=existing_operation(a)
customer=load('customers').get(cid)
if not customer:fail('CUSTOMER_NOT_FOUND')
with lock():
 rec=ensure_record(oid,cid)
 if 'contactEmail' in rec:emit(contactEmail=rec['contactEmail'],contactSource=rec['contactSource']);sys.exit(0)
 directory=load('sales-reps');rep=directory['reps'].get(customer.get('salesRepId'))
 address=rep.get('email') if rep and rep.get('active') else None
 source='ACTIVE_REP' if address else 'DEFAULT'
 address=address or directory.get('defaultContactEmail')
 if not address:fail('SALES_CONTACT_UNAVAILABLE')
 rec.update(contactEmail=address,contactSource=source);save_record(oid,rec)
 emit(contactEmail=address,contactSource=source)
