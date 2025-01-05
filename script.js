const playerContainer = document.getElementById('playerContainer');
const playlistHolder = document.getElementById('playlistHolder');
const listshowBtn = document.getElementById('showList');
const listcloseBtn = document.getElementById('closeList');
const openButton = document.getElementById('openFiles')
const fileInput = document.getElementById('fileInput');
const playPauseButton = document.getElementById('playPauseButton');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const albumArt = document.getElementById('albumArt');
const progressText = document.getElementById('progressText');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const playlistModal = document.getElementById('playlistHolder');
const playlistContainer = document.getElementById('playlistContainer');
const progressCircle = document.querySelector('.circular-progress');
let hammer = new Hammer(trackTitle);
navigator.mediaSession.setActionHandler('play', playAudio);
navigator.mediaSession.setActionHandler('pause', pauseAudio);
navigator.mediaSession.setActionHandler('previoustrack', prev);
navigator.mediaSession.setActionHandler('nexttrack', next);


hammer.on("swiperight", function () {
    prev();
});

hammer.on("swipeleft", function () {
    next();
});


let isPlaylistVisible = true;

const audio = new Audio();
let isPlaying = false;
let currentTrackIndex = 0;
let trackList = [];

openButton.addEventListener('click', () => fileInput.click());


fileInput.addEventListener('change', (event) => {
    const files = event.target.files;
    if (files.length > 0) {
        trackList = Array.from(files);
        currentTrackIndex = 0;
        loadTrack(currentTrackIndex);
        updatePlaylist();
    }
});

function loadTrack(index) {
    const file = trackList[index];
    if (file) {
        audio.src = URL.createObjectURL(file);

        jsmediatags.read(file, {
            onSuccess: (tag) => {
                const { title, artist, picture, album } = tag.tags;
                trackTitle.textContent = title || file.name;
                trackArtist.textContent = artist || 'Unknown Artist';

                const base64String = picture
                    ? `data:${picture.format};base64,${btoa(new Uint8Array(picture.data).reduce((data, byte) => data + String.fromCharCode(byte), ''))}`
                    : './assets/nocover.png';
          
                albumArt.src = base64String;

                // Apply background gradient from album art
                if (picture) {
                    const img = new Image();
                    img.src = base64String;
                    img.onload = () => {
                        const colorThief = new ColorThief();
                        const palette = colorThief.getPalette(img, 3);
                        const color1 = palette[0];
                        const color2 = palette[1];
                        const color3 = palette[2];
                        const rgbColor1 = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`;
                        const rgbColor2 = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`;
                        const rgbColor3 = `rgb(${color3[0]}, ${color3[1]}, ${color3[2]})`;
                        playerContainer.style.background = `linear-gradient(135deg, ${rgbColor1}, ${rgbColor3}, ${rgbColor2})`;
                    };
                } 
                
                
                // Update Media Session API
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: title || file.name,
                        artist: artist || 'Unknown Artist',
                        album: album || 'Unknown Album',
                        artwork: [
                            { src: base64String, sizes: '512x512', type: picture ? picture.format : 'image/png' }
                        ]
                    });
                } else {
                    playerContainer.style.background = '#1e1e2f';
                }

                
            },
            onError: () => {
                trackTitle.textContent = file.name;
                trackArtist.textContent = 'Unknown Artist';
                albumArt.src = './assets/nocover.png';
                playerContainer.style.background = '#1e1e2f';
                
                // Update Media Session API
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: file.name,
                        artist: 'Unknown Artist',
                        album: 'Unknown Album',
                        artwork: [
                            { src: './assets/nocover.png' }
                        ]
                    });
                }
            }
        });
    }
}


