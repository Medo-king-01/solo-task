
// A lightweight sound synthesizer using Web Audio API
// No external files required. Works offline.

let audioCtx: AudioContext | null = null;

const getContext = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number, vol = 0.1) => {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
};

export const AudioService = {
    playSuccess: () => {
        const ctx = getContext();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        // High pitch Arpeggio
        playTone(600, 'sine', 0.1, now, 0.1);
        playTone(800, 'sine', 0.1, now + 0.1, 0.1);
        playTone(1200, 'sine', 0.2, now + 0.2, 0.1);
    },

    playLevelUp: () => {
        const ctx = getContext();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        // Epic Chord
        playTone(440, 'triangle', 0.5, now, 0.2);
        playTone(554, 'triangle', 0.5, now, 0.2);
        playTone(659, 'triangle', 0.8, now, 0.2);
        playTone(880, 'sine', 1.0, now + 0.1, 0.15);
        playTone(1108, 'sine', 1.2, now + 0.2, 0.1);
    },

    playClick: () => {
        const ctx = getContext();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        // Short blip
        playTone(1200, 'sine', 0.05, now, 0.05);
    },

    playError: () => {
        const ctx = getContext();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        // Low buzz
        playTone(150, 'sawtooth', 0.3, now, 0.1);
    },
    
    playBoost: () => {
        const ctx = getContext();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        // Power up sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }
};
