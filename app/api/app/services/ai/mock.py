"""
Mock AI responses for testing — activated when MOCK_AI=true in .env.
All functions mirror the signatures of their real counterparts exactly.
"""

import json
import asyncio
from datetime import timedelta
from typing import AsyncGenerator


# ── Suggest destinations ───────────────────────────────────────────────────────

def mock_suggest_destinations(
    from_location: str,
    radius_miles: int | None,
    terrain: list[str],
    activities: list[str],
) -> list[dict]:
    base = from_location or "your location"
    has_skiing = "skiing" in activities
    has_mountains = "mountains" in terrain
    has_beach = "beach" in terrain
    has_city = "city" in terrain

    if has_skiing or has_mountains:
        return [
            {
                "destination": "Stowe, Vermont, USA",
                "distance": f"~280 miles from {base}",
                "tagline": "New England's premier ski resort with a charming village.",
                "highlights": ["155+ trails at Stowe Mountain Resort", "Cozy après-ski on Main Street", "Scenic Smugglers' Notch nearby"],
                "emoji": "🎿",
            },
            {
                "destination": "Lake Placid, New York, USA",
                "distance": f"~210 miles from {base}",
                "tagline": "Olympic mountain town in the heart of the Adirondacks.",
                "highlights": ["Whiteface Mountain — steepest vertical in the East", "Historic 1932 & 1980 Olympic venues", "Mirror Lake for skating & ice fishing"],
                "emoji": "🏔",
            },
            {
                "destination": "Killington, Vermont, USA",
                "distance": f"~295 miles from {base}",
                "tagline": "The Beast of the East — largest ski resort in the Northeast.",
                "highlights": ["6 peaks, 155 trails, season extends into May", "Lively Killington Road nightlife", "K1 Express Gondola to the summit"],
                "emoji": "⛷",
            },
            {
                "destination": "Pocono Mountains, Pennsylvania, USA",
                "distance": f"~90 miles from {base}",
                "tagline": "Closest ski getaway to the tri-state area.",
                "highlights": ["4 ski resorts in one compact region", "Budget-friendly weekend packages", "Great for families and beginners"],
                "emoji": "🌨",
            },
            {
                "destination": "Hunter Mountain, New York, USA",
                "distance": f"~120 miles from {base}",
                "tagline": "Catskills classic with reliable snowmaking.",
                "highlights": ["67 trails across 3 peaks", "Snow guarantee with 100% snowmaking coverage", "Charming Hunter village at the base"],
                "emoji": "❄️",
            },
        ]

    if has_beach:
        return [
            {
                "destination": "Cape May, New Jersey, USA",
                "distance": f"~90 miles from {base}",
                "tagline": "Victorian seaside gem with pristine beaches.",
                "highlights": ["National Historic Landmark district", "Award-winning restaurants & wine trail", "Whale watching off the Cape"],
                "emoji": "🏖",
            },
            {
                "destination": "Outer Banks, North Carolina, USA",
                "distance": f"~400 miles from {base}",
                "tagline": "Wild barrier islands with empty beaches and lighthouses.",
                "highlights": ["Cape Hatteras National Seashore", "Wright Brothers National Memorial", "World-class kiteboarding at Hatteras"],
                "emoji": "🌊",
            },
            {
                "destination": "Rehoboth Beach, Delaware, USA",
                "distance": f"~100 miles from {base}",
                "tagline": "Lively boardwalk beach with a thriving food scene.",
                "highlights": ["Dog-friendly beaches in off-season", "Dogfish Head Brewery just 5 miles away", "Tax-free shopping in nearby Rehoboth"],
                "emoji": "🏄",
            },
        ]

    if has_city:
        return [
            {
                "destination": "Philadelphia, Pennsylvania, USA",
                "distance": f"~90 miles from {base}",
                "tagline": "History, food, and art in a supremely walkable city.",
                "highlights": ["Reading Terminal Market — the best indoor food market in the US", "Liberty Bell and Independence Hall", "World-class Philadelphia Museum of Art"],
                "emoji": "🏛",
            },
            {
                "destination": "Washington, D.C., USA",
                "distance": f"~225 miles from {base}",
                "tagline": "Free world-class museums and iconic monuments.",
                "highlights": ["All 19 Smithsonian museums are free", "Capitol Hill and White House tours", "Vibrant H Street and 14th Street dining"],
                "emoji": "🏙",
            },
            {
                "destination": "Boston, Massachusetts, USA",
                "distance": f"~275 miles from {base}",
                "tagline": "Compact, walkable city packed with history and seafood.",
                "highlights": ["Freedom Trail — 16 historic sites in 2.5 miles", "Fresh clam chowder at Quincy Market", "Day trip to Harvard & MIT campuses"],
                "emoji": "🎭",
            },
        ]

    # Default
    return [
        {
            "destination": "Asheville, North Carolina, USA",
            "distance": f"~700 miles from {base}",
            "tagline": "Mountain city with craft beer, arts, and Blue Ridge views.",
            "highlights": ["Blue Ridge Parkway scenic drives", "Biltmore Estate — America's largest private home", "Over 30 independent breweries"],
            "emoji": "🌄",
        },
        {
            "destination": "Burlington, Vermont, USA",
            "distance": f"~325 miles from {base}",
            "tagline": "Laid-back lakeside college town with outstanding farm-to-table food.",
            "highlights": ["Lake Champlain waterfront and bike path", "Church Street Marketplace dining & shops", "Gateway to Stowe and Mad River Valley"],
            "emoji": "🍂",
        },
        {
            "destination": "Portland, Maine, USA",
            "distance": f"~320 miles from {base}",
            "tagline": "Charming port city with the best lobster rolls on the East Coast.",
            "highlights": ["Old Port cobblestone streets and craft cocktail bars", "Portland Head Light — Maine's oldest lighthouse", "Day trips to Acadia National Park"],
            "emoji": "🦞",
        },
    ]


