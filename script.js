// Enables Webmidi
await WebMidi.enable();

//Stores the variables for inputs and outputs
let myInput = WebMidi.inputs[0];
let myOutput = WebMidi.outputs[0];

// This defines all the possible major scales
const scales = {
  cMajor: [0, 2, 4, 5, 7, 9, 11],
  dbMajor: [0, 1, 3, 5, 6, 8, 10],
  dMajor: [1, 2, 4, 6, 7, 9, 11],
  ebMajor: [0, 2, 3, 5, 7, 8, 10],
  eMajor: [1, 3, 4, 6, 8, 9, 11],
  fMajor: [0, 2, 4, 5, 7, 9, 10],
  gbMajor: [1, 3, 5, 6, 8, 10, 11],
  gMajor: [0, 2, 4, 6, 7, 9, 11],
  abMajor: [0, 1, 3, 5, 7, 8, 10],
  aMajor: [1, 2, 4, 6, 8, 9, 11],
  bbMajor: [0, 2, 3, 5, 7, 9, 10],
  bMajor: [1, 3, 4, 6, 8, 10, 11],
};

// Makes C Major the default scale
let chosenScale = scales.cMajor;

// Gets the dropdown elements from the html
let dropIns = document.getElementById("dropdown-ins");
let dropOuts = document.getElementById("dropdown-outs");
let dropScale = document.getElementById("dropdown-scale");

// Populates the dropdown with the sclaes
for (let scaleName in scales) {
  dropScale.innerHTML += `<option value=${scaleName}>${scaleName}</option>`;
}

// Populates the midi input dropdown
WebMidi.inputs.forEach(function (input, num) {
  dropIns.innerHTML += `<option value=${num}>${input.name}</option>`;
});

// same thing but for the outputs
WebMidi.outputs.forEach(function (output, num) {
  dropOuts.innerHTML += `<option value=${num}>${output.name}</option>`;
});

/**
 * A function that transposes a MIDI note number to the nearest note within the chosen scale.
 * This function also ensures that the resulting note falls within the desired octave range.
 * @param {number} midi_number - The MIDI note number to be remapped.
 * @returns {number} The remapped MIDI note number.
 */
const remap = function (midi_number) {
  const octaveOffset = Math.floor(midi_number / 12) * 12; // Get the octave offset
  const noteWithinScale = midi_number % 12; // Get the note within the scale

  // Find the nearest note within the chosen scale
  let nearestNote = chosenScale.reduce((prev, curr) => {
    return Math.abs(curr - noteWithinScale) < Math.abs(prev - noteWithinScale) ? curr : prev;
  });

  // Add the octave offset to the nearest note
  let remappedNote = nearestNote + octaveOffset;

  // Ensure that the remapped note falls within the desired octave range
  while (remappedNote < 0) {
    remappedNote += 12; // Increase octave if note is below octave range
  }
  while (remappedNote > 127) {
    remappedNote -= 12; // Decrease octave if note is above octave range
  }

  return remappedNote;
};

// Adds event listener for any changes in dropdowns
dropIns.addEventListener("change", function () {
  // Remove existing event listeners
  if (myInput.hasListener("noteon")) {
    myInput.removeListener("noteon");
  }
  if (myInput.hasListener("noteoff")) {
    myInput.removeListener("noteoff");
  }

  // Updates the input devices
  myInput = WebMidi.inputs[dropIns.value];

  // Event listener for note on and off events
  myInput.addListener("noteon", "all", function (someMIDI) {
    console.log("Note On:", someMIDI.note.number);
  
    let noteNumber = someMIDI.note.number;
    let originalOctave = Math.floor(noteNumber / 12); // Calculate the original octave
  
    let remappedNoteNumber = remap(noteNumber);
    let scaleDegree = chosenScale.indexOf(remappedNoteNumber % 12);
  
    console.log("Scale Degree:", scaleDegree);
  
    const diatonicSeventhChords = {
      0: [0, 4, 7, 11],   // Major 7th chord for the root note
      1: [2, 5, 9, 0],    // Minor 7th chord for the second note
      2: [4, 7, 11, 2],   // Minor 7th chord for the third note
      3: [5, 9, 0, 4],    // Major 7th chord for the fourth note
      4: [7, 11, 2, 5],   // Dominant 7th chord for the fifth note
      5: [9, 0, 4, 7],    // Minor 7th chord for the sixth note
      6: [11, 2, 5, 9]    // Half-diminished 7th chord for the seventh note
    };
  
    //This section is responsible for playing the chords based on what scale degree is pressed
    if (diatonicSeventhChords.hasOwnProperty(scaleDegree)) {
      let chordIntervals = diatonicSeventhChords[scaleDegree];
      let rootNote = chosenScale[scaleDegree];
      let chordNotes = [];
  
      chordIntervals.forEach(interval => {
        let chordNote = rootNote + interval;
        chordNote = remap(chordNote);
  
        // Fixes ovctave issues
        let chordNoteOctave = Math.floor(chordNote / 12);
        while (chordNoteOctave < originalOctave) {
          chordNote += 12;
          chordNoteOctave++;
        }
        while (chordNoteOctave > originalOctave + 1) {
          chordNote -= 12;
          chordNoteOctave--;
        }
  
        chordNotes.push(chordNote);
      });
  
      console.log("Chord Notes:", chordNotes);
  
      chordNotes.forEach((note, index) => {
        let myNote = new Note(note);
        myOutput.sendNoteOn(myNote, index % 16); // send note on a specific channel
      });
    }
  });

  //event listener for all note off events
  myInput.addListener("noteoff", "all", function (someMIDI) {
    console.log("Note Off:", someMIDI.note.number);

    let noteNumber = someMIDI.note.number;
    let remappedNoteNumber = remap(noteNumber);
    let scaleDegree = chosenScale.indexOf(remappedNoteNumber % 12);

    console.log("Scale Degree (Note Off):", scaleDegree);

   
  });
});

dropOuts.addEventListener("change", function () {
  myOutput = WebMidi.outputs[dropOuts.value].channels[1];
});

dropScale.addEventListener("change", function () {
  chosenScale = scales[dropScale.value];
});
