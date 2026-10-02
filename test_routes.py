import urllib.request
import json
import sys

urls = [
    'http://localhost:3000/',
    'http://localhost:3000/instructor',
    'http://localhost:3000/instructor/scenarios',
    'http://localhost:3000/instructor/scenarios/create',
    'http://localhost:3000/instructor/exercises/exercise-demo-1',
    'http://localhost:3000/commander',
    'http://localhost:3000/commander/simulation/exercise-demo-1',
    'http://localhost:3000/team',
    'http://localhost:3000/aar/exercise-demo-1',
    'http://127.0.0.1:8000/api/health',
    'http://127.0.0.1:8000/api/scenarios',
    'http://127.0.0.1:8000/api/exercises',
    'http://127.0.0.1:8000/api/exercises/exercise-demo-1',
    'http://127.0.0.1:8000/api/exercises/exercise-demo-1/aar'
]

print("=== VERIFYING COMMAND-X SYSTEM ENDPOINTS ===")
all_ok = True
for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as res:
            status = res.status
            content_type = res.headers.get('Content-Type', '').split(';')[0]
            print(f"[OK] {status} - {url} ({content_type})")
    except Exception as e:
        print(f"[FAIL] {url} - Error: {e}")
        all_ok = False

if all_ok:
    print("\nSUCCESS: All 14 endpoints verified and running perfectly!")
else:
    sys.exit(1)
