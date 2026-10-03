"""Real running-server smoke test. Run after scripts/start-backend.ps1."""

import json
import urllib.request
import uuid

from websockets.sync.client import connect

BASE = "http://127.0.0.1:8000"


def request(path, body=None, key=None):
    headers = {"Content-Type": "application/json"}
    if key:
        headers["X-Instructor-Key"] = key
    data = json.dumps(body).encode() if body is not None else None
    with urllib.request.urlopen(
        urllib.request.Request(BASE + "/api" + path, data=data, headers=headers),
        timeout=5,
    ) as response:
        return json.load(response)


def receive(ws, kind, predicate=lambda p: True):
    for _ in range(100):
        packet = json.loads(ws.recv(timeout=5))
        if packet["type"] == kind and predicate(packet):
            return packet
    raise AssertionError("Expected packet not received")


def command(ws, kind, payload):
    request_id = uuid.uuid4().hex
    ws.send(json.dumps({"type": kind, "requestId": request_id, "payload": payload}))
    return receive(ws, "ACK", lambda p: p["requestId"] == request_id)


def main():
    room = request("/exercises/start", {"teamName": "Network smoke verification"})
    exercise_id, key = room["exerciseId"], room["instructorKey"]
    path = f"/exercises/{exercise_id}"
    try:
        with (
            connect(f"ws://127.0.0.1:8000/ws/exercises/{exercise_id}") as commander,
            connect(f"ws://127.0.0.1:8000/ws/exercises/{exercise_id}") as alpha,
        ):
            commander.send(
                json.dumps(
                    {"type": "JOIN", "role": "COMMANDER", "name": "Smoke Commander"}
                )
            )
            receive(commander, "JOINED")
            receive(commander, "STATE_UPDATE")
            alpha.send(
                json.dumps(
                    {"type": "JOIN", "role": "TEAM_ALPHA", "name": "Smoke Alpha"}
                )
            )
            receive(alpha, "JOINED")
            receive(alpha, "STATE_UPDATE")
            request(
                path + "/inject",
                {"action": "delay_radio", "payload": {"delay": 0.25}},
                key,
            )
            ack = command(alpha, "RADIO_MESSAGE", {"content": "Delayed network report"})
            assert ack["result"]["deliveryStatus"] == "DELAYED"
            delivered = receive(
                commander,
                "STATE_UPDATE",
                lambda p: any(
                    m["content"] == "Delayed network report"
                    for m in p["state"]["messages"]
                ),
            )
            assert "trueUnits" not in delivered["state"]
            request(path + "/inject", {"action": "outdate_map"}, key)
            request(path + "/inject", {"action": "drop_radio"}, key)
            ack = command(alpha, "RADIO_MESSAGE", {"content": "DROPPED_NETWORK_BODY"})
            assert ack["result"]["deliveryStatus"] == "DROPPED"
            state = receive(
                commander,
                "STATE_UPDATE",
                lambda p: any(
                    e["category"] == "MESSAGE_DROPPED" for e in p["state"]["eventLog"]
                ),
            )
            assert "DROPPED_NETWORK_BODY" not in json.dumps(state)
            command(
                commander,
                "DECISION_SUBMIT",
                {
                    "decision": "Hold and verify",
                    "rationale": "No radio and stale positions",
                    "confidence": "medium",
                },
            )
            request(path + "/end", {}, key)
            aar = request(path + "/aar")
            assert aar["isFinal"] and aar["stats"]["decisionsCount"] == 1
            assert (
                aar["stats"]["messagesDelivered"] == 1
                and aar["stats"]["messagesDropped"] == 1
            )
            assert aar["decisions"][0]["mapStatus"] == "outdated"
            assert "DROPPED_NETWORK_BODY" in json.dumps(aar)
            exported = request(path + "/aar/export?format=json")
            assert exported["exerciseId"] == exercise_id
            print(
                "PASS: running HTTP server, two real WebSocket clients, delayed/drop delivery, hidden data, decision snapshot and final JSON AAR"
            )
    finally:
        request(path + "/end", {}, key)


if __name__ == "__main__":
    main()
