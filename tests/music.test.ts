import { describe, expect, it } from 'vitest';
import { beatsUsed, canAdd, instruments, isInRange, normalizeSketch, pitchName, transposeSentence, writtenMidi } from '../src/music';

describe('transposition model', () => {
  it('maps concert C4 to written D4 for B-flat clarinet', () => {
    const clarinet = instruments.find((item) => item.id === 'clarinet-bb')!;
    expect(writtenMidi(60, clarinet)).toBe(62);
    expect(pitchName(62)).toBe('D4');
    expect(transposeSentence(60, clarinet)).toBe('You write D4. It sounds C4.');
  });

  it('maps concert C4 to written A4 for E-flat alto sax', () => {
    const alto = instruments.find((item) => item.id === 'alto-sax-eb')!;
    expect(writtenMidi(60, alto)).toBe(69);
    expect(isInRange(60, alto)).toBe(true);
  });

  it('maps piccolo an octave down on the written staff', () => {
    const piccolo = instruments.find((item) => item.id === 'piccolo-c')!;
    expect(writtenMidi(84, piccolo)).toBe(72);
  });
});

describe('eight-bar capacity', () => {
  const note = (duration: 0.5 | 1 | 2 | 4) => ({ id: crypto.randomUUID(), soundingMidi: 60, duration });

  it('accepts exactly 32 beats and rejects overflow', () => {
    const notes = Array.from({ length: 8 }, () => note(4));
    expect(beatsUsed(notes)).toBe(32);
    expect(canAdd(notes, 0.5)).toBe(false);
    expect(canAdd(notes.slice(0, 7), 4)).toBe(true);
  });

  it('rejects malformed and overlong imports', () => {
    expect(() => normalizeSketch({ version: 1, instrumentId: 'kazoo', tempo: 90, notes: [] })).toThrow('unknown instrument');
    expect(() => normalizeSketch({ version: 1, instrumentId: 'clarinet-bb', tempo: 90, notes: Array.from({ length: 9 }, () => note(4)) })).toThrow('longer than eight bars');
  });
});
