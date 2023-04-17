import {collectEffectParams, Keyboard, SynthPanel, OscillatorPanel, EffectsPanel, SequencerPanel, InstrumentsPanel} from './modules/controls.js';
import {pianoParams, baseSynths, amountOfSaveSynth, saveSynths, baseOscillators, baseEffects, sequencerSettings} from './modules/tools.js';

const baseControls = [Keyboard, SynthPanel, OscillatorPanel, EffectsPanel, SequencerPanel, InstrumentsPanel]

// ------------------------------------------------------------------------------
//                              APPLICATION
// ------------------------------------------------------------------------------

function handleAction(state, action){
/*
    final synthesizer: 
        `new Tone.${synthName}(${params}).connect(${...state.effects}).toDestination()`;

    in our SynthPanel controller we initiate each synthesizer as:
        `new Tone.${synthName}(${params})` // although params exist only for paino sampler, all other case they are: ''

    in this changeSynth we also add current state.oscillator. But all active effects are added in "turnEffect" 
        section state.effects;

    in this "playKey" action we are triggering Attack (the start of the sound with given note)
    in this "stopKey" action we are triggering Release (the end of the sound with given note)

*/

    if(action.type == 'playKey'){
        console.log("our state:", state);

        let note = action.note;

        if(!state.playingNotes.has(note)){ // if it is not repeat of the same event by the clamped key
            // 1. set shade to the pressed key:
            action.dom.classList.add('active');
            // 2. start playing a note (with PolySynth):
            let playingNotes = state.playingNotes.add(note);
            state.synth.object.triggerAttack(note, Tone.now());
            return Object.assign({}, state, {playingNotes});
        }
    }
    if(action.type == 'stopKey'){
        state.synth.object.triggerRelease(action.note, Tone.now() + .1);

        if(state.playingNotes.size == 1) { // thus it has been stopping the  last played note
            state.synth.object.releaseAll();
        }
        action.dom.classList.remove('active');
        return Object.assign({}, state, {pressedKey: state.playingNotes.delete(action.note)}); 
    }

    if(action.type == 'changeSynth'){
        // If user selected the same synth as before, we skip any change in state.
        if(action.synthType !== state.synth.type){
            // 1. coloring new selected synth and uncoloring old
            for(let i=0; i < action.parentDOM.children.length; i++){
                let child = action.parentDOM.children[i];
                if(child.classList[0] == action.synthType){ // && action.synthName !== 'Sampler'){
                    child.classList.add('active');
                } else{
                    child.classList.remove('active');
                }
            }

            // 2. if currently selected synth accepts different oscilltors, 
            //    color an oscillator of the selected synth and uncoloring an unmatching one
            if(action.oscillator){
                const oscParentDOM = document.querySelector('.oscillator-type');
                for(let i=0; i < oscParentDOM.children.length; i++){
                    let child = oscParentDOM.children[i];
                    if(child.classList[0] == action.oscillator.toLowerCase()){
                        child.classList.add('active');
                    } else{
                        child.classList.remove('active');
                    }
                }
            }
            

            // 3. if some effects were activated, ...
            if(Object.keys(state.effects).length){
                let effectNames = Object.keys(state.effects);
                // 2.1. disconnecting the old sinthesizer from effects and re-connecting it to Destination
                state.synth.object.disconnect(state.effects[effectNames[0]]);
                state.synth.object.connect(Tone.Destination);
                // 2.2. disconnecting the new sinthesizer from Dectination and
                //      connecting it to the activated effects
                action.object.disconnect(Tone.Destination);
                action.object.connect(state.effects[effectNames[0]]);
            }

            // some final assignments for the updated state
            const synth = {};
            Object.assign(synth, state.synth);
            synth.type = action.synthType;
            synth.object = action.object;
            /** we use state.synth.pattern in our Sequencer (when 'fixed' == true) for creating 
             *  a sample for the currently selected synth that will be independent of futher mutations
             *  of a synth that stays for a piano (i.e. 'state.synth')
             * */
            if(action.synthType == 'Sampler'){
                synth.pattern = `new Tone.${action.synthType}(${action.patternParams}).toDestination()`;
            } else{
                synth.pattern = `new Tone.PolySynth(Tone.${action.synthType}, ${action.patternParams}).toDestination()`;
            }
            
            synth.oscillator = action.oscillator;

            return Object.assign({}, state, {synth});
        }
    }

    if(action.type == 'changeOscillator'){
        /** only some first synthesizers have the ability to get different
         * types of oscillators (safe for it).
         * code, handling oscillator, is here (not in changeOscillator section because user
         * can change Synth and selected previously oscillaltor should be automatically set)
         */
        if(state.oscillator !== action.oscillator){
            // 1. highlight the selected oscillator name and unhighlight all others - out target is the one previously selected
            for(let i = 0; i < action.parentDOM.children.length; i++){
                let child = action.parentDOM.children[i];
                if(child.classList[0] == action.oscillator){
                    child.classList.add('active');
                } else{
                    child.classList.remove('active');
                }
            }

            // 2. set a new oscillator to our synth
            state.synth.object.set({oscillator: {type: action.oscillator}});
            //state.synth.object.oscillator.type = action.oscillator;

            return Object.assign({}, state, {oscillator: action.oscillator, synth: state.synth});
        }
    }

    if(action.type == 'turnEffect'){
        /*
         * we can not create an object for every Effect at the start, because Tone.js starts producing background sound 
         * while any note is played for ~10 seconds. So we create each of them after they are selected. Once they are
         * stored, we store them in this.effects in EffectsPanel class
        */

        // copy effects from state for safety
        let effects = Object.assign({}, state.effects);

        // action = {type: ..., name: ..., effect: Object, dom: ...}


        if(effects[action.name]){ // If this effect is already ON
            // disconnecting effect
            // 1. remove highlighting of the <i> element in the given dom
            action.dom.firstChild.classList.remove('active');

            // 2. disconnect this effect from his previous and after links
            let effectNames = Object.keys(effects);
            for(let i = 0; i < effectNames.length; i++){
                if(effectNames[i] == action.name){
                    if(i == 0 && i == effectNames.length - 1){
                        // current effect is the only one that is activeted
                        // 1. disconnect our synth from current effect
                        state.synth.object.disconnect(action.effect);
                        // 2. disconnect current effect from Destination
                        action.effect.disconnect(Tone.Destination);
                        // 3. connect our synth with Destination
                        state.synth.object.connect(Tone.Destination);
                        break;
                    } else if(i == 0 && i < (effectNames.length - 1)){
                        // current effect is first one of some activeted effects
                        let nextEffect = effects[effectNames[i+1]];
                        // 1. disconnect our synth from current effect
                        state.synth.object.disconnect(action.effect);
                        // 2. disconnect current effect from the next effect
                        action.effect.disconnect(nextEffect);
                        // 3. connect our synth with the next effect
                        state.synth.object.connect(nextEffect);
                        break;
                    } else if(i == effectNames.length - 1){
                        // current effect is last one of activeted effects
                        let prevEffect = effects[effectNames[i-1]];
                        // 1. disconnect our previous from current effect
                        prevEffect.disconnect(action.effect);
                        // 2. disconnect current effect from Destination
                        action.effect.disconnect(Tone.Destination);
                        // 3. connect previous effect with Destination
                        prevEffect.connect(Tone.Destination);
                        break;
                    } else{
                        // current effect is somewhere is the middle in the list of activeted effects
                        let nextEffect = effects[effectNames[i+1]];
                        let prevEffect = effects[effectNames[i-1]];
                        // 1. disconnect our previous from current effect
                        prevEffect.disconnect(action.effect);
                        // 2. disconnect current effect from the next effect
                        action.effect.disconnect(nextEffect);
                        // 3. connect previous effect with the next effect
                        prevEffect.connect(nextEffect);
                        break;
                    }
                }
            }

            // 3. delete this effect from out state
            delete effects[action.name];

            // 4. if there are no effects, we have to connect Tone.Destination to our synth
            if(!Object.keys(effects).length){
                state.synth.object.connect(Tone.Destination);
            }

            // 5. remove pattern and name of the current effect to state.synth.effectParams
            //    This will be needed when Sequencer will fixate synth.
            const effectPatterns = state.synth.effectPatterns.filter(e => e.name !== action.name)
            const synth = Object.assign({}, state.synth, {effectPatterns})

            return Object.assign({}, state, {effects: effects, synth: synth});
        } else{
            // connecting effect
            // 1. highlight the <i> element in the dom of a selected effect (it is the first one)
            action.dom.firstChild.classList.add('active');

            // 2. for the clarity of the sound, we have to connect our synth to 
            //    destination VIA effect: Synth -> Effect -> Destination.
            //    And disconnect this DIRECT connection: Synth -> Destination
            let effectNames = Object.keys(effects);
            let lastEffectName = effectNames[effectNames.length-1];

            // 3. apply params to the activating (current) effect (its params may have been changed while effect was off)
            for(let param of action.params){ // action.params = [{reference: referenceToParam, value: paramValue}, ...]
                eval(`action.effect${param.reference[0]+param.value+param.reference[1]}`);
            }

            // 4. if before currect effect no other effect was activated, ....
            if(!effectNames.length){ 
                // 4.1. We disconnect our synth from Destination
                state.synth.object.disconnect(Tone.Destination);
                // 4.2. add currect effect to our state
                effects[action.name] = action.effect;
                // 4.3. connect our synthesizer to the current effect and the currect effect to Destination. 
                //    Path: Synth -> First Effect -> Destination
                state.synth.object.chain(action.effect, Tone.Destination);

            } else{ 
                // 4.1. we disconnect the-last-added-effect from Destination
                effects[lastEffectName].disconnect(Tone.Destination);
                // 4.2. add this effect to our state
                effects[action.name] = action.effect;
                // 4.3. add this effect to our synthesizer. Disconnect all previous effects and connect the in new chain
                effects[lastEffectName].chain(action.effect, Tone.Destination);
            }

            // 5. add pattern and name of the current effect to state.synth.effectParams
            //    For what? To be able to recreate from pattern and bind them to synth. 
            //    This will be needed when Sequencer will fixate synth.
            const effectPatterns = state.synth.effectPatterns.concat({name: action.name, pattern: action.pattern});
            const synth = Object.assign({}, state.synth, {effectPatterns})

            return Object.assign({}, state, {effects: effects, synth: synth});
        }
    }

    if(action.type == 'adjustEffect'){
        if(state.effects[action.name]){
            eval(`state.effects[action.name]${action.reference[0]+action.value+action.reference[1]}`);
            
            return Object.assign({}, state, {effects: state.effects});
        }
    }


    // Sequencer
    if(action.type == "changeBPM"){
        // 1. Change the value of the page
        action.dom.innerHTML = `${action.value} BPM`;
        // 2. set new BPM to our sequener
        Tone.Transport.set({'bpm': parseFloat(action.value)})
    }

    if(action.type == "turnSequencerNote"){
        // copy! our sequencer from our state for further manipulations.
        // we do it to prevent unexpected behaviour 
        let seq = Object.assign({}, state.sequencer);
        let currentCell = seq.grid[action.column][action.row];
        
        // if this tile was already turned on
        if(currentCell.isActive){
            //console.log("note is active. State.sequencerNotes:", state.sequencerNotes);
            // 1. uncolor dom
            action.dom.classList.remove('active');
            // 2. mark this cell as an inactive in our state
            currentCell.isActive = false;
        } else{
            // 1. color dom
            action.dom.classList.add('active');
            // 2. mark this cell as an active in our state
            currentCell.isActive = true;            
        }

        return Object.assign({}, state, {sequencer: seq})
    }

    if(action.type == 'turnSequencer'){
        // copy! our sequencer from our state for further manipulations.
        let seq = Object.assign({}, state.sequencer);
        
        // *

        if(seq.playing){
            // sequencer is already working now
            // 1. change icon in the button from "stop" to "play" 
            action.play.style.display = '';
            action.pause.style.display = 'none';
            // 2. stop the Transport
            Tone.Transport.stop();
            // 3. set sequencer as not playing in our state 
            seq.playing = false;
        } else{
            // sequencer does not working now
            // 1. restart Transport. But why here and not earlier at * ? 
            Object.assign(seq, restartTransport(seq));
            // 1. change icon in the button from "play" to "stop"
            action.play.style.display = 'none';
            action.pause.style.display = '';
            // 2. launch the Transport
            Tone.Transport.start();
            // 3. set sequencer as playing in our state 
            seq.playing = true;
        }

        return Object.assign({}, state, {sequencer: seq})
    }

    if(action.type == 'stopSequencer'){
        // copy! our sequencer from our state for further manipulations.
        let seq = Object.assign({}, state.sequencer);
        if(seq.playing){
            // sequencer is working now
            // 1. change icon in the pause-button from "play" to "stop"
            action.play.style.display = '';
            action.pause.style.display = 'none';
            // 2. remove highlighting of the last-played column
            action.dom.children[parseInt(seq.beat.i) - 1].classList.remove('active');
            // 3. stop the Transport
            Tone.Transport.stop();
            // 4. set sequencer as 'not playing' in our state 
            seq.playing = false;
            // 5. set 'beat' to 0 to enforce the sequencer to start from the very begining when button 'play' is pressed
            seq.beat.i = 0;
        } else{
            // 1. change icon in the pause-button from "play" to "stop"
            action.play.style.display = '';
            action.pause.style.display = 'none';
            // 2. remove highlighting of the last-played column
            action.dom.children[parseInt(seq.beat.i) - 1].classList.remove('active');
            // 3. set 'beat' to 0 to enforce the sequencer to start from the very begining when button 'play' is pressed
            seq.beat.i = 0;
        }
        return Object.assign({}, state, {sequencer: seq})
    }

    function restartTransport(seq){
        /**
         * this function clears old 'repeat' from Transport.scheduleRepeat 
         * and sets a new 'repeat' function 
         */
        const repeat = (time) => {
            const beat = seq.beat.i; // 'beat.i' shows us which column that shall be played now
            console.log("beat:", seq.beat.i);
            
            // 1. highlight the current column and unhighlight the previous one
            let previousBeat = ((beat - 1) >= 0) ? (beat - 1) : (seq.columns - 1);
            // 'action.dom' contains a dom that includes all of the sequencer buttons
            action.dom.children[parseInt(beat)].classList.add('active');
            action.dom.children[parseInt(previousBeat)].classList.remove('active');

            // 2. read current column (its number is in 'beat.i') and play its notes
                /**   seq.grid is a shallow copy of the grid that was created in the runApp.
                 *  that means that it is exactly the same object as was initially created.
                 *    Alothough this function (repeat) doesn't use actuall state 
                 *  (or 'seq' as 'state.sequencer'). At first creation it memorises the state that
                 *  was actual at the moment and use it all the time afterwards (although real 
                 *  state may be changed).
                 *     As seq.grid is just a reference to initial grid-object, even in
                 *  this outdated state (or seq) reference 'state.sequencer.grid' (or 'seq.grid') 
                 *  will be actual. The same concerns seq.beat.
                 *    So to avoid this mismatch we violate our concept of immutability and operate 
                 *  mutable objects such as seq.grid and seq.beat. Because we need to know actual 
                 *  information from them and this information has been modifing due the runtime 
                 *  of 'repeat' callback function in Tone.scheduleRepeat(repeat, ...)
                 */
            seq.grid[beat].forEach(cell => {
                // as the index increments we are moving *down* the rows in the current column
                // beat is used to keep track of what column we play now
                if(!seq.fixed){
                // if current synth in the sequencer does not fixed:
                    seq.synth = state.synth.object;
                }
                if (cell.isActive) {
                    seq.synth.triggerAttackRelease(cell.note, "8n", time, seq.volume);
                }
            });
            // 3. increment the counter
                /** we don't use seq.grid.length instead of seq.columns although it is always 
                 *  actual and may seem right, too. Thus this 'repeat' function is invoked 
                 *  not only at the launch of the sequencer, but when amount of columns
                 *  or rows is changed
                 * */ 
            seq.beat.i = (beat + 1) % seq.columns;
            //console.log('[repeat] seq:', seq);

        };

        if(seq.started !== false){
            // clear old repeat (if there is one)
            Tone.Transport.clear(seq.started);
        } else{
            // set the tempo in beats per minute.
            Tone.Transport.bpm.value = 90;
            Tone.start();
        }

        // telling the Transport to execute our callback function every eight note.
        // "8n" parameter effects the speed of playing: 'repeat' is called
        //  every "8n" ~0.250? seconds
        let scheduleToken = Tone.Transport.scheduleRepeat(repeat, "8n");
        seq.started = scheduleToken;

        return seq;
    }

    if(action.type == 'changeRowNote'){
        // 0. copy! our sequencer from our state for further manipulations.
        let seq = Object.assign({}, state.sequencer);
        // 1. change '.note' property in every cell of the given row
        let grid = seq.grid.map(column => {
            column[action.row].note = action.note;
            return column;
        });
        seq.grid = grid;
        // 2. add a new note to 'notes' in state
        seq.notes[action.row] = action.note;
        return Object.assign({}, state, {sequencer: seq});
    }

    if(action.type == 'addRow'){
        // action.dom contains a container of all of the sequencer buttons
        // 0. copy! our sequencer from our state for further manipulations.
        let seq = Object.assign({}, state.sequencer);
        // 1. add a new cell into each column of the grid
        seq.grid.map(column => {
            let note = column[column.length-1].note;
            column.push(SequencerPanel.makeNote(note));
            return column;
        })
        // 2. increment amount of rows in state 
        seq.rows = seq.rows + 1;
        //3. add a new note to 'notes' in state
        seq.notes.push(seq.notes[seq.notes.length-1]);
        // 3. restart our sequencer with new amount of rows
        Object.assign(seq, restartTransport(seq));

        return Object.assign({}, state, {sequencer: seq});
    }

    if(action.type == 'addColumn'){
        // action.dom contains a container of all of the sequencer buttons
        // 0. copy! our sequencer from our state for further manipulations.
        let seq = Object.assign({}, state.sequencer);
        // 1. add a new column of cells to the grid
        let columnDOM = seq.notes.map(note => SequencerPanel.makeNote(note));
        seq.grid.push(columnDOM);
        // 2. increment amount of columns in state 
        seq.columns = seq.columns + 1;
        // 3. restart our sequencer with new amount of columns
        Object.assign (seq, restartTransport(seq));

        return Object.assign({}, state, {sequencer: seq});
    }

    if(action.type == 'removeColumn'){
        /** it is so conceived that a user can remove only the last 
         *  column. And minimum 4 columns must remain in any case
        */ 
        // 0. copy! our sequencer from our state for further manipulations.
        let seq = Object.assign({}, state.sequencer);
        // we set minimumamout of columns at 4
        if(seq.columns > 4){
            // 1. remove the last (presumably) column of cells from the grid
            seq.grid = [].concat(seq.grid.slice(0, action.column), seq.grid.slice(action.column+1))
            // 2. decrement amount of columns in state 
            seq.columns = seq.columns - 1;
            // 3. restart our sequencer with new amount of columns
            Object.assign (seq, restartTransport(seq));
        }
        

        return Object.assign({}, state, {sequencer: seq});
    }

    if(action.type == 'setSequencerSynth'){
        // 0. copy! our sequencer from our state for further manipulations.
        const seq = Object.assign({}, state.sequencer);
        const type = state.synth.type;
        // 1. if synth in the sequencer is not fixed (we are going to fixate synth in the code below)
        if(!seq.fixed){
            // 2. evaluate a copy of the currently selected synth (by its pattern)
            console.log("evaluating state.synth.pattern with given params:", state.synth.pattern);
            let synth = eval(state.synth.pattern);
            // if currect synth is a Sampler (in our case it is Piano) the program need to load some
            // files and that action takes some time. So to indicate it we set "cursor: wait" of Sequencer
            // for a few seconds (2 sec.). We can not set this directly so we add a new class that sets "cursor: wait" 
            if(state.synth.type == 'Sampler'){
                console.log("setting waiter");
                action.dom.classList.add('waiter');
                action.dom.setAttribute('disabled', '');
                setTimeout(() => {
                    action.dom.classList.remove('waiter');
                    action.dom.removeAttribute('disabled')
                }, 2700)
            }

            //Tone.start(); // ?
            // 3. set currenly selected oscillator to our synth
            synth.set({oscillator: {type: state.oscillator}});

            // 4. if any effect is activated, evaluate every active effect and bind it to our synth
            if(state.synth.effectPatterns.length){
                // if any effects are active
                // 4.1. disconnect synth from Destination
                synth.disconnect(Tone.Destination);

                // 4.2. evaluate effects and their params. Connect our synth to them and to Destination consistently
                const effects = state.synth.effectPatterns.map(e => { // array of evaluated effects like {name: effectName, object: effectObject}
                    return {name: e.name, object: eval(e.pattern)}
                });
                console.log('Evaluated effects', effects);

                for(let i = 0; i < effects.length; i++){
                    // evaluate and bind params for the effect
                    const params = collectEffectParams(effects[i].name);
                    for(let param of params){
                        eval(`effects[i].object${param.reference[0] + param.value + param.reference[1]}`);
                    }

                    if(i === 0 && i === effects.length-1){ 
                        // if it is the first and the only one effect, 
                        // connect synth with this effect and this effect with Destination
                        synth.connect(effects[i].object);
                        effects[i].object.connect(Tone.Destination);
                    } else if(i === 0){ 
                        // if it is the first effect (but not the last one), connect synth with it
                        synth.connect(effects[i].object);
                    } else if(i === effects.length - 1){
                        // if it is the last effect, connect it with the previous one and with Destination
                        effects[i-1].object.connect(effects[i].object);
                        effects[i].object.connect(Tone.Destination);
                    } else{ // if this effect is not the first nor the last one
                        effects[i-1].object.connect(effects[i].object);
                    }
                }
            }
            // 5. take synth from piano
            seq.synth = synth;
        }
        // 6. set 'fixed' if it wasn't or set 'not fixed' if it was
        seq.fixed = !seq.fixed;

        return Object.assign({}, state, {sequencer: seq});
    }

    // Instruments
    if(action.type == 'changeSequencerVolume'){
        // 0. copy! our sequencer from our state for further manipulations.
        let seq = Object.assign({}, state.sequencer);

        /* 'decibels' describe the amount of decibels on which 
         * we change our initial (computer) volume from normal to minimum. 
         * we don't raise the volume as it gets distorted
        */ 
        //let decibels = action.value - action.max; 
        
        seq.volume = action.value / action.max;
        //Tone.getDestination().volume.rampTo(decibels, 0.1);
        //Tone.getDestination().volume.value = decibels;

        return Object.assign({}, state, {sequencer: seq});
    }

    if(action.type == 'turnRecord'){
        let record = state.record;
        if(record.active){
            // stop recording
            // 1. unhighlight the record button
            for(let dom of action.toActivation){
                dom.classList.remove('active');
            }
            // 2. stop recording
            const recording = record.object.stop();
            //const recordingBlob = new Blob(state.record.stop(), {type:'audio/mpeg-3'});

            // 3. download the recording by giving the generated url to our download button
            // 'recording' is a promise, so we insert the code that handling the recorded audio in its '.then'
            recording.then((value) => {
                const url = URL.createObjectURL(value);
                action.reference.download = "recording.webm";
                action.reference.href = url;
                action.reference.classList.add("active");
            })
            // 4. set a 'record' to false in the state
            record.active = false;
            // 5. disconnect Destination from the Recorder object
            Tone.Destination.disconnect(record.object);
        } else{
            // start recording
            // 1. highlight the record button and some additional DOMs (for pulsing effect)
            for(let dom of action.toActivation){
                dom.classList.add('active');
            }
            // 2. set activation flag to 'true' (for our state)
            record.active = true;
            // 3. Connect Destination to the Recorder object and start it
            Tone.Destination.connect(record.object);
            record.object.start();
        }
        return Object.assign({}, state, {record})
    }

    if(action.type == 'flipKeyboard'){
        if(state.miniKeyboard){
            // show full keyboard
            // 1. get dom of the keyboard
            const keyboard = document.querySelector('.piano-keys');
            // 2. make them all visible
            for(let key of keyboard.children){
                key.classList.remove('disabled')
            }
            // 3. set a 'full-mode' class to the keyboard for 
            //    a good styling (it makes piano keys smaller via css)
            keyboard.setAttribute('id', 'full-mode-piano')

            state.miniKeyboard = false;
        } else{
            // show mini keyboard
            // 1. get dom of the keyboard
            const keyboard = document.querySelector('.piano-keys');
            // 2. make visible only those keys that have matching computer-keyboard keys to play
            for(let key of keyboard.children){
            if(!key.dataset.key)
                key.classList.add('disabled')
            }
            // 3. remove a 'full-mode' class from the keyboard
            keyboard.removeAttribute('id')

            state.miniKeyboard = true;

        }

        return Object.assign({}, state, {miniKeyboard: state.miniKeyboard})

    }

    return state;
}

