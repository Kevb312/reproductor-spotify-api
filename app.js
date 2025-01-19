const CLIENT_ID = 'd824b062c2e24a4eb3222a943e07f0e0'; // Cliente ID
const REDIRECT_URI = 'http://127.0.0.1:5500/'; // URL de la aplicacion
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';
const SCOPES = [
  'user-modify-playback-state',
  'user-read-playback-state',
  'streaming',
  'user-read-email',
  'user-read-private',
];
let token = null;

// Redirigir al usuario para autenticarse si no hay token
if (!window.location.hash) {
  window.location.href = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPES.join('%20')}`;
} 
else 
{
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  token = params.get('access_token');
}

// Función para buscar canciones
async function searchTracks(query) {
  try {

    // Mandamos la peticion al endpoint
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Obtenemos la respuesta
    const data = await response.json();

    // Mostramos los resultados
    displayResults(data.tracks.items);
  } catch (error) {
    console.error('Error al buscar canciones:', error);
  }
}

// Mostrar resultados en el DOM
function displayResults(tracks) {

    // Obtenemos el div en el que inyectaremos los resultados
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Limpiar resultados anteriores

    // Iteramos sobre los resultados para obtener los atributos que queremos
    // En este caso nos interesa la imagen, el nombre, el artista y la url de la cancion
    tracks.forEach((track) => {
        const trackElement = document.createElement('div');
        trackElement.innerHTML = `
        <img src="${track.album.images[2]?.url || ''}" alt="${track.name}" width="50" />
        <strong>${track.name}</strong> - ${track.artists[0].name}
        <button onclick="playTrack('${track.uri}')">Reproducir</button>
        `;
        resultsContainer.appendChild(trackElement);
    });
}

// Inicializar el reproductor de Spotify
let player;
window.onSpotifyWebPlaybackSDKReady = () => {
  player = new Spotify.Player({
    name: 'Spotify Web Player',
    getOAuthToken: (cb) => {
      cb(token);
    },
    volume: 0.5,
  });

  player.addListener('ready', ({ device_id }) => {
    console.log('Reproductor listo con el ID:', device_id);
    activateDevice(device_id); // Activa el dispositivo
  });

  player.connect();
};

// Activar el dispositivo del reproductor
function activateDevice(device_id) {
  fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device_ids: [device_id],
      play: false,
    }),
  })
    .then(() => console.log('Dispositivo activado'))
    .catch((error) => console.error('Error al activar el dispositivo:', error));
}

// Reproducir una canción
function playTrack(uri) {
  if (!player) {
    alert('El reproductor no está listo todavía.');
    return;
  }

  fetch('https://api.spotify.com/v1/me/player/play', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris: [uri] }),
  })
    .then(() => console.log('Reproduciendo canción...'))
    .catch((error) => console.error('Error al reproducir la canción:', error));
}

// Asignar evento al botón de búsqueda
document.getElementById('searchBtn').addEventListener('click', () => {
  const query = document.getElementById('searchQuery').value;
  searchTracks(query);
});
