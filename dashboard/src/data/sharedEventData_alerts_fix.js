// Read the existing file and fix the mockAlert and SHARED_ALERTS
const fs = require('fs');

let content = fs.readFileSync('/Users/prateekpd/Projects/SIH/VayuNet/dashboard/src/data/sharedEventData.js', 'utf8');

// I will just use sed or multi_replace_file_content to do it.
