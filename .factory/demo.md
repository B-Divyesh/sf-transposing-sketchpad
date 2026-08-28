# Demo sandbox

Open `https://transposing-sketchpad.sociobot.in/demo` or select **Try it with
sample data** on the landing page.

The demo opens a seven-entry B♭ clarinet warm-up named “Clarinet warm-up:
morning phrase.” It includes quarter notes, a rest, and a half note so the
paired written/sounding staff, playback, selection, transposition, and file
tools are immediately usable.

Demo state lives in memory only. The demo code does not open the real
`transposing-sketchpad` IndexedDB database. Reloading or selecting **Reset
demo** recreates the original sample. **Start for real** opens a blank real
sketch. Tests prove that entering, resetting, leaving, and reloading the demo
do not read, replace, or append to an existing real sketch.
