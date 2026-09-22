import re
import os

filepath = r"d:\PROJECTS\VayuNet-main\frontend\src\components\CitizenPortal.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Strip all the hardcoded risk logic from LOCATION_DATABASE
# We'll use regex to remove these fields from the database objects
fields_to_remove = [
    r"\s*isAffected:\s*(true|false),",
    r"\s*riskLevel:\s*['\"].*?['\"],",
    r"\s*riskClass:\s*['\"].*?['\"],",
    r"\s*riskColor:\s*['\"].*?['\"],",
    r"\s*timeframe:\s*['\"].*?['\"],",
    r"\s*hazard:\s*['\"].*?['\"],",
    r"\s*description:\s*['\"].*?['\"],"
]

for field in fields_to_remove:
    content = re.sub(field, "", content)

# 2. Fix resolveLocationData which forces SAFE ZONE based on simple logic
content = content.replace("let riskLevel = 'SAFE ZONE';", "let riskLevel = 'UNKNOWN';")
content = content.replace("let riskClass = 'risk-safe';", "let riskClass = 'risk-unknown';")
content = content.replace("let riskColor = '#16a34a';", "let riskColor = '#9ca3af';")

# 3. Save it back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully stripped hardcoded risk data from CitizenPortal.jsx")
