import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../errors/AppError.js';
import logger from '../config/logger.js';

const SYSTEM_INSTRUCTION = `Eres un analista experto en consumo eléctrico residencial en México (CFE).
Analiza el historial de un contrato y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "summary": "resumen breve del patrón de consumo",
  "anomalies": ["anomalía 1", "anomalía 2"],
  "recommendations": ["recomendación 1", "recomendación 2"]
}
Sin markdown, sin texto adicional, solo el JSON.`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function parseResponse(text) {
  try {
    return JSON.parse(text.trim());
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new AppError('El modelo no devolvió un JSON válido', 502);
  }
}

export async function callGemini(context, contractId) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { responseMimeType: 'application/json' },
  });

  logger.info({ event: 'gemini_request', model: 'gemini-2.5-flash', contractId }, 'ai metric');

  const start = Date.now();
  const result = await model.generateContent(
    `Analiza el siguiente contrato eléctrico:\n${JSON.stringify(context, null, 2)}`
  );

  const usage = result.response.usageMetadata;
  logger.info({
    event: 'gemini_response',
    contractId,
    durationMs: Date.now() - start,
    promptTokens: usage?.promptTokenCount,
    completionTokens: usage?.candidatesTokenCount,
  }, 'ai metric');

  return parseResponse(result.response.text());
}
