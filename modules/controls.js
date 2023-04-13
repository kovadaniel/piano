import {elt, eltSVG} from '../script.js';
import {keyboard, notes, activeKeys, availibleNotes} from './tools.js';


export class Keyboard{
    constructor(state, dispatch){
        console.log("availibleNotes:", availibleNotes);
        this.dispatch = dispatch;

        this.keys = availibleNotes.map((note, index) => {
            let keyDOM = this.makeKey(note, index);
            if(state.miniKeyboard && !keyboard[note]) keyDOM.classList.add('disabled')
            if(keyboard[note]) keyDOM.dataset.key = keyboard[note];
            keyDOM.dataset.note = note;
            return keyDOM;
        })

        this.dom = elt('ul', {className: 'piano-keys'},
            //...keyboardKeys.map((key, index) => {
            ...this.keys);
        document.addEventListener('keydown', e => {
            let key = e.key == ';' ? 'semicolon' : e.key;
            if(activeKeys.includes(key)){
                let dom = document.querySelector(`[data-key=${key}]`);
                dispatch({type: 'playKey', key, note: dom.dataset.note, dom})
            }
        })
        document.addEventListener('keyup', e => {
            let key = e.key == ';' ? 'semicolon' : e.key;
            if(activeKeys.includes(key)){
                let dom = document.querySelector(`[data-key=${key}]`);
                dispatch({type: 'stopKey', key, note: dom.dataset.note, dom})
            }
        })
    }

    makeKey(note, index) {
        // if a piano-key has a button on the computer-keyboard to trigger it, 
        // the name of this key-on-keyboard will be inscripted on the piano key
        let inscription = '';
        if(keyboard[note]){
            if(keyboard[note] == 'semicolon')
                inscription = ';';
            else
                inscription = keyboard[note].toUpperCase();
        }

        const dom = elt('li', 
            {className: `key ${keyColor(index)}`,
            onmousedown: () => this.dispatch({type: 'playKey', key: keyboard[note], note: note, dom: dom}),
            onmouseup: () => this.dispatch({type: 'stopKey', key: keyboard[note], note: note, dom: dom}), 
            onmouseleave: (e) => {
                if(e.buttons === 1){
                this.dispatch({type: 'stopKey', key: keyboard[note], note: note, dom: dom})
            }},
            onmouseenter: (e) => {
                if(e.buttons === 1){
                    this.dispatch({type: 'playKey', key: keyboard[note], note: note, dom: dom})
                }}
            },
            elt('span', {}, inscription?inscription:''));
            return dom;
    }

    syncState(state){
        this.state = state;
    }
}

function keyColor(i){
    switch(i%12){
        case 0:
            return 'white';
        case 1:
            return 'black';
        case 2:
            return 'white';
        case 3:
            return 'black';
        case 4:
            return 'white';
        case 5:
            return 'white';
        case 6:
            return 'black';
        case 7:
            return 'white';
        case 8:
            return 'black';
        case 9:
            return 'white';
        case 10:
            return 'black';
        case 11:
            return 'white';
    }
}


