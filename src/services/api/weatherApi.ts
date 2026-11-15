/**
 * Clima real da região da Av. Paulista (São Paulo) via Open-Meteo (gratuita, sem chave).
 * A chuva influencia a simulação: o fluxo de carros aumenta e a IA ajusta os tempos de verde.
 * Se a API estiver fora do ar ou o celular estiver sem internet, cai para um valor de exemplo.
 */
import type { Weather } from '@/domain/types';

const URL =
  'https://api.open-meteo.com/v1/forecast?latitude=-23.5614&longitude=-46.6559' +
  '&current=temperature_2m,precipitation,weather_code&timezone=America%2FSao_Paulo';

const FALLBACK: Weather = {
  source: 'mock',
  temperature: 24,
  description: 'Parcialmente nublado',
  isRaining: false,
};

function describe(code: number): string {
  if (code === 0) return 'Céu limpo';
  if (code <= 3) return 'Parcialmente nublado';
  if (code === 45 || code === 48) return 'Neblina';
  if (code >= 51 && code <= 57) return 'Garoa';
  if (code >= 61 && code <= 67) return 'Chuva';
  if (code >= 80 && code <= 82) return 'Pancadas de chuva';
  if (code >= 95) return 'Tempestade';
  return 'Nublado';
}

const isRainCode = (code: number) =>
  (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;

interface OpenMeteoResponse {
  current?: { temperature_2m?: number; precipitation?: number; weather_code?: number };
}

export async function getWeather(): Promise<Weather> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as OpenMeteoResponse;
    const c = json.current;
    if (!c || typeof c.temperature_2m !== 'number') throw new Error('Resposta inesperada');
    const code = c.weather_code ?? 0;
    return {
      source: 'open-meteo',
      temperature: Math.round(c.temperature_2m),
      description: describe(code),
      isRaining: (c.precipitation ?? 0) > 0 || isRainCode(code),
    };
  } catch {
    return FALLBACK;
  } finally {
    clearTimeout(timer);
  }
}
