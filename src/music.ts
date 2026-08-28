import type { Duration, Instrument, Sketch, SketchNote } from './types';

export const TOTAL_BEATS = 32;
export const BEATS_PER_BAR = 4;

export const instruments: Instrument[] = [
  { id: 'clarinet-bb', name: 'B♭ clarinet', family: 'Woodwind', soundingShift: -2, writtenRange: [52, 96], color: '#71e1d4' },
  { id: 'trumpet-bb', name: 'B♭ trumpet', family: 'Brass', soundingShift: -2, writtenRange: [54, 82], color: '#ffd275' },
  { id: 'alto-sax-eb', name: 'E♭ alto sax', family: 'Woodwind', soundingShift: -9, writtenRange: [49, 80], color: '#ffb38a' },
  { id: 'tenor-sax-bb', name: 'B♭ tenor sax', family: 'Woodwind', soundingShift: -14, writtenRange: [50, 80], color: '#91baff' },
  { id: 'horn-f', name: 'Horn in F', family: 'Brass', soundingShift: -7, writtenRange: [35, 77], color: '#d9f77e' },
  { id: 'piccolo-c', name: 'Piccolo', family: 'Woodwind', soundingShift: 12, writtenRange: [62, 96], color: '#e7b7ff' },
];

const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

export function pitchName(midi: number): string {
  return `${NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

export function writtenMidi(soundingMidi: number, instrument: Instrument): number {
  return soundingMidi - instrument.soundingShift;
}

export function transposeSentence(soundingMidi: number, instrument: Instrument): string {
  const written = pitchName(writtenMidi(soundingMidi, instrument));
  const sounding = pitchName(soundingMidi);
  if (instrument.soundingShift === 0) return `You write ${written}. It sounds the same: ${sounding}.`;
  return `You write ${written}. It sounds ${sounding}.`;
}

export function beatsUsed(notes: SketchNote[]): number {
  return notes.reduce((sum, note) => sum + note.duration, 0);
}

export function canAdd(notes: SketchNote[], duration: Duration): boolean {
  return beatsUsed(notes) + duration <= TOTAL_BEATS;
}

export function isInRange(soundingMidi: number, instrument: Instrument): boolean {
  const written = writtenMidi(soundingMidi, instrument);
  return written >= instrument.writtenRange[0] && written <= instrument.writtenRange[1];
}

export function blankSketch(): Sketch {
  return {
    version: 1,
    title: 'Untitled eight-bar sketch',
    instrumentId: 'clarinet-bb',
    tempo: 96,
    duration: 1,
    notes: [],
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeSketch(value: unknown): Sketch {
  if (!value || typeof value !== 'object') throw new Error('This file does not contain a sketch.');
  const raw = value as Partial<Sketch>;
  if (raw.version !== 1 || !Array.isArray(raw.notes)) throw new Error('This sketch version is not supported.');
  if (!instruments.some((item) => item.id === raw.instrumentId)) throw new Error('This sketch uses an unknown instrument.');
  const tempo = Number(raw.tempo);
  if (!Number.isFinite(tempo) || tempo < 40 || tempo > 220) throw new Error('Tempo must be between 40 and 220 BPM.');
  const validDurations = new Set([0.5, 1, 2, 4]);
  const notes = raw.notes.map((note, index) => {
    if (!note || !validDurations.has(note.duration) || (note.soundingMidi !== null && (!Number.isInteger(note.soundingMidi) || note.soundingMidi < 21 || note.soundingMidi > 108))) {
      throw new Error(`Note ${index + 1} is invalid.`);
    }
    return { id: String(note.id || `import-${index}`), soundingMidi: note.soundingMidi, duration: note.duration } as SketchNote;
  });
  if (beatsUsed(notes) > TOTAL_BEATS) throw new Error('The imported sketch is longer than eight bars.');
  return {
    version: 1,
    title: String(raw.title || 'Imported sketch').slice(0, 80),
    instrumentId: raw.instrumentId!,
    tempo,
    duration: validDurations.has(raw.duration as number) ? raw.duration as Duration : 1,
    notes,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}