function updatePlaylist() {
    playlistContainer.innerHTML = '';
    if (trackList.length === 0) {
        playlistContainer.innerHTML = '<div class="playlist-item">No Tracks</div>';
        return;
    }

    trackList.forEach((file, index) => {
        const listItem = document.createElement('div');
        listItem.classList.add('playlist-item');
        listItem.textContent = file.name;
    
        if (index === currentTrackIndex) listItem.classList.add('active-track');
    
        listItem.addEventListener('click', () => {
            currentTrackIndex = index;
            loadTrack(currentTrackIndex);
            updatePlaylist();
        });

        playlistContainer.appendChild(listItem);
    });
}

nextButton.addEventListener('click', next);

prevButton.addEventListener('click', prev);

function next() {
    if (isPlaying) {
        currentTrackIndex = (currentTrackIndex + 1) % trackList.length;
        loadTrack(currentTrackIndex);
        updatePlaylist();
        playAudio();
    } else {
        currentTrackIndex = (currentTrackIndex + 1) % trackList.length;
        loadTrack(currentTrackIndex);
        updatePlaylist();
        zero();
    }
}

function prev() {
    if (isPlaying) {
        currentTrackIndex = (currentTrackIndex - 1 + trackList.length) % trackList.length;
        loadTrack(currentTrackIndex);
        updatePlaylist();
        playAudio();
    } else {
        currentTrackIndex = (currentTrackIndex - 1 + trackList.length) % trackList.length;
        loadTrack(currentTrackIndex);
        updatePlaylist();
        zero();
    }
}

// Update Progress Circle

audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    const degree = (progress / 100) * 360;
    progressCircle.style.background = `conic-gradient(#1db954 ${degree}deg, #555 ${degree}deg)`;
});

function zero() {
    progressCircle.style.background = `conic-gradient(#1db954 360deg, #555 360deg)`;
}


