"""Shared India training presets and illustrative surface rules for one simulation.

The polygons are teaching overlays, not surveyed navigation charts. Terrain in
Cesium does not become a second source of simulation state.
"""

import json
import math
from copy import deepcopy
from itertools import pairwise
from pathlib import Path

TRAINING_AREAS = {
    area["id"]: area
    for area in json.loads(
        (Path(__file__).parent.parent / "data" / "training_areas.json").read_text(
            encoding="utf-8"
        )
    )
}


def preset_for(area):
    return TRAINING_AREAS.get(area["id"])


def point_in_polygon(point, polygon):
    """Ray casting with boundary points included."""
    x, y = point["x"], point["y"]
    inside = False
    for a, b in zip(polygon, polygon[1:] + polygon[:1]):
        cross = (x - a["x"]) * (b["y"] - a["y"]) - (y - a["y"]) * (b["x"] - a["x"])
        if (
            abs(cross) < 1e-7
            and min(a["x"], b["x"]) <= x <= max(a["x"], b["x"])
            and min(a["y"], b["y"]) <= y <= max(a["y"], b["y"])
        ):
            return True
        if (a["y"] > y) != (b["y"] > y):
            at_x = a["x"] + (y - a["y"]) * (b["x"] - a["x"]) / (b["y"] - a["y"])
            if x < at_x:
                inside = not inside
    return inside


def surface_allows(area, domain, point):
    preset = preset_for(area)
    if not preset or domain == "air":
        return True
    if preset["surface"] == "water":
        return domain == "sea"
    if preset["surface"] in ("coast", "island"):
        on_land = any(
            point_in_polygon(point, polygon) for polygon in preset["landPolygons"]
        )
        return on_land if domain == "ground" else not on_land
    on_water = any(
        point_in_polygon(point, polygon) for polygon in preset["waterPolygons"]
    )
    return not on_water if domain == "ground" else on_water


def route_allows(area, domain, start, end):
    """Test every crossed polygon edge and intervening segment, not just endpoints."""
    preset = preset_for(area)
    if not preset or domain == "air":
        return True
    dx, dy = end["x"] - start["x"], end["y"] - start["y"]
    intervals = [0.0, 1.0]
    for polygon in preset["landPolygons"] + preset["waterPolygons"]:
        for a, b in zip(polygon, polygon[1:] + polygon[:1]):
            ex, ey = b["x"] - a["x"], b["y"] - a["y"]
            denominator = dx * ey - dy * ex
            if abs(denominator) < 1e-10:
                continue
            ax, ay = a["x"] - start["x"], a["y"] - start["y"]
            t = (ax * ey - ay * ex) / denominator
            u = (ax * dy - ay * dx) / denominator
            if 0 <= t <= 1 and 0 <= u <= 1:
                intervals.append(t)
    intervals = sorted(set(intervals))
    samples = intervals + [(a + b) / 2 for a, b in pairwise(intervals)]
    return all(
        surface_allows(
            area, domain, {"x": start["x"] + t * dx, "y": start["y"] + t * dy}
        )
        for t in samples
    )


def is_dynamic_area(area):
    return preset_for(area) is not None and bool(area.get("forceProfile"))


def initial_training_units(area):
    preset = preset_for(area)
    force = area["forceProfile"]
    if force == "army":
        domains = ["ground", "ground", "ground"]
    elif force == "air_force":
        domains = ["air", "air", "air"]
    elif force == "navy":
        domains = ["sea", "sea", "sea"]
    elif preset["surface"] == "land":
        domains = ["ground", "ground", "air"]
    elif not preset["routes"]["ground"]:
        domains = ["sea", "sea", "air"]
    else:
        domains = ["ground", "sea", "air"]
    names = {
        "ground": ["Army Team Alpha", "Army Team Bravo", "Army Observer"],
        "sea": ["Patrol Boat Alpha", "Patrol Boat Bravo", "Rescue Boat"],
        "air": ["Aircraft Alpha", "Aircraft Bravo", "UAV Observer"],
    }

    def create(unit_id, domain, index, contact=False):
        route = deepcopy(preset["routes"][domain])
        route_index = index % len(route)
        spawn = route[route_index]
        if contact:
            following = route[(route_index + 1) % len(route)]
            spawn = {
                "x": (spawn["x"] + following["x"]) / 2,
                "y": (spawn["y"] + following["y"]) / 2,
            }
        observer = domain == "air" and unit_id == "unit-charlie"
        contact_kind = {"ground": "Contact", "sea": "Boat", "air": "Aircraft"}[domain]
        return {
            "id": unit_id,
            "name": f"Unknown {contact_kind} {'1' if unit_id.endswith('1') else '2'}"
            if contact
            else names[domain][index],
            "callsign": "Unidentified"
            if contact
            else ["Alpha", "Bravo", "Observer"][index],
            "role": "Unidentified simulated activity"
            if contact
            else [
                "Lead patrol",
                "Support patrol",
                "Rescue support" if domain == "sea" else "Observation",
            ][index],
            "type": ("UAV" if observer else "Aircraft")
            if domain == "air"
            else "Boat"
            if domain == "sea"
            else "Infantry",
            "domain": domain,
            "faction": "unknown" if contact else "friendly",
            **spawn,
            **(
                {"altitudeMeters": 150 if observer else 400 if index == 0 else 600}
                if domain == "air"
                else {}
            ),
            "heading": 0,
            "status": "unknown" if contact else "operational",
            "sector": area["name"],
            "communicationStatus": "LOST" if contact else "NORMAL",
            "speedGridPerSecond": {"ground": 10, "sea": 15, "air": 35}[domain]
            * (0.8 if contact else 1),
            "patrolRoute": route,
            "patrolIndex": (route_index + 1) % len(route),
        }

    # Contacts are observations with unknown identity; no hostile classification.
    return [
        *[
            create(f"unit-{team}", domains[index], index)
            for index, team in enumerate(["alpha", "bravo", "charlie"])
        ],
        create("contact-1", domains[0], 2, True),
        create("contact-2", domains[2], 3, True),
    ]


def initial_training_activities(area):
    preset = preset_for(area)
    first_domain = initial_training_units(area)[0]["domain"]
    route = preset["routes"][first_domain]
    return [
        {
            "id": "checkpoint-7a",
            "label": {
                "ground": "Route checkpoint",
                "sea": "Water checkpoint",
                "air": "Flight waypoint",
            }[first_domain],
            **route[1],
            "type": "checkpoint",
            "status": "active",
        },
        {
            "id": "objective-7",
            "label": "Observation area",
            **route[2],
            "type": "objective",
            "status": "active",
        },
    ]


def heading_to(start, end):
    """Compass degrees for SVG/Cesium: north=0, east=90, south=180, west=270."""
    return math.degrees(math.atan2(end["x"] - start["x"], start["y"] - end["y"])) % 360
