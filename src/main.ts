import './styles.css';
import { playSequence, soundNote } from './audio';
import { blankSketch, beatsUsed, canAdd, instruments, isInRange, normalizeSketch, pitchName, transposeSentence, writtenMidi } from './music';
import { renderScore } from './score';
import { decodeSketch, shareUrl } from './share';
import { loadSketch, saveSketch } from './storage';
import type { Duration, Sketch, SketchNote } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
let sketch = blankSketch();
let selectedId: string | undefined;
let playingIndex = -1;
let status = 'Loading your local sketch…';
let loadError = '';
let previousNotes: SketchNote[] | undefined;
let playController: AbortController | undefined;
let saveTimer = 0;
let online = navigator.onLine;

const KEYBOARD = [
  ['a', 60], ['w', 61], ['s', 62], ['e', 63], ['d', 64], ['f', 65], ['t', 66], ['g', 67], ['y', 68], ['h', 69], ['u', 70], ['j', 71],
  ['k', 72], ['o', 73], ['l', 74], ['p', 75], [';', 76], ["'", 77],
] as const;

function instrument() {
  return instruments.find((item) => item.id === sketch.instrumentId) ?? instruments[0];
}

function activeNote(): SketchNote | undefined {
  return sketch.notes.find((note) => note.id === selectedId) ?? sketch.notes.at(-1);
}

function setStatus(message: string): void {
  status = message;
  const region = document.querySelector<HTMLElement>('#status');
  if (region) region.textContent = message;
}

function queueSave(): void {
  sketch.updatedAt = new Date().toISOString();
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    try {
      await saveSketch(sketch);
      const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(sketch.updatedAt));
      setStatus(`Saved on this device at ${time}.`);
    } catch {
      setStatus('Could not save locally. Export a JSON copy to keep this sketch.');
    }
  }, 180);
}

function mutate(message: string): void {
  queueSave();
  status = message;
  render();
}

function addEntry(soundingMidi: number | null): void {
  if (!canAdd(sketch.notes, sketch.duration)) {
    setStatus('All eight bars are full. Choose a shorter note, delete an entry, or start a new sketch.');
    document.querySelector<HTMLElement>('#capacity')?.focus();
    return;
  }
  const note: SketchNote = { id: crypto.randomUUID(), soundingMidi, duration: sketch.duration };
  sketch.notes.push(note);
  selectedId = note.id;
  if (soundingMidi !== null) void soundNote(soundingMidi);
  const message = soundingMidi === null ? `Added a ${sketch.duration}-beat rest.` : transposeSentence(soundingMidi, instrument());
  mutate(message);
}

function deleteSelected(): void {
  if (!selectedId) return;
  const index = sketch.notes.findIndex((note) => note.id === selectedId);
  if (index < 0) return;
  previousNotes = structuredClone(sketch.notes);
  sketch.notes.splice(index, 1);
  selectedId = sketch.notes[Math.min(index, sketch.notes.length - 1)]?.id;
  mutate(`Deleted entry ${index + 1}. Undo is available.`);
}

function undoDelete(): void {
  if (!previousNotes) return;
  sketch.notes = previousNotes;
  previousNotes = undefined;
  selectedId = sketch.notes.at(-1)?.id;
  mutate('Restored the deleted entry.');
}

function translationPanel(): string {
  const note = activeNote();
  if (!note) return `<p class="translation-empty">Choose a key below. You enter the pitch you want to <strong>hear</strong>; the upper staff shows what the player reads.</p>`;
  if (note.soundingMidi === null) return `<p class="translation-sentence">This entry is a rest in both staves.</p>`;
  const inst = instrument();
  const written = writtenMidi(note.soundingMidi, inst);
  const inRange = isInRange(note.soundingMidi, inst);
  return `<div class="pitch-equation">
    <div><span class="eyebrow eyebrow--written">Player reads</span><strong>${pitchName(written)}</strong></div>
    <span aria-hidden="true" class="equation-arrow">→</span>
    <div><span class="eyebrow eyebrow--sounding">Room hears</span><strong>${pitchName(note.soundingMidi)}</strong></div>
  </div>
  <p class="translation-sentence">${transposeSentence(note.soundingMidi, inst)}</p>
  <p class="range-status ${inRange ? 'in-range' : 'out-range'}">${inRange ? 'Within the typical written range.' : `Range note: ${pitchName(written)} is outside this instrument’s typical written range (${pitchName(inst.writtenRange[0])}–${pitchName(inst.writtenRange[1])}). You can keep it and revise later.`}</p>`;
}

