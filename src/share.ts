import type { Sketch } from './types';
import { normalizeSketch } from './music';

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

export function encodeSketch(sketch: Sketch): string {
  const compact = { ...sketch, updatedAt: undefined };
  return toBase64Url(JSON.stringify(compact));
}

export function decodeSketch(value: string): Sketch {
  return normalizeSketch(JSON.parse(fromBase64Url(value)));
}

export function shareUrl(sketch: Sketch, base = window.location.href): string {
  const url = new URL(base);
  url.hash = `sketch=${encodeSketch(sketch)}`;
  return url.toString();
}