# ── Itinerary: day outline ─────────────────────────────────────────────────────

def mock_generate_day_outline(trip, day_list: list[dict]) -> list[dict]:  # type: ignore[type-arg]
    areas = [
        "Old Town / Historic Centre",
        "Riverside & Waterfront",
        "Arts & Museum District",
        "Local Neighbourhoods & Markets",
        "Day Trip & Outskirts",
    ]
    themes = [
        "Icons & First Impressions",
        "History Comes Alive",
        "Culture & Hidden Gems",
        "Local Life & Food",
        "Nature & Panoramas",
    ]
    dest = getattr(trip, "destination", "Mock City")
    return [
        {
            "day": d["day"],
            "area": areas[(d["day"] - 1) % len(areas)],
            "theme": themes[(d["day"] - 1) % len(themes)],
            "city": dest,
        }
        for d in day_list
    ]


# ── Itinerary: single day stream ──────────────────────────────────────────────

async def mock_generate_single_day_stream(
    trip,  # type: ignore[type-arg]
    weather_for_day: str,
    day_num: int,
    day_date: str,
    total_days: int,
    day_outline: list[dict] | None = None,
    day_type: str = "destination",
    arrival_time: str | None = None,
    departure_time: str | None = None,
) -> AsyncGenerator[str, None]:
    """Yields a realistic mock day JSON in small chunks, simulating streaming."""
    area = "Historic Centre"
    theme = "Icons & First Impressions"
    if day_outline:
        for entry in day_outline:
            if entry.get("day") == day_num:
                area = entry.get("area", area)
                theme = entry.get("theme", theme)

    dest = trip.destination

    travel_tip_suffix = ""
    if day_type == "partial_arrival" and arrival_time:
        travel_tip_suffix = f" Afternoon plan from {arrival_time} — make the most of the time you have."
    elif day_type == "partial_departure" and departure_time:
        travel_tip_suffix = f" Morning plan only — you leave at {departure_time}, so keep it local and relaxed."

    day_data = {
        "day": day_num,
        "date": day_date,
        "theme": theme,
        "area": area,
        "activities": [
            {
                "name": f"{dest} Central Landmark",
                "category": "culture",
                "time": "09:00",
                "duration": "2 hours",
                "location": area,
                "lat": 48.8566,
                "lng": 2.3522,
                "why_chosen": f"The defining centrepiece of {dest} that every visitor should experience first.",
                "highlights": [
                    "One of the most photographed spots in the entire region.",
                    "Arrive early to beat the crowds and get the best light.",
                    "Free entry on the first Sunday of each month.",
                ],
                "price_range": "$10–15",
                "booking_tip": "Pre-book online to skip the queue.",
            },
            {
                "name": f"{dest} History Museum",
                "category": "culture",
                "time": "11:30",
                "duration": "1.5 hours",
                "location": area,
                "lat": 48.8600,
                "lng": 2.3488,
                "why_chosen": "Fascinating permanent collection that puts the city's story into vivid context.",
                "highlights": [
                    "The third floor has a rarely-visited archive room open to the public.",
                    "Ask staff for the self-guided 'hidden gems' leaflet at the front desk.",
                    "Rooftop terrace offers a sweeping panorama over the old city.",
                ],
                "price_range": "Free–$8",
            },
            {
                "name": f"{dest} Viewpoint",
                "category": "nature",
                "time": "16:30",
                "duration": "1 hour",
                "location": f"Above {area}",
                "lat": 48.8530,
                "lng": 2.3499,
                "why_chosen": "The golden hour from here is genuinely unmissable — locals call it the magic window.",
                "highlights": [
                    "Best sunset vantage point in the city according to residents.",
                    "Bring a blanket — the benches fill up fast after 16:00.",
                    "Street vendor sells excellent local pastries at the base of the path.",
                ],
                "price_range": "Free",
            },
        ],
        "restaurants": [
            {
                "name": f"Café {dest[:4]}",
                "meal": "breakfast",
                "cuisine": "Local / Café",
                "famous_for": "The city's best espresso and flaky house-made pastries since 1952.",
                "price_range": "$",
                "location": area,
                "insider_tip": "Order the daily special — the chef uses whatever's freshest at the market.",
            },
            {
                "name": "La Terrazza",
                "meal": "lunch",
                "cuisine": "Mediterranean",
                "famous_for": "Generous mezze platters eaten on a sun-drenched rooftop terrace.",
                "price_range": "$$",
                "location": area,
            },
            {
                "name": "Osteria del Vecchio Porto",
                "meal": "dinner",
                "cuisine": "Regional / Seasonal",
                "famous_for": "Slow-cooked regional dishes using grandma's recipes — the braised lamb is legendary.",
                "price_range": "$$",
                "location": f"Side streets off {area}",
                "insider_tip": "No reservations — arrive by 19:00 or expect a 30-minute wait.",
            },
        ],
        "offbeat_spots": [
            {
                "name": "The Hidden Courtyard",
                "why_special": "A tucked-away baroque courtyard most tourists walk straight past — extraordinary silence in the middle of the city.",
                "location": f"Behind the main square, {area}",
                "best_time": "Morning",
            },
            {
                "name": "Local Antique Market",
                "why_special": "Vendors set up at dawn — real bargains on vintage maps, ceramics, and postcards if you get there before 08:00.",
                "location": f"Side street, {area}",
                "best_time": "Early morning",
            },
        ],
        "travel_tip": f"Day {day_num} tip: use the local tram rather than taxis — faster, cheaper, and you see far more of the city.{travel_tip_suffix}",
    }

    # Yield the JSON in chunks to simulate streaming
    payload = json.dumps(day_data)
    chunk_size = 80
    for i in range(0, len(payload), chunk_size):
        yield payload[i : i + chunk_size]
        await asyncio.sleep(0.02)