function keyboardMarkup(): string {
  const black = new Set([1, 3, 6, 8, 10]);
  return KEYBOARD.map(([key, midi]) => `<button class="piano-key ${black.has(midi % 12) ? 'piano-key--black' : 'piano-key--white'}" type="button" data-midi="${midi}" aria-label="Play sounding ${pitchName(midi)}, keyboard key ${key}"><span>${pitchName(midi)}</span><kbd>${key}</kbd></button>`).join('');
}

function render(): void {
  const inst = instrument();
  const used = beatsUsed(sketch.notes);
  const completeBars = Math.floor(used / 4);
  const remaining = 32 - used;
  const selected = Boolean(selectedId && sketch.notes.some((note) => note.id === selectedId));
  app.innerHTML = `
    <header class="site-header">
      <a class="wordmark" href="/" aria-label="Transposing Sketchpad home"><span class="wordmark-mark" aria-hidden="true">↕</span><span>TS / 08</span></a>
      <div class="connection-state"><span class="connection-dot ${online ? '' : 'is-offline'}"></span>${online ? 'Local-first' : 'Offline · still working'}</div>
    </header>
    <main id="main">
      <section class="masthead" aria-labelledby="page-title">
        <div class="masthead-copy">
          <p class="kicker">An instrument-aware melody notebook</p>
          <h1 id="page-title">Write what they read.<br><em>Hear what sounds.</em></h1>
          <p class="lede">Sketch up to eight bars in concert pitch. The paired staff handles the transposition while you learn it by ear.</p>
          <a class="text-link" href="#workbench">Open the sketchpad <span aria-hidden="true">↓</span></a>
        </div>
        <figure class="hero-art">
          <picture>
            <source srcset="/assets/pitch-landscape.avif" type="image/avif" />
            <source srcset="/assets/pitch-landscape.webp" type="image/webp" />
            <img src="/assets/pitch-landscape.jpg" width="768" height="512" alt="" fetchpriority="high" decoding="async" />
          </picture>
          <figcaption>Two pitch planes, one musical idea.</figcaption>
        </figure>
      </section>

      <section id="workbench" class="workbench" aria-labelledby="workbench-title">
        <div class="workbench-heading">
          <div><p class="kicker">Eight bars · 4/4 · sounds-first entry</p><h2 id="workbench-title">Your transposition desk</h2></div>
          <div class="save-state" id="status" aria-live="polite">${status}</div>
        </div>
        ${loadError ? `<div class="notice notice--error" role="alert"><strong>Your saved sketch could not be opened.</strong> ${loadError} A fresh sketch is ready; import a previous JSON export if you have one.</div>` : ''}
        ${!online ? `<div class="notice" role="status"><strong>You’re offline.</strong> Entry, playback, saving, import, and export still work. Sharing a link can wait until you reconnect.</div>` : ''}

        <div class="control-rail" aria-label="Sketch settings">
          <label class="field"><span>Instrument</span><select id="instrument">${instruments.map((item) => `<option value="${item.id}" ${item.id === inst.id ? 'selected' : ''}>${item.name}</option>`).join('')}</select></label>
          <div class="instrument-fact"><span class="fact-dot" style="--instrument-color:${inst.color}"></span><span><strong>${inst.name}</strong><small>${inst.soundingShift === 12 ? 'sounds one octave higher' : `sounds ${Math.abs(inst.soundingShift)} semitones lower`} than written</small></span></div>
          <fieldset class="duration-field"><legend>Note length</legend><div class="segmented">${([0.5, 1, 2, 4] as Duration[]).map((duration) => `<button type="button" data-duration="${duration}" aria-pressed="${sketch.duration === duration}" title="${duration} beats">${duration === 0.5 ? '⅛' : duration === 1 ? '♩' : duration === 2 ? '𝅗𝅥' : '𝅝'}<span>${duration}</span></button>`).join('')}</div></fieldset>
          <label class="field field--tempo"><span>Tempo <output id="tempo-output">${sketch.tempo} BPM</output></span><input id="tempo" type="range" min="40" max="220" value="${sketch.tempo}" /></label>
          <button id="midi-button" class="button button--quiet" type="button">Connect MIDI</button>
        </div>

        <div class="score-heading">
          <label class="title-field"><span class="sr-only">Sketch title</span><input id="sketch-title" value="${sketch.title.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}" maxlength="80" /></label>
          <div id="capacity" class="capacity" tabindex="-1"><strong>${used}</strong> / 32 beats <span>· ${completeBars} bars + ${used % 4} beats</span></div>
        </div>

        <div class="score-shell ${sketch.notes.length ? '' : 'is-empty'}">
          <div class="legend" aria-label="Score legend"><span><i class="legend-written"></i>Written pitch</span><span><i class="legend-sounding"></i>Sounding pitch</span><span><i class="legend-thread"></i>Same musical moment</span></div>
          <div class="score-scroll">${renderScore(sketch, inst, selectedId, playingIndex)}</div>
          ${sketch.notes.length === 0 ? `<div class="empty-score"><strong>Your first note makes the bridge visible.</strong><span>Try sounding C4 with the A key.</span></div>` : ''}
        </div>

        <div class="transport">
          <button id="play" class="button button--primary" type="button" ${sketch.notes.length ? '' : 'disabled'}><span aria-hidden="true">${playingIndex >= 0 ? '■' : '▶'}</span>${playingIndex >= 0 ? 'Stop' : 'Play sketch'}</button>
          <button id="delete-note" class="button button--quiet" type="button" ${selected ? '' : 'disabled'}>Delete selected</button>
          <button id="undo" class="button button--quiet" type="button" ${previousNotes ? '' : 'disabled'}>Undo delete</button>
          <span class="transport-hint">Select score notes with click or Tab. Use Delete to remove.</span>
        </div>

        <section class="translation" aria-labelledby="translation-title">
          <div><p class="kicker">Live translation</p><h3 id="translation-title">What the player sees</h3></div>
          <div id="translation-detail">${translationPanel()}</div>
        </section>

        <section class="input-deck" aria-labelledby="input-title">
          <div class="input-heading"><div><p class="kicker">Concert-pitch input</p><h3 id="input-title">Play what you want to hear</h3></div><button id="add-rest" class="button button--quiet" type="button" ${remaining < sketch.duration ? 'disabled' : ''}>Add rest</button></div>
          <div class="piano" aria-label="Sounding pitch keyboard">${keyboardMarkup()}</div>
          <p class="keyboard-help">Computer keys A–' play C4–F5. MIDI input also enters sounding pitch. Audio begins only after you play.</p>
        </section>

        <section class="ownership" aria-labelledby="ownership-title">
          <div><p class="kicker">Local by design</p><h3 id="ownership-title">Your sketch stays yours</h3><p>Saved in this browser. No account, upload, tracking, or sample library.</p></div>
          <div class="ownership-actions">
            <button id="share" class="button button--secondary" type="button">Copy share link</button>
            <button id="export" class="button button--quiet" type="button">Export JSON</button>
            <label class="button button--quiet file-button">Import JSON<input id="import" type="file" accept="application/json,.json" /></label>
            <button id="clear" class="button button--danger" type="button">Start over</button>
          </div>
        </section>
      </section>
    </main>
    <footer><p>Made for curious ears. Synthesized locally; no sound leaves your device.</p><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav><p class="generated-note">Atmospheric artwork generated for this product.</p></footer>
    <dialog id="clear-dialog"><form method="dialog"><p class="kicker">Start over</p><h2>Clear all eight bars?</h2><p>This replaces the current local sketch. Export it first if you want a copy.</p><div class="dialog-actions"><button class="button button--quiet" value="cancel">Keep sketch</button><button class="button button--danger" id="confirm-clear" value="confirm">Clear sketch</button></div></form></dialog>
    <div class="update-toast" id="update-toast" hidden><span>A fresher sketchpad is ready.</span><button type="button" class="button button--secondary" id="reload">Update now</button></div>
  `;
  bindEvents();
}

