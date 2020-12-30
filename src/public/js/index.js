const url = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;

const play = () => {
  if (!window.player) {
    window.player = new Howl({ // eslint-disable-line
      src: [`${url}/stream`, `${url}/stream?format=mp3`],
      format: ['aac', 'mp3'],
      autoplay: true,
      html5: true,
      volume: 1
    });
  }
  console.log('[DEBUG] play');
  window.player.play();
};

const pause = () => {
  console.log('[DEBUG] pause');
  window.player.pause();
};

$('#volume').on('input', () => { // eslint-disable-line
  window.player.volume($('#volume').val() / 100); // eslint-disable-line
});
$('#play').click(play); // eslint-disable-line
$('#pause').click(pause); // eslint-disable-line