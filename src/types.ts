export type Duration = 0.5 | 1 | 2 | 4;

export interface SketchNote {
  id: string;
  soundingMidi: number | null;
  duration: Duration;
}

export interface Sketch {
  version: 1;
  title: string;
  instrumentId: string;
  tempo: number;
  duration: Duration;
  notes: SketchNote[];
  updatedAt: string;
}

export interface Instrument {
  id: string;
  name: string;
  family: string;
  soundingShift: number;
  writtenRange: [number, number];
  color: string;
}
