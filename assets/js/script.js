let player;
let captions = [];

let currentCaptionIndex = -1; // 처음에 -1로 설정하여 처음 자막이 표시되지 않도록 함
let intervalId;

console.log("Script started loading");

fetch("./files/output_final.srt")
  .then((response) => {
    console.log("SRT file fetch response received");
    return response.text();
  })
  .then((data) => {
    console.log("SRT file data received, length:", data.length);
    captions = parseSRT(data);
    console.log("Captions parsed, count:", captions.length);
    onYouTubeIframeAPIReady();
  })
  .catch((error) => console.error("Error loading SRT file:", error));

function onPlayerReady(event) {
  console.log("Player is ready!");
  updateCaptions();
}

// SRT 파일 파싱 함수
function parseSRT(srtContent) {
  const captions = [];
  const srtArray = srtContent.split("\n\n");

  srtArray.forEach((entry) => {
    const lines = entry.split("\n");
    if (lines.length >= 3) {
      const times = lines[1].split(" --> ");
      const start = parseTime(times[0]);
      const end = parseTime(times[1]);
      const text = lines.slice(2).join("\n");
      captions.push({ start, end, text });
    }
  });

  return captions;
}

function parseTime(timeString) {
  const [hours, minutes, seconds] = timeString.split(":");
  const [secs, millis] = seconds.split(",");
  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseInt(secs) +
    parseInt(millis) / 1000
  );
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING) {
    updateCaptions();
  } else if (
    event.data == YT.PlayerState.PAUSED ||
    event.data == YT.PlayerState.ENDED
  ) {
    clearInterval(intervalId);

    if (event.data == YT.PlayerState.ENDED) {
      document.getElementById("caption").innerText = ""; // 동영상이 끝나면 자막 초기화
      currentCaptionIndex = -1; // 자막 인덱스 초기화
    }
  }
}

function updateCaptions() {
  clearInterval(intervalId); // 기존 인터벌을 초기화하여 중복 실행 방지
  intervalId = setInterval(() => {
    const currentTime = player.getCurrentTime();
    console.log(`Current Time: ${currentTime}`); // 현재 시간을 콘솔에 출력

    let foundCaption = false;
    for (let i = 0; i < captions.length; i++) {
      console.log(`Caption index ${i}:`, captions[i]); // 현재 인덱스와 자막 객체를 콘솔에 출력

      if (currentTime >= captions[i].start && currentTime <= captions[i].end) {
        if (currentCaptionIndex !== i) {
          currentCaptionIndex = i;
          document.getElementById("caption").innerText = captions[i].text;
        }
        foundCaption = true;
        break;
      }
    }

    if (!foundCaption) {
      document.getElementById("caption").innerText = "";
      currentCaptionIndex = -1; // 자막이 없을 때 인덱스를 초기화
    }
  }, 100); // 0.1초마다 확인 (더 짧은 간격으로 동기화 정확도 향상)
}
