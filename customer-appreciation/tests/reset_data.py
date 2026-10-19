"""Reset mutable simulation files only; preserve sample customers, reps, invoices."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'data'
for name in ('operations','credits','messages'):
 (root/(name+'.json')).write_text('{}\n',encoding='utf-8')
print('Simulation state reset')
