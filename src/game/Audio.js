export class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Lower volume
        this.masterGain.connect(this.ctx.destination);
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
        this.initialized = true;
        this.startAmbience();
    }

    playTone(freq, type, duration, vol = 1) {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playCollect() {
        // High pitch "coin" sound
        this.playTone(880, 'sine', 0.1, 0.5);
        setTimeout(() => this.playTone(1760, 'sine', 0.1, 0.3), 50);
    }

    playPowerup() {
        // Ascending charge
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    playExplosion() {
        // Noise burst
        if (!this.initialized) return;
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();

        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }

    startAmbience() {
        // Low drone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 50;

        // Lowpass filter for "muffled" sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        gain.gain.value = 0.1;
        osc.start();

        this.ambienceOsc = osc; // Keep reference to stop it
    }

    playMusic(mode = 'NORMAL') {
        if (!this.initialized) return;
        if (this.musicInterval) return; // Already playing

        let notes, tempo, waveType;

        if (mode === 'HARDCORE') {
            // Fast, aggressive, dissonant
            notes = [220, 233, 247, 262, 277, 294, 311, 330]; // Chromatic scale
            tempo = 60; // Very fast
            waveType = 'sawtooth';
        } else if (mode === 'ZEN') {
            // Calm, melodic, peaceful - pentatonic scale
            notes = [261.63, 293.66, 329.63, 392.00, 440.00]; // C, D, E, G, A
            tempo = 200; // Slow
            waveType = 'sine';
        } else {
            // Normal - C minor arpeggio
            notes = [261.63, 311.13, 392.00, 523.25]; // C, Eb, G, C
            tempo = 100; // Medium
            waveType = 'square';
        }

        let noteIdx = 0;

        const playNote = () => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = waveType;
            osc.frequency.setValueAtTime(notes[noteIdx], this.ctx.currentTime);

            const volume = mode === 'ZEN' ? 0.05 : 0.1;
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (tempo / 1000));

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.ctx.currentTime + (tempo / 1000));

            noteIdx = (noteIdx + 1) % notes.length;
        };

        this.musicInterval = setInterval(playNote, tempo);
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}
