import re
import os

filepath = r"d:\PROJECTS\VayuNet-main\frontend\src\components\AlertsView.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the giant array with an empty one
content = re.sub(r'const INITIAL_INCIDENTS = \[.*?\];', 'const INITIAL_INCIDENTS = [];', content, flags=re.DOTALL)

# Update state initialization to handle empty arrays
content = content.replace('useState(INITIAL_INCIDENTS[0])', 'useState(null)')

# Save back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully cleared INITIAL_INCIDENTS in AlertsView.jsx")
