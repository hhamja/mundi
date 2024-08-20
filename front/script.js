let player;
const captions = [
  { start: 0, end: 2, text: "Welcome to the video!" },
  { start: 3, end: 6, text: "This is an example caption." },
  { start: 7, end: 10, text: "Captions appear at the bottom." },
  { start: 11, end: 14, text: "They sync with the video." },
];
let currentCaptionIndex = 0;

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

function onPlayerReady(event) {
  updateCaptions();
}

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING) {
    updateCaptions();
  }
}

function updateCaptions() {
  const interval = setInterval(() => {
    const currentTime = Math.floor(player.getCurrentTime()); // 초 단위로 현재 시간을 확인
    if (currentCaptionIndex < captions.length) {
      const currentCaption = captions[currentCaptionIndex];
      if (
        currentTime >= currentCaption.start &&
        currentTime <= currentCaption.end
      ) {
        document.getElementById("caption").innerText = currentCaption.text;
      } else if (currentTime > currentCaption.end) {
        document.getElementById("caption").innerText = "";
        currentCaptionIndex++;
      }
    } else {
      clearInterval(interval); // 자막이 모두 표시된 후 interval 종료
    }
  }, 1000); // 1초마다 확인
}
