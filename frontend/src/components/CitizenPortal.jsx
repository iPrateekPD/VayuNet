import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import gsap from 'gsap';
import './CitizenPortal.css';
import AccessibilityMenu from './AccessibilityMenu';
import ReadAloudButton from './ReadAloudButton';
import { useAccessibility } from '../context/AccessibilityContext';
import { INDIAN_LANGUAGES } from './HomePage';
import { getNavTranslation } from '../translations';

import { cn } from "@/lib/utils";
import { fetchLiveDistrictWarning, fetchLiveObservation } from '../services/liveWeatherService';

// Pre-defined database of Severe Weather Zones & Safe Zones across India
const LOCATION_DATABASE = {
  gunupur: {
    id: 'gunupur',
    name: 'Gunupur',
    district: 'Rayagada District, Odisha',
    pincode: '765022',
    center: [19.0805, 83.8166],
    isAffected: false,
    riskLevel: 'SAFE ZONE',
    riskClass: 'risk-safe',
    riskColor: '#16a34a',
    timeframe: 'Conditions Nominal',
    hazard: 'No Active Severe Warnings',
    description: 'Atmospheric stability indices nominal at your location. No flood or cloudburst alert detected.',
    safeShelter: {
      name: 'Gunupur Sub-Divisional Hospital',
      distance: '1.2 km away, Gunupur',
      address: 'Main Road, Gunupur',
      elevation: '85 m (Safe Zone)',
      capacity: '500 Persons',
      facilities: 'Emergency Medical, Drinking Water, Backup Power',
      contact: 'Emergency: 108',
      coords: [19.0850, 83.8200]
    },
    nearbyWarnings: []
  },
  mcleodganj: {
    id: 'mcleodganj',
    name: 'McLeodganj',
    district: 'Kangra District, Himachal Pradesh',
    pincode: '176219',
    center: [32.2426, 76.3213],
    isAffected: false,
    riskLevel: 'HIGH RISK',
    riskClass: 'risk-high',
    riskColor: '#dc2626',
    timeframe: 'Within 2 – 4 hours',
    hazard: 'Flash Flood + Cloudburst',
    description: 'Your location is inside the warning area. Heavy rainfall may cause flash floods, sudden rises in streams and dangerous travel conditions.',
    safeShelter: {
      name: 'Govt. Polytechnic College',
      distance: '2.4 km away, McLeodganj',
      address: 'Upper Dharamkot Road, McLeodganj',
      elevation: '2,082 m (Safe Highland Plateau)',
      capacity: '850 Persons',
      facilities: 'Drinking Water, Medical Post, DG Power Backup',
      contact: 'DEOC Helpline: 01892-229000',
      coords: [32.2460, 76.3260]
    },
    nearbyWarnings: [
      { name: 'Dharamsala', dist: '~ 8 km', level: 'High', color: '#dc2626' },
      { name: 'Kangra', dist: '~ 20 km', level: 'Moderate', color: '#ca8a04' },
      { name: 'Palampur', dist: '~ 45 km', level: 'Moderate', color: '#ca8a04' }
    ]
  },
  dharamsala: {
    id: 'dharamsala',
    name: 'Dharamsala',
    district: 'Kangra District, Himachal Pradesh',
    pincode: '176215',
    center: [32.2190, 76.3234],
    isAffected: false,
    riskLevel: 'HIGH RISK',
    riskClass: 'risk-high',
    riskColor: '#dc2626',
    timeframe: 'Within 2 – 4 hours',
    hazard: 'Flash Flood & Valley Torrent',
    description: 'Convective storm cloud developing above Dhauladhar ridge. Rapid runoff entering Bhagsunag stream and lower nullahs.',
    safeShelter: {
      name: 'Dharamsala Indoor Sports Complex',
      distance: '1.8 km away, Dharamsala',
      address: 'Civil Lines, Lower Dharamsala',
      elevation: '1,457 m (Reinforced Relief Camp)',
      capacity: '1,200 Persons',
      facilities: 'First Aid Dispensary, Satellite Phone, Clean Water',
      contact: 'Kangra Police: 112 / 01892-222244',
      coords: [32.2150, 76.3200]
    },
    nearbyWarnings: [
      { name: 'McLeodganj', dist: '~ 8 km', level: 'High', color: '#dc2626' },
      { name: 'Kangra', dist: '~ 18 km', level: 'Moderate', color: '#ca8a04' },
      { name: 'Shahpur', dist: '~ 24 km', level: 'Advisory', color: '#0284c7' }
    ]
  },
  chamoli: {
    id: 'chamoli',
    name: 'Chamoli / Joshimath',
    district: 'Chamoli District, Uttarakhand',
    pincode: '246443',
    center: [30.4124, 79.3243],
    isAffected: false,
    riskLevel: 'EXTREME RISK',
    riskClass: 'risk-extreme',
    riskColor: '#dc2626',
    timeframe: 'Immediate (1 – 3 hours)',
    hazard: 'Cloudburst & Debris Flow',
    description: 'High-altitude convective cell collapse. Alaknanda catchment water levels rising rapidly. Mandatory evacuation of riverbanks.',
    safeShelter: {
      name: 'Gopeshwar District Sports Pavilion',
      distance: '3.1 km away, Gopeshwar',
      address: 'Main Bazar High Ground, Gopeshwar',
      elevation: '1,550 m (Above River Flood Line)',
      capacity: '1,500 Persons',
      facilities: 'NDRF Base, Emergency Medical Tents, Rations',
      contact: 'Uttarakhand SEOC: 1070 / 0135-2710334',
      coords: [30.4050, 79.3300]
    },
    nearbyWarnings: [
      { name: 'Joshimath', dist: '~ 22 km', level: 'Extreme', color: '#dc2626' },
      { name: 'Karnaprayag', dist: '~ 32 km', level: 'High', color: '#ea580c' },
      { name: 'Rudraprayag', dist: '~ 48 km', level: 'Moderate', color: '#ca8a04' }
    ]
  },
  wayanad: {
    id: 'wayanad',
    name: 'Wayanad (Meppadi)',
    district: 'Wayanad District, Kerala',
    pincode: '673577',
    center: [11.5564, 76.1320],
    isAffected: false,
    riskLevel: 'EXTREME RISK',
    riskClass: 'risk-extreme',
    riskColor: '#dc2626',
    timeframe: 'Within 1 – 3 hours',
    hazard: 'Extreme Orographic Rain & Landslide',
    description: 'Torrential Western Ghats downpour producing saturated soil runoff. Chooralmala and Mundakkai river corridors in red danger.',
    safeShelter: {
      name: 'St. Joseph Higher Secondary School Relief Camp',
      distance: '2.1 km away, Meppadi',
      address: 'Ooty Road, Meppadi Central',
      elevation: '920 m (Safe Ridge Elevation)',
      capacity: '900 Persons',
      facilities: 'Kitchen, SDRF Logistics, Medical Station',
      contact: 'Wayanad District Control: 1077 / 04936-204151',
      coords: [11.5520, 76.1280]
    },
    nearbyWarnings: [
      { name: 'Kalpetta', dist: '~ 14 km', level: 'High', color: '#ea580c' },
      { name: 'Sulthan Bathery', dist: '~ 26 km', level: 'Moderate', color: '#ca8a04' },
      { name: 'Mananthavady', dist: '~ 42 km', level: 'Moderate', color: '#ca8a04' }
    ]
  },
  mumbai: {
    id: 'mumbai',
    name: 'Mumbai Coastal Delta',
    district: 'Mumbai Suburban, Maharashtra',
    pincode: '400001',
    center: [19.0760, 72.8777],
    isAffected: false,
    riskLevel: 'HIGH RISK',
    riskClass: 'risk-high',
    riskColor: '#ea580c',
    timeframe: 'Within 2 – 4 hours',
    hazard: 'Severe Squall & Coastal Inundation',
    description: 'High-tide sync with intense convective rain bands over Mithi river basin. Extreme waterlogging expected in low-lying corridors.',
    safeShelter: {
      name: 'Dadar Central Municipal Relief Pavilion',
      distance: '2.8 km away, Dadar West',
      address: 'Dr. B. Ambedkar Road, Dadar',
      elevation: '28 m (Elevated Concrete Multi-Story Complex)',
      capacity: '2,500 Persons',
      facilities: 'Emergency Generator, BMC Food Supplies, Medical Unit',
      contact: 'BMC Disaster Management: 1916 (Toll-Free)',
      coords: [19.0178, 72.8478]
    },
    nearbyWarnings: [
      { name: 'Thane', dist: '~ 24 km', level: 'Moderate', color: '#ca8a04' },
      { name: 'Navi Mumbai', dist: '~ 28 km', level: 'Moderate', color: '#ca8a04' },
      { name: 'Palghar', dist: '~ 48 km', level: 'Advisory', color: '#0284c7' }
    ]
  },
  delhi: {
    id: 'delhi',
    name: 'New Delhi',
    district: 'National Capital Region (NCR)',
    pincode: '110001',
    center: [28.6139, 77.2090],
    isAffected: false,
    riskLevel: 'SAFE ZONE',
    riskClass: 'risk-safe',
    riskColor: '#16a34a',
    timeframe: 'Conditions Nominal',
    hazard: 'No Active Severe Warnings',
    description: 'Atmospheric stability indices (CAPE, IWV, CTT) are within nominal thresholds. No flood, cloudburst or squall alerts in effect.',
    safeShelter: {
      name: 'Connaught Place Civil Defense Center',
      distance: '1.2 km away, New Delhi',
      address: 'Palika Kendra, Sansad Marg',
      elevation: '216 m (Standard Urban Ground)',
      capacity: 'Civil Defense Headquarters',
      facilities: 'Information Hub, Emergency Operations Relay',
      contact: 'Delhi Disaster Management: 1077',
      coords: [28.6280, 77.2150]
    },
    nearbyWarnings: []
  },
  newdelhi: {
    id: 'newdelhi',
    name: 'New Delhi',
    district: 'National Capital Territory of Delhi',
    pincode: '110001',
    center: [28.6139, 77.2090],
    isAffected: false,
    riskLevel: 'SAFE ZONE',
    riskClass: 'risk-safe',
    riskColor: '#16a34a',
    timeframe: 'Conditions Nominal',
    hazard: 'No Active Severe Warnings',
    description: 'Atmospheric stability indices nominal at your location.',
    safeShelter: {
      name: 'Connaught Place Civil Defense Center',
      distance: '1.2 km away, New Delhi',
      address: 'Palika Kendra, Sansad Marg',
      elevation: '216 m (Standard Urban Ground)',
      capacity: 'Civil Defense Headquarters',
      facilities: 'Information Hub, Emergency Operations Relay',
      contact: 'Delhi Disaster Management: 1077',
      coords: [28.6280, 77.2150]
    },
    nearbyWarnings: []
  },
  bengaluru: {
    id: 'bengaluru',
    name: 'Bengaluru Urban',
    district: 'Bengaluru Urban, Karnataka',
    pincode: '560001',
    center: [12.9716, 77.5946],
    isAffected: false,
    riskLevel: 'SAFE ZONE',
    riskClass: 'risk-safe',
    riskColor: '#16a34a',
    timeframe: 'Conditions Nominal',
    hazard: 'No Active Severe Warnings',
    description: 'Atmospheric parameters are nominal across the Deccan Plateau. Light intermittent drizzle possible, well below alert thresholds.',
    safeShelter: {
      name: 'BBMP Central Relief Center',
      distance: '2.0 km away, Corporation Circle',
      address: 'Hudson Circle, Bengaluru',
      elevation: '920 m (Safe Plateau Ground)',
      capacity: 'Municipal Disaster Center',
      facilities: 'Civil Defense Reserve, Karnataka SDRF Liaison',
      contact: 'BBMP Control Room: 080-22221188',
      coords: [12.9650, 77.5850]
    },
    nearbyWarnings: []
  },
  chandigarh: {
    id: 'chandigarh',
    name: 'Chandigarh Tri-City',
    district: 'Union Territory of Chandigarh',
    pincode: '160017',
    center: [30.7333, 76.7794],
    isAffected: false,
    riskLevel: 'SAFE ZONE',
    riskClass: 'risk-safe',
    riskColor: '#16a34a',
    timeframe: 'Conditions Nominal',
    hazard: 'No Active Severe Warnings',
    description: 'Fair weather conditions prevailing in the plain foothills. Upstream mountain catchments under observation.',
    safeShelter: {
      name: 'Sector 17 Civil Defense Facility',
      distance: '1.5 km away, Sector 17',
      address: 'Bridge Market, Chandigarh',
      elevation: '321 m (Safe Urban Plain)',
      capacity: 'Disaster Coordination Cell',
      facilities: 'Relief Supplies, Communication Hub',
      contact: 'Chandigarh Emergency: 112',
      coords: [30.7400, 76.7850]
    },
    nearbyWarnings: []
  }
};