# ── Itinerary: route stops ────────────────────────────────────────────────────

def mock_generate_route_stops(trip) -> dict:  # type: ignore[type-arg]
    origin = getattr(trip, "origin", None) or "your starting point"
    dest = getattr(trip, "destination", "your destination")
    include_return = getattr(trip, "include_return_stops", False)
    result: dict = {
        "outbound": [
            {
                "name": "Scenic Overlook State Park",
                "category": "nature",
                "location": "Midpoint, En Route",
                "why_stop": f"A stunning halfway point between {origin} and {dest} with panoramic views that make the drive worth it.",
                "duration": "45 minutes",
                "lat": 40.5,
                "lng": -75.5,
            },
            {
                "name": "The Roadside Diner",
                "category": "food",
                "location": "Route Junction",
                "why_stop": "A beloved local institution serving homemade pies and classic comfort food since 1952.",
                "duration": "30 minutes",
                "lat": 41.0,
                "lng": -76.0,
            },
        ]
    }
    if include_return:
        result["return"] = [
            {
                "name": "Antique Row Shops",
                "category": "culture",
                "location": "Highway Town",
                "why_stop": f"A charming strip of antique shops on the way back to {origin} — perfect for a unique souvenir.",
                "duration": "30 minutes",
                "lat": 40.7,
                "lng": -75.8,
            },
            {
                "name": "Riverside Rest Area & Picnic Grounds",
                "category": "nature",
                "location": "River Crossing",
                "why_stop": "Lovely riverside park ideal for stretching your legs and grabbing a coffee from the nearby food truck.",
                "duration": "20 minutes",
                "lat": 40.3,
                "lng": -75.2,
            },
        ]
    return result


# ── Itinerary: trip meta ──────────────────────────────────────────────────────

