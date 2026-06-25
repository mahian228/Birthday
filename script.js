// ---- open gift (animated) ----
const introScreen = document.getElementById('intro-screen');
const mainContent = document.getElementById('main-content');
const giftBtn = document.getElementById('gift-btn');
const giftLid = document.getElementById('gift-lid');
const giftBow = document.getElementById('gift-bow');

giftBtn.addEventListener('click', () => {
    // Disable further clicks
    giftBtn.style.pointerEvents = 'none';

    // Stage 1: Bow spins off + Lid flies up
    giftBow.classList.add('opening');
    giftLid.classList.add('opening');

    // Stage 2: Box shrinks and disappears (after 300ms delay via CSS)
    setTimeout(() => {
        giftBtn.classList.add('opening');
    }, 350);

    // Stage 3: Massive confetti burst from center
    setTimeout(() => {
        for (let i = 0; i < 40; i++) burst(window.innerWidth / 2, window.innerHeight / 2);
    }, 500);

    // Stage 4: Fade intro screen and show main content
    setTimeout(() => {
        introScreen.classList.add('hide');
    }, 800);

    setTimeout(() => {
        mainContent.classList.add('show');
        mainContent.classList.add('section-fade');
        startAmbientSparkles();
    }, 1500);
});

// ---- progress and section locking system ----
const stages = ['music', 'cake', 'quiz', 'message', 'mementos', 'jar'];
const cards = {
    music: document.getElementById('card-music'),
    cake: document.getElementById('card-cake'),
    quiz: document.getElementById('card-quiz'),
    message: document.getElementById('card-message'),
    mementos: document.getElementById('card-mementos'),
    jar: document.getElementById('card-jar')
};

let birthdayStage = 0;

// Clear previous stored stage if any
localStorage.removeItem('birthday_stage');

function getBirthdayStage() {
    return birthdayStage;
}

function setBirthdayStage(stage) {
    birthdayStage = stage;
    updateProgressUI();
}

function updateProgressUI() {
    const currentStage = getBirthdayStage();
    
    const lockedBadge = `<span class="status-badge status-locked"><svg class="pixel-icon" width="10" height="12" viewBox="0 0 8 8" fill="currentColor"><path d="M 3 0 H 5 V 1 H 6 V 3 H 2 V 1 H 3 V 0 Z M 1 3 H 7 V 7 H 1 Z M 4 4 H 4.5 V 5.5 H 4 Z"/></svg> Locked</span>`;
    const openBadge = `<span class="status-badge status-open"><svg class="pixel-icon" width="14" height="12" viewBox="0 0 7 6" fill="currentColor"><path d="M1,0 h2 v1 h1 v-1 h2 v1 h1 v2 h-1 v1 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-2 h1 v-1 z"/></svg> Open</span>`;
    const completeBadge = `<span class="status-badge status-complete"><svg class="pixel-icon" width="12" height="12" viewBox="0 0 8 8" fill="currentColor"><path d="M 6 1 L 7 2 L 3 6 L 1 4 L 2 3 L 3 4 Z"/></svg> Complete</span>`;

    stages.forEach((stageName, index) => {
        const card = cards[stageName];
        if (!card) return;
        const statusTextEl = card.querySelector('.status-text');

        if (index <= currentStage) {
            // Unlocked
            card.classList.remove('locked');
            card.removeAttribute('disabled');
            
            if (index < currentStage) {
                if (statusTextEl) statusTextEl.innerHTML = completeBadge;
            } else {
                if (statusTextEl) statusTextEl.innerHTML = openBadge;
            }
        } else {
            // Locked
            card.classList.add('locked');
            card.setAttribute('disabled', 'true');
            if (statusTextEl) statusTextEl.innerHTML = lockedBadge;
        }
    });
}

// Initial UI application
updateProgressUI();

// ---- hub <-> panel navigation ----
const hubWrap = document.getElementById('hub-wrap');
const panels = document.querySelectorAll('.panel');

