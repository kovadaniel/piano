
export const keyboard = {'C4': 'a', 'C#4': 'w', 'D4': 's', 'D#4': 'e', 'E4': 'd', 'F4': 'f', 'F#4': 't', 'G4': 'g', 'G#4': 'y', 'A4': 'h', 'A#4': 'u', 
                       'B4': 'j', 'C5': 'k', 'C#5': 'o', 'D5': 'l', 'D#5': 'p', 'E5': 'semicolon',}

export const notes = Object.keys(keyboard);
/*
const noteNames = ['C', 'C#',  'D', 'D#',  'E',  'F', 'F#',  'G', 'G#',  'A', 'A#',  'B'];
const octaves = 7;
                       
//export const keyboardKeys = Object.keys(keyboard);


export const allKeys = Array(octaves).fill(true).map((_, index) => {
    const octave = [];
    noteNames.map(note => {
        octave.push(note + (index + 1));
    });
    return octave;
}).flat();
*/

export const activeKeys = Object.values(keyboard);


//const pianoSynth = await new Tone.Sampler(pianoParams)..();

export const pianoParams = `{
    urls: {
        A0: "A0.mp3",
        C1: "C1.mp3",
        "D#1": "Ds1.mp3",
        "F#1": "Fs1.mp3",
        A1: "A1.mp3",
        C2: "C2.mp3",
        "D#2": "Ds2.mp3",
        "F#2": "Fs2.mp3",
        A2: "A2.mp3",
        C3: "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        A3: "A3.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        A5: "A5.mp3",
        C6: "C6.mp3",
        "D#6": "Ds6.mp3",
        "F#6": "Fs6.mp3",
        A6: "A6.mp3",
        C7: "C7.mp3",
        "D#7": "Ds7.mp3",
        "F#7": "Fs7.mp3",
        A7: "A7.mp3",
        C8: "C8.mp3"
    },
    release: 10,
    baseUrl: "https://tonejs.github.io/audio/salamander/"
}`
// synth that accept differect types of oscillators are place at the start.
// and their amout is set by amountOfSaveSynth const.
export const baseSynths = {Synth : '', MonoSynth: '', AMSynth: '', FMSynth: '', MembraneSynth: '', DuoSynth: '', MetalSynth: '', 
                           PluckSynth: '', Sampler: pianoParams}; // 'NoiseSynth',

export const amountOfSaveSynth = 4; // first 'amountOfSaveSynth' synths are save for using with all oscilators
export const saveSynths = Object.keys(baseSynths).slice(0, amountOfSaveSynth + 1);


export const baseOscillators = ['sine', 'square', 'triangle', 'sawtooth', 'pwm', 'pulse'];


// 'reference' in 'params' is the way to set a new value (set by our <input type="range">) to effect-object.
// In some cases 'reference' == fasle. That means that this effect cannot be modified by referencing to its properties
// so it has to have a 'pattern' property which contains an array with two values: 1. A part of the creation command before
// the position where effect are listed (as a string) and 2. A part after all effects are listed
 
export const baseEffects = [
    {
        name: 'Chorus',
        params: [{name: 'Frequency', min: 0, max: 50, step: 0.1, value: 0, reference: ['.set({frequency: ', '})']}, // value is always at min
                {name: 'Delay', min: 2, max: 50, step: 0.1, value: 2, reference: ['.set({delayTime: ', '})']},    
                {name: 'Depth', min: 1, max: 10, step: 0.1, value: 1, reference: ['.set({depth: ', '})']}],
        //pattern: ['new Tone.Chorus().toDestination().start()'],
        pattern: 'new Tone.Chorus().toDestination().start()',
    }, 
    {
        name: 'Tremolo',
        params: [{name: 'Frequency', min: 0, max: 1000, step: 1, value: 0, reference: ['.set({frequency: ', '})']},  //reference: '.frequency.value'}, 
                {name: 'Depth', min: 0, max: 1, step: 0.1, value: 1, reference: ['.set({depth: ', '})']}], //reference: '.depth.input.value'}],
        //pattern: ['new Tone.Tremolo(',').toDestination().start()'],
        pattern: 'new Tone.Tremolo().toDestination().start()',
    },                
    {
        name: 'Vibrato',
        params: [{name: 'Frequency', min: 0, max: 10, step: 0.1, value: 8, reference: ['.set({frequency: ', '})']}, //reference: '.frequency.value'}, 
                {name: 'Depth', min: 0, max: 1, step: 0.1, value: 0.5, reference: ['.set({depth: ', '})']}], //reference: '.depth.input.value'}],
        //pattern: ['new Tone.Vibrato(',').toDestination()'],
        pattern: 'new Tone.Vibrato().toDestination()',
    }, 
    {
        name: 'Phaser',
        params: [{name: 'Frequency', min: 0, max: 100, step: 0.1, value: 0.5, reference: ['.set({frequency: ', '})']}, //reference: '.frequency.value'}, 
                {name: 'Octaves', min: 0, max: 4, step: 1, value: 3, reference: ['.set({octaves: ', '})']}, //reference: '.octave'},
                {name: 'Base', min: 0, max: 2000, step: 1, value: 350, reference: ['.set({baseFrequency: ', '})']}], //reference: '.basefrequency'}],
        //pattern: ['new Tone.Phaser(',').toDestination()'],
        pattern: 'new Tone.Phaser().toDestination()',
    },             
    {
        name: 'Reverb',
        params: [{name: 'Room Size', min: 0, max: 0.9, step: 0.01, value: 0.2, reference: ['.set({roomSize: ', '})']}],//reference: '.roomSize.input.value'}],
        //pattern: ['new Tone.JCReverb(',').toDestination()'],
        pattern: 'new Tone.JCReverb().toDestination()',
    }, 
    {
        name: 'Distortion',
        params: [{name: 'Distortion', min: 0, max: 10, step: 0.1, value: 1.5, reference: ['.set({distortion: ', '})']}],
        //pattern: ['new Tone.Distortion(',').toDestination()'],
        pattern: 'new Tone.Distortion().toDestination()',
    }, 
    {
        name: 'BitCrusher',
        params: [{name: 'Bit', min: 1, max: 8, step: 1, value: 4, reference: ['.set({bits: ', '})'] }],
        //pattern: ['new Tone.BitCrusher(',').toDestination()'],
        pattern: 'new Tone.BitCrusher().toDestination()',
    },
];

