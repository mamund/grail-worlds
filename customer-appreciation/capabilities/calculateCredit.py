from common import *
a=receive();oid,cid,_=existing_operation(a);require(a,'invoiceTotal','creditPercent','currency')
with lock():
 rec=ensure_record(oid,cid)
 if rec.get('invoiceTotal')!=cents(a['invoiceTotal']):fail('OPERATION_CONFLICT: invoice total')
 if rec.get('invoiceBasis',{}).get('currency')!=a['currency']:fail('OPERATION_CONFLICT: currency')
 try:percent=Decimal(str(a['creditPercent']))
 except InvalidOperation:fail('INVALID_PERCENT')
 if not percent.is_finite() or percent<0 or percent>100:fail('INVALID_PERCENT')
 if 'creditAmount' in rec:
  if rec['creditPercent']!=str(percent):fail('OPERATION_CONFLICT: credit percent')
  emit(creditAmount=rec['creditAmount']);sys.exit(0)
 amount=money(money(a['invoiceTotal'])*percent/Decimal('100'))
 rec.update(creditPercent=str(percent),creditAmount=cents(amount));save_record(oid,rec)
 emit(creditAmount=rec['creditAmount'])