document.querySelectorAll('.gift-card').forEach(card => {
    card.addEventListener('click', () => {
        if (card.classList.contains('locked')) return;
        
        if (card.dataset.target === 'jar') {
            if (jarModal) {
                jarModal.classList.add('active');
                drawLoveNote();
            }
            playLoveStory();
            return;
        }

        hubWrap.style.display = 'none';
        const target = document.getElementById('panel-' + card.dataset.target);
        if (target) {
            target.classList.add('active', 'section-fade');
        }
    });
});

document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const activePanel = btn.closest('.panel');
        if (activePanel) {
            const panelId = activePanel.id;
            if (panelId === 'panel-music') {
                if (getBirthdayStage() < 1) {
                    setBirthdayStage(1);
                }
            } else if (panelId === 'panel-message') {
                if (getBirthdayStage() < 4) {
                    setBirthdayStage(4);
                }
                // Reset envelope opening state when leaving the panel
                const envelope = document.querySelector('.envelope-pixel');
                const letterStage = document.querySelector('.letter-stage');
                if (envelope) envelope.classList.remove('opened', 'opened-flap');
                if (letterStage) letterStage.classList.remove('opened');
                typewriterStarted = false;
                const el = document.getElementById('typewriter-text');
                if (el) el.textContent = '';
                const heartEl = document.getElementById('typewriter-heart');
                if (heartEl) heartEl.style.display = 'none';
            } else if (panelId === 'panel-mementos') {
                if (getBirthdayStage() < 5) {
                    setBirthdayStage(5);
                }
            }
        }

        panels.forEach(p => p.classList.remove('active'));
        hubWrap.style.display = 'block';
        hubWrap.classList.add('section-fade');
    });
});

// ---- music player ----
const vinyl = document.getElementById('vinyl');
const tonearm = document.getElementById('tonearm');
const playBtn = document.getElementById('play-btn');
const audioElement = document.getElementById('audio-element');
const bars = document.querySelectorAll('.v-bar');
let playing = false;

let loveStoryAudio = null;
let loveStoryPlayCount = 0;

function showWishPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.zIndex = '2000';
    
    const content = document.createElement('div');
    content.className = 'modal-content pixel-frame';
    content.style.maxWidth = '300px';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-modal-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => overlay.remove());
    
    const heartSvg = `<div style="display: block; text-align: center; margin-bottom: 12px;">
        <svg class="pixel-heart-svg lg glow" style="--c:var(--red); display: block; width: 56px; height: 48px; margin: 0 auto;" viewBox="0 0 7 6">
            <path d="M1,0 h2 v1 h1 v-1 h2 v1 h1 v2 h-1 v1 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-2 h1 v-1 z" fill="currentColor" />
        </svg>
    </div>`;
    
    const message = document.createElement('p');
    message.style.fontSize = '1.25rem';
    message.style.lineHeight = '1.4';
    message.style.margin = '0 0 16px 0';
    message.textContent = "Have a  great day and best of luck for the upcoming days!";
    
    const okBtn = document.createElement('button');
    okBtn.className = 'pixel-frame-sm';
    okBtn.style.background = 'var(--red)';
    okBtn.style.color = 'var(--cream)';
    okBtn.style.border = '2px solid var(--ink)';
    okBtn.style.padding = '6px 16px';
    okBtn.style.fontSize = '1rem';
    okBtn.textContent = 'Thank you! ❤️';
    okBtn.addEventListener('click', () => overlay.remove());
    
    content.appendChild(closeBtn);
    content.innerHTML += heartSvg;
    content.appendChild(message);
    content.appendChild(okBtn);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