export function elt(type, props, ...children) {
    let dom = document.createElement(type);
    if (props) Object.assign(dom, props);
    for (let child of children) {
      if (typeof child != "string") dom.appendChild(child);
      else dom.appendChild(document.createTextNode(child));
    }
    return dom;
}


export function eltSVG(type, props, ...children){
    let dom = document.createElementNS('http://www.w3.org/2000/svg', type);
    if(props){
        Object.keys(props).map(key => {
            dom.setAttributeNS(null, key, props[key])
        })
    }
    for (let child of children) {
        if (typeof child != "string") dom.appendChild(child);
        else dom.appendChild(document.createTextNode(child));
    }
    return dom;
}

class PianoApp{
    constructor(state, config){
        this.state = {};
        let {controls, tools, dispatch} = config;
        this.dispatch = dispatch;
        this.controls = controls.map(
            Control => new Control(state, dispatch, tools));

        this.dom = document.getElementById('container');
        this.keyboard = this.controls[0];
        this.effectsBoard = elt('div', {className: 'effects-board'});
        
        for(let ctrl of this.controls.slice(1)){
            this.effectsBoard.appendChild(ctrl.dom);
        }

        this.dom.appendChild(this.effectsBoard);
        this.dom.appendChild(this.keyboard.dom);

        this.syncState(state);
    }
    syncState(state){
        if(this.state != state){
            this.state = state;
            for(let ctrl of this.controls){
                ctrl.syncState(state);
            }
        }
    }
}