// Canonical ID aliases mapping to existing entries
LOCATION_DATABASE.chamoli_joshimath = { ...LOCATION_DATABASE.chamoli, id: 'chamoli_joshimath' };
LOCATION_DATABASE.wayanad_meppadi = { ...LOCATION_DATABASE.wayanad, id: 'wayanad_meppadi' };
LOCATION_DATABASE.mumbai_coastal_delta = { ...LOCATION_DATABASE.mumbai, id: 'mumbai_coastal_delta' };
LOCATION_DATABASE.new_delhi = { ...LOCATION_DATABASE.delhi, id: 'new_delhi' };
LOCATION_DATABASE.bengaluru_urban = { ...LOCATION_DATABASE.bengaluru, id: 'bengaluru_urban' };
LOCATION_DATABASE.chandigarh_tricity = { ...LOCATION_DATABASE.chandigarh, id: 'chandigarh_tricity' };

// Smooth Leaflet Controller
function MapFlyController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 11, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Helper to construct a dynamic location object from coordinates & reverse-geocoded data (Zero API Keys needed)
async function resolveLocationData(latitude, longitude, fallbackName = 'My Location') {
  let placeName = fallbackName;
  let districtName = '';
  let postcode = '';

  // 1. Try BigDataCloud Client Reverse Geocoding (Free, no key, CORS friendly)
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      placeName = bdcData.locality || bdcData.city || bdcData.principalSubdivision || fallbackName;
      const adminList = bdcData.localityInfo?.administrative || [];
      const distObj = adminList.find(a => a.adminLevel === 5 || a.description?.includes('district'));
      const distStr = distObj ? distObj.name : (bdcData.city || bdcData.principalSubdivision || '');
      districtName = [distStr, bdcData.principalSubdivision].filter(Boolean).join(', ');
      postcode = bdcData.postcode || '';
    }
  } catch (err) {
    console.warn('BigDataCloud reverse geocode error:', err);
  }

  // 1b. Fallback to OpenStreetMap Nominatim if needed
  if (!districtName) {
    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      if (osmRes.ok) {
        const osmData = await osmRes.json();
        const addr = osmData.address || {};
        placeName = addr.suburb || addr.neighbourhood || addr.city || addr.town || addr.village || placeName;
        const dist = addr.state_district || addr.county || addr.city || '';
        districtName = [dist, addr.state].filter(Boolean).join(', ');
        postcode = addr.postcode || postcode;
      }
    } catch (err) {
      console.warn('Nominatim reverse geocode error:', err);
    }
  }

  if (!districtName) {
    districtName = `Coordinates: ${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E`;
  }

  // 2. Query live weather metrics using unified live observation
  let tempC = 28;
  let precipitation = 0;
  let weatherCode = 0;
  let windSpeed = 8;
  let windDir = 'SW';
  let humidity = 70;
  let pressure = 1008;
  let weatherStatus = 'Live IMD Stream';
  try {
    const obs = await fetchLiveObservation(latitude, longitude, placeName);
    if (obs) {
      tempC = obs.temp;
      precipitation = obs.rain;
      weatherCode = obs.weatherCode;
      windSpeed = obs.windSpeed;
      windDir = obs.windDir;
      humidity = obs.humidity;
      pressure = obs.pressure;
      weatherStatus = obs.status;
    }
  } catch (wErr) {
    console.warn('[VAYUNET Live] Live observation error in resolveLocationData:', wErr);
  }

  // 3. Proximity check to active severe weather threats in database
  let nearestThreat = null;
  let minThreatDist = Infinity;
  Object.values(LOCATION_DATABASE).forEach((item) => {
    if (item.isAffected) {
      const dLat = (item.center[0] - latitude) * 111;
      const dLon = (item.center[1] - longitude) * 111 * Math.cos((latitude * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLon * dLon);
      if (dist < minThreatDist) {
        minThreatDist = dist;
        nearestThreat = { ...item, distKm: Math.round(dist) };
      }
    }
  });

  // Determine risk level based on live radar / precipitation / threat proximity
  const isNearThreat = minThreatDist <= 35;
  const isHeavyRain = precipitation >= 10 || weatherCode >= 80;
  
  // NEVER equate weather directly to hazard risk! Let the backend model decide.
  let riskLevel = 'EVALUATING...';
  let riskClass = 'risk-stale';
  let riskColor = '#94a3b8';
  let hazard = 'Awaiting Model Inference';
  let timeframe = '';
  let description = `Fetching VAYUNET deep learning telemetry for your coordinates. Please wait...`;

  const shelterLat = latitude + 0.004;
  const shelterLon = longitude + 0.003;

  return {
    id: `dyn_${Date.now()}`,
    name: placeName,
    district: districtName,
    pincode: postcode || 'Live GPS',
    center: [latitude, longitude],
    isAffected: false,
    riskLevel,
    riskClass,
    riskColor,
    timeframe,
    hazard,
    description,
    liveObservation: {
      temp: tempC,
      rain: precipitation,
      humidity,
      pressure,
      windSpeed,
      windDir,
      status: weatherStatus,
      weatherCode,
      source: 'weather.indianapi.in & IMD Network',
    },
    lastUpdatedText: `Last updated: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST`,
    dataSourceText: 'Source: VAYUNET Live Telemetry (weather.indianapi.in)',
    safeShelter: {
      name: `${placeName} Emergency Civil Defense Post`,
      distance: '1.4 km away',
      address: `Designated Public Shelter & High Ground, ${placeName}`,
      elevation: 'Safe High Elevation Zone',
      capacity: 'Community Emergency Shelter',
      facilities: 'Emergency First Aid, Clean Water Reserve, Backup Power',
      contact: 'Disaster Emergency Helpline: 1070 / Police: 112',
      coords: [shelterLat, shelterLon]
    },
    nearbyWarnings: nearestThreat && minThreatDist < 250 ? [
      {
        name: nearestThreat.name,
        dist: `~ ${nearestThreat.distKm} km`,
        level: nearestThreat.riskLevel.includes('EXTREME') ? 'Extreme' : 'High',
        color: nearestThreat.riskColor
      }
    ] : []
  };
}

