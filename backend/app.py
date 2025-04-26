# backend/app.py
import os
import csv # Ensure csv is imported if used elsewhere, like in mta_api potentially
from functools import wraps # Import wraps for decorator
from flask import Flask, jsonify, request, g # Import request and g for decorator
import pandas as pd
from flask_cors import CORS
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
import firebase_admin
from firebase_admin import credentials, auth # Import auth for decorator

# Import the mta_api module
import mta_api

load_dotenv()

app = Flask(__name__)

# --- Explicit CORS Configuration ---
CORS(app, resources={
    # Apply CORS to all routes starting with /api/
    r"/api/*": {
        # Allow requests only from your frontend origin
        "origins": ["http://localhost:5173", "http://localhost:3000"],# Or your specific frontend port
        # Allow common methods plus OPTIONS for preflight
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        # Allow necessary headers for requests
        "allow_headers": ["Content-Type", "Authorization"],
        # Allow credentials if you use cookies/sessions later (optional for now)
        # "supports_credentials": True
    }
})
# ---------------------------------

# --- Database Configuration ---
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
# -----------------------------

# --- Database Models ---
class User(db.Model):
    """Represents a user in the local database, linked to Firebase Auth."""
    id = db.Column(db.Integer, primary_key=True) # Local primary key
    firebase_uid = db.Column(db.String(128), unique=True, nullable=False) # Firebase unique ID
    favorite_routes = db.relationship('FavoriteRoute', backref='user', lazy=True, cascade="all, delete-orphan")
    favorite_stations = db.relationship('FavoriteStation', backref='user', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<User {self.firebase_uid}>'

class FavoriteRoute(db.Model):
    """Represents a user's favorited route."""
    id = db.Column(db.Integer, primary_key=True)
    # Foreign key linking to the User table's primary key (user.id)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    route_id = db.Column(db.String(10), nullable=False) # e.g., '1', 'A', 'L', 'SIR'

    def __repr__(self):
        return f'<FavoriteRoute {self.route_id} for User {self.user_id}>'

class FavoriteStation(db.Model):
    """Represents a user's favorited station."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    station_id = db.Column(db.String(10), nullable=False) # MTA station ID (often a number)

    def __repr__(self):
        return f'<FavoriteStation {self.station_id} for User {self.user_id}>'
# ----------------------

# --- Firebase Admin SDK Initialization ---
cred_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')
firebase_app_initialized = False
if cred_path:
    # Construct path relative to the app.py file's directory
    full_cred_path = os.path.join(os.path.dirname(__file__), cred_path)
    if os.path.exists(full_cred_path):
        try:
            cred = credentials.Certificate(full_cred_path)
            if not firebase_admin._apps:
                 firebase_admin.initialize_app(cred)
                 print("Firebase Admin SDK initialized successfully.")
                 firebase_app_initialized = True
            else:
                 print("Firebase Admin SDK already initialized.")
                 firebase_app_initialized = True
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK: {e}")
    else:
        print(f"Firebase Admin SDK credentials file not found at calculated path: {full_cred_path}")
else:
    print("FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set. SDK not initialized.")
# ---------------------------------------

# --- Authentication Decorator (Corrected Logic) ---
def token_required(f):
    """Decorator to verify Firebase ID token in Authorization header."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        # Skip token verification logic for OPTIONS preflight requests
        if request.method != 'OPTIONS':
            # Ensure Firebase Admin SDK was initialized before proceeding
            if not firebase_app_initialized:
                 print("Error: Firebase Admin SDK not initialized, cannot verify token.")
                 return jsonify({"message": "Firebase Admin SDK not initialized on server!"}), 500

            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split('Bearer ')[1]

            if not token:
                print("Token verification failed: Token missing")
                return jsonify({"message": "Authentication Token is missing!"}), 401 # Unauthorized

            try:
                # Verify the token using Firebase Admin SDK
                decoded_token = auth.verify_id_token(token)
                # Store user's Firebase UID in Flask's global context 'g' for this request
                g.current_user_uid = decoded_token['uid']
                print(f"Token verified for UID: {g.current_user_uid}") # Server log

                # Optional: Check/create user in local DB
                # Use app_context for database operations within decorator if needed
                with app.app_context():
                    user = User.query.filter_by(firebase_uid=g.current_user_uid).first()
                    if not user:
                         print(f"First time seeing user {g.current_user_uid}, adding to local DB.")
                         new_user = User(firebase_uid=g.current_user_uid)
                         db.session.add(new_user)
                         db.session.commit()
                         g.user_db_id = new_user.id # Store new user's local DB ID
                    else:
                         g.user_db_id = user.id # Store existing user's local DB ID

            except auth.ExpiredIdTokenError:
                 print("Token verification failed: Expired")
                 return jsonify({"message": "Token has expired!"}), 401 # Unauthorized
            except auth.InvalidIdTokenError as e:
                 print(f"Token verification failed: Invalid ({e})")
                 return jsonify({"message": "Token is invalid!"}), 401 # Unauthorized
            except Exception as e:
                # Catch any other unexpected errors during verification
                print(f"Token verification failed: Unexpected error - {e}")
                return jsonify({"message": "Token verification failed!"}), 500 # Internal Server Error

        # Call the actual route function (for both OPTIONS and verified requests)
        # Flask-CORS should handle adding headers to the OPTIONS response path
        return f(*args, **kwargs)
    return decorated_function
# -----------------------------

# --- Basic Routes (Public) ---
@app.route('/')
def home():
    return "Hello from NYC Transit Hub Backend!"

@app.route('/api/test')
def api_test():
    return jsonify({"message": "API is working!"})
# ---------------------------

@app.route('/api/stations', methods=['GET'])
def get_stations():
    base_dir = os.path.dirname(__file__)

    # Load GTFS data
    stops_df = pd.read_csv(os.path.join(base_dir, 'stops.txt'))
    stop_times_df = pd.read_csv(os.path.join(base_dir, 'stop_times.txt'))
    trips_df = pd.read_csv(os.path.join(base_dir, 'trips.txt'))

    # Merge stop_times with trips to get route_id for each stop
    stop_trips = stop_times_df[['stop_id', 'trip_id']].merge(
        trips_df[['trip_id', 'route_id']], on='trip_id', how='left'
    )

    # Group by stop_id and collect unique route_ids
    stop_routes = stop_trips.groupby('stop_id')['route_id'].unique().reset_index()
    stop_routes['route_id'] = stop_routes['route_id'].apply(list)

    # Merge with stops_df to attach stop names and coordinates
    merged = stops_df.merge(stop_routes, on='stop_id', how='left')

    # Group by stop_name to collect all the route_ids for each stop_name
    grouped_by_name = merged.groupby('stop_name').agg(
        stop_id=('stop_id', 'first'),
        stop_lat=('stop_lat', 'first'),
        stop_lon=('stop_lon', 'first'),
        routes=('route_id', 'first')
    ).reset_index()

    # Build structured list/dict to send to frontend
    stops_data = []
    for _, row in grouped_by_name.iterrows():
        stops_data.append({
            'stop_id': row['stop_id'],
            'stop_name': row['stop_name'],
            'stop_lat': row['stop_lat'],
            'stop_lon': row['stop_lon'],
            'routes': row['routes'] if isinstance(row['routes'], list) else []
        })

    return jsonify(stops_data)

# --- MTA Data API Endpoint (Public) ---
@app.route('/api/subway/status', methods=['GET'])
@app.route('/api/subway/status/<feed_id>', methods=['GET'])
def get_subway_status(feed_id='1'):
    """API endpoint to get subway status updates for a given feed."""
    status_data = mta_api.get_subway_status_updates(feed_id)
    if status_data is None or "error" in status_data:
         error_message = status_data.get("error", "Failed to retrieve subway status.") if status_data else "Failed to retrieve subway status."
         return jsonify({"error": error_message}), 500
    return jsonify(status_data)
# -----------------------------------

# --- Accessibility API Endpoint (Public) ---
@app.route('/api/accessibility/outages', methods=['GET'])
def get_accessibility_outages():
    """
    API endpoint to get current elevator/escalator outages.
    Publicly accessible.
    """
    outage_data = mta_api.get_elevator_escalator_outages()
    # Handle potential errors returned from the mta_api module
    if isinstance(outage_data, dict) and "error" in outage_data:
        return jsonify(outage_data), 500 # Internal Server Error
    # Return the successfully fetched data
    return jsonify(outage_data), 200
# ----------------------------------------------------

# --- Protected Route Example (Decorator Re-enabled) ---
@app.route('/api/user/profile', methods=['GET', 'OPTIONS']) # Keep OPTIONS here
@token_required # <-- DECORATOR IS NOW ACTIVE
def get_user_profile():
    """Protected route example. Returns the verified user's UID."""
    # If the code reaches here via GET, the token was valid and g.current_user_uid is set
    uid = g.current_user_uid # Use the UID set by the decorator
    user_db_id = g.user_db_id # Get local DB ID set by decorator

    print(f"Successfully accessed protected profile route for UID: {uid}") # Log success

    return jsonify({
        "message": "Successfully accessed protected profile route.",
        "user_uid": uid,
        "user_db_id": user_db_id # Return local DB ID as well
    })
# -----------------------------

# --- API Endpoints for Favorite Routes (Protected) ---

@app.route('/api/user/favorites/routes', methods=['GET', 'OPTIONS'])
@token_required # Protect this route
def get_favorite_routes():
    """Fetches the favorite route IDs for the authenticated user."""
    # OPTIONS is handled by the decorator now
    user_db_id = g.user_db_id # Get local DB ID from decorator context
    try:
        # Query the database for FavoriteRoute records matching the user's ID
        favorite_routes = FavoriteRoute.query.filter_by(user_id=user_db_id).all()
        # Extract just the route IDs into a list
        route_ids = [fav.route_id for fav in favorite_routes]
        print(f"Fetched favorite routes for user {user_db_id}: {route_ids}")
        return jsonify({"favorite_routes": route_ids}), 200
    except Exception as e:
        # Log error and return a generic server error message
        print(f"Error fetching favorite routes for user {user_db_id}: {e}")
        return jsonify({"message": "Error fetching favorites"}), 500

@app.route('/api/user/favorites/routes', methods=['POST', 'OPTIONS'])
@token_required # Protect this route
def add_favorite_route():
    """Adds a route to the authenticated user's favorites."""
    # OPTIONS is handled by the decorator
    user_db_id = g.user_db_id
    data = request.get_json() # Get JSON data from request body

    # Basic input validation
    if not data or 'route_id' not in data:
        return jsonify({"message": "Missing 'route_id' in request body"}), 400 # Bad Request
    route_id_to_add = data['route_id']
    if not isinstance(route_id_to_add, str) or len(route_id_to_add) > 10: # Example validation
         return jsonify({"message": "Invalid 'route_id' format"}), 400

    try:
        # Check if the route is already favorited by this user to prevent duplicates
        existing_fav = FavoriteRoute.query.filter_by(user_id=user_db_id, route_id=route_id_to_add).first()
        if existing_fav:
            # Return 409 Conflict if already exists
            return jsonify({"message": f"Route '{route_id_to_add}' is already a favorite"}), 409

        # Create a new FavoriteRoute record
        new_fav = FavoriteRoute(user_id=user_db_id, route_id=route_id_to_add)
        # Add to the database session and commit
        db.session.add(new_fav)
        db.session.commit()

        print(f"Added favorite route '{route_id_to_add}' for user {user_db_id}")
        # Return success message and the created object
        return jsonify({
            "message": f"Route '{route_id_to_add}' added to favorites",
            "favorite": {"id": new_fav.id, "route_id": new_fav.route_id}
        }), 201 # 201 Created status code
    except Exception as e:
        db.session.rollback() # Rollback DB changes if an error occurs
        print(f"Error adding favorite route '{route_id_to_add}' for user {user_db_id}: {e}")
        return jsonify({"message": "Error adding favorite"}), 500

@app.route('/api/user/favorites/routes/<string:route_id>', methods=['DELETE', 'OPTIONS'])
@token_required # Protect this route
def remove_favorite_route(route_id):
    """Removes a specific route from the authenticated user's favorites."""
    # OPTIONS is handled by the decorator
    user_db_id = g.user_db_id
    route_id_to_delete = route_id # Get route ID from the URL path parameter

    try:
        # Find the specific favorite record for this user and route
        fav_to_delete = FavoriteRoute.query.filter_by(
            user_id=user_db_id,
            route_id=route_id_to_delete
        ).first()

        # If the favorite doesn't exist, return 404 Not Found
        if not fav_to_delete:
            return jsonify({"message": f"Favorite route '{route_id_to_delete}' not found"}), 404

        # Delete the record from the database session and commit
        db.session.delete(fav_to_delete)
        db.session.commit()

        print(f"Removed favorite route '{route_id_to_delete}' for user {user_db_id}")
        # Return success message
        return jsonify({"message": f"Route '{route_id_to_delete}' removed from favorites"}), 200 # 200 OK
    except Exception as e:
        db.session.rollback() # Rollback DB changes on error
        print(f"Error removing favorite route '{route_id_to_delete}' for user {user_db_id}: {e}")
        return jsonify({"message": "Error removing favorite"}), 500
# ---------------------------------------

# --- API Endpoints for Favorite Stations (Protected) ---

@app.route('/api/user/favorites/stations', methods=['GET', 'OPTIONS'])
@token_required # Protect this route
def get_favorite_stations():
    """Fetches the favorite station IDs for the authenticated user."""
    # OPTIONS is handled by the decorator
    user_db_id = g.user_db_id
    try:
        # Query the database for FavoriteStation records matching the user's ID
        favorite_stations = FavoriteStation.query.filter_by(user_id=user_db_id).all()
        # Extract just the station IDs into a list
        station_ids = [fav.station_id for fav in favorite_stations]
        print(f"Fetched favorite stations for user {user_db_id}: {station_ids}")
        return jsonify({"favorite_stations": station_ids}), 200
    except Exception as e:
        print(f"Error fetching favorite stations for user {user_db_id}: {e}")
        return jsonify({"message": "Error fetching favorite stations"}), 500

@app.route('/api/user/favorites/stations', methods=['POST', 'OPTIONS'])
@token_required # Protect this route
def add_favorite_station():
    """Adds a station to the authenticated user's favorites."""
    # OPTIONS is handled by the decorator
    user_db_id = g.user_db_id
    data = request.get_json()

    # Basic input validation
    if not data or 'station_id' not in data:
        return jsonify({"message": "Missing 'station_id' in request body"}), 400
    station_id_to_add = data['station_id']
    if not isinstance(station_id_to_add, str) or len(station_id_to_add) > 10:
         return jsonify({"message": "Invalid 'station_id' format"}), 400

    try:
        # Check if the station is already favorited by this user
        existing_fav = FavoriteStation.query.filter_by(user_id=user_db_id, station_id=station_id_to_add).first()
        if existing_fav:
            return jsonify({"message": f"Station '{station_id_to_add}' is already a favorite"}), 409 # Conflict

        # Create and save the new favorite station
        new_fav = FavoriteStation(user_id=user_db_id, station_id=station_id_to_add)
        db.session.add(new_fav)
        db.session.commit()

        print(f"Added favorite station '{station_id_to_add}' for user {user_db_id}")
        # Return success message and the created object
        return jsonify({
            "message": f"Station '{station_id_to_add}' added to favorites",
            "favorite": {"id": new_fav.id, "station_id": new_fav.station_id}
        }), 201 # Created
    except Exception as e:
        db.session.rollback()
        print(f"Error adding favorite station '{station_id_to_add}' for user {user_db_id}: {e}")
        return jsonify({"message": "Error adding favorite station"}), 500

@app.route('/api/user/favorites/stations/<string:station_id>', methods=['DELETE', 'OPTIONS'])
@token_required # Protect this route
def remove_favorite_station(station_id):
    """Removes a specific station from the authenticated user's favorites."""
    # OPTIONS is handled by the decorator
    user_db_id = g.user_db_id
    station_id_to_delete = station_id # Get station ID from URL path

    try:
        # Find the specific favorite record for this user and station
        fav_to_delete = FavoriteStation.query.filter_by(
            user_id=user_db_id,
            station_id=station_id_to_delete
        ).first()

        # If not found, return 404
        if not fav_to_delete:
            return jsonify({"message": f"Favorite station '{station_id_to_delete}' not found"}), 404

        # Delete the record and commit
        db.session.delete(fav_to_delete)
        db.session.commit()

        print(f"Removed favorite station '{station_id_to_delete}' for user {user_db_id}")
        # Return success message
        return jsonify({"message": f"Station '{station_id_to_delete}' removed from favorites"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error removing favorite station '{station_id_to_delete}' for user {user_db_id}: {e}")
        return jsonify({"message": "Error removing favorite station"}), 500
# -----------------------------------------

if __name__ == '__main__':
    # Create database tables if they don't exist
    with app.app_context():
         db.create_all()
         print("Database tables checked/created.")

    # Run the Flask development server
    app.run(debug=True)