// previous baseEffects
/*
// 'reference' in 'params' is the way to set a new value (set by our <input type="range">) to effect-object.
// In some cases 'reference' == fasle. That means that this effect cannot be modified by referencing to its properties
// so it has to have a 'pattern' property which contains an array with two values: 1. A part of the creation command before
// the position where effect are listed (as a string) and 2. A part after all effects are listed

export const baseEffects = [
    {
        name: 'Chorus',
        params: [{name: 'Frequency', min: 0, max: 50, step: 0.1, reference: '.frequency.value'}, // value is always at min
                {name: 'Delay', min: 2, max: 50, step: 0.1, reference: '.delayTime'},    
                {name: 'Depth', min: 1, max: 10, step: 0.1, reference: '.depth'}],
        object: 'new Tone.Chorus(0, 2, 1).toDestination().start()'
    }, 
    {
        name: 'Tremolo',
        params: [{name: 'Frequency', min: 0, max: 50, step: 0.1, reference: '.frequency.value'}, 
                {name: 'Depth', min: 1, max: 50, step: 0.1, reference: '.depth.input.value'}],
        object: 'new Tone.Tremolo(0, 1).toMaster().start()'
    },                
    {
        name: 'Vibrato',
        params: [{name: 'Frequency', min: 0, max: 10, step: 0.1, reference: '.frequency.value'}, 
                {name: 'Depth', min: 1, max: 10, step: 0.1, reference: '.depth.input.value'}],
        object: 'new Tone.Vibrato(4, 0.5).toDestination()'
    }, 
    {
        name: 'Phaser',
        params: [{name: 'Frequency', min: 0, max: 100, step: 0.1, reference: '.frequency.value'}, 
                {name: 'Octaves', min: 0, max: 4, step: 1, reference: '.octave'},
                {name: 'Base', min: 0, max: 2000, step: 1, reference: '.basefrequency'}],
        object: 'new Tone.Phaser(0.5, 3, 350).toDestination()'
    },             
    {
        name: 'Reverb',
        params: [{name: 'Room Size', min: 0, max: 0.9, step: 0.01, reference: '.roomSize.input.value'}],
        object: 'new Tone.JCReverb(0.2).toDestination()'
    }, 
    {
        name: 'Distortion',
        params: [{name: 'Distortion', min: 0, max: 100, step: 0.1, reference: '.distortion'}],
        object: 'new Tone.Distortion(1.5).toDestination()'
    }, 
    {
        name: 'BitCrusher',
        params: [{name: 'Bit', min: 1, max: 8, step: 1, reference: false, pattern: ['new Tone.BitCrusher(',').toDestination()']}],
        object: 'new Tone.BitCrusher(4).toDestination()'
    },
];


*/

// urls of the music files that the Player will load to play in our Sequencer
export const sequencerSettings = {
    notes: ['C4', 'F4', 'A#4', 'D#5'],
    rows: 4,
    columns: 16,
    minBPM: 60,
    maxBPM: 240,
    baseBPM: 90,
    stepBPM: .1,
    volume: 70,
    volumeStep: 1,
}

/*
const urls = {    
    0: "A1.mp3",
    1: "Fs5.mp3",
    2: "C7.mp3",
    3: "A6.mp3",
}
export const sequencerSettings = {
    urls,
    keys: new Tone.Players({
            urls,
            fadeOut: "64n",
            baseUrl: "./asset/audio/salamander/", //"https://tonejs.github.io/audio/salamander/"
        }).toDestination(),
    rows: 4,
    columns: 16,
    minBPM: 60,
    maxBPM: 240,
    baseBPM: 90,
    stepBPM: .1,
}
*/

// here all the notes that can be selected in sequencer are presented

export const availibleNotes = Array.from(Array(49).keys()).map(number => {
    switch (number % 7){
        case 0:
            return ['C'+ (Math.floor(number / 7) + 1), 'C#'+ (Math.floor(number / 7) + 1)];
        case 1:
            return ['D'+ (Math.floor(number / 7) + 1), 'D#'+ (Math.floor(number / 7) + 1)];
        case 2:
            return ['E'+ (Math.floor(number / 7) + 1)];
        case 3:
            return ['F'+ (Math.floor(number / 7) + 1), 'F#'+ (Math.floor(number / 7) + 1)];
        case 4:
            return ['G'+ (Math.floor(number / 7) + 1), 'G#'+ (Math.floor(number / 7) + 1)];
        case 5:
            return ['A'+ (Math.floor(number / 7) + 1), 'A#'+ (Math.floor(number / 7) + 1)];
        case 6:
            return ['B'+ (Math.floor(number / 7) + 1)];
    }
}).flat();
