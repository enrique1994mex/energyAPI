import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../errors/AppError.js';

const SYSTEM_INSTRUCTION = `Eres un analista experto en consumo eléctrico residencial en México (CFE).
Analiza el historial de un contrato y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "summary": "resumen breve del patrón de consumo",
  "anomalies": ["anomalía 1", "anomalía 2"],
  "recommendations": ["recomendación 1", "recomendación 2"]
}
Sin markdown, sin texto adicional, solo el JSON.`;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function buildUserMessage(context) {
  return `Analiza el siguiente contrato eléctrico:\n${JSON.stringify(context, null, 2)}`;
}

function parseResponse(text) {
  try {
    return JSON.parse(text.trim());
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new AppError('El modelo no devolvió un JSON válido', 502);
  }
}

async function callClaude(context) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: SYSTEM_INSTRUCTION,
    messages: [{ role: 'user', content: buildUserMessage(context) }],
  });
  return parseResponse(response.content[0].text);
}

async function callGemini(context) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await model.generateContent(buildUserMessage(context));
  return parseResponse(result.response.text());
}

const providers = { claude: callClaude, gemini: callGemini };

export async function callLLM(context) {
  const providerName = process.env.AI_PROVIDER ?? 'claude';
  const provider = providers[providerName];
  if (!provider) {
    throw new AppError(`Proveedor de IA "${providerName}" no soportado. Use "claude" o "gemini".`, 500);
  }
  return provider(context);
}
