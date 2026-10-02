import urllib.request
import json

BASE = "http://127.0.0.1:8000/api"

def post(endpoint, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(f"{BASE}/{endpoint}", data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def get(endpoint):
    req = urllib.request.Request(f"{BASE}/{endpoint}")
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

print("--- TESTING SIMULATION ENGINE & CONTROL INJECTS ---")

# 1. Start exercise
state = post("exercises/exercise-demo-1/control", {"action": "start"})
print(f"1. Started Exercise: status={state.get('status')}, timer={state.get('formattedTime')}")

# 2. Inject Radio Delay
res = post("exercises/exercise-demo-1/inject", {"action": "delay_radio", "payload": {"delay": 10}})
print(f"2. Injected Radio Delay: {res}")

# 3. Inject Conflicting Report
res = post("exercises/exercise-demo-1/inject", {"action": "conflicting_report", "payload": {}})
print(f"3. Injected Conflicting Report: {res}")

# 4. Submit Commander Decision
dec = post("exercises/exercise-demo-1/decision", {
    "decision": "Divert Route via Western Ridge Pass",
    "rationale": "Hostile mobile jammer identified near Choke Point Bravo. Bypassing primary highway to avoid RF ambush despite rough terrain.",
    "confidence": "high"
})
print(f"4. Recorded Commander Decision: {dec.get('decision')} (Confidence: {dec.get('confidence')})")

# 5. Fetch AAR Report
aar = get("exercises/exercise-demo-1/aar")
print(f"5. Generated AAR Report:")
print(f"   - Scenario: {aar.get('scenarioName')}")
print(f"   - Decisions Count: {len(aar.get('decisions', []))}")
print(f"   - Stated Rationale: \"{aar.get('decisions')[0].get('rationale')}\"")
print(f"   - Available Info Items: {len(aar.get('decisions')[0].get('availableInformation', []))}")
print(f"   - Denied Info Items: {len(aar.get('decisions')[0].get('unavailableInformation', []))}")
print(f"   - Transmissions: Total={aar.get('stats').get('messagesTotal')}, Delivered={aar.get('stats').get('messagesDelivered')}")

print("\n--- ALL SIMULATION AND AAR INJECT CYCLES VERIFIED SUCCESSFULLY! ---")