function bindEvents(): void {
  document.querySelector<HTMLSelectElement>('#instrument')?.addEventListener('change', (event) => {
    sketch.instrumentId = (event.target as HTMLSelectElement).value;
    mutate(`Switched to ${instrument().name}. Sounding pitches stay fixed; the written staff has changed.`);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-duration]').forEach((button) => button.addEventListener('click', () => {
    sketch.duration = Number(button.dataset.duration) as Duration;
    mutate(`${button.dataset.duration}-beat entry selected.`);
  }));
  document.querySelector<HTMLInputElement>('#tempo')?.addEventListener('input', (event) => {
    sketch.tempo = Number((event.target as HTMLInputElement).value);
    document.querySelector('#tempo-output')!.textContent = `${sketch.tempo} BPM`;
    queueSave();
  });
  document.querySelector<HTMLInputElement>('#sketch-title')?.addEventListener('input', (event) => {
    sketch.title = (event.target as HTMLInputElement).value || 'Untitled eight-bar sketch';
    queueSave();
  });
  document.querySelectorAll<HTMLButtonElement>('[data-midi]').forEach((button) => button.addEventListener('click', () => addEntry(Number(button.dataset.midi))));
  document.querySelector('#add-rest')?.addEventListener('click', () => addEntry(null));
  document.querySelector('#delete-note')?.addEventListener('click', deleteSelected);
  document.querySelector('#undo')?.addEventListener('click', undoDelete);
  document.querySelectorAll<SVGGElement>('[data-note-id]').forEach((node) => {
    const select = () => { selectedId = node.dataset.noteId; status = `Selected entry ${sketch.notes.findIndex((note) => note.id === selectedId) + 1}.`; render(); };
    node.addEventListener('click', select);
    node.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); } });
  });
  document.querySelector('#play')?.addEventListener('click', togglePlayback);
  document.querySelector('#share')?.addEventListener('click', copyShareLink);
  document.querySelector('#export')?.addEventListener('click', exportJson);
  document.querySelector<HTMLInputElement>('#import')?.addEventListener('change', importJson);
  document.querySelector('#clear')?.addEventListener('click', () => document.querySelector<HTMLDialogElement>('#clear-dialog')?.showModal());
  document.querySelector('#confirm-clear')?.addEventListener('click', () => {
    playController?.abort(); sketch = blankSketch(); selectedId = undefined; previousNotes = undefined; mutate('Started a new blank sketch.');
  });
  document.querySelector('#midi-button')?.addEventListener('click', connectMidi);
  document.querySelector('#reload')?.addEventListener('click', () => window.location.reload());
}