export class SynthPanel{
    constructor(state, dispatch, tools){  // synth is an object with {type: ..., object:...,}
        this.synths = {};
        /*
        this.synths = ['Synth': SynthObject, 'MonoSynth': MonoSynthObject, 'DuoSynth': DuoSynthObject, 
                       'AMSynth': AMSynthObject, 'FMSynth' : FMSynthObject, 'MembraneSynth': MembraneSynthObject, 
                       'MetalSynth': MetalSynthObject, 'PluckSynth': PluckSynthObject, 'Sampler': SamplerObject] 
                        // 'NoiseSynth',  'PolySynth', 'Sampler'
        */
        for(let synthName of Object.keys(tools.synths)){            
            // here we envelope our synth into a PolySynth to enable multiple notes to be played
            // simultaneously. But Tone.Sampler is already PolySynth and doesn't need to be wrapped
            let synth;
            if(synthName == 'Sampler'){
                let synthType = `new Tone.${synthName}(${tools.synths[synthName]}).toDestination()`;
                synth = eval(synthType);
            } else{
                let polySynthType = `new Tone.PolySynth(Tone.${synthName}, ${tools.synths[synthName]}).toDestination()`;
                synth = eval(polySynthType);
            }
            
            // if this synth is able to get different oscillators (only for safe synths)
            if(synth.get().oscillator){
                //console.log('synth.get()', synth.get());
                //console.log('synth.get().oscillator', synth.get().oscillator);
                //console.log('synth.get().oscillator.type', synth.get().oscillator.type);

                this.synths[synthName] = {type: synthName, object: synth, oscillator: synth.get().oscillator.type} ;
            } else{
                // 'oscillator: false' means that this synth can only have its basic oscillator if ever it has one
                this.synths[synthName] = {type: synthName, object: synth, oscillator: false}; 
            }
        }
        console.log(this.synths);

        this.sectionDOM = elt('section', {className: 'sound-type'},
            ...Object.keys(this.synths).map(synth => {
                let type = this.synths[synth].type;
                return elt('div', 
                        {className: type + (type === state.synth.type ? ' active' : ''),
                        onclick: () => dispatch({type: 'changeSynth', 
                                                 synthType: this.synths[synth].type, 
                                                 object: this.synths[synth].object,
                                                 oscillator: this.synths[synth].oscillator,
                                                 parentDOM: this.sectionDOM})},
                                                 
                        synth === 'Sampler' ? 'Piano': synth,
                        )
            })
        )
        this.dom = elt('div', {className: 'sound-choice-container'},
                        elt('label', {className: 'sounds-label'}, 'Synthesizer'),
                        this.sectionDOM,
        )

    }
    syncState(state){
        /**if a user has changed oscilator of the currently selected synth we shall  
         * reflect this change in this.synths[<currently-selected-synth>].oscillator
        */
       if(state.oscillator !== this.synths[state.synth.type].oscillator){
            this.synths[state.synth.type].oscillator = state.oscillator;
       }
    }
}

export class OscillatorPanel{
    constructor(state, dispatch, tools){
        this.oscillators = tools.oscillators;
        this.saveSynths = tools.saveSynths;

        this.oscillator = this.oscillators[0];

        this.sectionDOM = elt('section', {className: 'oscillator-type'},
            ...this.oscillators.map(osc => {
                return elt('button', 
                        {className: osc + (osc === state.oscillator ? ' active' : ''),
                        value: osc,
                        onclick: () => dispatch({type: 'changeOscillator', oscillator: osc, parentDOM: this.sectionDOM})},
                        osc,
                        )
            })
    )
        this.dom = elt('div', {className: 'oscillator-choice-container'},
            elt('label', {className: 'oscillator-label'}, 'Oscillator Type'),
            this.sectionDOM,
        )
    }
    syncState(state){
        if(this.saveSynths.includes(state.synth.type)){
            // if curerently selected synthsesizer accept (it is save) differect types of oscillators,
            // we enable all of them:
            for(let child of this.sectionDOM.children){
                child.value == state.oscillator ? child.classList.add('active') : true;
                child.disabled = false;
            }
        } else{
            // if curerently selected synthsesizer doesn't accept any other types of oscillators than OmniOscillator,
            // we disable all of them:
            for(let child of this.sectionDOM.children){
                child.classList.remove('active');
                child.disabled = true;
            }
        }
    }
        
}

