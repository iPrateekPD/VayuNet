import re

filepath = r"d:\PROJECTS\VayuNet-main\frontend\src\services\liveWeatherService.js"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Refactor fetchLiveObservation to use V4 API
new_fetchLiveObservation = """export async function fetchLiveObservation(lat, lon, cityName = '') {
  let region = cityName || 'Unknown';
  try {
    const res = await fetch(`http://localhost:8000/api/weather/imd/current?region=${encodeURIComponent(region)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        temp: data.temperature_c || 0,
        rain: data.rainfall_mm || 0,
        humidity: data.humidity_pct || 0,
        pressure: data.pressure_hpa || 1000,
        windSpeed: data.wind_speed_ms || 0,
        windDir: data.wind_direction_deg || 0,
        status: data.status || 'DATA_UNAVAILABLE',
        weatherCode: data.quality === 'GOOD' ? 1 : 0,
        source: data.source || 'IMD V4',
        isLive: data.status === 'LIVE'
      };
    }
  } catch (err) {
    console.error('V4 API Error:', err);
  }
  return null;
}"""

# Replace the existing function
content = re.sub(r'export async function fetchLiveObservation\(lat, lon, cityName = \'\'\).*?return liveData;\n}', new_fetchLiveObservation, content, flags=re.DOTALL)

# Refactor fetchLiveDistrictWarning to use V4 API
new_fetchLiveDistrictWarning = """export async function fetchLiveDistrictWarning(districtKey, baseLocationData) {
  if (!baseLocationData) return null;
  let region = baseLocationData.name || districtKey;
  try {
    const res = await fetch(`http://localhost:8000/api/risk/${encodeURIComponent(region)}`);
    if (res.ok) {
      const data = await res.json();
      
      const vayu = data.vayunet?.hazards?.thunderstorm || {};
      const riskLevel = vayu.risk_level || 'UNKNOWN';
      const isAffected = riskLevel === 'MODERATE' || riskLevel === 'HIGH' || riskLevel === 'EXTREME';
      
      let riskClass = 'risk-unknown';
      let riskColor = '#9ca3af';
      if (riskLevel === 'MODERATE') { riskClass = 'risk-high'; riskColor = '#ca8a04'; }
      if (riskLevel === 'HIGH') { riskClass = 'risk-high'; riskColor = '#ea580c'; }
      if (riskLevel === 'EXTREME') { riskClass = 'risk-extreme'; riskColor = '#dc2626'; }
      if (riskLevel === 'SAFE') { riskClass = 'risk-safe'; riskColor = '#16a34a'; }

      const aws = data.observations?.aws || {};
      
      return {
        ...baseLocationData,
        isAffected,
        riskLevel,
        riskClass,
        riskColor,
        timeframe: 'V4 Assessment',
        hazard: data.official_information?.imd_warnings?.length > 0 ? data.official_information.imd_warnings[0].hazard : 'Nominal',
        description: `V4 Unified Risk Engine. Status: ${data.data_quality?.overall || 'UNKNOWN'}.`,
        liveObservation: {
          temp: aws.temperature_c || 0,
          rain: aws.rainfall_mm || 0,
          humidity: aws.humidity_pct || 0,
          pressure: aws.pressure_hpa || 0,
          windSpeed: aws.wind_speed_ms || 0,
          windDir: aws.wind_direction_deg || 0,
          status: aws.status || 'DATA_UNAVAILABLE',
          source: 'V4 Unified API',
        },
        lastUpdatedText: `Last updated: ${data.timestamp}`,
        dataSourceText: `Source: V4 Fusion`,
      };
    }
  } catch (err) {
    console.error('V4 Risk API Error:', err);
  }
  return baseLocationData;
}"""

content = re.sub(r'export async function fetchLiveDistrictWarning\(districtKey, baseLocationData\).*?return baseLocationData;\n}', new_fetchLiveDistrictWarning, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully refactored liveWeatherService.js to use V4 endpoints!")
