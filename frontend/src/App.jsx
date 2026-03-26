import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function AuthScreen({ onLogin }) {
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setMessage("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_BASE_URL}/api/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid username or password.");
      }

      const data = await response.json();

      const userData = {
        username: loginForm.username,
        access: data.access,
        refresh: data.refresh,
      };

      localStorage.setItem("geojson_auth", JSON.stringify(userData));
      onLogin(userData);
    } catch (error) {
      setMessage(error.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <section className="auth-brand-panel">
          <p className="eyebrow">GeoJSON Platform</p>
          <h1 className="auth-title">
            Secure geospatial access for municipality exploration.
          </h1>
          <p className="auth-description">
            Sign in to access a protected municipality workspace with JWT-backed
            authentication, bounding-box filtering, and map-based exploration.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <span className="auth-feature-dot" />
              <span>JWT-secured API access</span>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-dot" />
              <span>Bounding-box filtering from current map view</span>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-dot" />
              <span>Alphabetical feature browsing</span>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-header">
            <p className="eyebrow">Sign in</p>
            <h2 className="auth-card-title">Welcome back</h2>
            <p className="auth-card-text">
              Use your Django credentials to access the municipality explorer.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="field-group">
              <label className="field-label" htmlFor="login-username">
                Username
              </label>
              <input
                id="login-username"
                className="text-input"
                type="text"
                placeholder="Enter username"
                value={loginForm.username}
                onChange={(event) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    username: event.target.value,
                  }))
                }
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                className="text-input"
                type="password"
                placeholder="Enter password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
              />
            </div>

            {message && <p className="auth-message">{message}</p>}

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function BoundsWatcher({ onBoundsChange }) {
  const map = useMapEvents({
    moveend() {
      onBoundsChange(map.getBounds());
    },
    zoomend() {
      onBoundsChange(map.getBounds());
    },
  });

  useEffect(() => {
    onBoundsChange(map.getBounds());
  }, [map, onBoundsChange]);

  return null;
}

function FitInitialFeatures({ geojson, hasFitted, onFitted }) {
  const map = useMap();

  useEffect(() => {
    if (hasFitted) return;
    if (!geojson || !geojson.features || geojson.features.length === 0) return;

    const layer = L.geoJSON(geojson);
    const bounds = layer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.05));
      onFitted();
    }
  }, [geojson, hasFitted, map, onFitted]);

  return null;
}

