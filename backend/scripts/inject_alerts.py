import re

filepath = r"d:\PROJECTS\VayuNet-main\frontend\src\components\AlertsView.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the useEffect that syncs the selected incident
old_effect = """  // Synchronize when global location changes
  useEffect(() => {
    if (globalSelectedLocation) {
      const match = INITIAL_INCIDENTS.find(inc => inc.location === globalSelectedLocation);
      if (match) setSelectedIncident(match);
    }
  }, [globalSelectedLocation]);"""

new_effect = """  // Fetch Active Alerts from V4 API
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/alerts/active');
        if (res.ok) {
          const data = await res.json();
          setIncidents(data.alerts || []);
          if (data.alerts && data.alerts.length > 0) {
            setSelectedIncident(data.alerts[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch active alerts', err);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize when global location changes
  useEffect(() => {
    if (globalSelectedLocation && incidents.length > 0) {
      const match = incidents.find(inc => inc.region === globalSelectedLocation || inc.district === globalSelectedLocation);
      if (match) setSelectedIncident(match);
    }
  }, [globalSelectedLocation, incidents]);"""

content = content.replace(old_effect, new_effect)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully injected V4 alert fetching into AlertsView.jsx")
