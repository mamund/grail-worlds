"""Local, single-writer JSON simulation. No external requests or actual email delivery."""
import json,sys,os,tempfile,fcntl
from pathlib import Path
from decimal import Decimal,InvalidOperation,ROUND_HALF_UP
from datetime import date
ROOT=Path(__file__).resolve().parent.parent
DATA=ROOT/'data'

def receive():
 try:
  value=json.load(sys.stdin)
  if not isinstance(value,dict):raise ValueError('expected object')
  return value
 except (ValueError,TypeError) as exc:fail('invalid input: '+str(exc))
def emit(**kwargs):print(json.dumps(kwargs,ensure_ascii=False))
def fail(message):print(message,file=sys.stderr);sys.exit(1)
def load(name):return json.loads((DATA/(name+'.json')).read_text(encoding='utf-8'))
def save(name,value):
 path=DATA/(name+'.json'); fd,tmp=tempfile.mkstemp(prefix='.'+name+'-',dir=DATA)
 try:
  with os.fdopen(fd,'w',encoding='utf-8') as f:
   json.dump(value,f,indent=2,ensure_ascii=False);f.write('\n');f.flush();os.fsync(f.fileno())
  os.replace(tmp,path)
 finally:
  if os.path.exists(tmp):os.unlink(tmp)
def money(value):
 try:
  d=Decimal(str(value))
  if not d.is_finite():raise ValueError('non-finite')
  return d.quantize(Decimal('0.01'),rounding=ROUND_HALF_UP)
 except (InvalidOperation,ValueError,TypeError):fail('INVALID_MONEY')
def cents(value):return str(money(value))
def require(a,*names):
 for n in names:
  if a.get(n) is None or a.get(n)=='':fail('MISSING_'+n)
def lock():
 """Exclusive lock for cooperating local simulation writers (not a distributed lock)."""
 f=open(DATA/'.operation.lock','a+')
 fcntl.flock(f.fileno(),fcntl.LOCK_EX)
 return f

def operation(a):
 require(a,'operationId','customerId')
 return str(a['operationId']),str(a['customerId'])
def existing_operation(a):
 oid,cid=operation(a)
 op=load('operations').get(oid)
 if op and op['customerId']!=cid:fail('OPERATION_CONFLICT: customerId')
 return oid,cid,op

def get_record(oid):return load('operations').get(oid)
def save_record(oid,record):
 allops=load('operations');allops[oid]=record;save('operations',allops)
def ensure_record(oid,cid):
 rec=get_record(oid)
 if rec and rec['customerId']!=cid:fail('OPERATION_CONFLICT: customerId')
 return rec or {'customerId':cid}
