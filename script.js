let player;
let captions = [
  { start: 0, end: 2, text: "Welcome to the video!" },
  { start: 3, end: 6, text: "This is an example caption." },
  { start: 7, end: 10, text: "Captions appear at the bottom." },
  { start: 11, end: 14, text: "They sync with the video." },
];
let currentCaptionIndex = 0;
let intervalId;

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
  } else if (
    event.data == YT.PlayerState.PAUSED ||
    event.data == YT.PlayerState.ENDED
  ) {
    clearInterval(intervalId); // 재생이 중지되면 자막 업데이트 중단

    if (event.data == YT.PlayerState.ENDED) {
      document.getElementById("caption").innerText = ""; // 동영상이 끝나면 자막 초기화
      currentCaptionIndex = 0; // 자막 인덱스 초기화
    }
  }
}

function updateCaptions() {
  intervalId = setInterval(() => {
    const currentTime = player.getCurrentTime(); // 현재 재생 시간(초)을 가져옴

    // 현재 시간을 기반으로 자막 인덱스를 업데이트
    for (let i = 0; i < captions.length; i++) {
      if (currentTime >= captions[i].start && currentTime <= captions[i].end) {
        if (currentCaptionIndex !== i) {
          currentCaptionIndex = i;
          document.getElementById("caption").innerText =
            captions[currentCaptionIndex].text;
        }
        break;
      } else {
        document.getElementById("caption").innerText = "임시 자막 임시 자막";
      }
    }
  }, 100); // 0.1초마다 확인 (더 짧은 간격으로 동기화 정확도 향상)
}
