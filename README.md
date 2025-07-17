base URL
https://ultratec-admin-backend.onrender.com

AIzaSyBfFli6IWfYgj6e7FrWlP4KhM4UTDsvoZg
curl "https://generativelanguage.googleapis.com/v1beta/model/gemini-2.0-flash:generateContent?key=GEMINI_API_KEY" \
-H 'Content-Type: application/json' \
-X POST \
-d '{
"contents": [{
"parts":[{"text": "Explain how AI works"}]
}]
}'
asd
