# ────────────────────────────────────────────────────────────────
#  api/app.py  •  Flask + Supabase backend for HomeAndOwn
# ----------------------------------------------------------------
from __future__ import annotations

import datetime
import hashlib
import json
import os
from functools import wraps
from pathlib import Path
from typing import Any, Dict, List

import jwt
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import Client, create_client

# ───────────── 1. CONFIG / ENV ──────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=False)

SUPABASE_URL: str | None = os.getenv("SUPABASE_URL")
SUPABASE_KEY: str | None = os.getenv("SUPABASE_KEY")
APP_SECRET: str = os.getenv("APP_SECRET", "change-me-now")
FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_KEY must be set in api/.env (see your Supabase project → Settings → API)"
    )

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ───────────── 2. FLASK & CORS ──────────────────────────────────
app = Flask(__name__)
app.config["SECRET_KEY"] = APP_SECRET

# CORS(
#     app,
#     origins=[FRONTEND_ORIGIN],
#     supports_credentials=True,  # allows cookies / auth header
#     allow_headers=[
#         "Content-Type",
#         "Authorization",
#         "X-Requested-With",
#         "Accept",
#         "Origin",
#     ],
# )

FRONTEND_ORIGINS = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173,https://r4family.com"
).split(",")

# later, when you initialize CORS:
CORS(
    app,
    origins=FRONTEND_ORIGINS,
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
)
# ───────────── 3. HELPERS ───────────────────────────────────────
def hash_password(pwd: str) -> str:
    return hashlib.sha256(pwd.encode()).hexdigest()