async function runApp(){
    /*
     * as an object type in state.effects we use object, not a Map. Although we need its keys to be ordered in
     * the order of their adding to the object. As our keys are always strings, we don't have to worry about it.
     * 
     * this app supports multiple keys to ne played simultaneously via Tone.PolySynth in which every of our
     * synthesizers are wrapped. Maximum of simultaneously played notes is 32.
     */

    let baseSynth = new Tone.PolySynth(Tone.Synth).toDestination();

    let state = {playingNotes: new Set(),
                 duration: '8n',
                 effects: {}, // {Chorus: chorusObject, }
                 oscillator: 'triangle',
                 //synth: {type: 'Synth', object: new Tone.Synth().toDestination()},
                 synth: {type: 'Synth', 
                         object: baseSynth, 
                         pattern: 'new Tone.PolySynth(Tone.Synth).toDestination()',
                         effectPatterns: [], // [ {pattern: '...', params: [{param1}, ...], }, ...]
                        }, 
                 miniKeyboard: true,
                 sequencer: typeof SequencerPanel !== 'undefined' ?
                    { 
                        grid: SequencerPanel.makeGrid(sequencerSettings.notes, sequencerSettings.columns),
                        columns: sequencerSettings.columns, 
                        rows: sequencerSettings.rows,
                        notes: sequencerSettings.notes,
                        /**  beat.i reflects the number of the current playing column. We have to
                         *  use '{i: 0}' instead of simply '0' here because beat will be operated
                         *  and mutated in a 'repeat' in Tone.scheduleRepeat(repeat, ...). It is a
                         *  setInterval-like function. Mutation of beat as a simple number like '0'
                         *  will not be reflected in this state because it is not mutable - we create
                         *  a new instance of state every time it is changed
                         * */ 
                        beat: {i: 0}, 
                        started: false,
                        playing: false,
                        synth: baseSynth,
                        fixed: false, // defines wheather the current synth being used by sequencer is fixed
                        volume: 1,
                    } :
                    false,
                 record: {active: false, object: new Tone.Recorder()}, // 'record: true' means that recording is going on right now
            }

    let app = new PianoApp(state, {controls: baseControls, 
                                   tools: {synths: baseSynths, 
                                           saveSynths: Object.keys(baseSynths).slice(0, amountOfSaveSynth + 1),
                                           oscillators: baseOscillators, 
                                           effects: baseEffects,
                                           sequencer: sequencerSettings}, 
                                   dispatch})

    function dispatch(action){
        state = handleAction(state, action);
        app.syncState(state);
    }
    
}

runApp();
