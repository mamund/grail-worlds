import json,subprocess,sys,tempfile,shutil,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
NAMES=['findCustomer','findSalesRep','totalInvoices','calculateCredit','processCredit','prepareThankYou','processThankYou']
class WorldTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
  self.root=Path(self.tmp.name);shutil.copytree(ROOT/'capabilities',self.root/'capabilities');shutil.copytree(ROOT/'data',self.root/'data')
 def call(self,name,**kwargs):
  p=subprocess.run([sys.executable,str(self.root/'capabilities'/(name+'.py'))],input=json.dumps(kwargs),text=True,capture_output=True,cwd=self.root,timeout=8)
  return p,json.loads(p.stdout) if p.returncode==0 else None
 def pursuit(self,cid,oid):
  base={'customerId':cid,'operationId':oid}
  p,customer=self.call('findCustomer',**base)
  if p.returncode:return p,None
  p,contact=self.call('findSalesRep',**base);self.assertEqual(p.returncode,0,p.stderr)
  p,invoice=self.call('totalInvoices',**base,periodStart='2025-01-01',periodEnd='2025-12-31',currency='USD');self.assertEqual(p.returncode,0,p.stderr)
  p,credit=self.call('calculateCredit',**base,invoiceTotal=invoice['invoiceTotal'],creditPercent=10,currency='USD');self.assertEqual(p.returncode,0,p.stderr)
  p,posted=self.call('processCredit',**base,creditAmount=credit['creditAmount'],currency='USD');self.assertEqual(p.returncode,0,p.stderr)
  p,prepared=self.call('prepareThankYou',**base)
  if p.returncode:return p,None
  p,sent=self.call('processThankYou',**base)
  if p.returncode:return p,None
  return p,{'contact':contact,'invoice':invoice,'credit':credit,'posted':posted,'prepared':prepared,'sent':sent}
 def data(self,name):return json.loads((self.root/'data'/(name+'.json')).read_text())
 def test_positive_and_retry(self):
  p,x=self.pursuit('C100','THANKYOU-2026-C100');self.assertEqual(x['invoice']['invoiceTotal'],'5000.00');self.assertEqual(x['credit']['creditAmount'],'500.00');self.assertEqual(x['sent']['deliveryStatus'],'SENT')
  p,y=self.pursuit('C100','THANKYOU-2026-C100');self.assertEqual(y['posted']['creditStatus'],'ALREADY_APPLIED');self.assertEqual(y['sent']['deliveryStatus'],'ALREADY_SENT');self.assertEqual(len(self.data('credits')),1);self.assertEqual(len(self.data('messages')),1)
 def test_zero(self):
  p,x=self.pursuit('C200','THANKYOU-2026-C200');self.assertEqual(x['credit']['creditAmount'],'0.00');self.assertEqual(x['contact']['contactSource'],'DEFAULT');self.assertEqual(x['sent']['deliveryStatus'],'NOT_APPLICABLE');self.assertEqual(self.data('credits'),{});self.assertEqual(self.data('messages'),{})
 def test_missing_customer(self):
  p,x=self.pursuit('UNKNOWN','THANKYOU-2026-UNKNOWN');self.assertNotEqual(p.returncode,0);self.assertIn('CUSTOMER_NOT_FOUND',p.stderr)
 def test_conflicting_retry(self):
  self.pursuit('C100','ONE');p,x=self.call('calculateCredit',operationId='ONE',customerId='C100',invoiceTotal='5000.00',creditPercent=20,currency='USD');self.assertNotEqual(p.returncode,0);self.assertIn('OPERATION_CONFLICT',p.stderr)
 def test_interruption_after_credit(self):
  base={'customerId':'C100','operationId':'INTERRUPT'}
  self.call('findCustomer',**base);self.call('findSalesRep',**base)
  self.call('totalInvoices',**base,periodStart='2025-01-01',periodEnd='2025-12-31',currency='USD')
  self.call('calculateCredit',**base,invoiceTotal='5000.00',creditPercent=10,currency='USD')
  p,_=self.call('processCredit',**base,creditAmount='500.00',currency='USD');self.assertEqual(p.returncode,0,p.stderr)
  _,x=self.pursuit('C100','INTERRUPT');self.assertEqual(x['posted']['creditStatus'],'ALREADY_APPLIED');self.assertEqual(len(self.data('credits')),1)
 def test_zero_credit_missing_email(self):
  p,x=self.pursuit('C300','NOEMAIL')
  self.assertEqual(p.returncode,0,p.stderr)
  self.assertEqual(x['invoice']['invoiceTotal'],'0.00')
  self.assertEqual(x['credit']['creditAmount'],'0.00')
  self.assertEqual(x['prepared']['messageStatus'],'NOT_APPLICABLE')
  self.assertEqual(x['sent']['deliveryStatus'],'NOT_APPLICABLE')
  self.assertEqual(self.data('credits'),{})
  self.assertEqual(self.data('messages'),{})
 def test_positive_credit_missing_email(self):
  invoices=self.data('invoices')
  invoices.append({'id':'I-C300-TEST','customerId':'C300','date':'2025-06-15','amount':'1000.00','currency':'USD','status':'ISSUED'})
  (self.root/'data'/'invoices.json').write_text(json.dumps(invoices))
  p,x=self.pursuit('C300','NOEMAIL-POSITIVE')
  self.assertNotEqual(p.returncode,0)
  self.assertIn('CUSTOMER_EMAIL_MISSING',p.stderr)
  self.assertEqual(self.data('messages'),{})
if __name__=='__main__':unittest.main()
