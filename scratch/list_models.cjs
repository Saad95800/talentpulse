const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const models = await genAI.listModels();
    console.log("Modèles disponibles :");
    models.models.forEach(m => {
      console.log(`- ${m.name} (${m.displayName}) - Input: ${m.inputTokenLimit}, Output: ${m.outputTokenLimit}`);
    });
  } catch (error) {
    console.error("Erreur lors du listage des modèles :", error.message);
  }
}

listModels();
