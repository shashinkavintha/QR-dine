const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream("public/notification.mp3");
https.get("https://raw.githubusercontent.com/shashinkavintha/qr-menu-saas/main/public/notification.mp3", function(response) {
  // Try another public URL if that fails. Let's use a known public sound file.
  // Actually, I can just use a tiny base64 in the code, it's easier.
});
