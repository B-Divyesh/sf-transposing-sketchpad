import { BEATS_PER_BAR, beatsUsed, isInRange, pitchName, writtenMidi } from './music';
import type { Instrument, Sketch, SketchNote } from './types';

const WIDTH = 1040;
const LEFT = 92;
const BAR_WIDTH = 114;
const STAFF_GAP = 12;

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]!);
}

function pitchY(midi: number, centerY: number): number {
  return Math.max(centerY - 50, Math.min(centerY + 50, centerY + (60 - midi) * 3.2));
}

function staff(y: number, label: string, kind: 'written' | 'sounding'): string {
  const lines = Array.from({ length: 5 }, (_, index) => `<line x1="${LEFT}" y1="${y + index * STAFF_GAP}" x2="${LEFT + BAR_WIDTH * 8}" y2="${y + index * STAFF_GAP}" />`).join('');
  const bars = Array.from({ length: 9 }, (_, index) => `<line class="bar-line" x1="${LEFT + index * BAR_WIDTH}" y1="${y}" x2="${LEFT + index * BAR_WIDTH}" y2="${y + STAFF_GAP * 4}" />`).join('');
  const numbers = Array.from({ length: 8 }, (_, index) => `<text class="bar-number" x="${LEFT + index * BAR_WIDTH + 7}" y="${y - 10}">${index + 1}</text>`).join('');
  return `<g class="staff staff--${kind}"><text class="staff-name" x="16" y="${y + 9}">${label}</text>${lines}${bars}${numbers}</g>`;
}

function noteMarkup(note: SketchNote, index: number, beat: number, instrument: Instrument, selectedId?: string, playingIndex = -1): string {
  const x = LEFT + (beat + note.duration / 2) * (BAR_WIDTH / BEATS_PER_BAR);
  const sounding = note.soundingMidi;
  const selected = note.id === selectedId;
  const playing = index === playingIndex;
  const classes = ['score-note', selected ? 'is-selected' : '', playing ? 'is-playing' : ''].filter(Boolean).join(' ');
  if (sounding === null) {
    return `<g class="${classes}" data-note-id="${escape(note.id)}" role="button" tabindex="0" aria-label="Rest, ${note.duration} beats, note ${index + 1}"><rect class="rest-mark" x="${x - 6}" y="88" width="12" height="7" rx="2"/><rect class="rest-mark rest-mark--sound" x="${x - 6}" y="256" width="12" height="7" rx="2"/><text class="note-index" x="${x}" y="332">${index + 1}</text></g>`;
  }
  const written = writtenMidi(sounding, instrument);
  const topY = pitchY(written, 112);
  const bottomY = pitchY(sounding, 280);
  const rangeClass = isInRange(sounding, instrument) ? '' : ' is-out-of-range';
  const label = `${pitchName(written)} written, sounds ${pitchName(sounding)}, ${note.duration} beats, note ${index + 1}${rangeClass ? ', outside typical range' : ''}`;
  return `<g class="${classes}${rangeClass}" data-note-id="${escape(note.id)}" role="button" tabindex="0" aria-label="${escape(label)}">
    <line class="pitch-thread" x1="${x}" y1="${topY + 8}" x2="${x}" y2="${bottomY - 8}" />
    <ellipse class="note-head note-head--written" cx="${x}" cy="${topY}" rx="8" ry="5.5" transform="rotate(-15 ${x} ${topY})" />
    <line class="note-stem note-stem--written" x1="${x + 7}" y1="${topY}" x2="${x + 7}" y2="${topY - 29}" />
    <path class="note-head note-head--sounding" d="M ${x - 8} ${bottomY} L ${x} ${bottomY - 7} L ${x + 8} ${bottomY} L ${x} ${bottomY + 7} Z" />
    <line class="note-stem note-stem--sounding" x1="${x + 7}" y1="${bottomY}" x2="${x + 7}" y2="${bottomY - 29}" />
    <text class="note-index" x="${x}" y="332">${index + 1}</text>
  </g>`;
}

export function renderScore(sketch: Sketch, instrument: Instrument, selectedId?: string, playingIndex = -1): string {
  let beat = 0;
  const notes = sketch.notes.map((note, index) => {
    const markup = noteMarkup(note, index, beat, instrument, selectedId, playingIndex);
    beat += note.duration;
    return markup;
  }).join('');
  const used = beatsUsed(sketch.notes);
  const cursorX = LEFT + used * (BAR_WIDTH / BEATS_PER_BAR);
  return `<svg class="score" viewBox="0 0 ${WIDTH} 350" role="img" aria-labelledby="score-title score-description">
    <title id="score-title">Paired written and sounding pitch staff</title>
    <desc id="score-description">Eight bars in four four time. ${sketch.notes.length ? `${sketch.notes.length} entries use ${used} of 32 beats.` : 'The score is empty.'} Select a note to inspect or delete it.</desc>
    <defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    ${staff(88, 'WRITTEN', 'written')}
    ${staff(256, 'SOUNDS', 'sounding')}
    <line class="entry-cursor" x1="${cursorX}" y1="70" x2="${cursorX}" y2="314" />
    ${notes}
  </svg>`;
}
