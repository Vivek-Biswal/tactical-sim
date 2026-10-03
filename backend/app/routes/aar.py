import csv
import io
import json

from app.service import get_session, is_instructor
from fastapi import APIRouter, Header, HTTPException, Query, Response

router = APIRouter(prefix="/exercises/{exercise_id}", tags=["AAR"])


def report(exercise_id, key):
    session = get_session(exercise_id)
    if session.status != "completed" and not is_instructor(session, key):
        raise HTTPException(409, "Full AAR becomes available after the exercise ends")
    return session.generate_aar()


@router.get("/aar")
async def get_aar(
    exercise_id: str, x_instructor_key: str | None = Header(default=None)
):
    return report(exercise_id, x_instructor_key)


@router.get("/aar/export")
async def export_aar(
    exercise_id: str,
    format: str = Query(default="json", pattern="^(json|csv)$"),
    x_instructor_key: str | None = Header(default=None),
):
    data = report(exercise_id, x_instructor_key)
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