function playLoveStory() {
    // Stop the blue song if playing
    if (playing) {
        audioElement.pause();
        playing = false;
        if (vinyl) vinyl.classList.remove('spinning');
        if (tonearm) tonearm.classList.remove('dropped');
        if (playBtn) playBtn.innerHTML = '&#9658; play';
        if (bars) {
            bars.forEach((bar, index) => {
                currentHeights[index] = 6;
                bar.style.height = '6px';
            });
        }
        document.documentElement.style.setProperty('--music-beat-scale', '1');
    }
    
    // Play Love Story
    if (!loveStoryAudio) {
        loveStoryAudio = new Audio('Love-Story.mp3');
        loveStoryAudio.addEventListener('ended', () => {
            loveStoryPlayCount++;
            if (loveStoryPlayCount < 2) {
                loveStoryAudio.currentTime = 0;
                loveStoryAudio.play().catch(err => console.error(err));
            } else {
                loveStoryPlayCount = 0;
                showWishPopup();
            }
        });
    }
    
    loveStoryPlayCount = 0;
    loveStoryAudio.currentTime = 0;
    loveStoryAudio.play().catch(err => console.error("Love Story playback failed:", err));
}

// ---- Synced lyrics for "Blue" by yung kai ----
const songLyrics = [
    { time: 0, text: "♪ (Music Playing) ♪" },
    { time: 19.3, text: "Your morning eyes, I could stare like watching stars" },
    { time: 26.6, text: "I could walk you by, and I'll tell without a thought" },
    { time: 32.4, text: "You'd be mine, would you mind if I took your hand tonight?" },
    { time: 40.0, text: "Know you're all that I want this life" },
    { time: 48.3, text: "I'll imagine we fell in love" },
    { time: 51.0, text: "I'll nap under moonlight skies with you" },
    { time: 55.2, text: "I think I'll picture us, you with the waves" },
    { time: 59.0, text: "The ocean's colors on your face" },
    { time: 62.8, text: "I'll leave my heart with your air" },
    { time: 66.8, text: "So let me fly with you" },
    { time: 69.5, text: "Will you be forever with me?" },
    { time: 76.0, text: "♪ (Instrumental Break) ♪" },
    { time: 106.9, text: "My love will always stay by you" },
    { time: 112.7, text: "I'll keep it safe, so don't you worry a thing" },
    { time: 118.0, text: "I'll tell you I love you more" },
    { time: 121.5, text: "It's stuck with you forever, so promise you won't let it go" },
    { time: 128.4, text: "I'll trust the universe will always bring me to you" },
    { time: 136.9, text: "I'll imagine we fell in love" },
    { time: 139.4, text: "I'll nap under moonlight skies with you" },
    { time: 142.9, text: "I think I'll picture us, you with the waves" },
    { time: 146.6, text: "The ocean's colors on your face" },
    { time: 150.3, text: "I'll leave my heart with your air" },
    { time: 155.0, text: "So let me fly with you" },
    { time: 158.4, text: "Will you be forever with me?" },
    { time: 164.0, text: "Will you be forever with me?" },
    { time: 171.0, text: "♪ (Outro) ♪" }
];

let currentLyricIndex = -1;
const lyricTextEl = document.getElementById('lyric-text');

function updateLyrics(currentTime) {
    let activeIndex = -1;
    for (let i = 0; i < songLyrics.length; i++) {
        if (currentTime >= songLyrics[i].time) {
            activeIndex = i;
        } else {
            break;
        }
    }

    if (activeIndex !== currentLyricIndex) {
        currentLyricIndex = activeIndex;
        const newText = activeIndex !== -1 ? songLyrics[activeIndex].text : "♪ Click Play to Start ♪";
        
        // Smooth transition effect
        lyricTextEl.style.opacity = '0';
        lyricTextEl.style.transform = 'scale(0.96)';
        
        setTimeout(() => {
            lyricTextEl.textContent = newText;
            lyricTextEl.style.opacity = '1';
            lyricTextEl.style.transform = 'scale(1)';
        }, 150);
    }
}

let audioCtx;
let analyser;
let source;
let dataArray;

// Visualizer height memory for smooth transition interpolation
let currentHeights = Array(12).fill(6);

function initAudio() {
    if (audioCtx || analyser) return;
    try {
        // Detect if loaded via file:// protocol
        const isLocalFile = window.location.protocol === 'file:';
        if (isLocalFile) {
            console.info("Running locally via file://. Bypassing Web Audio API connection to avoid CORS silencing. Falling back to simulated visualizer.");
            analyser = 'simulated';
            return;
        }

        // Create AudioContext (must be triggered by user gesture)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64; // Small size fits 12 bars perfectly
        source = audioCtx.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    } catch (e) {
        console.warn("Web Audio API blocked or not supported. Falling back to simulated visualizer.", e);
        analyser = 'simulated';
    }
}