async def mock_generate_meta(trip, day_outline: list[dict] | None = None) -> dict:  # type: ignore[type-arg]
    await asyncio.sleep(0.1)
    num_days = (trip.end_date - trip.start_date).days + 1
    return {
        "summary": (
            f"Your {num_days}-day trip to {trip.destination} is packed with iconic sights, "
            "hidden local gems, and unforgettable food. Each day explores a distinct neighbourhood "
            "so you leave feeling like a well-travelled local, not a tourist."
        ),
        "destination": trip.destination,
        "country": "Mock Country",
        "practical_info": {
            "currency": "Local Currency (LC)",
            "language": "Local Language (English widely spoken)",
            "timezone": "UTC+1",
            "transport_tips": [
                "Buy a 3-day transit pass on arrival — covers all buses and metro.",
                "Taxis from the airport cost roughly LC 30–40; ride-share is 20% cheaper.",
            ],
            "packing_suggestions": [
                "Comfortable walking shoes — you'll easily cover 10–15 km/day.",
                "Light layers — mornings can be cool even in summer.",
            ],
        },
        "accommodations": [
            {
                "zone": "City Centre",
                "nights": f"Nights 1–{num_days}",
                "location": f"Central {trip.destination}",
                "options": [
                    {
                        "name": "Grand Hotel Central",
                        "type": "hotel",
                        "description": "Four-star property two minutes from the main square. Rooftop pool and excellent breakfast included.",
                        "price_range": "$180–240/night",
                        "location": "Historic Centre",
                        "booking_tip": "Sells out 6+ weeks ahead in peak season.",
                        "search_query": f"Grand Hotel {trip.destination} city centre",
                    },
                    {
                        "name": "Boutique Rooms Vecchio",
                        "type": "boutique",
                        "description": "Eight-room family-run guesthouse in a restored 18th-century building. Personal service, great value.",
                        "price_range": "$95–130/night",
                        "location": "Old Quarter",
                        "search_query": f"boutique guesthouse {trip.destination} old town",
                    },
                    {
                        "name": "The Loft Hostel",
                        "type": "hostel",
                        "description": "Social, design-forward hostel popular with solo travellers. Great common kitchen and weekly events.",
                        "price_range": "$30–55/night",
                        "location": "Arts District",
                        "search_query": f"hostel {trip.destination} arts district",
                    },
                ],
            }
        ],
    }


# ── Chat concierge ────────────────────────────────────────────────────────────

async def mock_stream_chat_response(
    trip,  # type: ignore[type-arg]
    itinerary,  # type: ignore[type-arg]
    phase: str,
    history: list[dict],
    user_message: str,
) -> AsyncGenerator[str, None]:
    """Yields SSE-formatted mock chat response chunks."""
    response = (
        f"Great question about your trip to **{trip.destination}**! "
        "This is a mock response — the real MyTravel AI Concierge will give you "
        "specific, personalised advice once you switch back to live mode. "
        "For now, here's a placeholder: make sure to check local transport options "
        "in advance, book popular restaurants early, and always carry a small amount "
        "of local cash for markets and street food. Enjoy your trip!"
    )

    words = response.split(" ")
    for i, word in enumerate(words):
        chunk = word + (" " if i < len(words) - 1 else "")
        escaped = chunk.replace("\n", "\\n")
        yield f"data: {escaped}\n\n"
        await asyncio.sleep(0.03)

    yield "data: [DONE]\n\n"


# ── Local services ────────────────────────────────────────────────────────────

async def mock_generate_local_services(trip) -> dict:  # type: ignore[type-arg]
    await asyncio.sleep(0.1)
    dest = trip.destination
    return {
        "categories": [
            {
                "id": "emergency",
                "label": "Emergency",
                "emoji": "🚨",
                "items": [
                    {"name": "Emergency Services", "phone": "911", "note": "Police · Fire · Ambulance", "hours": "24 hrs"},
                    {"name": "City Police Station", "address": "Downtown precinct", "hours": "24 hrs"},
                    {"name": "Fire & Rescue", "address": "Central fire station", "hours": "24 hrs"},
                ],
            },
            {
                "id": "hospital",
                "label": "Hospital & Urgent Care",
                "emoji": "🏥",
                "items": [
                    {"name": f"{dest} General Hospital", "address": "Medical district", "hours": "24 hrs"},
                    {"name": "Urgent Care Clinic", "address": "Near city centre", "hours": "8 am–10 pm"},
                ],
            },
            {
                "id": "pharmacy",
                "label": "Pharmacy",
                "emoji": "💊",
                "items": [
                    {"name": "Central Pharmacy", "address": "High Street", "hours": "8 am–9 pm"},
                    {"name": "24-Hour Pharmacy", "address": "Near main square", "hours": "24 hrs"},
                ],
            },
            {
                "id": "grocery",
                "label": "Grocery & Supermarket",
                "emoji": "🛒",
                "items": [
                    {"name": "City Supermarket", "address": "Market Square"},
                    {"name": "Convenience Store", "address": "Near accommodation", "hours": "7 am–11 pm"},
                ],
            },
            {
                "id": "atm",
                "label": "ATM & Currency Exchange",
                "emoji": "🏧",
                "items": [
                    {"name": "International ATM", "address": "City Centre", "note": "Widely available; foreign card fees may apply"},
                    {"name": "Currency Exchange", "address": "Airport & tourist areas", "hours": "6 am–10 pm"},
                ],
            },
            {
                "id": "embassy",
                "label": "Embassy & Consulate",
                "emoji": "🛟",
                "items": [
                    {"name": "US Embassy", "address": "Embassy District"},
                    {"name": "UK Consulate", "address": "Diplomatic Quarter"},
                ],
            },
        ]
    }


