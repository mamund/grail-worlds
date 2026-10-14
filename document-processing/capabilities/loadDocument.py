from common import receive, emit, read_document

a = receive()
path = a.get('documentPath')

if not isinstance(path, str) or not path:
    raise SystemExit('documentPath required')

text = read_document(path, 'utf-8')

if text.startswith('LEGACY:'):
    raise SystemExit('primary loader does not support legacy format')

emit({'text': text, 'path': path})