function updateVisualizer() {
    if (!playing || !analyser) {
        // Reset visualizer bars to baseline height when paused
        bars.forEach((bar, index) => {
            currentHeights[index] = 6;
            bar.style.height = '6px';
        });
        document.documentElement.style.setProperty('--music-beat-scale', '1');
        return;
    }

    requestAnimationFrame(updateVisualizer);

    if (analyser === 'simulated') {
        const t = audioElement.currentTime;

        // 124 BPM beat calculation (approx 2.06 beats per second)
        const beatTime = t * 2.06;
        const isKickBeat = (beatTime % 1.0) < 0.16; // Kick drum window
        const isSnareBeat = ((beatTime + 0.5) % 1.0) < 0.16; // Snare drum window (offbeat)

        // Dynamic State Machine: 5 choreographical stages synced to the song progress
        let stage = 'intro';
        if (t < 15) {
            stage = 'intro'; // Chill opening
        } else if (t < 55) {
            stage = 'verse'; // Rhythmic build-up
        } else if (t < 95) {
            stage = 'chorus'; // High energy peak (heavy drums + full spectrum)
        } else if (t < 135) {
            stage = 'verse'; // Vocal verse 2
        } else if (t < 185) {
            stage = 'chorus'; // Outro chorus peak
        } else {
            stage = 'outro'; // Calm fading outro
        }

        let beatScale = 1.0;
        if (isKickBeat) {
            beatScale = 1.45;
            if (Math.random() < 0.22) spawnParticle();
        } else if (isSnareBeat) {
            beatScale = 1.25;
            if (Math.random() < 0.12) spawnParticle();
        }
        document.documentElement.style.setProperty('--music-beat-scale', beatScale);

        bars.forEach((bar, index) => {
            let targetHeight = 6;

            switch (stage) {
                case 'intro':
                    // Soft warm low-frequency swell (Bass end only)
                    if (index < 4) {
                        targetHeight = Math.sin(t * 2 + index * 0.8) * 10 + 14;
                    } else if (index < 8) {
                        targetHeight = Math.sin(t * 1.5 + index * 0.5) * 5 + 9;
                    } else {
                        targetHeight = Math.sin(t * 1.0) * 2 + 7;
                    }
                    break;

                case 'verse':
                    // Active verse style. Mid frequencies (vocals) bouncy, low drums kicking
                    if (index < 3) {
                        // Rhythmic kick beats on sub-bass
                        targetHeight = isKickBeat ? 26 : (Math.sin(t * 4 + index) * 6 + 10);
                    } else if (index < 8) {
                        // Melody / Vocals
                        targetHeight = Math.sin(t * 6 + index * 0.6) * 12 + 18;
                    } else {
                        // High hats reacting on offbeats
                        targetHeight = isSnareBeat ? 18 : (Math.cos(t * 8 + index) * 5 + 8);
                    }
                    break;

                case 'chorus':
                    // Peak Energy Chorus! Spikes on all bands, heavy synchronized beats
                    if (index < 4) {
                        // Bass drops / Heavy kick drums
                        targetHeight = isKickBeat ? 38 : (Math.random() * 10 + 14);
                    } else if (index < 9) {
                        // Intense synth / chords
                        targetHeight = Math.sin(t * 7.5 + index * 0.45) * 16 + 22;
                        if (isSnareBeat) targetHeight += 4;
                    } else {
                        // Sparkly cymbals / highs
                        targetHeight = Math.cos(t * 11 + index * 0.9) * 12 + 18;
                    }
                    break;

                case 'outro':
                    // Fading out slowly towards the end of the song
                    const fade = Math.max(0, (221 - t) / 36);
                    targetHeight = (Math.sin(t * 3.5 + index * 0.5) * 12 + 14) * fade;
                    break;
            }

            // Bind values between 6px and 42px
            targetHeight = Math.max(6, Math.min(42, targetHeight));

            // Smooth linear interpolation (0.16 smoothing factor)
            currentHeights[index] += (targetHeight - currentHeights[index]) * 0.16;
            bar.style.height = Math.round(currentHeights[index]) + 'px';
        });
        return;
    }

    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    const intensity = avg / 255;
    const beatScale = 1.0 + intensity * 0.55;
    document.documentElement.style.setProperty('--music-beat-scale', beatScale);

    if (intensity > 0.28 && Math.random() < intensity * 0.4) {
        spawnParticle();
    }

    bars.forEach((bar, index) => {
        // Map frequency range values (0-255) to a height range (6px to 42px)
        const value = dataArray[index] || 0;
        const percent = value / 255;
        const targetHeight = Math.max(6, Math.floor(percent * 36) + 6);

        // Linear interpolation (smoothing factor of 0.22)
        currentHeights[index] += (targetHeight - currentHeights[index]) * 0.22;
        bar.style.height = Math.round(currentHeights[index]) + 'px';
    });
}