export class EffectsPanel{
    constructor(state, dispatch, tools){
        /*
            tools.effects = [
                {
                    name: 'Chorus',
                    params: [{name: 'Frequency', min: 0, max: 50, step: 0.1, value: 0}, // value is always at min
                            {name: 'Delay', min: 2, max: 50, step: 0.1, value: 2,  reference: '.distortion'},    
                            {name: 'Depth', min: 1, max: 10, step: 0.1, value: 1, reference: ['.set({bits: ', '})']}],
                    pattern: ['new Tone.Chorus(',').toDestination().start()'],
                },
                ...
            ]
        */
        this.effects = {};
        /* this.effects = { Chorus: ["new Tone.Chorus(", ").toDestination().start()"], ...} */

        //console.log("[EffectsPanel] this.effects:", this.effects);
        
        // here we create a DOM for every our Effect
        this.effectSections = tools.effects.map(effect => {

            // here create a DOM for every parameter (frequency, depth, etc.) of 
            // the current Effect and store them in array
            let effectParams = effect.params.map(param => {

                // this function services the knob (input[type="range"]) appearance
                function update(input) {
                    console.log('updating');
                    for (const data of ["min", "max", "value"]){
                        if (input[data]) input.style.setProperty(`--${data}`, input[data]);
                    }
                }
                
                let inputRange = elt('input', {type: 'range', 
                        className: 'knob ' + `${effect.name}-input`,
                        id: param.name, //.replace(/\s/g, ''), // remove white spaces
                        min: param.min,
                        '--min': param.min,
                        max: param.max,
                        '--max': param.max,
                        value: param.min,
                        '--value': param.min,
                        step: param.step,
                        onchange: (e) => update(e.target),
                        oninput: (e) => update(e.target),
                        onkeyup: (e) => {
                            dispatch({type: 'adjustEffect', 
                                      effect: this.effects[effect.name], 
                                      name: effect.name,
                                      value: e.target.value,
                                      reference: param.reference})
                            },
                        onmouseup: (e) => {
                            //console.log("param.reference:", param.reference);
                            //console.log(" Array. isArray(param.reference):",  Array. isArray(param.reference));

                            dispatch({type: 'adjustEffect', 
                                      effect: this.effects[effect.name], 
                                      name: effect.name,
                                      value: e.target.value,
                                      reference: param.reference})
                            },
                    });
                inputRange.dataset.param = param.name;
                inputRange.dataset.reference = param.reference;
                //inputRange.dataset.effect = effect.name;

                return elt('section', {},
                            inputRange,
                            elt('div', {className: 'before'}, param.min.toString()),
                            elt('div', {className: 'after'}, param.max.toString()),
                            elt('label', {}, param.name))    
            })

            return elt('div', {className: 'effect-sections', id: effect.name},
                        elt('div', {
                            className: 'turn-effect-container',
                            onclick: (e) => {
                                // 1. when the effect is turned on at first time, 
                                //    it is evaluated and stored in this.effects
                                if(!this.effects[effect.name])
                                    this.effects[effect.name] = eval(effect.pattern);

                                dispatch({type: 'turnEffect', 
                                            effect: this.effects[effect.name],
                                            name: effect.name,
                                            params: collectEffectParams(effect.name),
                                            dom: e.currentTarget})
                                }},
                            elt('i', {className: 'fas fa-power-off',
                            name: effect.name,
                            }),
                            elt('h4', {for: effect.name}, effect.name),
                        ),
                        elt('div', {className: 'slider-container'},
                            ...effectParams))
        })
       
        this.dom = elt('div', {className: 'effects-choice-container'},
            elt('label', {className: 'effects-label'}, 'Effects'),
            elt('section', {className: 'effect-type'},
                ...this.effectSections)
        );
    }
    
    syncState(state){
        this.state = state;
        //console.log("[EffectsPanel] syncStating...");
    }

}

function collectEffectParams(name){
    /*
     * returns [{key: paramName, value: paramValue}]
    */
    const inputParams = document.querySelectorAll(`.${name}-input`);
    let params = [];
    for (let i = 0; i < inputParams.length; i++){
        params.push({reference: inputParams[i].dataset.reference.split(','),
                     value: inputParams[i].value});
    }
    console.log("collectedParams:", params);
    return params;
}


