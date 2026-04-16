const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  if (!res.ok) {
    console.error("Error listing models:", data);
    process.exit(1);
  }
  
  console.log(JSON.stringify(data.models, null, 2));
}

listModels();
