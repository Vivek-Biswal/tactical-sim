import csv
import io
import json

from fastapi import APIRouter, Header, HTTPException, Query, Request, Response

from app.auth import identity_for, is_demo, membership
from app.service import get_session, is_instructor, require_instructor

router = APIRouter(prefix="/exercises/{exercise_id}", tags=["AAR"])


def report(exercise_id, key, identity):
    session = get_session(exercise_id)
    member = None
    if not is_demo():
        member = membership(session, identity)
        if key:
            require_instructor(session, key, identity)
    instructor = is_instructor(session, key, identity)
    if session.status != "completed" and not instructor:
        raise HTTPException(409, "Full AAR becomes available after the exercise ends")
    if not is_demo() and not instructor and member is None:
        raise HTTPException(403, "Join this exercise before accessing its final AAR")
    data = session.generate_aar()
    # Final debrief releases unavailable information so participants can compare
    # their decisions against the exercise truth after training has ended.
    data["reviewScope"] = (
        "instructor" if instructor else "demo" if is_demo() else "participant"
    )
    data["participants"] = [
        {"role": value["role"], "name": value["name"]}
        for value in session.scenario.get("_access", {}).get("memberships", {}).values()
    ]
    return data


@router.get("/aar")
async def get_aar(
    exercise_id: str,
    request: Request,
    x_instructor_key: str | None = Header(default=None),
):
    return report(exercise_id, x_instructor_key, identity_for(request))


@router.get("/aar/export")
async def export_aar(
    exercise_id: str,
    request: Request,
    format: str = Query(default="json", pattern="^(json|csv)$"),
    x_instructor_key: str | None = Header(default=None),
):
    data = report(exercise_id, x_instructor_key, identity_for(request))
    if format == "json":
        body, mime = json.dumps(data, indent=2), "application/json"
    else:
        out = io.StringIO()
        writer = csv.writer(out)
        writer.writerow(
            [
                "simulationSecond",
                "traineeId",
                "decision",
                "rationale",
                "confidence",
                "comms",
                "map",
                "availableInformation",
                "unavailableInformation",
                "decisionRequiredSecond",
                "decisionSubmissionSecond",
                "responseLatencySeconds",
                "availableReportIds",
                "mapSnapshotSecond",
                "radioDelaySeconds",
            ]
        )

        def safe(value):
            value = str(value)
            return (
                "'" + value
                if value.lstrip().startswith(("=", "+", "-", "@"))
                else value
            )

        for d in data["decisions"]:
            writer.writerow(
                [
                    safe(v)
                    for v in [
                        d["simulationSecond"],
                        d["traineeId"],
                        d["decision"],
                        d["rationale"],
                        d["confidence"],
                        d["communicationState"],
                        d["mapStatus"],
                        " | ".join(d["availableInformation"]),
                        " | ".join(d["unavailableInformation"]),
                        d.get("decisionRequiredSecond") if d.get("decisionRequiredSecond") is not None else "Not available",
                        d["simulationSecond"],
                        d.get("responseLatencySeconds") if d.get("responseLatencySeconds") is not None else "Not available",
                        " | ".join(d.get("informationSnapshot", {}).get("reportIds", [])),
                        d.get("informationSnapshot", {}).get("mapSnapshotSecond", "Not available"),
                        d.get("informationSnapshot", {}).get("radioDelaySeconds", "Not available"),
                    ]
                ]
            )
        body, mime = out.getvalue(), "text/csv"
    return Response(
        body,
        media_type=mime,
        headers={
            "Content-Disposition": f'attachment; filename="aar-{exercise_id}.{format}"'
        },
    )