// ---- Progress bar and time tracking logic ----
const progressFill = document.getElementById('progress-fill');
const currentTimeEl = document.getElementById('current-time');
const durationTimeEl = document.getElementById('duration-time');
const progressBar = document.querySelector('.progress-bar');

function formatTime(secs) {
    if (isNaN(secs) || secs === Infinity) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

audioElement.addEventListener('timeupdate', () => {
    const cur = audioElement.currentTime;
    const dur = audioElement.duration || 221; // fallback to 221s (3:41) if metadata hasn't loaded yet

    currentTimeEl.textContent = formatTime(cur);
    durationTimeEl.textContent = formatTime(dur);

    const percent = (cur / dur) * 100;
    progressFill.style.width = percent + '%';

    // Update synchronized lyrics
    updateLyrics(cur);
});

// Click to seek on progress bar
progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const dur = audioElement.duration || 221;
    audioElement.currentTime = (clickX / width) * dur;
});

playBtn.addEventListener('click', () => {
    // Initialize Web Audio API components on first interaction
    initAudio();

    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    playing = !playing;

    if (playing) {
        audioElement.play().catch(err => {
            console.error("Audio playback failed or file missing: ", err);
            // Revert state if audio fails to play
            playing = false;
            vinyl.classList.remove('spinning');
            tonearm.classList.remove('dropped');
            playBtn.innerHTML = '&#9658; play';
        });

        if (playing) {
            vinyl.classList.add('spinning');
            tonearm.classList.add('dropped');
            playBtn.innerHTML = '&#10074;&#10074; pause';
            updateVisualizer();
        }
    } else {
        audioElement.pause();
        vinyl.classList.remove('spinning');
        tonearm.classList.remove('dropped');
        playBtn.innerHTML = '&#9658; play';
    }
});

vinyl.addEventListener('click', () => {
    playBtn.click();
});

// ---- sparkle / particle system (hearts + stars, no emoji) ----
function burst(x, y) {
    spawnParticle(x + (Math.random() * 140 - 70), y + (Math.random() * 140 - 70), true);
}

