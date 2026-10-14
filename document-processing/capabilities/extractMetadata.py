from common import receive, emit, fail

a = receive()
text = a.get('documentText')

if not isinstance(text, str):
    fail('documentText must be a string')

metadata = {}

for line in text.splitlines()[1:]:
    if ':' in line:
        key, value = line.split(':', 1)
        key = key.strip().lower().replace(' ', '_')
        if key and key not in metadata:
            metadata[key] = value.strip()

emit({'metadata':metadata})