function togglePlayback(): void {
  if (playController) { playController.abort(); playController = undefined; playingIndex = -1; setStatus('Playback stopped.'); render(); return; }
  playController = new AbortController();
  setStatus(`Playing ${sketch.notes.length} entries at ${sketch.tempo} BPM.`);
  void playSequence(sketch.notes, sketch.tempo, (index) => {
    playingIndex = index;
    if (index < 0) { playController = undefined; status = 'Playback finished.'; }
    render();
  }, playController.signal);
}

async function copyShareLink(): Promise<void> {
  const url = shareUrl(sketch);
  try {
    await navigator.clipboard.writeText(url);
    setStatus('Share link copied. It contains this sketch, not a cloud upload.');
  } catch {
    window.prompt('Copy this share link', url);
    setStatus('Share link is ready to copy.');
  }
}

function exportJson(): void {
  const blob = new Blob([JSON.stringify(sketch, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${sketch.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'sketch'}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus('Exported a portable JSON copy.');
}

async function importJson(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    sketch = normalizeSketch(JSON.parse(await file.text()));
    selectedId = sketch.notes.at(-1)?.id;
    previousNotes = undefined;
    mutate(`Imported “${sketch.title}”.`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'That file could not be imported.');
  } finally { input.value = ''; }
}

async function connectMidi(): Promise<void> {
  const midiNavigator = navigator as Navigator & { requestMIDIAccess?: () => Promise<{ inputs: Map<string, { name?: string; onmidimessage: ((event: { data: Uint8Array }) => void) | null }> }> };
  if (!midiNavigator.requestMIDIAccess) { setStatus('Web MIDI is not available in this browser. The on-screen and computer keyboards still work.'); return; }
  try {
    const access = await midiNavigator.requestMIDIAccess();
    if (!access.inputs.size) { setStatus('MIDI permission granted, but no input device was found. Connect one and try again.'); return; }
    access.inputs.forEach((input) => { input.onmidimessage = (event) => { if (!event.data) return; const [command, midi, velocity] = event.data; if ((command & 0xf0) === 0x90 && velocity > 0) addEntry(midi); }; });
    const names = [...access.inputs.values()].map((input) => input.name || 'MIDI input').join(', ');
    setStatus(`MIDI connected: ${names}. Play notes to enter sounding pitch.`);
  } catch { setStatus('MIDI access was not granted. You can keep using the on-screen or computer keyboard.'); }
}

function handleComputerKeyboard(event: KeyboardEvent): void {
  const target = event.target as HTMLElement;
  if (target.matches('input, select, textarea, button') || event.metaKey || event.ctrlKey || event.altKey) return;
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) { event.preventDefault(); deleteSelected(); return; }
  const found = KEYBOARD.find(([key]) => key === event.key.toLowerCase());
  if (found) { event.preventDefault(); addEntry(found[1]); }
}

async function initialize(): Promise<void> {
  render();
  try {
    const shared = window.location.hash.startsWith('#sketch=') ? decodeSketch(window.location.hash.slice(8)) : undefined;
    const local = await loadSketch();
    const requestsNewSketch = new URLSearchParams(window.location.search).has('new');
    sketch = requestsNewSketch ? blankSketch() : shared ?? (local ? normalizeSketch(local) : blankSketch());
    selectedId = sketch.notes.at(-1)?.id;
    status = requestsNewSketch ? 'Blank sketch ready. Saved locally after your first note.' : shared ? 'Opened a shared sketch. A local copy will be saved as you edit.' : local ? 'Restored your sketch from this device.' : 'Blank sketch ready. Saved locally after your first note.';
  } catch (error) {
    sketch = blankSketch();
    loadError = error instanceof Error ? error.message : 'The stored data was invalid.';
    status = 'Fresh sketch ready.';
  }
  render();
}

window.addEventListener('keydown', handleComputerKeyboard);
window.addEventListener('online', () => { online = true; status = 'Back online. Your local sketch is unchanged.'; render(); });
window.addEventListener('offline', () => { online = false; status = 'Offline. Your sketch still works and saves locally.'; render(); });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => setStatus('Offline installation is unavailable, but the sketchpad still works in this tab.'));
  });
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'UPDATE_AVAILABLE') document.querySelector<HTMLElement>('#update-toast')?.removeAttribute('hidden');
  });
}

void initialize();