export class SequencerPanel{
    constructor(state, dispatch, tools){
        //console.log('[SequencerPanel] tools.sequencer', tools.sequencer);
        this.sequencer = state.sequencer;
        this.baseParams = tools.sequencer;

        this.dispatch = dispatch;

        this.selectContainer =  elt('div', {className: 'cell-column'},
            ...state.sequencer.grid[0].map((row, rIndex) => {
                let cell =  this.makeSelectCell(rIndex);
                cell.dataset.row = row;
                return cell;
            })
        )

        this.sequencerContainer = 
            elt('div', {className: 'sequencer-buttons'},
                ...state.sequencer.grid.map((column, cIndex) => this.makeColumn(column, cIndex))
            )

        this.bpmLabel = elt('span', {className: 'bmp-label'}, this.baseParams.baseBPM + ' BPM')

        this.bpmRange = elt('form', {id: 'sequencer-bpm-form'},
            elt('input', {id: 'sequencer-range', 
                type: 'range', 
                min: this.baseParams.minBPM,
                max: this.baseParams.maxBPM,
                value: this.baseParams.baseBPM,
                step: this.baseParams.stepBPM,
                oninput: (e) => {
                    // '--val' property is used to draw range line to the left of the thumb
                    let _t = e.target;
                    _t.parentNode.style.setProperty('--val', +_t.value)
                    dispatch({type: 'changeBPM', value: +_t.value, dom: this.bpmLabel})
                }
            }),
        );
        this.bpmRange.style.setProperty('--min', this.baseParams.minBPM);
        this.bpmRange.style.setProperty('--max', this.baseParams.maxBPM);
        this.bpmRange.style.setProperty('--val', this.baseParams.baseBPM);

        this.playIcon = elt('i', {className: 'fas fa-solid fa-play icon',});
        this.pauseIcon = elt('i', {className: 'fas fa-solid fa-pause icon',});
        this.pauseIcon.style.display = 'none';

        this.stopIcon = elt('i', {className: 'fas fa-solid fa-stop icon',});


        this.lockSVG = elt('label', {className: "btn-lock", title: "Remember current synth, oscillator and active effects"},
            eltSVG('svg', {width: "36",  height: "40", viewBox: "0 0 36 40"},
                eltSVG('path', {class: "lockb", d: "M27 27C27 34.1797 21.1797 40 14 40C6.8203 40 1 34.1797 1 27C1 19.8203 6.8203 14 14 14C21.1797 14 27 19.8203 27 27ZM15.6298 26.5191C16.4544 25.9845 17 25.056 17 24C17 22.3431 15.6569 21 14 21C12.3431 21 11 22.3431 11 24C11 25.056 11.5456 25.9845 12.3702 26.5191L11 32H17L15.6298 26.5191Z"}),
                eltSVG('path', {class: "lock", d: "M6 21V10C6 5.58172 9.58172 2 14 2V2C18.4183 2 22 5.58172 22 10V21"}),
                eltSVG('path', {class: "bling", d: "M29 20L31 22"}),
                eltSVG('path', {class: "bling", d: "M31.5 15H34"}),
                eltSVG('path', {class: "bling", d: "M29 10L31 8"}),                        
            )
        )
        this.lockSVG.setAttributeNS(null, 'for', 'inputLock');
        
        /*this.download = elt("a", {className: 'sequencer-button download-recorded'}, 
                            elt("i", {className: 'fa-solid fa-download'}))*/

        this.dom = elt('div', {className: 'sequencer-container'},
            elt('label', {className: 'sequencer-label'}, 'Sequencer'),
            elt('div', {className: 'sequencer-main'},
                this.selectContainer,

                elt('div', {className: 'sequencer'}, 
                    this.sequencerContainer,
                    elt('button', 
                    {
                        className: 'add-row',
                        onclick: e => {
                            console.log("adding a new row");
                            dispatch({type: 'addRow', dom: this.sequencerContainer})
                        },
                    }, 
                    '+')
                ),

                elt('button', 
                    {
                        className: 'add-column',
                        onclick: (e) => dispatch({type: 'addColumn', dom: this.sequencerContainer}),
                    }, 
                    '+')
            ),
            elt('div', {className: 'sequencer-footer'},
                elt('button', {className: 'sequencer-button',
                               onclick: () => {
                                    dispatch({type: 'turnSequencer', play: this.playIcon, pause: this.pauseIcon, dom: this.sequencerContainer});
                               }}, 
                    this.playIcon,
                    this.pauseIcon,
                ),
                elt('button', {className: 'sequencer-button',
                               onclick: () => dispatch({
                                    type: 'stopSequencer', 
                                    stop: this.stopIcon, 
                                    play: this.playIcon, 
                                    pause: this.pauseIcon, 
                                    dom: this.sequencerContainer})
                        }, 
                        this.stopIcon,
                ),
                this.bpmRange,
                this.bpmLabel,
            ),
            elt('div', {className: 'lock-container'},
                elt('input', {type: 'checkbox', id:'inputLock', onchange: () => dispatch({type: 'setSequencerSynth'})}),
                this.lockSVG,
                elt('span', {className: 'lock-tooltip'})
            )
        )
    }

