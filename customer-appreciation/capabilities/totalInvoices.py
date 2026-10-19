from common import *
a=receive();oid,cid,_=existing_operation(a);require(a,'periodStart','periodEnd','currency')
try:
 start=date.fromisoformat(a['periodStart']);end=date.fromisoformat(a['periodEnd'])
 if end<start:fail('INVALID_PERIOD')
except (ValueError,TypeError):fail('INVALID_PERIOD')
if cid not in load('customers'):fail('CUSTOMER_NOT_FOUND')
with lock():
 rec=ensure_record(oid,cid)
 basis={'periodStart':a['periodStart'],'periodEnd':a['periodEnd'],'currency':a['currency']}
 if 'invoiceBasis' in rec:
  if rec['invoiceBasis']!=basis:fail('OPERATION_CONFLICT: invoice basis')
  emit(invoiceTotal=rec['invoiceTotal'],invoiceCount=rec['invoiceCount']);sys.exit(0)
 total=Decimal('0');ids=[]
 for inv in load('invoices'):
  if inv['customerId']!=cid or not(start<=date.fromisoformat(inv['date'])<=end) or inv['status']=='VOID':continue
  if inv['currency']!=a['currency']:fail('CURRENCY_MISMATCH')
  total+=money(inv['amount']);ids.append(inv['id'])
 total=max(total,Decimal('0'))
 rec.update(invoiceBasis=basis,invoiceTotal=cents(total),invoiceCount=len(ids),invoiceIds=ids)
 save_record(oid,rec)
 emit(invoiceTotal=rec['invoiceTotal'],invoiceCount=len(ids))