export default function CitizenPortal({ onBackHome, onEnterPortal }) {
  // Active selected location state (defaults to Gunupur)
  const [selectedId, setSelectedId] = useState('gunupur');
  const [isLocationSwitching, setIsLocationSwitching] = useState(false);
  const [customLocations, setCustomLocations] = useState({});
  const [liveDistricts, setLiveDistricts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [showNearbyOnMap, setShowNearbyOnMap] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [guidanceModalOpen, setGuidanceModalOpen] = useState(false);
  const [shelterModalOpen, setShelterModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const { language, setLanguage } = useAccessibility();
  const langKey = (language || 'en').toUpperCase();
  const t = getNavTranslation(language);
  const isHi = langKey === 'HI';
  const [liveIstTime, setLiveIstTime] = useState('');

  const [dynamicShelter, setDynamicShelter] = useState(null);
  const [evaluatingShelter, setEvaluatingShelter] = useState(false);

  // Map Layer Controls
  const [layersOpen, setLayersOpen] = useState(false);
  const [baseMap, setBaseMap] = useState('streets');
  const [cloudLayer, setCloudLayer] = useState(false);
  const [owmCloudLayer, setOwmCloudLayer] = useState(false);
  const [rainLayer, setRainLayer] = useState(false);
  const [cloudTempLayer, setCloudTempLayer] = useState(false);
  const [waterVapourLayer, setWaterVapourLayer] = useState(false);
  const [windLayer, setWindLayer] = useState(false);
  const [cloudOpacity, setCloudOpacity] = useState(0.65);
  const [radarTimestamp, setRadarTimestamp] = useState('latest');
  const [terrainLayer, setTerrainLayer] = useState(false);
  const [riskLayer, setRiskLayer] = useState(true);
  const [shelterLayer, setShelterLayer] = useState(true);
  const [liveWeather, setLiveWeather] = useState(null);
  const [broadcastScript, setBroadcastScript] = useState("");
  const [weatherLoading, setWeatherLoading] = useState(false);



  const headerRef = useRef(null);
  const footerRef = useRef(null);

  const allLocations = { ...LOCATION_DATABASE, ...customLocations, ...liveDistricts };
  const loc = allLocations[selectedId] || LOCATION_DATABASE.gunupur;

  // Dynamic Safe Shelter Routing
  useEffect(() => {
    let isMounted = true;
    const fetchDynamicShelter = async () => {
      if (!loc || !loc.center) return;
      setEvaluatingShelter(true);
      setDynamicShelter(null);
      try {
        const res = await fetch(`http://localhost:8000/api/locations/${loc.id}/safe-shelter?lat=${loc.center[0]}&lng=${loc.center[1]}`);
        const data = await res.json();
        if (isMounted && data.status === 'success' && data.data && data.data.safest) {
          setDynamicShelter(data.data.safest.shelter);
        }
      } catch (e) {
        console.warn("Failed to fetch dynamic shelter", e);
      } finally {
        if (isMounted) setEvaluatingShelter(false);
      }
    };
    
    // Only fetch if it's a real location ID (not dynamic GPS which is dyn_...)
    if (!loc.id.startsWith('dyn_')) {
      fetchDynamicShelter();
    } else {
      setEvaluatingShelter(false);
    }
    
    return () => { isMounted = false; };
  }, [loc?.id, loc?.center[0], loc?.center[1]]);
  
  const currentShelter = dynamicShelter || loc.safeShelter;

  useEffect(() => {
    const fetchTimestamp = () => {
      fetch('http://localhost:8000/api/warnings/map/timestamps')
        .then(r => r.json())
        .then(d => {
          if (d.radar_timestamp) setRadarTimestamp(d.radar_timestamp);
        })
        .catch(e => console.warn('Radar timestamp fetch failed:', e));

      const locId = selectedId;
      const locObj = allLocations[locId] || LOCATION_DATABASE.gunupur;
      const locName = locObj ? locObj.name : 'Gunupur';

      if (locId) {
        setWeatherLoading(true);
        fetch(`http://localhost:8000/api/weather/imd/current?region=${encodeURIComponent(locName)}`)
          .then(res => res.json())
          .then(data => {
            if (data.temperature) {
              setLiveWeather(data);
            } else {
              setLiveWeather(null);
            }
          })
          .catch(err => {
            console.error('Weather fetch error:', err);
            setLiveWeather(null);
          })
          .finally(() => setWeatherLoading(false));
      }
    };

    fetchTimestamp();
    const interval = setInterval(fetchTimestamp, 5 * 60 * 1000); // refresh every 5 mins
    return () => clearInterval(interval);
  }, [selectedId]);

  // Fetch the dynamic broadcast script from backend whenever weather or location changes
  useEffect(() => {
    const locObj = allLocations[selectedId] || LOCATION_DATABASE['gunupur'];
    const currentShelterObj = dynamicShelter || locObj.safeShelter;
    
    // Fallback script if backend fetch fails
    const fallbackScript = `Attention residents of ${locObj.name}, ${locObj.district}. A ${locObj.riskLevel.toLowerCase()} level warning is currently active for ${locObj.hazard}. ${locObj.description}. Please proceed to the nearest safe zone: ${currentShelterObj?.name}.`;
    
    fetch('http://localhost:8000/api/weather/broadcast-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: locObj.name,
        district: locObj.district,
        risk_level: locObj.riskLevel,
        hazard: locObj.hazard,
        description: locObj.description,
        temperature: liveWeather?.temperature || 0.0,
        rain_mm: liveWeather?.rain_mm || 0.0,
        wind_speed: liveWeather?.wind_speed || 0.0,
        shelter_name: currentShelterObj?.name || "",
        shelter_distance: currentShelterObj?.distance || ""
      })
    })
      .then(res => res.json())
      .then(data => setBroadcastScript(data.script || fallbackScript))
      .catch(() => setBroadcastScript(fallbackScript));
  }, [selectedId, liveWeather, dynamicShelter]);



  // 1. Initial live synchronization for all monitoring districts across India
  useEffect(() => {
    let isMounted = true;
    const syncAllDistricts = async () => {
      try {
        const keys = Object.keys(LOCATION_DATABASE);
        const results = await Promise.all(
          keys.map(k => fetchLiveDistrictWarning(k, LOCATION_DATABASE[k]))
        );
        if (isMounted) {
          const map = {};
          results.forEach(r => {
            if (r && r.id) map[r.id] = r;
          });
          setLiveDistricts(prev => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.warn('[VAYUNET Live] Error syncing live district warnings:', err);
      }
    };
    syncAllDistricts();
    const interval = setInterval(syncAllDistricts, 35000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Fetch live data immediately for selected location with clear loading transition
  useEffect(() => {
    let isMounted = true;
    setIsLocationSwitching(true);
    const base = allLocations[selectedId] || LOCATION_DATABASE[selectedId];
    if (base) {
      fetchLiveDistrictWarning(selectedId, base)
        .then(live => {
          if (isMounted && live) {
            setLiveDistricts(prev => ({ ...prev, [selectedId]: live }));
            setIsLocationSwitching(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLocationSwitching(false);
        });
    } else {
      setIsLocationSwitching(false);
    }
    return () => { isMounted = false; };
  }, [selectedId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Always open CitizenPortal starting from the very top of the page (0, 0)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, []);

  // Real-time dynamic IST clock for sovereign ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveIstTime(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST');
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // GSAP Entrance & Pulse Animations for Smart Header and Footer
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header entrance animation
      if (headerRef.current) {
        gsap.from(headerRef.current, {
          y: -24,
          opacity: 0,
          duration: 0.75,
          ease: 'power3.out'
        });

        gsap.from('.cp-nav-anim-item', {
          y: -10,
          opacity: 0,
          stagger: 0.05,
          duration: 0.45,
          delay: 0.15,
          ease: 'power2.out'
        });

        // Pulsing live beacon
        gsap.to('.cp-live-pulse-beacon', {
          scale: 1.4,
          opacity: 0.35,
          repeat: -1,
          yoyo: true,
          duration: 0.85,
          ease: 'sine.inOut'
        });
      }

      // Footer entrance animation
      if (footerRef.current) {
        gsap.from('.cp-footer-anim-item', {
          y: 20,
          opacity: 0,
          duration: 0.6,
          delay: 0.25,
          ease: 'power2.out'
        });

        gsap.to('.cp-footer-telemetry-dot', {
          boxShadow: '0 0 10px #22c55e',
          repeat: -1,
          yoyo: true,
          duration: 1.1,
          ease: 'sine.inOut'
        });
      }
    });

    return () => ctx.revert();
  }, []);

  // Search handler (searches local stations and falls back to Nominatim India geocoding)
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
    const queryLower = query.toLowerCase();

    // 1. Check if it matches existing locations in memory
    const existingKey = Object.keys(allLocations).find((key) => {
      const item = allLocations[key];
      return (
        item.name.toLowerCase().includes(queryLower) ||
        item.district.toLowerCase().includes(queryLower) ||
        item.pincode.includes(queryLower)
      );
    });

    if (existingKey) {
      setSelectedId(existingKey);
      setSearchQuery('');
      showToast(`Switched view to ${allLocations[existingKey].name}`);
      return;
    }

    // 2. If not in local list, search OpenStreetMap Nominatim for India
    setIsDetecting(true);
    try {
      const searchRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=in&limit=1`
      );
      if (searchRes.ok) {
        const results = await searchRes.json();
        if (results && results.length > 0) {
          const r = results[0];
          const lat = parseFloat(r.lat);
          const lon = parseFloat(r.lon);
          const searchedLoc = await resolveLocationData(lat, lon, r.name || query);

          setCustomLocations((prev) => ({
            ...prev,
            [searchedLoc.id]: searchedLoc
          }));
          setSelectedId(searchedLoc.id);
          setSearchQuery('');
          setIsDetecting(false);
          showToast(`📍 Found: ${searchedLoc.name} (${searchedLoc.riskLevel})`);
          return;
        }
      }
    } catch (searchErr) {
      console.warn('Search geocoding error:', searchErr);
    }

    setIsDetecting(false);
    showToast(`No location found for "${query}". Try city name or PIN code.`);
  };

  // Use My Location click handler (uses real browser GPS + reverse geocoding)
  const handleUseMyLocation = () => {
    setIsDetecting(true);
    if (!('geolocation' in navigator)) {
      setIsDetecting(false);
      showToast('Geolocation not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const userLocation = await resolveLocationData(latitude, longitude, 'My Location');

          setCustomLocations((prev) => ({
            ...prev,
            [userLocation.id]: userLocation
          }));
          setSelectedId(userLocation.id);
          setIsDetecting(false);
          showToast(`📍 Located: ${userLocation.name} (${userLocation.riskLevel})`);
        } catch (err) {
          console.error(err);
          setIsDetecting(false);
          showToast('Failed to resolve GPS location address.');
        }
      },
      (err) => {
        setIsDetecting(false);
        showToast('GPS access denied or unavailable. Please allow location access in your browser.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Share functionality
  const handleShare = () => {
    const shareTitle = `⚠️ VAYUNET Weather Warning: ${loc.name}`;
    const shareText = `${loc.isAffected ? '⚠️ SEVERE WEATHER WARNING' : '✅ Safe Status'} for ${loc.name} (${loc.district}): ${loc.hazard}. Check your nearest safe shelter on VAYUNET.`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      }).catch(() => {
        setShareModalOpen(true);
      });
    } else {
      setShareModalOpen(true);
    }
  };

  const copyPageLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('🔗 Warning portal link copied to clipboard!');
    setShareModalOpen(false);
  };

  const openGoogleDirections = () => {
    const dest = `${currentShelter?.coords[0]},${currentShelter?.coords[1]}`;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
  };

  // Custom pulsing pin for target location
  const targetPinIcon = L.divIcon({
    className: 'cp-target-map-pin',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: ${loc.riskColor}; opacity: 0.25; animation: cpPulse 1.8s infinite;"></div>
        <div style="position: absolute; width: 18px; height: 18px; border-radius: 50%; background: #ffffff; border: 3px solid ${loc.riskColor}; box-shadow: 0 0 10px rgba(0,0,0,0.35);"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  return (
    <div className="cp-wrapper">
      {/* 1. SMART REDEFINED SOVEREIGN HEADER WITH GSAP ANIMATIONS */}
      <header className="cp-header-container" ref={headerRef}>
        {/* Main Smart Navigation Bar */}
        <nav className="cp-navbar">
          <div className="cp-nav-inner">
            <div className="home-brand" onClick={onBackHome} title="Return to VAYUNET Home" style={{ cursor: 'pointer' }}>
              <div className="home-logo">
                <img src="/VAYUNET_LOGO.png" alt="VAYUNET Logo" className="home-logo-img" />
              </div>
              <div className="brand-titles-group">
                <div className="brand-row">
                  <span className="home-title">VAYUNET</span>
                  <span className="gov-sovereign-pill">🇮🇳 MoES · NCMRWF</span>
                </div>
                <div className="home-dept">{t.brandSubtitle}</div>
              </div>
            </div>

            <div className="home-nav-links-capsule cp-nav-anim-item">
              <button className="nav-link-item" onClick={onBackHome}>{t.home}</button>
              <button className="nav-link-item active">{t.legalWarnings || t.publicWarnings}</button>
              <button className="nav-link-item" onClick={() => setGuidanceModalOpen(true)}>{t.footerProtocols || 'Safety Guide'}</button>
              <button className="nav-link-item" onClick={() => setShelterModalOpen(true)}>{t.footerShelter || 'Resources'}</button>
            </div>

            <div className="home-nav-actions cp-nav-anim-item">
              {/* ♿ Unified Accessibility & Language Control */}
              <AccessibilityMenu />

              {/* 2. Home Navigation Option */}
              <button 
                className="btn-secondary-nav"
                onClick={onBackHome}
                id="nav-home-btn"
                title="Return to VAYUNET Home"
              >
                <span>← {t.home}</span>
              </button>

              {/* 3. Enter Operations Portal Option */}
              <button
                className="btn-primary-nav"
                onClick={onEnterPortal}
                id="nav-enter-portal-btn"
                title="Enter Operations Portal"
              >
                <span>{t.enterPortal}</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Top Sovereign Emergency Broadcast Ticker (Below Header) */}
        <div className="cp-header-ticker">
          <div className="cp-ticker-inner">
            <div className="cp-ticker-left cp-nav-anim-item">
              <span className="cp-tricolor-flag">🇮🇳</span>
              <span className="cp-gov-title">भारत सरकार · Government of India</span>
              <span className="cp-ticker-dot">•</span>
              <span className="cp-dept-title">MoES · NCMRWF</span>
            </div>

            <div className="cp-ticker-center cp-nav-anim-item">
              <div className="cp-telemetry-badge">
                <span className="cp-live-pulse-beacon" />
                <span className="cp-live-beacon-text">LIVE NOWCAST INGEST</span>
                <span className="cp-ticker-chip">4km Convective Grid</span>
              </div>
              <span className="cp-ticker-time">{liveIstTime || '01:24:00 PM IST'}</span>
            </div>

            <div className="cp-ticker-right cp-nav-anim-item">
              <a href="tel:1078" className="cp-ticker-helpline" title="Click to dial 24x7 NDMA Disaster Helpline">
                <span className="cp-helpline-icon">🚨</span>
                <span className="cp-helpline-text">NDMA 24x7:</span>
                <strong className="cp-helpline-num">1078</strong>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 2. HERO BANNER WITH SEARCH BAR OVERLAY */}
      <section 
        className="cp-hero" 
        style={{ backgroundImage: `url(/hazards_mountain_backdrop.jpg)` }}
      >
        <div className="cp-hero-overlay"></div>
        <div className="cp-hero-content">
          {/* Quick Navigation: Current Page Badge & Outbound Navigation Links */}
          <div className="cp-quick-nav-bar">
            {/* Active Current Page Badge */}
            <div className="cp-current-page-pill" title="Current Location: Public Severe Weather Warnings">
              <span className="cp-pulse-warning-dot" />
              <span>Public Warnings</span>
            </div>

            {/* Quick Navigation Actions */}
            <div className="cp-quick-nav-links">
              <button 
                type="button" 
                className="cp-quick-nav-btn cp-quick-home-btn"
                onClick={onBackHome}
                title="Return to VAYUNET Home"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>Home</span>
              </button>

              <button 
                type="button" 
                className="cp-quick-nav-btn cp-quick-ops-link-btn"
                onClick={onEnterPortal}
                title="Navigate to Operational Console"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                <span>Operational Page</span>
                <span className="cp-quick-btn-arrow">↗</span>
              </button>
            </div>
          </div>

          <div className="cp-hero-top">
            <div>
              <div className="cp-hero-eyebrow">Severe Weather Warning</div>
              <h1 className="cp-hero-title">Severe Weather Warning</h1>
              <p className="cp-hero-subtitle">Check your area. Stay informed. Stay safe.</p>
            </div>
            <div className="cp-hero-tagline">
              <div className="cp-hero-tagline-text">Safer People<br />Stronger Communities</div>
              <div className="cp-hero-tagline-bar">
                <div className="cp-tagline-segment orange"></div>
                <div className="cp-tagline-segment green"></div>
              </div>
            </div>
          </div>

          {/* Search Card */}
          <form className="cp-search-card" onSubmit={handleSearch}>
            <div className="cp-search-input-wrap">
              <svg className="cp-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                className="cp-search-input"
                placeholder="Search your city, district, PIN code or landmark"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button type="submit" className="cp-search-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Search
            </button>

            <span className="cp-search-or">or</span>

            <button 
              type="button" 
              className="cp-locate-btn"
              onClick={handleUseMyLocation}
              disabled={isDetecting}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="22" y1="12" x2="18" y2="12"></line>
                <line x1="6" y1="12" x2="2" y2="12"></line>
                <line x1="12" y1="6" x2="12" y2="2"></line>
                <line x1="12" y1="22" x2="12" y2="18"></line>
              </svg>
              {isDetecting ? 'Locating...' : 'Use My Location'}
            </button>
          </form>

          <div className="cp-search-examples">
            Try popular locations:{' '}
            <span onClick={() => setSelectedId('dharamsala')}>Dharamsala</span>,{' '}
            <span onClick={() => setSelectedId('gunupur')}>Gunupur</span>,{' '}
            <span onClick={() => setSelectedId('wayanad')}>Wayanad</span>,{' '}
            <span onClick={() => setSelectedId('delhi')}>Delhi</span>, 176215
          </div>

          <div className="cp-location-pill-banner">
            <div className="cp-pulse-dot"></div>
            <span>
              Viewing area: <strong>{loc.name}</strong> ({loc.district}) &mdash;{' '}
              {loc.isAffected ? '⚠️ Active Alert Zone' : '✅ Nominal Conditions (Safe Zone)'}
            </span>
          </div>
        </div>
      </section>

      {/* 3. MAIN INTERACTIVE CONTENT CONTAINER */}
      <main className="cp-main-container">
        {/* Top Grid: Warning Card + Interactive Map */}
        <div className="cp-top-grid">
          {/* Left: Status / Warning Card */}
          <div className={`cp-warning-card ${loc.riskClass}`}>
            {isLocationSwitching ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div className="cp-spinner" style={{ margin: '0 auto 16px auto', width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>Evaluating Live VAYUNET Telemetry...</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>Executing universal VAYUNET-MTL inference for {loc.name}</div>
              </div>
            ) : (
            <div>
              <div className="cp-badge-row">
                <div className={`cp-risk-badge ${loc.isAffected ? (loc.riskLevel.includes('EXTREME') ? 'red' : 'red') : 'green'}`}>
                  {loc.isAffected ? (
                    <>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      {loc.riskLevel}
                    </>
                  ) : (
                    <>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        <polyline points="9 12 11 14 15 10"></polyline>
                      </svg>
                      {loc.riskLevel}
                    </>
                  )}
                </div>

                <div className={`cp-lead-pill ${loc.isAffected ? '' : 'green'}`}>
                  {loc.timeframe}
                </div>
                <ReadAloudButton 
                  text={broadcastScript}
                  lang={language}
                  label="Listen to public weather warning" 
                  forceShow={true}
                />
              </div>

              <h2 className="cp-warning-loc-title">{loc.name}</h2>
              <p className="cp-warning-loc-sub">{loc.district}</p>

              <div className="cp-hazard-name">
                {loc.isAffected ? (
                  <>
                    <span className="highlight">{loc.hazard.split(' + ')[0]}</span>
                    {loc.hazard.includes(' + ') && ` + ${loc.hazard.split(' + ')[1]}`}
                  </>
                ) : (
                  <span style={{ color: '#16a34a' }}>{loc.hazard}</span>
                )}
              </div>

              <p className="cp-hazard-desc">{loc.description}</p>

              {/* VAYUNET Hazard Breakdown */}
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--card-bg-2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>VAYUNET Risk Breakdown</h4>
                {loc.vayunetHazards ? Object.entries(loc.vayunetHazards).map(([hName, hObj]) => (
                  <div key={hName} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px', textTransform: 'capitalize' }}>
                    <span>{hName.replace('_', ' ')}</span>
                    <span style={{ fontWeight: 'bold', color: hObj.risk_level === 'EXTREME' ? '#dc2626' : hObj.risk_level === 'HIGH' ? '#ea580c' : hObj.risk_level === 'MODERATE' ? '#ca8a04' : '#16a34a' }}>
                      {hObj.risk_level}
                    </span>
                  </div>
                )) : (
                  <div style={{ fontSize: '14px', color: '#94a3b8' }}>Risk inference unavailable</div>
                )}
              </div>

              {/* LIVE REAL-TIME TELEMETRY STRIP (weather.indianapi.in & IMD Network) */}
              <div className="cp-live-telemetry-strip">
                <div className="cp-telemetry-chip">
                  <span className="chip-label">🌡️ Temperature</span>
                  <span className="chip-val">{loc.liveObservation?.temp ?? '--'}°C</span>
                </div>
                <div className="cp-telemetry-chip">
                  <span className="chip-label">🌧️ Rainfall Rate</span>
                  <span className="chip-val" style={{ color: (loc.liveObservation?.rain > 0) ? '#38bdf8' : '#e2e8f0' }}>
                    {loc.liveObservation?.rain ?? 0} mm/h
                  </span>
                </div>
                <div className="cp-telemetry-chip">
                  <span className="chip-label">💧 Humidity</span>
                  <span className="chip-val">{loc.liveObservation?.humidity ?? '--'}%</span>
                </div>
                <div className="cp-telemetry-chip">
                  <span className="chip-label">💨 Wind</span>
                  <span className="chip-val">{loc.liveObservation?.windDir ?? '--'} {loc.liveObservation?.windSpeed ?? '--'} km/h</span>
                </div>
                <div className="cp-telemetry-chip">
                  <span className="chip-label">🧭 Barometer</span>
                  <span className="chip-val">{loc.liveObservation?.pressure ?? '--'} hPa</span>
                </div>
                <div className="cp-telemetry-chip live-source">
                  <span className={loc.liveObservation?.isLive ? "live-stream-badge" : "stale-stream-badge"} style={{ backgroundColor: loc.liveObservation?.isLive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.15)', color: loc.liveObservation?.isLive ? '#f87171' : '#cbd5e1' }}>
                    {loc.liveObservation?.isLive ? '● LIVE' : '● STALE'} {loc.liveObservation?.source || 'Source Unknown'}
                  </span>
                </div>
              </div>

              {/* DATA / AI PROVENANCE STRIP */}
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ padding: '8px 12px', background: 'var(--card-bg-2)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', flex: '1' }}>
                  <div style={{ color: '#64748b', marginBottom: '2px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>Live Weather</div>
                  <div style={{ fontWeight: '600' }}>{loc.liveObservation?.source || 'Live Data'}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--card-bg-2)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', flex: '1' }}>
                  <div style={{ color: '#64748b', marginBottom: '2px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>Model</div>
                  <div style={{ fontWeight: '600' }}>
                    {loc.modelProvenance?.name 
                      ? `${loc.modelProvenance.name.replace(/-$/, '')}-${loc.modelProvenance.version || 'V3'}`.replace(/--+/g, '-').replace(/-V3-V3/g, '-V3') 
                      : 'VAYUNET-MTL-V3'}
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--card-bg-2)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', flex: '1' }}>
                  <div style={{ color: '#64748b', marginBottom: '2px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>Inference</div>
                  <div style={{ fontWeight: '600', color: loc.modelProvenance?.inference_executed ? '#16a34a' : '#94a3b8' }}>{loc.modelProvenance?.inference_executed ? 'Executed' : 'Unavailable'}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--card-bg-2)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', flex: '1' }}>
                  <div style={{ color: '#64748b', marginBottom: '2px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>Updated</div>
                  <div style={{ fontWeight: '600' }}>{loc.modelProvenance?.inference_timestamp ? new Date(loc.modelProvenance.inference_timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST' : '--'}</div>
                </div>
              </div>

              {/* Safe State Alert helper if user is not in danger zone */}
              {!loc.isAffected && (
                <div className="cp-safe-state-box">
                  <div className="cp-safe-icon">🛡️</div>
                  <div>
                    <h4 className="cp-safe-title">You are currently in a Safe Zone</h4>
                    <p className="cp-safe-desc">
                      Atmospheric stability and precipitation radars show normal baseline readings in this area.
                      If you plan to travel, review current active warning zones below.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="cp-warning-actions">
                {loc.isAffected ? (
                  <>
                    <button 
                      className="cp-btn-primary-action"
                      onClick={() => setGuidanceModalOpen(true)}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      What Should I Do Now?
                    </button>

                    <button 
                      className="cp-btn-secondary-action"
                      onClick={() => {
                        const mapEl = document.getElementById('cp-leaflet-map');
                        mapEl?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      View on Map &rarr;
                    </button>
                  </>
                ) : (
                  <button 
                    className="cp-btn-primary-action"
                    style={{ background: '#16a34a' }}
                    onClick={() => {
                      setSelectedId('mcleodganj');
                      showToast('Switched to active warning zone: McLeodganj');
                    }}
                  >
                    View Active Disaster Zones &rarr;
                  </button>
                )}

                <button 
                  className="cp-btn-share-action"
                  onClick={handleShare}
                  title="Share Warning Alert"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  Share Alert
                </button>
              </div>

              {/* Quick links to active affected zones if safe */}
              {!loc.isAffected && (
                <div className="cp-active-zones-banner">
                  <div className="cp-active-zones-title">
                    <span>⚠️</span> Current Active Warning Zones in India:
                  </div>
                  <div className="cp-active-zones-list">
                    {(() => {
                      const activeZones = Object.keys(LOCATION_DATABASE).filter(k => {
                        const item = liveDistricts[k] || LOCATION_DATABASE[k];
                        return item.isAffected;
                      });

                      if (activeZones.length === 0) {
                        return <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>None</span>;
                      }

                      return activeZones.slice(0, 6).map(k => {
                        const item = liveDistricts[k] || LOCATION_DATABASE[k];
                        const isExtreme = item.riskLevel?.includes('EXTREME');
                        const icon = isExtreme ? '🔴' : '🟠';
                        return (
                          <button key={k} className="cp-zone-chip" onClick={() => setSelectedId(k)}>
                            {icon} {item.name} {item.liveObservation?.temp !== undefined ? `(${item.liveObservation.temp}°C, ${item.liveObservation.rain} mm/h)` : ''}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
            )}

            <div className="cp-warning-footer">
              <span>{loc.lastUpdatedText || `Last updated: ${liveIstTime}`}</span>
              <span>{loc.dataSourceText || 'Source: VAYUNET Live Telemetry (weather.indianapi.in) ⓘ'}</span>
            </div>
          </div>

          {/* Right: Map Card */}
          <div className="cp-map-card" id="cp-leaflet-map">
            <div className="cp-map-viewport">

              {/* LAYERS BUTTON & PANEL */}
              <div className="cp-layers-container">
                <button 
                  className="cp-layers-btn"
                  onClick={() => setLayersOpen(!layersOpen)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
                  LAYERS
                </button>

                {layersOpen && (
                  <div className="cp-layers-panel">
                    <div className="cp-layers-header">MAP LAYERS</div>
                    
                    <div className="cp-layers-group">
                      <div className="cp-layers-grouptitle">BASE</div>
                      <label className="cp-radio-label">
                        <input type="radio" checked={baseMap === 'streets'} onChange={() => setBaseMap('streets')} />
                        Streets
                      </label>
                      <label className="cp-radio-label">
                        <input type="radio" checked={baseMap === 'satellite'} onChange={() => setBaseMap('satellite')} />
                        Satellite
                      </label>
                    </div>

                    <div className="cp-layers-group">
                      <div className="cp-layers-grouptitle">WEATHER</div>
                      <label className="cp-checkbox-label">
                        <input type="checkbox" checked={owmCloudLayer} onChange={(e) => setOwmCloudLayer(e.target.checked)} />
                        Clouds (OpenWeatherMap)
                      </label>
                      {owmCloudLayer && (
                        <div className="cp-opacity-slider">
                          <span>Opacity</span>
                          <input 
                            type="range" 
                            min="0" max="100" 
                            value={cloudOpacity * 100} 
                            onChange={(e) => setCloudOpacity(e.target.value / 100)} 
                          />
                        </div>
                      )}
                      
                      <label className="cp-checkbox-label">
                        <input type="checkbox" checked={rainLayer} onChange={(e) => setRainLayer(e.target.checked)} />
                        Rainfall
                      </label>
                    </div>

                    <div className="cp-layers-group">
                      <div className="cp-layers-grouptitle">TERRAIN</div>
                      <label className="cp-checkbox-label">
                        <input type="checkbox" checked={terrainLayer} onChange={(e) => setTerrainLayer(e.target.checked)} />
                        Elevation / Terrain
                      </label>
                    </div>

                    <div className="cp-layers-group">
                      <div className="cp-layers-grouptitle">VAYUNET</div>
                      <label className="cp-checkbox-label">
                        <input type="checkbox" checked={riskLayer} onChange={(e) => setRiskLayer(e.target.checked)} />
                        Hazard Risk Zones
                      </label>
                    </div>

                    <div className="cp-layers-group">
                      <div className="cp-layers-grouptitle">SAFETY</div>
                      <label className="cp-checkbox-label">
                        <input type="checkbox" checked={shelterLayer} onChange={(e) => setShelterLayer(e.target.checked)} />
                        Shelters
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Dynamic Legend for Weather Layers */}
              <div className="cp-weather-legends">
                {owmCloudLayer && (
                  <div className="cp-weather-legend-box">
                    <strong>CLOUDS (OWM)</strong><br/>
                    <span style={{color:'#64748b'}}>Source: OpenWeatherMap</span><br/>
                    <span className="cp-live-dot">● LIVE</span> {new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}
                  </div>
                )}
                {rainLayer && (
                  <div className="cp-weather-legend-box">
                    <strong>RAINFALL</strong><br/>
                    <span style={{color:'#64748b'}}>Proxy: RainViewer</span><br/>
                    <span className="cp-live-dot">● LIVE</span> Timestamp: {radarTimestamp}
                  </div>
                )}
              </div>


              <MapContainer
                center={loc.center}
                zoom={11}
                scrollWheelZoom={true}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
              >
                {baseMap === 'streets' && (
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" zIndex={1} />
                )}
                {baseMap === 'satellite' && (
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" zIndex={1} />
                )}
                
                {terrainLayer && (
                  <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" opacity={0.5} zIndex={2} />
                )}
                
                {owmCloudLayer && (
                  <TileLayer 
                    url={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${import.meta.env.VITE_OPENWEATHER_API_KEY || ''}`} 
                    opacity={cloudOpacity} 
                    zIndex={3}
                    maxNativeZoom={9}
                    maxZoom={18}
                  />
                )}
                
                {rainLayer && (
                  <TileLayer 
                    url={`http://localhost:8000/api/warnings/map/tiles/rainfall/{z}/{x}/{y}?time_param=${radarTimestamp}`}
                    opacity={0.7} 
                    zIndex={4}
                    maxNativeZoom={12}
                    maxZoom={18}
                  />
                )}

                <MapFlyController center={loc.center} zoom={loc.isAffected ? 12 : 10} />

                {/* Concentric Risk Heat Zones if affected */}
                {(loc.isAffected && riskLayer) && (
                  <>
                    {/* Outermost: Advisory Blue */}
                    <Circle
                      center={loc.center}
                      radius={12000}
                      pathOptions={{
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.15,
                        weight: 1,
                        dashArray: '4 4'
                      }}
                    />
                    {/* Outer: Moderate Yellow */}
                    <Circle
                      center={loc.center}
                      radius={8500}
                      pathOptions={{
                        color: '#eab308',
                        fillColor: '#eab308',
                        fillOpacity: 0.28,
                        weight: 1.5
                      }}
                    />
                    {/* Mid: High Orange */}
                    <Circle
                      center={loc.center}
                      radius={5000}
                      pathOptions={{
                        color: '#f97316',
                        fillColor: '#f97316',
                        fillOpacity: 0.45,
                        weight: 2
                      }}
                    />
                    {/* Core: Extreme Red */}
                    <Circle
                      center={loc.center}
                      radius={2800}
                      pathOptions={{
                        color: '#dc2626',
                        fillColor: '#dc2626',
                        fillOpacity: 0.65,
                        weight: 2.5
                      }}
                    />
                  </>
                )}

                {shelterLayer && currentShelter && (
                <Marker
                  position={currentShelter?.coords}
                  icon={L.divIcon({
                    className: 'cp-shelter-marker',
                    html: `
                      <div style="background: #16a34a; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 14px;">
                        🏛️
                      </div>
                    `,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                  })}
                >
                  <Popup>
                    <div style={{ padding: '4px' }}>
                      <strong style={{ color: '#16a34a' }}>🏛️ Designated Safe Shelter</strong>
                      <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>{currentShelter?.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{currentShelter?.address}</div>
                      <button 
                        onClick={openGoogleDirections}
                        style={{ marginTop: '6px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Navigate &rarr;
                      </button>
                    </div>
                  </Popup>
                </Marker>
                )}

                {/* Central Location Pin */}
                <Marker position={[loc.liveObservation?.lat ?? loc.center[0], loc.liveObservation?.lng ?? loc.center[1]]} icon={targetPinIcon}>
                  <Popup>
                    <div>
                      <strong>{loc.name}</strong>
                      <div>{loc.hazard}</div>
                      <div style={{ fontSize: '11px', color: loc.riskColor, fontWeight: 700 }}>{loc.riskLevel}</div>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>

              {/* Map Floating Legend */}
              <div className="cp-map-legend-box">
                <div className="cp-map-legend-title">Warning Level</div>
                <div className="cp-legend-item">
                  <div className="cp-legend-dot extreme"></div>
                  <span>Extreme</span>
                </div>
                <div className="cp-legend-item">
                  <div className="cp-legend-dot high"></div>
                  <span>High</span>
                </div>
                <div className="cp-legend-item">
                  <div className="cp-legend-dot moderate"></div>
                  <span>Moderate</span>
                </div>
                <div className="cp-legend-item">
                  <div className="cp-legend-dot advisory"></div>
                  <span>Advisory</span>
                </div>
              </div>

              {/* Show Nearby Areas button */}
              <button 
                className="cp-map-nearby-toggle"
                onClick={() => {
                  setShowNearbyOnMap(!showNearbyOnMap);
                  showToast(showNearbyOnMap ? 'Hidden nearby points' : 'Showing all nearby regional zones');
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                {showNearbyOnMap ? 'Hide Nearby Areas' : 'Show Nearby Areas'}
              </button>

              <div className="cp-map-scale-badge">5 km scale</div>
            </div>
          </div>
        </div>

        {/* Middle Triplet Row: 3 Action Cards */}
        <div className="cp-triplet-grid">
          {/* Card 1: What This Means */}
          <div className="cp-action-card">
            <div className="cp-card-header">
              <span className="cp-card-icon">🌧️</span>
              <h3 className="cp-card-title">What This Means</h3>
            </div>
            <ul className="cp-means-list">
              <li className="cp-means-item">
                <span className="cp-means-icon">👤</span>
                <span>{loc.isAffected ? 'Flash flooding in low-lying areas' : 'Normal water flow in rivers and local drains'}</span>
              </li>
              <li className="cp-means-item">
                <span className="cp-means-icon">〰️</span>
                <span>{loc.isAffected ? 'Sudden rises in streams and rivers' : 'Streams operating within seasonal bounds'}</span>
              </li>
              <li className="cp-means-item">
                <span className="cp-means-icon">⚠️</span>
                <span>{loc.isAffected ? 'Road closures and unsafe travel' : 'Standard transit routes fully operational'}</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Do This Now */}
          <div className="cp-action-card">
            <div className="cp-card-header">
              <span className="cp-card-icon">🛡️</span>
              <h3 className="cp-card-title">Do This Now</h3>
            </div>
            <ul className="cp-steps-list">
              <li className="cp-step-item">
                <div className="cp-step-num" style={{ background: loc.isAffected ? '#dc2626' : '#16a34a' }}>1</div>
                <span>{loc.isAffected ? 'Move to higher and safer ground' : 'Keep emergency numbers saved'}</span>
              </li>
              <li className="cp-step-item">
                <div className="cp-step-num" style={{ background: loc.isAffected ? '#dc2626' : '#16a34a' }}>2</div>
                <span>{loc.isAffected ? 'Avoid rivers, streams and low-lying roads' : 'Charge power banks and mobile devices'}</span>
              </li>
              <li className="cp-step-item">
                <div className="cp-step-num" style={{ background: loc.isAffected ? '#dc2626' : '#16a34a' }}>3</div>
                <span>{loc.isAffected ? 'Do not travel unless necessary' : 'Check regional warnings before traveling'}</span>
              </li>
              <li className="cp-step-item">
                <div className="cp-step-num" style={{ background: loc.isAffected ? '#dc2626' : '#16a34a' }}>4</div>
                <span>{loc.isAffected ? 'Follow official instructions' : 'Stay tuned to official weather advisories'}</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Nearest Safe Location (Tailored to citizen's location!) */}
          <div className="cp-action-card">
            <div className="cp-card-header">
              <span className="cp-card-icon">🏛️</span>
              <h3 className="cp-card-title">Nearest Safe Location</h3>
              <span className="cp-card-badge">Verified Shelter</span>
            </div>

            <h4 className="cp-safe-shelter-name">{currentShelter?.name}</h4>
            <div className="cp-safe-shelter-dist">{currentShelter?.distance}</div>

            <div className="cp-shelter-actions">
              <button className="cp-btn-directions" onClick={openGoogleDirections}>
                Get Directions
              </button>
              <button className="cp-btn-view-more" onClick={() => setShelterModalOpen(true)}>
                View Details
              </button>
            </div>
          </div>
        </div>

        {/* Lower Row: Nearby Warnings + Emergency Contacts */}
        <div className="cp-lower-grid">
          {/* Nearby Warnings */}
          <div className="cp-lower-card">
            <div className="cp-nearby-header">
              <div className="cp-nearby-header-left">
                <span>🎯</span>
                <span>Nearby Warnings (within 50 km)</span>
              </div>
              <span 
                className="cp-view-all-link"
                onClick={() => showToast('Displaying full regional cluster stations')}
              >
                View All &rarr;
              </span>
            </div>

            {loc.nearbyWarnings.length > 0 ? (
              <div className="cp-nearby-pills-row">
                {loc.nearbyWarnings.map((nw, i) => (
                  <div 
                    key={i} 
                    className="cp-nearby-pill-card"
                    onClick={() => {
                      const key = nw.name.toLowerCase().replace(/[^a-z]/g, '');
                      if (allLocations[key]) {
                        setSelectedId(key);
                        showToast(`Switched view to ${nw.name}`);
                      } else {
                        showToast(`Station ${nw.name}: Current Status ${nw.level}`);
                      }
                    }}
                  >
                    <div className="cp-nearby-pill-top">
                      <div className="cp-nearby-dot" style={{ background: nw.color }}></div>
                      <span>{nw.name}</span>
                    </div>
                    <div className="cp-nearby-dist">{nw.dist}</div>
                    <div className={`cp-nearby-badge ${nw.level.toLowerCase()}`}>
                      {nw.level}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#64748b', padding: '12px 0' }}>
                No severe warning zones within 50 km of this location. Surroundings are nominal.
              </div>
            )}
          </div>

          {/* Emergency Contacts */}
          <div className="cp-lower-card">
            <div className="cp-nearby-header">
              <div className="cp-nearby-header-left">
                <span>📞</span>
                <span>Emergency Contacts</span>
              </div>
            </div>

            <div className="cp-emergency-row">
              <a href="tel:112" className="cp-contact-btn">
                <span className="cp-contact-icon">📞</span>
                <div className="cp-contact-info">
                  <span className="cp-contact-num red">112</span>
                  <span className="cp-contact-label">Emergency</span>
                </div>
              </a>

              <a href="tel:108" className="cp-contact-btn">
                <span className="cp-contact-icon">🚑</span>
                <div className="cp-contact-info">
                  <span className="cp-contact-num red">108</span>
                  <span className="cp-contact-label">Ambulance</span>
                </div>
              </a>

              <a href="tel:100" className="cp-contact-btn">
                <span className="cp-contact-icon">👮</span>
                <div className="cp-contact-info">
                  <span className="cp-contact-num blue">100</span>
                  <span className="cp-contact-label">Police</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Official Source & Transparency Banner */}
        <div className="cp-info-banner">
          <div className="cp-info-left">
            <span className="cp-info-icon">ℹ️</span>
            <span>
              <strong>VAYUNET</strong> provides predictive weather intelligence to support early awareness.
              Follow instructions issued by local authorities and official emergency agencies.
            </span>
          </div>
          <a 
            href="https://mausam.imd.gov.in" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="cp-info-link"
          >
            View Official Source &rarr;
          </a>
        </div>
      </main>

      {/* 4. SMART REDEFINED SOVEREIGN FOOTER WITH GSAP ANIMATIONS */}
      <footer className="cp-footer relative overflow-hidden" ref={footerRef}>

        {/* Row 1: Live System Telemetry Strip */}
        <div className="cp-footer-telemetry cp-footer-anim-item">
          <div className="cp-telemetry-inner">
            <div className="cp-telemetry-status">
              <span className="cp-footer-telemetry-dot"></span>
              <span><strong>{t.telemetryTitle}:</strong> {t.telemetryNominal}</span>
            </div>
            <div className="cp-telemetry-metrics">
              <span>{t.telemetryInsat} <strong>{t.online100}</strong></span>
              <span className="cp-telemetry-sep">•</span>
              <span>{t.telemetryImdaa} <strong>{t.coupled}</strong></span>
              <span className="cp-telemetry-sep">•</span>
              <span>{t.telemetryLatency} <strong>&lt; 120 ms</strong></span>
              <span className="cp-telemetry-sep">•</span>
              <span>{t.telemetryCap} <strong>{t.activeStatus}</strong></span>
            </div>
          </div>
        </div>

        {/* Row 2: 4-Column Rich Information Architecture */}
        <div className="cp-footer-main">
          <div className="cp-footer-grid">
            {/* Col 1: Brand & Sovereign Mandate */}
            <div className="cp-footer-col cp-footer-brand-col cp-footer-anim-item">
              <div className="cp-footer-brand">
                <div className="home-logo" style={{ width: 38, height: 38 }}>
                  <img src="/VAYUNET_LOGO.png" alt="VAYUNET Logo" className="home-logo-img" />
                </div>
                <div>
                  <h2>VAYUNET</h2>
                  <p>{t.footerSubtitle}</p>
                </div>
              </div>
              <p className="cp-footer-desc">
                {t.footerDesc}
              </p>
              <div className="cp-footer-emblem-badge">
                <img src="/emblem-india.svg" alt="State Emblem of India" className="cp-gov-emblem-img" />
                <div className="cp-gov-text" style={{ color: '#cbd5e1' }}>
                  {t.moes}
                  <span style={{ color: '#94a3b8' }}>{t.goi}</span>
                </div>
              </div>
            </div>

            {/* Col 2: Public Safety & Early Warnings */}
            <div className="cp-footer-col cp-footer-anim-item">
              <h3 className="cp-footer-heading">{t.footerCol2Title}</h3>
              <ul className="cp-footer-link-list">
                <li><button className="cp-footer-btn-link" onClick={() => setSelectedId('mcleodganj')}>{t.footerRadar}</button></li>
                <li><button className="cp-footer-btn-link" onClick={() => setShelterModalOpen(true)}>{t.footerShelter}</button></li>
                <li><button className="cp-footer-btn-link" onClick={() => setGuidanceModalOpen(true)}>{t.footerProtocols}</button></li>
                <li><button className="cp-footer-btn-link" onClick={() => setGuidanceModalOpen(true)}>{t.footerEvac}</button></li>
                <li><button className="cp-footer-btn-link" onClick={() => showToast('CAP 1.2 XML Feed is broadcasting on /api/cap-feed')}>{t.footerCap}</button></li>
              </ul>
            </div>

            {/* Col 3: 24x7 Emergency Hotlines */}
            <div className="cp-footer-col cp-footer-anim-item">
              <h3 className="cp-footer-heading">{t.footerCol3Title}</h3>
              <div className="cp-footer-hotlines">
                <a href="tel:112" className="cp-footer-hotline-card">
                  <div className="cp-hotline-num">112</div>
                  <div className="cp-hotline-desc">
                    <strong>{t.hotline112Title}</strong>
                    <span>{t.hotline112Sub}</span>
                  </div>
                </a>
                <a href="tel:108" className="cp-footer-hotline-card">
                  <div className="cp-hotline-num">108</div>
                  <div className="cp-hotline-desc">
                    <strong>{t.hotline108Title}</strong>
                    <span>{t.hotline108Sub}</span>
                  </div>
                </a>
                <a href="tel:1078" className="cp-footer-hotline-card">
                  <div className="cp-hotline-num">1078</div>
                  <div className="cp-hotline-desc">
                    <strong>{t.hotline1078Title}</strong>
                    <span>{t.hotline1078Sub}</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Col 4: Sovereign Institutional Partners */}
            <div className="cp-footer-col cp-footer-anim-item">
              <h3 className="cp-footer-heading">{t.footerCol4Title}</h3>
              <ul className="cp-footer-link-list">
                <li><a href="https://www.moes.gov.in" target="_blank" rel="noreferrer">{t.instMoes}</a></li>
                <li><a href="https://mausam.imd.gov.in" target="_blank" rel="noreferrer">{t.instImd}</a></li>
                <li><a href="https://www.ncmrwf.gov.in" target="_blank" rel="noreferrer">{t.instNcmrwf}</a></li>
                <li><a href="https://ndma.gov.in" target="_blank" rel="noreferrer">{t.instNdma}</a></li>
                <li><a href="https://www.mosdac.gov.in" target="_blank" rel="noreferrer">{t.instIsro}</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Row 3: Bottom Legal & Compliance */}
        <div className="cp-footer-bottom cp-footer-anim-item">
          <div className="cp-footer-bottom-inner">
            <div className="cp-footer-legal">
              <span>{t.legalCopyright}</span>
              <span>{t.legalCompliance}</span>
            </div>
            <div className="cp-footer-bottom-links">
              <span onClick={() => showToast('VAYUNET Privacy Policy: No personal location data is stored permanently.')}>{t.legalPrivacy}</span>
              <span onClick={() => showToast('Terms of Service: Public alerts provided for early safety awareness.')}>{t.legalTerms}</span>
              <span onClick={onEnterPortal}>{t.legalPortal}</span>
              <span onClick={() => setShareModalOpen(true)}>{t.legalWarnings}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. SHARE ALERT MODAL */}
      {shareModalOpen && (
        <div className="cp-modal-backdrop" onClick={() => setShareModalOpen(false)}>
          <div className="cp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <h3 className="cp-modal-title">
                <span>📢</span> Share Weather Alert
              </h3>
              <button className="cp-modal-close" onClick={() => setShareModalOpen(false)}>✕</button>
            </div>
            <div className="cp-modal-body">
              <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '18px', lineHeight: 1.5 }}>
                Help keep your community safe. Share this official severe weather warning with family, neighbors, and travel groups.
              </p>

              <div className="cp-share-options">
                <a 
                  className="cp-share-btn whatsapp"
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`⚠️ VAYUNET ALERT for ${loc.name} (${loc.district}): ${loc.hazard}. Read official warning & safe shelter details: ${window.location.href}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShareModalOpen(false)}
                >
                  <span>💬</span> Share on WhatsApp
                </a>

                <a 
                  className="cp-share-btn twitter"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`⚠️ Emergency Weather Warning for ${loc.name} (${loc.district}): ${loc.hazard}. Check nearest safe location via VAYUNET: ${window.location.href}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShareModalOpen(false)}
                >
                  <span>🐦</span> Share on X (Twitter)
                </a>

                <button className="cp-share-btn" onClick={copyPageLink}>
                  <span>🔗</span> Copy Portal Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. "WHAT SHOULD I DO NOW?" SAFETY GUIDANCE MODAL */}
      {guidanceModalOpen && (
        <div className="cp-modal-backdrop" onClick={() => setGuidanceModalOpen(false)}>
          <div className="cp-modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <h3 className="cp-modal-title">
                <span>🛡️</span> Immediate Action Checklist
              </h3>
              <button className="cp-modal-close" onClick={() => setGuidanceModalOpen(false)}>✕</button>
            </div>
            <div className="cp-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: '16px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13px' }}>
                <strong>⚠️ Time-Critical Warning:</strong> Rapid flash floods can surge with zero acoustic warning in mountain nullahs. Complete these actions immediately.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ background: '#dc2626', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>1</span>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>Evacuate Low-Lying Riverbeds & Gullies</strong>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>Move uphill immediately. Do not park vehicles near nullahs or camp on river islands.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ background: '#dc2626', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>2</span>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>Assemble Emergency Go-Bag</strong>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>Essential medicines, drinking water bottle, power bank, whistle, waterproof torch, and ID cards.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ background: '#dc2626', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>3</span>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>Head to {currentShelter?.name}</strong>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>Located {currentShelter?.distance}. Equipped with power backup, clean water, and SDRF contact.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ background: '#dc2626', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>4</span>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>Do NOT Walk or Drive Through Floodwaters</strong>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>Just 6 inches of rushing mountain water can sweep an adult away; 12 inches can carry an SUV.</p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '22px', display: 'flex', gap: '12px' }}>
                <button 
                  className="cp-btn-primary-action"
                  style={{ flex: 1 }}
                  onClick={openGoogleDirections}
                >
                  Navigate to Safe Shelter &rarr;
                </button>
                <button 
                  className="cp-btn-secondary-action"
                  onClick={() => setGuidanceModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. SHELTER DETAILS MODAL */}
      {shelterModalOpen && (
        <div className="cp-modal-backdrop" onClick={() => setShelterModalOpen(false)}>
          <div className="cp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <h3 className="cp-modal-title">
                <span>🏛️</span> Designated Shelter Details
              </h3>
              <button className="cp-modal-close" onClick={() => setShelterModalOpen(false)}>✕</button>
            </div>
            <div className="cp-modal-body">
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '18px', color: '#0f172a', margin: '0 0 4px 0' }}>{currentShelter?.name}</h4>
                <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>{currentShelter?.distance}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#334155' }}>
                <div><strong>Address:</strong> {currentShelter?.address}</div>
                <div><strong>Elevation:</strong> {currentShelter?.elevation}</div>
                <div><strong>Authorized Capacity:</strong> {currentShelter?.capacity}</div>
                <div><strong>Available Facilities:</strong> {currentShelter?.facilities}</div>
                <div><strong>Helpline:</strong> <span style={{ color: '#0284c7', fontWeight: 700 }}>{currentShelter?.contact}</span></div>
              </div>

              <div style={{ marginTop: '22px', display: 'flex', gap: '12px' }}>
                <button 
                  className="cp-btn-primary-action"
                  style={{ flex: 1, background: '#0284c7' }}
                  onClick={openGoogleDirections}
                >
                  Open in Google Maps &rarr;
                </button>
                <button 
                  className="cp-btn-secondary-action"
                  onClick={() => setShelterModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="cp-toast">
          <span>🔔</span> {toastMessage}
        </div>
      )}
    </div>
  );
}