function spawnParticle(x, yOverride, isBurst) {
    // Cap active sparkles to keep DOM light and rendering at 60fps on mobile
    if (!isBurst && document.querySelectorAll('.sparkle').length > 30) {
        return;
    }

    let container = document.getElementById('sparkle-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'sparkle-container';
        document.body.appendChild(container);
    }

    const el = document.createElement('div');
    const isHeart = Math.random() > 0.45;
    el.className = 'sparkle';

    const colors = ['var(--pink)', 'var(--gold)', 'var(--red)', 'var(--green)'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Hardware accelerated inline SVGs instead of long box-shadow strings
    if (isHeart) {
        el.innerHTML = `<svg width="18" height="15" viewBox="0 0 7 6" style="display:block; filter: drop-shadow(0 0 4px ${color}); color: ${color};"><path d="M1,0 h2 v1 h1 v-1 h2 v1 h1 v2 h-1 v1 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-2 h1 v-1 z" fill="currentColor"/></svg>`;
    } else {
        el.innerHTML = `<svg width="15" height="15" viewBox="0 0 5 5" style="display:block; filter: drop-shadow(0 0 4px ${color}); color: ${color};"><path d="M2,0 h1 v1 h1 v1 h1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-1 h1 v-1 h1 z" fill="currentColor"/></svg>`;
    }

    const startX = x !== undefined ? x : Math.random() * window.innerWidth;
    const startY = yOverride !== undefined ? yOverride : window.innerHeight + 10;
    const duration = isBurst ? (1.2 + Math.random()) : (4 + Math.random() * 2);

    el.style.left = startX + 'px';
    el.style.top = startY + 'px';
    el.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
    el.style.animationDuration = duration + 's';

    container.appendChild(el);
    setTimeout(() => el.remove(), duration * 1000);
}

function startAmbientSparkles() {
    setInterval(() => spawnParticle(), 350);
}

// ---- Typewriter effect for love note ----
const typewriterFullText = `Dear Riham, the love of my life,

This is a simple surprise that I could manage for now, but I still feel it isn't enough for you. You mean a lot to me and deserve much more than this. First of all, I am really sorry if I have hurt you throughout this period of our relationship. It has been nearly two years already; we have really had both good and bad times, but we overcame every situation, and we are still together. Inshallah, we will be getting much closer to our final step soon. I have a lot to say that cannot be explained in a letter; I hope you look forward to the time when we will be together and spend the night.

Your love,
Mahian.`;
let typewriterStarted = false;

function startTypewriter() {
    if (typewriterStarted) return;
    typewriterStarted = true;

    const el = document.getElementById('typewriter-text');
    const heartEl = document.getElementById('typewriter-heart');
    el.textContent = '';

    // Add blinking cursor
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    el.appendChild(cursor);

    let i = 0;
    const speed = 20; // ms per character (slightly faster for longer text)

    function typeChar() {
        if (i < typewriterFullText.length) {
            // Insert character before cursor
            el.insertBefore(document.createTextNode(typewriterFullText[i]), cursor);
            i++;
            
            // Auto scroll container to keep cursor in view
            const paperEl = el.closest('.letter-paper');
            if (paperEl) {
                paperEl.scrollTop = paperEl.scrollHeight;
            }
            
            setTimeout(typeChar, speed);
        } else {
            // Typing complete — remove cursor, show heart
            setTimeout(() => {
                cursor.remove();
                if (heartEl) {
                    heartEl.style.display = 'block';
                    // Scroll to bottom once more to show the heart
                    const paperEl = el.closest('.letter-paper');
                    if (paperEl) {
                        paperEl.scrollTop = paperEl.scrollHeight;
                    }
                }
                // Close the envelope flap once loading completes!
                if (envelope) {
                    envelope.classList.remove('opened-flap');
                }
            }, 600);
        }
    }

    // Start after a brief pause for the letter rise animation
    setTimeout(typeChar, 1200);
}

// ---- Envelope opening and Love Letter playback ----
const envelope = document.querySelector('.envelope-pixel');
const letterStage = document.querySelector('.letter-stage');

if (envelope) {
    envelope.addEventListener('click', () => {
        if (!envelope.classList.contains('opened')) {
            envelope.classList.add('opened', 'opened-flap');
            letterStage.classList.add('opened');
            startTypewriter();
        }
    });
}

// ---- Birthday Cake: Candle blowing & wishing ----
const candles = document.querySelectorAll('.candle');
const wishMsg = document.getElementById('wish-msg');
const wishContainer = document.getElementById('wish-input-container');
const wishInput = document.getElementById('wish-input');
const sendWishBtn = document.getElementById('send-wish-btn');
let candlesOut = 0;

candles.forEach(candle => {
    candle.addEventListener('click', () => {
        if (candle.dataset.lit === 'true') {
            candle.dataset.lit = 'false';
            candlesOut++;

            // Small burst from this candle
            const rect = candle.getBoundingClientRect();
            for (let i = 0; i < 3; i++) {
                burst(rect.left + rect.width / 2, rect.top);
            }

            // All candles blown out
            if (candlesOut >= candles.length) {
                setTimeout(() => {
                    // Reveal the wish box
                    if (wishContainer) {
                        wishContainer.style.display = 'flex';
                        wishInput.focus();
                    }
                    // Big celebration burst
                    for (let i = 0; i < 20; i++) {
                        burst(window.innerWidth / 2, window.innerHeight / 2);
                    }
                }, 600);
            }
        }
    });
});

function submitWish() {
    const wishText = wishInput.value.trim();
    if (!wishText) return;

    // Hide the input container
    wishContainer.style.display = 'none';

    // Show magical confirmation
    wishMsg.textContent = '✨Inshallah, Allah will make your wish true.✨';

    // Unlock next stage (message card)
    if (getBirthdayStage() < 2) {
        setBirthdayStage(2);
    }

    // Massive celebration bursts
    let burstsCount = 0;
    const interval = setInterval(() => {
        for (let i = 0; i < 15; i++) {
            burst(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
        }
        burstsCount++;
        if (burstsCount >= 3) clearInterval(interval);
    }, 300);
}

if (sendWishBtn && wishInput) {
    sendWishBtn.addEventListener('click', submitWish);
    wishInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitWish();
    });
}