    makeCell(row, column){
        //console.log(`making a new cell row:${row}, column:${column}`);
        let cell = elt('button',
                    {className: 'cell',
                        onmousedown: (e) => {
                        this.dispatch({type: 'turnSequencerNote', row, column, dom: e.currentTarget})
                    },
                    onmouseenter: (e) => {
                        if(e.buttons === 1){
                            this.dispatch({type: 'turnSequencerNote', row, column, dom: e.currentTarget})
                        }}});
        cell.dataset.column = column;
        cell.dataset.row = row;
        return cell;
    }

    makeSelectCell(row){
        let selectedValue = null;
        const select = 
            elt('select', {className: 'note-select', 
                           onchange: (e) => this.dispatch({type: 'changeRowNote', row, note: e.target.value})},
                ...availibleNotes.map(note => {
                    let dom = elt('option', {value: note}, note);
                    // Fs5 -> F#5
                    // let baseNote = this.sequencer.urls[row].split('.')[0].replace(/s/g, '#')
                    if(note == this.sequencer.notes[row]){
                        selectedValue = note;
                    }
                    return dom;
                })
            );
        if(selectedValue) select.value = selectedValue;

        const selectCell = 
            elt('div', {className: 'note-select-container'},
                select,
                /*elt('i', {className: "next-note fas fa-regular fa-caret-up"}),
                elt('i', {className: "prev-note fas fa-regular fa-caret-down"}),*/
            );
        return selectCell;
    }

    makeColumn(column, cIndex){
        //console.log("new column:", column);
        return elt('div', {className: 'cell-column'},
                    ...column.map((_, rIndex) => this.makeCell(rIndex, cIndex)),
                    elt('button', {className: 'remove-column'}, 
                        elt('i', {className: 'fas fa-solid fa-xmark',
                                  onclick: () => this.dispatch({type: 'removeColumn', column: cIndex, dom: this.sequencerContainer})}))
                )
    }

    static makeGrid = (notes, columns) => {
        const output = [];

        for (let i = 0; i < columns; i++) {
            const column = [];
            for (const note of notes) {
                column.push(this.makeNote(note));
            }
            output.push(column);
        }
        return output;
    };

    static makeNote = (note) => {
        return {note: note, isActive: false}
    }
    
