export function buildInitialMessage(contractId, contract) {
  return {
    role: 'user',
    content: `Analiza el siguiente contrato eléctrico CFE:
- ID del contrato: ${contractId}
- Tarifa: ${contract.tariff.type}
- Ciudad: ${contract.city ?? 'no especificada'}

Usa las herramientas para obtener el historial de consumo y simular las facturas recientes. Cuando tengas suficiente información, devuelve el JSON de análisis.`,
  };
}