// ---- Developer Bypass Keybind ----
window.addEventListener('keydown', (e) => {
    // Ignore keypress if user is typing in an input
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
    }
    // Press 'u' or 'U' to bypass and unlock all sections
    if (e.key === 'u' || e.key === 'U') {
        setBirthdayStage(6);
        console.log("Developer Bypass: All sections unlocked.");
    }
});

// ============ QUIZ SYSTEM LOGIC ============
const quizQuestions = [
    {
        question: "When did we first meet in person?",
        options: ["8th September 2024", "10th September 2024", "10th April 2025"],
        answer: 0
    },
    {
        question: "Who confessed first (and how)?",
        options: ["Mahian did, very romantically", "Riham did (but Mahian tricked her!)", "It was a mutual double-confession"],
        answer: 1
    },
    {
        question: "Where did we go on our first official date?",
        options: ["A cozy local cafe", "The beautiful beach", "A quiet nature park"],
        answer: 1
    }
];

let currentQuestionIndex = 0;
const quizQuestionEl = document.getElementById('quiz-question');
const quizOptionsEl = document.getElementById('quiz-options');
const quizFeedbackEl = document.getElementById('quiz-feedback');
const quizProgressFillEl = document.getElementById('quiz-progress-fill');
const quizQNumEl = document.getElementById('quiz-q-num');

function loadQuizQuestion() {
    if (!quizQuestionEl) return;
    const currentQ = quizQuestions[currentQuestionIndex];
    quizQuestionEl.textContent = currentQ.question;
    quizFeedbackEl.textContent = "";
    
    // Update progress
    quizQNumEl.textContent = `Question ${currentQuestionIndex + 1} of ${quizQuestions.length}`;
    const progressPct = (currentQuestionIndex / quizQuestions.length) * 100;
    quizProgressFillEl.style.width = progressPct + '%';

    quizOptionsEl.innerHTML = "";
    currentQ.options.forEach((option, idx) => {
        const btn = document.createElement('button');
        btn.className = "quiz-opt-btn pixel-frame-sm";
        btn.textContent = option;
        btn.addEventListener('click', () => handleQuizAnswer(idx, btn));
        quizOptionsEl.appendChild(btn);
    });
}

