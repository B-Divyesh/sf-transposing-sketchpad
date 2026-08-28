import type { SketchNote } from './types';

let context: AudioContext | undefined;

function audioContext(): AudioContext {
  context ??= new AudioContext();
  return context;
}

export function midiFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export async function soundNote(midi: number, seconds = 0.42, when?: number): Promise<void> {
  const audio = audioContext();
  if (audio.state === 'suspended') await audio.resume();
  const start = when ?? audio.currentTime;
  const gain = audio.createGain();
  const main = audio.createOscillator();
  const warmth = audio.createOscillator();
  main.type = 'triangle';
  warmth.type = 'sine';
  main.frequency.value = midiFrequency(midi);
  warmth.frequency.value = midiFrequency(midi) * 2;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.17, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  main.connect(gain); warmth.connect(gain); gain.connect(audio.destination);
  main.start(start); warmth.start(start);
  main.stop(start + seconds + 0.03); warmth.stop(start + seconds + 0.03);
}

export async function playSequence(notes: SketchNote[], tempo: number, onStep: (index: number) => void, signal: AbortSignal): Promise<void> {
  const beatMs = 60_000 / tempo;
  for (let index = 0; index < notes.length; index += 1) {
    if (signal.aborted) break;
    onStep(index);
    const note = notes[index];
    if (note.soundingMidi !== null) await soundNote(note.soundingMidi, Math.max(0.1, note.duration * beatMs / 1000 * 0.82));
    await new Promise<void>((resolve) => {
      const timeout = window.setTimeout(resolve, note.duration * beatMs);
      signal.addEventListener('abort', () => { clearTimeout(timeout); resolve(); }, { once: true });
    });
  }
  onStep(-1);
}
