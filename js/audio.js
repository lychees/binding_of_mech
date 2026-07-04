// 音效系统 - 使用 Web Audio API 生成程序化音效
const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = null;

function getCtx() {
    if (!ctx) ctx = new AudioContext();
    return ctx;
}

export function initAudio() {
    return getCtx();
}

// 白噪声缓冲（用于爆炸、火焰等）
function createNoiseBuffer() {
    const context = getCtx();
    const bufferSize = context.sampleRate * 2;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}
let noiseBuffer = null;

function getNoiseBuffer() {
    if (!noiseBuffer) noiseBuffer = createNoiseBuffer();
    return noiseBuffer;
}

export function playShootSound(weaponType = 'vulcan') {
    const context = getCtx();
    const t = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    
    osc.connect(gain);
    gain.connect(context.destination);
    
    switch (weaponType) {
        case 'vulcan':
        case 'shotgun':
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
            break;
        case 'cannon':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
            break;
        case 'laser':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, t);
            osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.15);
            break;
        case 'beamSword':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.2);
            break;
        default:
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
    }
}

export function playExplosionSound(size = 'small') {
    const context = getCtx();
    const t = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = getNoiseBuffer();
    
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + (size === 'large' ? 0.8 : 0.4));
    
    const gain = context.createGain();
    gain.gain.setValueAtTime(size === 'large' ? 0.5 : 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + (size === 'large' ? 0.8 : 0.4));
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start(t);
    source.stop(t + (size === 'large' ? 0.8 : 0.4));
}

export function playHitSound() {
    const context = getCtx();
    const t = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(t);
    osc.stop(t + 0.1);
}

export function playDashSound() {
    const context = getCtx();
    const t = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(t);
    osc.stop(t + 0.2);
}

export function playHookSound() {
    const context = getCtx();
    const t = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(t);
    osc.stop(t + 0.15);
}

export function playHookHitSound() {
    const context = getCtx();
    const t = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(t);
    osc.stop(t + 0.15);
}

export function playHookBoostSound() {
    const context = getCtx();
    const t = context.currentTime;
    
    // 使用白噪声模拟压缩空气喷射
    const source = context.createBufferSource();
    source.buffer = getNoiseBuffer();
    
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.18);
    filter.Q.setValueAtTime(1.5, t);
    
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start(t);
    source.stop(t + 0.22);
    
    // 叠加一个低频的轰鸣感
    const osc = context.createOscillator();
    const oscGain = context.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.2);
    oscGain.gain.setValueAtTime(0.06, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(oscGain);
    oscGain.connect(context.destination);
    osc.start(t);
    osc.stop(t + 0.22);
}

export function playRepairSound() {
    const context = getCtx();
    const t = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.setValueAtTime(800, t + 0.1);
    osc.frequency.setValueAtTime(1000, t + 0.2);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(t);
    osc.stop(t + 0.3);
}

export function playPickupSound() {
    const context = getCtx();
    const t = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, t);
    osc.frequency.exponentialRampToValueAtTime(1500, t + 0.1);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(t);
    osc.stop(t + 0.1);
}

// 背景音乐（简单的节奏循环）
let bgmOscillators = [];
let bgmGain = null;
let isBgmPlaying = false;

export function playBGM() {
    if (isBgmPlaying) return;
    const context = getCtx();
    isBgmPlaying = true;
    
    const baseFreq = 55;
    const notes = [1, 1.2, 1.5, 1.25, 1, 1.5, 1.33, 1.66];
    let noteIndex = 0;
    
    function playBeat() {
        if (!isBgmPlaying) return;
        const t = context.currentTime;
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq * notes[noteIndex], t);
        gain.gain.setValueAtTime(0.03, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(t);
        osc.stop(t + 0.2);
        bgmOscillators.push(osc);
        noteIndex = (noteIndex + 1) % notes.length;
        setTimeout(playBeat, 250);
    }
    playBeat();
}

export function stopBGM() {
    isBgmPlaying = false;
    bgmOscillators.forEach(osc => {
        try { osc.stop(); } catch (e) {}
    });
    bgmOscillators = [];
}
