import hashlib
import json
import math


def cache_key(data: dict) -> str:
    raw = json.dumps(data, sort_keys=True)
    return hashlib.md5(raw.encode()).hexdigest()


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in meters between two lat/lon points."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def decode_polyline(encoded: str) -> list[tuple[float, float]]:
    """Decode Google Maps encoded polyline to list of (lat, lon) tuples."""
    coords = []
    index = 0
    lat = 0
    lon = 0

    while index < len(encoded):
        for char in [1, -1]:
            shift = 0
            result = 0
            while True:
                b = ord(encoded[index]) - 63
                index += 1
                result |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            lat += result if char == 1 else ~result + 1

        shift = 0
        result = 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        lon += result if char == 1 else ~result + 1

        coords.append((lat / 1e5, lon / 1e5))

    return coords


def interpolate_points(
    coords: list[tuple[float, float]], segment_length_m: float
) -> list[tuple[float, float]]:
    """Add intermediate points along a polyline so segments are ~segment_length_m apart."""
    if len(coords) < 2:
        return coords

    result = [coords[0]]
    accumulated = 0.0

    for i in range(1, len(coords)):
        seg_dist = haversine_distance(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1])

        if seg_dist == 0:
            continue

        if accumulated + seg_dist >= segment_length_m:
            overshoot = (accumulated + seg_dist) - segment_length_m
            ratio = 1 - (overshoot / seg_dist)
            interp_lat = coords[i - 1][0] + ratio * (coords[i][0] - coords[i - 1][0])
            interp_lon = coords[i - 1][1] + ratio * (coords[i][1] - coords[i - 1][1])
            result.append((interp_lat, interp_lon))
            accumulated = overshoot
        else:
            accumulated += seg_dist

    result.append(coords[-1])
    return result
