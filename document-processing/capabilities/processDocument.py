from common import receive, emit, fail

a = receive()
kind = a.get('classification')
metadata = a.get('metadata')
path = a.get('documentPath')

if kind not in ('INVOICE','CONTRACT','LETTER','OTHER') or not isinstance(metadata, dict):
    fail('valid classification and metadata required')

# Domain branching belongs here. All recognized outcomes resolve documentProcessed.
dispositions = {'INVOICE':'queued-for-accounts-payable','CONTRACT':'queued-for-legal-review','LETTER':'filed-as-correspondence','OTHER':'queued-for-manual-triage'}

disposition = dispositions[kind]

emit({'disposition':disposition,'receipt':{'source':path,'classification':kind,'disposition':disposition,'metadata':metadata}})