    syncState(state){
        // if amount of rows in the grid has been changed (increased)
        if(this.sequencer.rows !== state.sequencer.rows){
            // 1. add to each of the cell-column's dom another cell (thus we from a new row)
            for(let i = 0; i < state.sequencer.columns; i++){
                const cell = this.makeCell(state.sequencer.rows - 1, i)
                this.sequencerContainer.children[i].appendChild(cell);
            }
            // 2. add a new select-cell (representing a new row) to our selectContainer
            this.selectContainer.appendChild(this.makeSelectCell(state.sequencer.rows - 1));
        }

        // if amount of columns in the grid has been changed (increased)
        if(this.sequencer.columns < state.sequencer.columns){
            // 1. add a new column to the sequencerContainer 
            //    where all column-DOMs are stored
            const columnNumber = state.sequencer.columns - 1;
            const columnGrid = state.sequencer.grid[columnNumber]
            const columnDOM = this.makeColumn(columnGrid, columnNumber);
            this.sequencerContainer.appendChild(columnDOM);
        }
        // if amount of columns in the grid has been changed (decreased)
        if(this.sequencer.columns > state.sequencer.columns){
            this.sequencerContainer.lastChild.remove();
        }
        // 3. update sequencer in this class
        this.sequencer = state.sequencer;
    }

}



export class InstrumentsPanel{
    constructor(state, dispatch, tools){
        this.baseParams = tools.sequencer;
        this.volume = elt('form', {id: 'sequencer-volume-form'},
            elt('input', {id: 'sequencer-volume', 
                type: 'range', 
                max: this.baseParams.volume,
                value: this.baseParams.volume,
                step: this.baseParams.volumeStep,
                oninput: (e) => {
                    // '--val' property is used to draw range line to the left of the thumb
                    let _t = e.target;
                    _t.parentNode.style.setProperty('--val', +_t.value);
                    dispatch({type: 'changeSequencerVolume', value: +_t.value, max: this.baseParams.volume})
                }
            }),
            elt('datalist', {id: 'volumeList'},
                elt('option', {label: '🕨', value: 'min'}),
                elt('option', {label: '🕪', value: 'max'})
            )
        );
        this.volume.style.setProperty('--min', 0);
        this.volume.style.setProperty('--max', this.baseParams.volume);
        this.volume.style.setProperty('--val', this.baseParams.volume);
        this.download = elt("a", {className: 'sequencer-button download-recorded'}, 
                            elt("i", {className: 'fa-solid fa-download'}));

        // a button to show/hide full keyboard
        let fullKeyboardButton = elt("label", {className:'but'}, 
            elt("span", {className: "on"}, 
                elt("i", {className: "fa-sharp fa-solid fa-down-left-and-up-right-to-center"}),
            ),
            elt("span", {className: "off"}, 
                elt("i", {className: "fa-sharp fa-solid fa-up-right-and-down-left-from-center"}),
            ),
        )
        fullKeyboardButton.setAttribute('for', "onoff");
        this.showFullKeyboardButton = elt("div", {className: "round"}, 
            elt("input", {id: "onoff", name: "onoff", type: 'checkbox', 
                          onclick: () => dispatch({type: 'flipKeyboard'})}),
            elt("div", {className: "back"}, fullKeyboardButton)
        )

        this.dom = elt('div', {className: 'instrument-container'},
            elt('label', {className: 'instruments-label'}, 
                elt('i', {className: 'fas fa-light fa-toolbox'})),
            elt('div', {className: 'instruments-main'},
                elt("div", {className: 'recorder-container', 
                                onclick: e =>{
                                    dispatch({type: "turnRecord", 
                                            toActivation: 
                                                [e.currentTarget, 
                                                e.currentTarget.children[0],
                                                e.currentTarget.children[1]],
                                            reference: this.download})}
                                }, 
                        elt("div", {className: 'outer'}),
                        elt("div", {className: 'outer-2'}),
                        elt("div", {className: 'icon-microphone'},
                            elt("i", {className: 'fas fa-regular fa-microphone'})),
                ),
                this.download,
                this.volume,
                this.showFullKeyboardButton,
            )
        )
    }

    syncState(state){

    }
}