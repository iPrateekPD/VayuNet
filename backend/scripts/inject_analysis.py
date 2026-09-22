import re

filepath = r"d:\PROJECTS\VayuNet-main\frontend\src\components\AnalysisView.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state and effect hooks
new_state = """  const selectedSector = globalSelectedLocation || 'Chamoli, Uttarakhand';
  const setSelectedSector = setGlobalSelectedLocation || (() => {});
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState('satellite');

  // NEW: State for API Data
  const [apiData, setApiData] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/risk/${encodeURIComponent(selectedSector)}`);
        if (res.ok) {
          const data = await res.json();
          setApiData(data);
        }
      } catch (err) {
        console.error('Failed to fetch risk data for analysis', err);
        setApiData(null);
      }
    };
    fetchData();
  }, [selectedSector]);

  const awsData = apiData?.observations?.aws || {};
  const hazardData = apiData?.vayunet?.hazards?.thunderstorm || {};
  const isDataAvailable = awsData.status !== 'DATA_UNAVAILABLE' && awsData.status !== undefined;
"""

content = re.sub(
    r"  const selectedSector = globalSelectedLocation \|\| 'Chamoli, Uttarakhand';\n.*?  const \[activeLayer, setActiveLayer\] = useState\('satellite'\); // 'satellite' \| 'radar'",
    new_state,
    content,
    flags=re.DOTALL
)

# 2. Replace hardcoded "08 Sep 2026, 11:52 PM IST"
content = content.replace("08 Sep 2026, 11:52 PM IST", "{apiData?.timestamp ? new Date(apiData.timestamp).toLocaleString() : 'Fetching...'}")

# 3. Replace AI Analysis Card header
ai_header_old = """<AlertTriangle size={24} color="#ef4444" strokeWidth={2.2} />
                  <span className="ana-ai-title">AI Analysis</span>
                  <span className="ana-ai-conf-badge">High Confidence (82%)</span>
                </div>

                <div className="ana-ai-header-right">
                  <span className="ana-risk-label">Risk Level</span>
                  <span className="ana-risk-val">HIGH</span>"""
ai_header_new = """<AlertTriangle size={24} color={isDataAvailable ? "#ef4444" : "#9ca3af"} strokeWidth={2.2} />
                  <span className="ana-ai-title">AI Analysis ({apiData?.vayunet?.model_version || 'V4.0'})</span>
                  <span className="ana-ai-conf-badge">{isDataAvailable ? `Confidence (${Math.round(hazardData.probability * 100 || 0)}%)` : 'DATA UNAVAILABLE'}</span>
                </div>

                <div className="ana-ai-header-right">
                  <span className="ana-risk-label">Risk Level</span>
                  <span className="ana-risk-val">{hazardData.risk_level || 'UNKNOWN'}</span>"""
content = content.replace(ai_header_old, ai_header_new)

# 4. Replace hardcoded Atmospheric Conditions
atm_old = """<h2 className="ana-section-title">Atmospheric Conditions (Current)</h2>

              <div className="ana-atm-metrics-grid">
                {/* Metric 1: CAPE */}
                <div className="ana-atm-box">
                  <div className="ana-atm-box-left">
                    <Thermometer size={24} color="#ef4444" className="ana-atm-icon" />
                  </div>
                  <div className="ana-atm-box-content">
                    <span className="ana-atm-label">CAPE</span>
                    <span className="ana-atm-val" style={{ color: '#ef4444' }}>2450 J/kg</span>
                    <span className="ana-atm-badge badge-high">High</span>
                  </div>
                </div>

                {/* Metric 2: IWV */}
                <div className="ana-atm-box">
                  <div className="ana-atm-box-left">
                    <Droplet size={24} color="#38bdf8" className="ana-atm-icon" />
                  </div>
                  <div className="ana-atm-box-content">
                    <span className="ana-atm-label">IWV</span>
                    <span className="ana-atm-val" style={{ color: '#f8fafc' }}>48 mm</span>
                    <span className="ana-atm-badge badge-high">High</span>
                  </div>
                </div>

                {/* Metric 3: Vertical Shear */}
                <div className="ana-atm-box">
                  <div className="ana-atm-box-left">
                    <Wind size={24} color="#38bdf8" className="ana-atm-icon" />
                  </div>
                  <div className="ana-atm-box-content">
                    <span className="ana-atm-label">Vertical Shear</span>
                    <span className="ana-atm-val" style={{ color: '#f8fafc' }}>18 m/s</span>
                    <span className="ana-atm-badge badge-mod">Moderate</span>
                  </div>
                </div>

                {/* Metric 4: CTT Drop Rate */}
                <div className="ana-atm-box">
                  <div className="ana-atm-box-left">
                    <CloudSnow size={24} color="#cbd5e1" className="ana-atm-icon" />
                  </div>
                  <div className="ana-atm-box-content">
                    <span className="ana-atm-label">CTT Drop Rate</span>
                    <span className="ana-atm-val" style={{ color: '#f8fafc' }}>-12 °C/hr</span>
                    <span className="ana-atm-badge badge-high">High</span>
                  </div>
                </div>
              </div>"""

atm_new = """<h2 className="ana-section-title">Atmospheric Conditions (IMD AWS)</h2>

              <div className="ana-atm-metrics-grid">
                <div className="ana-atm-box">
                  <div className="ana-atm-box-left">
                    <Thermometer size={24} color="#ef4444" className="ana-atm-icon" />
                  </div>
                  <div className="ana-atm-box-content">
                    <span className="ana-atm-label">Temperature</span>
                    <span className="ana-atm-val" style={{ color: '#f8fafc' }}>{isDataAvailable ? `${awsData.temperature_c} °C` : '--'}</span>
                  </div>
                </div>

                <div className="ana-atm-box">
                  <div className="ana-atm-box-left">
                    <Droplet size={24} color="#38bdf8" className="ana-atm-icon" />
                  </div>
                  <div className="ana-atm-box-content">
                    <span className="ana-atm-label">Rainfall Rate</span>
                    <span className="ana-atm-val" style={{ color: '#f8fafc' }}>{isDataAvailable ? `${awsData.rainfall_mm} mm/h` : '--'}</span>
                  </div>
                </div>

                <div className="ana-atm-box">
                  <div className="ana-atm-box-left">
                    <Wind size={24} color="#38bdf8" className="ana-atm-icon" />
                  </div>
                  <div className="ana-atm-box-content">
                    <span className="ana-atm-label">Wind Speed</span>
                    <span className="ana-atm-val" style={{ color: '#f8fafc' }}>{isDataAvailable ? `${awsData.wind_speed_ms} km/h` : '--'}</span>
                  </div>
                </div>

                <div className="ana-atm-box">
                  <div className="ana-atm-box-left">
                    <Activity size={24} color="#cbd5e1" className="ana-atm-icon" />
                  </div>
                  <div className="ana-atm-box-content">
                    <span className="ana-atm-label">Humidity</span>
                    <span className="ana-atm-val" style={{ color: '#f8fafc' }}>{isDataAvailable ? `${awsData.humidity_pct} %` : '--'}</span>
                  </div>
                </div>
              </div>"""

content = content.replace(atm_old, atm_new)

# Save
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully wired AnalysisView.jsx to V4 backend API!")
