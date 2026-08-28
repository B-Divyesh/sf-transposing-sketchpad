// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { blankSketch } from '../src/music';
import { decodeSketch, encodeSketch } from '../src/share';

it('round-trips a Unicode-titled sketch through a compact share fragment', () => {
  const sketch = blankSketch();
  sketch.title = 'Clarinette étude ♫';
  sketch.notes = [{ id: 'n1', soundingMidi: 60, duration: 1 }];
  const encoded = encodeSketch(sketch);
  expect(encoded).not.toContain('+');
  expect(decodeSketch(encoded)).toMatchObject({ title: sketch.title, notes: sketch.notes });
});
