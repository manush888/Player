const openButton = document.getElementById('openButton');
const fileInput = document.getElementById('fileInput');
const playPauseButton = document.getElementById('playPauseButton');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const albumArt = document.getElementById('albumArt');
const progressText = document.getElementById('progressText');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const playlistModal = document.getElementById('playlistModal');
const playlistContainer = document.getElementById('playlistContainer');
const showPlaylistButton = document.getElementById('showPlaylistButton');
const closePlaylistButton = document.getElementById('closePlaylistButton');
const playerContainer = document.getElementById('playerContainer');

const audio = new Audio();
let isPlaying = false;
let currentTrackIndex = 0;
let trackList = [];

// File Input
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
        const { title, artist, picture } = tag.tags;
        trackTitle.textContent = title || file.name;
        trackArtist.textContent = artist || 'Unknown Artist';

        const base64String = picture
          ? `data:${picture.format};base64,${btoa(new Uint8Array(picture.data).reduce((data, byte) => data + String.fromCharCode(byte), ''))}`
          : 'https://via.placeholder.com/200?text=No+Cover';
          
        albumArt.src = base64String;

        if (picture) {
          const img = new Image();
          img.src = base64String;
          img.onload = () => {
            const colorThief = new ColorThief();
            const dominantColor = colorThief.getColor(img);
            const rgbColor = `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;
            playerContainer.style.background = `linear-gradient(135deg, ${rgbColor}, #1e1e2f)`;
          };
        } else {
          playerContainer.style.background = '#1e1e2f';
        }
      },
      onError: () => {
        trackTitle.textContent = file.name;
        trackArtist.textContent = 'Unknown Artist';
        albumArt.src = 'https://via.placeholder.com/200?text=No+Cover';
        playerContainer.style.background = '#1e1e2f';
      }
    });
  }
}

// Update Playlist
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
      if (isPlaying) audio.play();
      updatePlaylist();
    });

    playlistContainer.appendChild(listItem);
  });
}

// Show Playlist Modal
showPlaylistButton.addEventListener('click', () => {
  playlistModal.style.display = 'flex';
});

// Close Playlist Modal
closePlaylistButton.addEventListener('click', () => {
  playlistModal.style.display = 'none';
});

// Next/Previous Track Navigation
nextButton.addEventListener('click', () => {
  currentTrackIndex = (currentTrackIndex + 1) % trackList.length;
  loadTrack(currentTrackIndex);
  audio.play();
  updatePlaylist();
});

prevButton.addEventListener('click', () => {
  currentTrackIndex = (currentTrackIndex - 1 + trackList.length) % trackList.length;
  loadTrack(currentTrackIndex);
  audio.play();
  updatePlaylist();
});

// Update Progress Circle
const progressCircle = document.querySelector('.circular-progress');

audio.addEventListener('timeupdate', () => {
  const progress = (audio.currentTime / audio.duration) * 100;
  const degree = (progress / 100) * 360; // Convert progress to degrees
  progressCircle.style.background = `conic-gradient(#1db954 ${degree}deg, #555 ${degree}deg)`;
});


function formatTime(time) {
  if (isNaN(time)) return '00:00';
  const minutes = Math.floor(time / 60).toString().padStart(2, '0');
  const seconds = Math.floor(time % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// Play/Pause Button
playPauseButton.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    playPauseButton.classList.add('pause');
  } else {
    audio.pause();
    playPauseButton.classList.remove('pause');
  }
});

albumArt.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    playPauseButton.classList.add('pause');
  } else {
    audio.pause();
    playPauseButton.classList.remove('pause');
  }
});

// Track End Event
audio.addEventListener('ended', () => {
  currentTrackIndex = (currentTrackIndex + 1) % trackList.length;
  loadTrack(currentTrackIndex);
  audio.play();
  updatePlaylist();
});

// Function to update the progress
function updateProgress(e) {
  const rect = progressCircle.getBoundingClientRect();  // Get the circle's position
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const offsetX = e.clientX - centerX;
  const offsetY = e.clientY - centerY;

  // Calculate the angle of the click relative to the center
  let angle = Math.atan2(offsetY, offsetX);

  // Normalize the angle to start from the top (12 o'clock position)
  angle += Math.PI / 2;  // This rotates the angle to start from top (12 o'clock)

  // Ensure the angle is between 0 and 2 * Math.PI
  if (angle < 0) {
    angle += 2 * Math.PI;
  }

  // Map the angle to a range of 0 to 1
  let progress = angle / (2 * Math.PI);

  // Ensure the progress is within the range [0, 1]
  progress = Math.min(1, Math.max(0, progress));

  // Update the audio current time based on the calculated progress
  audio.currentTime = progress * audio.duration;

  // Update the progress circle to reflect the change
  updateProgressCircle();
}

// Function to update the progress circle based on current audio time
function updateProgressCircle() {
  const progress = (audio.currentTime / audio.duration) * 100;
  progressCircle.style.background = `conic-gradient(#009c37 ${progress}%, #555 ${progress}%)`;

  const currentTime = formatTime(audio.currentTime);
  const duration = formatTime(audio.duration);
  progressText.textContent = `${currentTime} / ${duration}`;
}

// Add event listener to the circular progress to allow manual seek
progressCircle.addEventListener('click', updateProgress);

// Keep the time updated while the song plays
audio.addEventListener('timeupdate', updateProgressCircle);