# ── Packing list ──────────────────────────────────────────────────────────────

async def mock_generate_packing_list(
    trip,  # type: ignore[type-arg]
    weather_summary: str,
    itinerary_activities: list[str],
) -> dict:
    await asyncio.sleep(0.1)
    return {
        "weather_note": f"Expect mild to warm temperatures in {trip.destination}. Pack layers for evenings.",
        "categories": [
            {
                "name": "Clothing",
                "icon": "👕",
                "items": [
                    {"label": "T-shirts (3–4)", "essential": True},
                    {"label": "Lightweight trousers or jeans", "essential": True},
                    {"label": "Smart casual outfit for dinners", "essential": True},
                    {"label": "Light jacket or cardigan", "essential": True},
                    {"label": "Underwear & socks (5 pairs)", "essential": True},
                    {"label": "Pyjamas", "essential": False},
                    {"label": "Swimwear", "essential": False, "note": "If your hotel has a pool"},
                ],
            },
            {
                "name": "Footwear",
                "icon": "👟",
                "items": [
                    {"label": "Comfortable walking shoes", "essential": True, "note": "Expect 10–15 km/day"},
                    {"label": "Sandals or flip-flops", "essential": False},
                    {"label": "Smart shoes for evenings", "essential": False},
                ],
            },
            {
                "name": "Toiletries",
                "icon": "🧴",
                "items": [
                    {"label": "Toothbrush & toothpaste", "essential": True},
                    {"label": "Deodorant", "essential": True},
                    {"label": "Shampoo & conditioner (travel size)", "essential": True},
                    {"label": "Sunscreen SPF 50+", "essential": True},
                    {"label": "Lip balm", "essential": False},
                    {"label": "Hand sanitiser", "essential": True},
                ],
            },
            {
                "name": "Electronics & Cables",
                "icon": "🔌",
                "items": [
                    {"label": "Phone charger & cable", "essential": True},
                    {"label": "Universal power adapter", "essential": True},
                    {"label": "Portable battery pack", "essential": True},
                    {"label": "Earphones or AirPods", "essential": False},
                    {"label": "Camera (optional)", "essential": False},
                ],
            },
            {
                "name": "Documents & Money",
                "icon": "📄",
                "items": [
                    {"label": "Passport (valid 6+ months)", "essential": True},
                    {"label": "Travel insurance documents", "essential": True},
                    {"label": "Credit & debit cards", "essential": True},
                    {"label": "Local currency (small amount for markets)", "essential": True},
                    {"label": "Digital copies of all documents", "essential": True, "note": "Store in cloud storage"},
                ],
            },
            {
                "name": "Health & Safety",
                "icon": "💊",
                "items": [
                    {"label": "Any prescription medications", "essential": True},
                    {"label": "Paracetamol / ibuprofen", "essential": True},
                    {"label": "Blister plasters", "essential": True, "note": "Essential for heavy walking days"},
                    {"label": "Antihistamines", "essential": False},
                    {"label": "Rehydration sachets", "essential": False},
                ],
            },
            {
                "name": "Day Pack Essentials",
                "icon": "🎒",
                "items": [
                    {"label": "Small daypack or crossbody bag", "essential": True},
                    {"label": "Reusable water bottle", "essential": True},
                    {"label": "Umbrella or packable rain jacket", "essential": True},
                    {"label": "Snacks for long sightseeing days", "essential": False},
                    {"label": "Notebook & pen", "essential": False},
                ],
            },
            {
                "name": "Destination-Specific",
                "icon": "🗺",
                "items": [
                    {"label": "City transit card or day pass", "essential": True},
                    {"label": "Museum / attraction pre-booked tickets", "essential": True, "note": "Print or save to phone"},
                    {"label": "Offline maps downloaded (Google Maps / Maps.me)", "essential": True},
                    {"label": "Local SIM or international roaming plan", "essential": False},
                ],
            },
        ],
    }