function formatTime(time) {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

// Play/Pause Button
playPauseButton.addEventListener('click', () => {
    advancedPlay();
});

albumArt.addEventListener('click', () => {
    advancedPlay();
});

function advancedPlay() {
    if (audio.paused) {
        if (trackList.length >0) {
            playAudio();
        }
        else {
            fileInput.click();
        }
    } 
    else {
        if (trackList.length >0) {
            pauseAudio();
        }        
        else {
            fileInput.click();
        }
    
    }
}

function playAudio() {
    audio.play();
    playPauseButton.classList.add('pause');
    progressCircle.classList.remove('anim');
    isPlaying = true
}

function pauseAudio() {
    audio.pause();
    playPauseButton.classList.remove('pause');
    progressCircle.classList.add('anim');
    isPlaying = false;
}

audio.addEventListener('ended', () => {
    currentTrackIndex = (currentTrackIndex + 1) % trackList.length;
    loadTrack(currentTrackIndex);
    audio.play();
    updatePlaylist();
});

function updateProgress(e) {
    const rect = progressCircle.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = e.clientX - centerX;
    const offsetY = e.clientY - centerY;
    let angle = Math.atan2(offsetY, offsetX);
    angle += Math.PI / 2;
    if (angle < 0) {
        angle += 2 * Math.PI;
    }
    let progress = angle / (2 * Math.PI);
    progress = Math.min(1, Math.max(0, progress));
    audio.currentTime = progress * audio.duration;
    updateProgressCircle();
}

function updateProgressCircle() {
  const progress = (audio.currentTime / audio.duration) * 100;
  progressCircle.style.background = `conic-gradient(#009c37 ${progress}%, #555 ${progress}%)`;

  const currentTime = formatTime(audio.currentTime);
  const duration = formatTime(audio.duration);
  progressText.textContent = `~ ${currentTime} / ${duration} ~`;
}

progressCircle.addEventListener('click', updateProgress);

audio.addEventListener('timeupdate', updateProgressCircle);

document.onload = playlistHeight();
listshowBtn.addEventListener('click',playlistHeight);
listshowBtn.addEventListener('click',playlistVisible);
listcloseBtn.addEventListener('click',playlistVisible);

//playlist
function playlistHeight() {

    const playerHeight = playerContainer.offsetHeight;
    const playerWidth = playerContainer.offsetWidth;
    playlistHolder.style.height = playerHeight + 'px';
    playlistHolder.style.width = playerWidth + 'px';

};

function playlistVisible() {

    if (isPlaylistVisible) {
        if (trackList.length <= 0) {
            fileInput.click();            
        }
        playlistHolder.style.zIndex = '3';
        playlistHolder.style.opacity = '1';
        playlistHolder.style.backdropFilter = 'blur(150px)';
        isPlaylistVisible = false;
    } else {
        playlistHolder.style.backdropFilter = 'blur(15px)';
        isPlaylistVisible = true;
        setTimeout(() => {
            playlistHolder.style.opacity = '0';
            setTimeout(() => {
                playlistHolder.style.zIndex = '-1';
            }, 100);
        }, 300);
    }

}

const settingsPane = document.getElementById('settingsPane');
const closeSettingsBtn = document.getElementById('closeSettings');
const showSettingsBtn = document.getElementById('showSettings');
const volumeSlider = document.getElementById('volumeSlider');
const playbackRateSlider = document.getElementById('playbackRateSlider');
const loopCheckbox = document.getElementById('loopCheckbox');
const sleepTimerSlider = document.getElementById('sleepTimerSlider');
const resetBtn = document.getElementById('reset');
const timerInfo = document.getElementById('timerInfo')
const rateInfo = document.getElementById('rateInfo')
const volumeInfo = document.getElementById('volumeInfo')
const setTimer = document.getElementById('setTimer')
const clearTimer = document.getElementById('clearTimer')

// Close settings panel
closeSettingsBtn.addEventListener('click', () => {
    settingsPane.style.left = '-350px';
});

showSettingsBtn.addEventListener('click', () => {
    settingsPane.style.left = '0px';
});

// Adjust volume
volumeSlider.addEventListener('input', (e) => {
    const audioVolume = e.target.value;
    audio.volume = audioVolume / 100;
    volumeInfo.textContent = `~ ${audioVolume}`
});

// Adjust playback rate
playbackRateSlider.addEventListener('input', (e) => {
    const playRate = e.target.value;
    audio.playbackRate = playRate;
    rateInfo.textContent = '~ '+ playRate + 'x';
});

// Reset playback rate
resetBtn.addEventListener('click', () => {
    playbackRateSlider.value = 1;
    audio.playbackRate = 1;
    rateInfo.textContent = '~ 1x';
});

// Sleep timer logic
sleepTimerSlider.addEventListener('input', (e) => {
    const time = e.target.value;
    clearTimeout(audio.sleepTimer);
    timerInfo.textContent = `~ ${time} min`
});

const countdown = document.getElementById('countdown');
let countdownInterval; // Declare at the top


setTimer.addEventListener('click', () => {
    const time = sleepTimerSlider.value;
    clearTimeout(audio.sleepTimer);
    clearInterval(countdownInterval); // Clear any existing countdown
    
    if (trackList.length > 0) {        
        if (time > 0) {
            countdownTime(time); // Start countdown display

            
            if (isPlaying) {
            } else {
                playAudio();
            }

            audio.sleepTimer = setTimeout(() => {
                pauseAudio();
                timerInfo.textContent = `~ 0min`;
                clearInterval(countdownInterval);
                countdown.textContent = 'Time’s up!';
            }, time * 60000); // Convert to milliseconds
        } else {        
            countdown.textContent = 'Timer Off';
        }
    } else {
        countdown.textContent = 'Add files to play'
    }

});

clearTimer.addEventListener('click', () => {
    clearTimeout(audio.sleepTimer);
    clearInterval(countdownInterval);
    sleepTimerSlider.value = 0;
    countdown.textContent = 'Timer Cleared';
});

function countdownTime(time) {
    let remainingTime = time * 60; // Convert to seconds
    
    countdownInterval = setInterval(() => {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        countdown.textContent = `${minutes}m ${seconds}s`;

        if (remainingTime <= 0) {
            clearInterval(countdownInterval);
            countdown.textContent = 'Time’s up!';
        }
        remainingTime--;
    }, 1000); 
}
