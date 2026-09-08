# VAYUNET — Database & Data Model Architecture
### SIH26077 | Ministry of Earth Sciences (MoES) — NCMRWF
### AI-Driven Hyper-Local Early Warning System for Severe Weather Nowcasting

---

## 1. Data Modeling Strategy

VAYUNET operates on a hybrid storage architecture designed to balance **high-throughput spatiotemporal tensor ingestion** with **relational operational management**:
1. **Spatiotemporal Tensor Storage (Hot Cache):** Array stores (Zarr / HDF5 / In-Memory Shards) for 12-channel 4 km raster sequences ($X_{t-3 \dots t}$).
2. **Relational & Spatial Database (PostgreSQL 16 + PostGIS):** Persistent records for monitored basins, administrative zones, generated CAP alerts, XAI audit trails, and historical validation benchmarks.

---

## 2. Entity-Relationship Diagram (ERD)

```text
┌─────────────────────────┐           1:N           ┌─────────────────────────────┐
│   monitored_locations   │ ─────────────────────── │    atmospheric_telemetry    │
├─────────────────────────┤                         ├─────────────────────────────┤
│ id (PK)                 │                         │ id (PK)                     │
│ name                    │                         │ location_id (FK)            │
│ state                   │                         │ timestamp                   │
│ coordinates (GEOMETRY)  │                         │ iwv_mm                      │
│ elevation_m             │                         │ cape_j_kg                   │
│ terrain_type            │                         │ cin_j_kg                    │
│ drainage_basin          │                         │ ctt_drop_rate_c_hr          │
└───────────┬─────────────┘                         │ wind_shear_0_6km_kt         │
            │                                       │ dem_slope_deg               │
            │ 1:N                                   └─────────────────────────────┘
            ▼
┌─────────────────────────┐           1:1           ┌─────────────────────────────┐
│   nowcast_predictions   │ ─────────────────────── │      xai_attributions       │
├─────────────────────────┤                         ├─────────────────────────────┤
│ id (PK)                 │                         │ prediction_id (FK)          │
│ location_id (FK)        │                         │ ctt_drop_rate_weight        │
│ generated_at            │                         │ dem_slope_weight            │
│ lead_time_horizon (2-6h)│                         │ cape_instability_weight     │
│ thunderstorm_prob       │                         │ iwv_moisture_weight         │
│ cloudburst_prob         │                         │ plain_language_diagnostic   │
│ flash_flood_prob        │                         └─────────────────────────────┘
│ alert_severity (Level)  │
└───────────┬─────────────┘
            │ 1:N
            ▼
┌─────────────────────────┐
│       cap_alerts        │
├─────────────────────────┤
│ id (PK / CAP identifier)│
│ prediction_id (FK)      │
│ dispatched_at           │
│ severity (RED/ORANGE)   │
│ target_polygon (GEOMETRY│
│ channels_broadcasted    │
│ xml_payload             │
└─────────────────────────┘
```

---

## 3. SQL Table Definitions (PostgreSQL + PostGIS DDL)

### 3.1 `monitored_locations`
```sql
CREATE TABLE monitored_locations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(128) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    elevation_m REAL NOT NULL,
    terrain_type VARCHAR(128) NOT NULL,
    drainage_basin VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_geom ON monitored_locations USING GIST (geom);
```

### 3.2 `atmospheric_telemetry`
```sql
CREATE TABLE atmospheric_telemetry (
    id BIGSERIAL PRIMARY KEY,
    location_id VARCHAR(64) REFERENCES monitored_locations(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    iwv_mm REAL CHECK (iwv_mm >= 0),
    cape_j_kg REAL CHECK (cape_j_kg >= 0),
    cin_j_kg REAL,
    ctt_drop_rate_c_hr REAL,
    wind_shear_0_6km_kt REAL,
    dem_slope_deg REAL,
    data_source_flags JSONB DEFAULT '{"insat": true, "imdaa": true, "cartodem": true}'::jsonb
);

CREATE INDEX idx_telemetry_loc_time ON atmospheric_telemetry (location_id, recorded_at DESC);
```

### 3.3 `nowcast_predictions`
```sql
CREATE TABLE nowcast_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id VARCHAR(64) REFERENCES monitored_locations(id) ON DELETE CASCADE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    lead_time_hours INT CHECK (lead_time_hours BETWEEN 1 AND 6),
    thunderstorm_prob REAL CHECK (thunderstorm_prob BETWEEN 0 AND 100),
    cloudburst_prob REAL CHECK (cloudburst_prob BETWEEN 0 AND 100),
    flash_flood_prob REAL CHECK (flash_flood_prob BETWEEN 0 AND 100),
    alert_severity VARCHAR(16) CHECK (alert_severity IN ('GREEN', 'YELLOW', 'ORANGE', 'RED')),
    model_version VARCHAR(64) NOT NULL,
    inference_latency_ms REAL NOT NULL
);

CREATE INDEX idx_predictions_lookup ON nowcast_predictions (location_id, lead_time_hours, generated_at DESC);
```

### 3.4 `xai_attributions`
```sql
CREATE TABLE xai_attributions (
    prediction_id UUID PRIMARY KEY REFERENCES nowcast_predictions(id) ON DELETE CASCADE,
    ctt_drop_rate_weight REAL NOT NULL,
    dem_slope_weight REAL NOT NULL,
    cape_instability_weight REAL NOT NULL,
    iwv_moisture_weight REAL NOT NULL,
    plain_language_diagnostic TEXT NOT NULL
);
```

### 3.5 `cap_alerts`
```sql
CREATE TABLE cap_alerts (
    alert_id VARCHAR(128) PRIMARY KEY, -- Standardized CAP-IN-xxxx identifier
    prediction_id UUID REFERENCES nowcast_predictions(id) ON DELETE SET NULL,
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    hazard_type VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    target_locality VARCHAR(255) NOT NULL,
    lead_time_hours INT NOT NULL,
    target_polygon GEOMETRY(Polygon, 4326),
    channels_notified JSONB NOT NULL,
    xml_payload TEXT NOT NULL,
    delivery_status VARCHAR(32) DEFAULT 'DISPATCHED'
);

CREATE INDEX idx_cap_alerts_time ON cap_alerts (dispatched_at DESC);
CREATE INDEX idx_cap_alerts_poly ON cap_alerts USING GIST (target_polygon);
```