function handleQuizAnswer(selectedIdx, selectedBtn) {
    const currentQ = quizQuestions[currentQuestionIndex];
    const buttons = quizOptionsEl.querySelectorAll('.quiz-opt-btn');
    
    buttons.forEach(btn => btn.disabled = true);

    if (selectedIdx === currentQ.answer) {
        selectedBtn.classList.add('correct');
        quizFeedbackEl.textContent = "✨ Correct! Sweet memory. ✨";
        
        const rect = selectedBtn.getBoundingClientRect();
        for (let i = 0; i < 4; i++) {
            burst(rect.left + rect.width / 2, rect.top);
        }

        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < quizQuestions.length) {
                loadQuizQuestion();
            } else {
                quizProgressFillEl.style.width = '100%';
                quizQuestionEl.textContent = "🎉 You know us perfectly!";
                quizOptionsEl.innerHTML = "";
                quizFeedbackEl.textContent = "Love Note is now unlocked! 💌";
                
                if (getBirthdayStage() < 3) {
                    setBirthdayStage(3);
                }

                for (let i = 0; i < 15; i++) {
                    burst(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
                }
            }
        }, 1500);
    } else {
        selectedBtn.classList.add('wrong');
        quizFeedbackEl.textContent = "🤫 Close! Think back to our timeline...";
        
        setTimeout(() => {
            buttons.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('wrong');
            });
        }, 1200);
    }
}

loadQuizQuestion();

// ============ LOVE JAR WIDGET LOGIC ============
const loveJarMessages = [
    "You are the answer to all my prayers. 🤲",
    "I can't wait for the day we share the same home and night skies. 🏡",
    "I love the sparkle in your eyes when you look at me. 💕",
    "You are my greatest blessing, Riham. 🌸",
    "I promise to hold your hand through every storm and every sunshine. ☀️",
    "Two years with you felt like a beautiful dream I never want to wake up from.",
    "I fell in love with your soul before I could even touch your hand. 💫",
    "May Allah bless us with endless sabr, mercy, and love. 🤲",
    "You are my today, my tomorrow, and my forever. 👩‍❤️‍👨",
    "I love you more than words could ever describe, Riham.",
    "Being with you makes me the happiest version of myself. 💖",
    "I thank Allah every day for bringing you into my life. 🌸",
    "Hope you understand my feeling when you're angry. 🥺"
];

const loveJarWidget = document.getElementById('love-jar-widget');
const jarModal = document.getElementById('jar-modal');
const closeJarBtn = document.getElementById('close-jar-btn');
const drawAgainBtn = document.getElementById('draw-again-btn');
const jarNoteText = document.getElementById('jar-note-text');
const modalJarSvg = document.getElementById('modal-jar-svg');

if (loveJarWidget) {
    loveJarWidget.addEventListener('click', () => {
        jarModal.classList.add('active');
        drawLoveNote();
        playLoveStory();
    });
}

if (closeJarBtn) {
    closeJarBtn.addEventListener('click', () => {
        jarModal.classList.remove('active');
    });
}

if (jarModal) {
    jarModal.addEventListener('click', (e) => {
        if (e.target === jarModal) {
            jarModal.classList.remove('active');
        }
    });
}

if (drawAgainBtn) {
    drawAgainBtn.addEventListener('click', () => {
        drawLoveNote();
    });
}

function drawLoveNote() {
    if (!modalJarSvg) return;
    
    modalJarSvg.classList.add('shaking-jar');
    jarNoteText.style.opacity = '0';
    jarNoteText.classList.remove('fade-in-text');
    drawAgainBtn.disabled = true;

    setTimeout(() => {
        modalJarSvg.classList.remove('shaking-jar');
        
        const randomMsg = loveJarMessages[Math.floor(Math.random() * loveJarMessages.length)];
        jarNoteText.textContent = `"${randomMsg}"`;
        
        jarNoteText.classList.add('fade-in-text');
        drawAgainBtn.disabled = false;
        drawAgainBtn.textContent = "Draw Another";
        
        const rect = modalJarSvg.getBoundingClientRect();
        for (let i = 0; i < 5; i++) {
            burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }

        // Sprinkle sparkles on the text area as it fades in
        const textRect = jarNoteText.getBoundingClientRect();
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                burst(textRect.left + Math.random() * textRect.width, textRect.top + Math.random() * textRect.height);
            }, i * 80);
        }
    }, 600);
}