function Workspace({ user, onLogout }) {
  const [geojson, setGeojson] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadedCount, setLoadedCount] = useState(0);
  const [hasInitialFit, setHasInitialFit] = useState(false);
  const [featurePage, setFeaturePage] = useState(1);

  const debounceRef = useRef(null);
  const lastBoundsRef = useRef(null);
  const selectedLayerRef = useRef(null);

  const fetchFeaturesByBounds = useCallback(
    async (bounds) => {
      if (!bounds) return;

      const southWest = bounds.getSouthWest();
      const northEast = bounds.getNorthEast();
      const bbox = [
        southWest.lng,
        southWest.lat,
        northEast.lng,
        northEast.lat,
      ].join(",");

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/api/features/?bbox=${bbox}`, {
          headers: {
            Authorization: `Bearer ${user.access}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("geojson_auth");
          onLogout();
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load features for current map extent.");
        }

        const data = await response.json();

        const rawFeatureList = Array.isArray(data.results)
          ? data.results
          : Array.isArray(data)
            ? data
            : [];

        const polygonFeatures = rawFeatureList.filter((feature) => {
          const geometryType = feature?.geometry?.type;
          return geometryType === "Polygon" || geometryType === "MultiPolygon";
        });

        setGeojson({
          type: "FeatureCollection",
          features: polygonFeatures,
        });
        setLoadedCount(polygonFeatures.length);
        setFeaturePage(1);

        if (
          selectedFeature &&
          !polygonFeatures.some((feature) => feature.id === selectedFeature.id)
        ) {
          setSelectedFeature(null);
        }
      } catch (err) {
        setError(err.message || "Unable to load features.");
        setGeojson({
          type: "FeatureCollection",
          features: [],
        });
        setLoadedCount(0);
        setFeaturePage(1);
      } finally {
        setLoading(false);
      }
    },
    [onLogout, selectedFeature, user.access]
  );

  const handleBoundsChange = useCallback(
    (bounds) => {
      lastBoundsRef.current = bounds;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        fetchFeaturesByBounds(bounds);
      }, 400);
    },
    [fetchFeaturesByBounds]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const isSelectedFeature = useCallback(
    (feature) => selectedFeature?.id === feature?.id,
    [selectedFeature]
  );

  const geoJsonStyle = useCallback(
    (feature) => ({
      color: isSelectedFeature(feature) ? "#dc2626" : "#0f172a",
      weight: isSelectedFeature(feature) ? 3 : 1,
      fillColor: isSelectedFeature(feature) ? "#fca5a5" : "#94a3b8",
      fillOpacity: isSelectedFeature(feature) ? 0.55 : 0.35,
    }),
    [isSelectedFeature]
  );

  const onEachFeature = useCallback(
    (feature, layer) => {
      layer.on({
        click: () => {
          setSelectedFeature(feature);
          selectedLayerRef.current = layer;

          if (layer.getBounds) {
            const bounds = layer.getBounds();
            if (bounds && bounds.isValid()) {
              layer._map.fitBounds(bounds.pad(0.1));
            }
          }
        },
      });
    },
    []
  );

  const sortedFeatures = useMemo(() => {
    const features = geojson?.features ?? [];
    return [...features].sort((a, b) => {
      const nameA =
        a?.properties?.name?.toLowerCase?.() ||
        a?.properties?.naam?.toLowerCase?.() ||
        "";
      const nameB =
        b?.properties?.name?.toLowerCase?.() ||
        b?.properties?.naam?.toLowerCase?.() ||
        "";
      return nameA.localeCompare(nameB);
    });
  }, [geojson]);

  const FEATURES_PER_PAGE = 5;
  const totalPages = Math.max(
    1,
    Math.ceil(sortedFeatures.length / FEATURES_PER_PAGE)
  );
  const currentPage = Math.min(featurePage, totalPages);

  const paginatedFeatures = useMemo(() => {
    const start = (currentPage - 1) * FEATURES_PER_PAGE;
    const end = start + FEATURES_PER_PAGE;
    return sortedFeatures.slice(start, end);
  }, [sortedFeatures, currentPage]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">GeoJSON Platform</p>
          <h1 className="app-title">Municipality Explorer</h1>
        </div>

        <div className="topbar-actions">
          <div className="user-chip">
            <span className="user-chip-label">Signed in as</span>
            <strong>{user.username}</strong>
          </div>
          <button
            className="ghost-button"
            onClick={() => {
              localStorage.removeItem("geojson_auth");
              onLogout();
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="workspace map-led-workspace">
        <aside className="sidebar left-sidebar">
          <section className="panel">
            <p className="panel-label">Search</p>
            <h2 className="panel-title">Map-driven exploration</h2>
            <p className="panel-text">
              Features load automatically from the current visible map extent.
            </p>

            <div className="button-row">
              <button
                className="primary-button full-width"
                onClick={() => {
                  if (lastBoundsRef.current) {
                    fetchFeaturesByBounds(lastBoundsRef.current);
                  }
                }}
              >
                Refresh data
              </button>
              <button
                className="ghost-button full-width"
                onClick={() => setSelectedFeature(null)}
              >
                Clear selection
              </button>
            </div>
          </section>

          <section className="panel stats-panel">
            <p className="panel-label">Overview</p>
            <h2 className="panel-title">Dataset status</h2>

            <div className="stat-grid">
              <div className="stat-card">
                <span className="stat-label">Loaded in view</span>
                <strong className="stat-value">{loadedCount}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Source</span>
                <strong className="stat-value">NL</strong>
              </div>
            </div>

            {loading && <p className="panel-note">Loading features…</p>}
            {error && <p className="panel-note error-text">{error}</p>}
          </section>
        </aside>

        <section className="map-stage">
          <div className="real-map-shell">
            <MapContainer
              center={[52.2, 5.3]}
              zoom={8}
              className="leaflet-map"
              scrollWheelZoom
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <BoundsWatcher onBoundsChange={handleBoundsChange} />

              {geojson && (
                <>
                  <GeoJSON
                    key={selectedFeature?.id || "no-selection"}
                    data={geojson}
                    style={geoJsonStyle}
                    onEachFeature={onEachFeature}
                  />
                  <FitInitialFeatures
                    geojson={geojson}
                    hasFitted={hasInitialFit}
                    onFitted={() => setHasInitialFit(true)}
                  />
                </>
              )}
            </MapContainer>

            {loading && (
              <div className="map-overlay">
                <div className="map-overlay-card">
                  <p className="panel-label">Loading</p>
                  <h2 className="map-title">Fetching municipality data</h2>
                  <p className="panel-text centered">
                    The map is requesting polygon features from the current viewport.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="sidebar right-sidebar">
          <section className="panel">
            <p className="panel-label">Selection</p>
            <h2 className="panel-title">Feature details</h2>
            <p className="panel-text">
              Click a municipality on the map or in the list to inspect it.
            </p>

            <div className="detail-list">
              <div className="detail-item">
                <span className="detail-key">Status</span>
                <span className="detail-value">
                  {selectedFeature ? "Selected" : "No feature selected"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-key">Geometry</span>
                <span className="detail-value">
                  {selectedFeature?.geometry?.type || "—"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-key">Municipality</span>
                <span className="detail-value">
                  {selectedFeature?.properties?.name ||
                    selectedFeature?.properties?.naam ||
                    "—"}
                </span>
              </div>
            </div>
          </section>

          <section className="panel">
            <p className="panel-label">Feature list</p>
            <h2 className="panel-title">Visible municipalities</h2>
            <p className="panel-text">
              Alphabetical list for the current map extent.
            </p>

            <div className="feature-list">
              {paginatedFeatures.length > 0 ? (
                paginatedFeatures.map((feature) => (
                  <button
                    key={feature.id}
                    className={`feature-list-item ${selectedFeature?.id === feature.id ? "active" : ""
                      }`}
                    onClick={() => setSelectedFeature(feature)}
                    type="button"
                  >
                    {feature?.properties?.name ||
                      feature?.properties?.naam ||
                      "Unnamed feature"}
                  </button>
                ))
              ) : (
                <p className="panel-note">No features in the current view.</p>
              )}
            </div>

            <div className="pagination-row">
              <button
                className="ghost-button small-button"
                onClick={() => setFeaturePage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                type="button"
              >
                Previous
              </button>

              <span className="pagination-label">
                Page {currentPage} / {totalPages}
              </span>

              <button
                className="ghost-button small-button"
                onClick={() =>
                  setFeaturePage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                type="button"
              >
                Next
              </button>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("geojson_auth");
    return saved ? JSON.parse(saved) : null;
  });

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  return <Workspace user={user} onLogout={() => setUser(null)} />;
}

export default App;