def token_required(fn):
    """Decorator that injects current user_id or aborts with 401."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization", "")
        if token.startswith("Bearer "):
            token = token[7:]
        if not token:
            return jsonify({"message": "Token missing"}), 401
        try:
            data = jwt.decode(token, APP_SECRET, algorithms=["HS256"])
            user_id = data["user_id"]
        except jwt.PyJWTError:
            return jsonify({"message": "Token invalid"}), 401
        return fn(user_id, *args, **kwargs)

    return wrapper


def sign_token(user_id: int, hours: int = 24) -> str:
    """Return a JWT string."""
    return jwt.encode(
        {
            "user_id": user_id,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=hours),
        },
        APP_SECRET,
    )


# ───────────── 4. AUTH ROUTES ───────────────────────────────────
@app.post("/api/auth/register")
def register():
    data: Dict[str, Any] = request.get_json(force=True) or {}
    required = ["first_name", "last_name", "email", "password", "user_type"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"{', '.join(missing)} required"}), 400

    # Ensure email is unique
    if (
        sb.table("users").select("id").eq("email", data["email"]).maybe_single().execute().data
        is not None
    ):
        return jsonify({"error": "User already exists"}), 400

    # Insert user
    resp = (
        sb.table("users")
        .insert(
            {
                "first_name": data["first_name"],
                "last_name": data["last_name"],
                "email": data["email"],
                "password_hash": hash_password(data["password"]),
                "user_type": data["user_type"],  # buyer | seller | agent
                "phone_number": data.get("phone_number"),
                "verification_status": "pending",
            }
        )
        .execute()
    )
    user_id = resp.data[0]["id"]
    token = sign_token(user_id)
    return (
        jsonify(
            {
                "token": token,
                "user": {"id": user_id, "email": data["email"], "user_type": data["user_type"]},
            }
        ),
        201,
    )


@app.post("/api/auth/login")
def login():
    data: Dict[str, Any] = request.get_json(force=True) or {}
    email, password = data.get("email"), data.get("password")
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    resp = (
        sb.table("users")
        .select("id,first_name,last_name,email,user_type,password_hash,status,verification_status")
        .eq("email", email)
        .maybe_single()
        .execute()
    )
    user = resp.data
    if user is None or user["password_hash"] != hash_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = sign_token(user["id"])
    return jsonify(
        {
            "token": token,
            "user": {
                "id": user["id"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "email": user["email"],
                "user_type": user["user_type"],
                "status": user["status"],
                "verification_status": user["verification_status"],
            },
        }
    )


@app.get("/api/auth/me")
def auth_me():
    token = request.headers.get("Authorization", "")
    if token.startswith("Bearer "):
        token = token[7:]
    try:
        data = jwt.decode(token, APP_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return jsonify({"user": None, "profile": None})
    user_id = data["user_id"]
    user = (
        sb.table("users")
        .select("id,email,first_name,last_name,user_type")
        .eq("id", user_id)
        .single()
        .execute()
        .data
    )
    if not user:
        return jsonify({"user": None, "profile": None})
    return jsonify(
        {
            "user": {"id": user["id"], "email": user["email"], "user_type": user["user_type"]},
            "profile": {"first_name": user["first_name"], "last_name": user["last_name"]},
        }
    )


# ───────────── 5. PROPERTY ROUTES ───────────────────────────────
# ─────────────────────── Properties routes ──────────────────────
@app.get("/api/properties")
def list_properties():
    args = request.args

    # ---------- 1. start with a proper Select builder ------------
    q = (
        sb.table("properties")        # <- keep
          .select("*")                # <- **new** — required for .eq/.order
          .eq("status", "active")     # we can now chain helpers safely
          .order("created_at", desc=True)
    )

    # ---------- 2. dynamic filters -------------------------------
    if listing := args.get("listing_type"):
        q = q.eq("listing_type", listing)

    if city := args.get("city"):
        q = q.ilike("city", f"%{city}%")        # ilike ≈ case-insensitive LIKE

    if ptype := args.get("property_type"):
        q = q.eq("property_type", ptype)

    if min_p := args.get("min_price"):
        q = q.gte("price", float(min_p))

    if max_p := args.get("max_price"):
        q = q.lte("price", float(max_p))

    if bed := args.get("bedrooms"):
        q = q.eq("bedrooms", int(bed))

    if bath := args.get("bathrooms"):
        q = q.eq("bathrooms", int(bath))

    # ---------- 3. execute & return ------------------------------
    resp = q.execute()
    # supabase-py 2.x puts data in .data
    return jsonify(resp.data)


@app.get("/api/properties/<prop_id>")              # <-- prop_id is a string now
def get_property(prop_id: str):
    # ---- main record ----------------------------------------------------
    p_resp = (
        sb.table("properties")
          .select("*")
          .eq("id", prop_id)
          .maybe_single()
          .execute()
    )
    prop = p_resp.data               # returns None if not found
    if not prop:
        return jsonify({"error": "Property not found"}), 404

    # ---- owner (optional) ----------------------------------------------
    owner_id = prop.get("owner_id")
    owner = None
    if owner_id:
        u_resp = (
            sb.table("users")
              .select("first_name,last_name,email,phone_number")
              .eq("id", owner_id)
              .maybe_single()
              .execute()
        )
        u = u_resp.data
        if u:
            owner = {
                "name": f"{u['first_name']} {u['last_name']}",
                "email": u["email"],
                "phone": u["phone_number"],
            }

    # ---- build response -------------------------------------------------
    prop["owner"] = owner
    return jsonify(prop)


@app.post("/api/properties")
@token_required
def create_property(current_user_id: int):
    data: Dict[str, Any] = request.get_json(force=True) or {}
    required = [
        "title",
        "description",
        "property_type",
        "area_sqft",
        "address",
        "city",
        "state",
        "zip_code",
        "listing_type",
    ]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"{', '.join(missing)} required"}), 400

    row = {
        "title": data["title"],
        "description": data["description"],
        "property_type": data["property_type"],
        "area_sqft": data["area_sqft"],
        "address": data["address"],
        "city": data["city"],
        "state": data["state"],
        "zip_code": data["zip_code"],
        "listing_type": data["listing_type"],  # SALE | RENT
        "owner_id": current_user_id,
        # optional numeric fields
        "price": data.get("price"),
        "monthly_rent": data.get("monthly_rent"),
        "security_deposit": data.get("security_deposit"),
        "bedrooms": data.get("bedrooms", 0),
        "bathrooms": data.get("bathrooms", 0),
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        # optional JSON fields
        "images": json.dumps(data.get("images", [])),
        "amenities": json.dumps(data.get("amenities", [])),
        # misc
        "status": "active",
        "available_from": data.get("available_from"),
        "furnishing_status": data.get("furnishing_status"),
        "balcony": data.get("balcony"),
        "possession": data.get("possession"),
    }
    resp = sb.table("properties").insert(row).execute()
    prop_id = resp.data[0]["id"]
    return jsonify({"message": "Created", "property_id": prop_id}), 201


# ───────────── 6. AGENTS  &  HEALTH ─────────────────────────────
@app.get("/api/agents")
def list_agents():
    resp = (
        sb.table("users")
        .select(
            "id,first_name,last_name,email,phone_number,agency,"
            "experience,license_number,verification_status,profile_image_url"
        )
        .eq("user_type", "agent")
        .eq("status", "active")
        .order("created_at", desc=True)
        .execute()
    )
    return jsonify(resp.data), 200


@app.get("/api/health")
def health():
    return jsonify({"status": "healthy"}), 200


# ───────────── 7. MAIN ──────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    # Options: host="127.0.0.1" if you don’t want LAN exposure
    app.run(host="0.0.0.0", port=port, debug=True)
