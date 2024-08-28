// 전역 변수 선언
let player;
let captions = [];
let currentCaptionIndex = -1; // 처음에 -1로 설정하여 처음 자막이 표시되지 않도록 함
let intervalId;

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

// 시간 문자열을 초 단위로 변환하는 함수
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

// 자막 로드 함수
function loadCaptions(userName, youtubeId) {
  return new Promise((resolve, reject) => {
    document.getElementById("loadingIndicator").style.display = "block";

    fetch(`../${userName}/${youtubeId}.srt`)
      .then((response) => response.text())
      .then((data) => {
        console.log("Captions loaded, parsing SRT");
        captions = parseSRT(data);
        console.log("Captions parsed, count:", captions.length);
        document.getElementById("loadingIndicator").style.display = "none";
        resolve(); // 자막 로드 완료
      })
      .catch((error) => {
        console.error("Error loading SRT file:", error);
        document.getElementById("loadingIndicator").style.display = "none";
        document.getElementById("caption").innerText =
          "자막을 불러오는 데 실패했습니다.";
        reject(error); // 자막 로드 실패
      });
  });
}

// 유튜브 API 초기화 함수
function initializeYouTubePlayer(userName, youtubeId) {
  return new Promise((resolve, reject) => {
    fetch("../users_videos.json")
      .then((response) => response.json())
      .then((data) => {
        if (data[userName] && data[userName].includes(youtubeId)) {
          document.getElementById(
            "player"
          ).src = `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1`;

          player = new YT.Player("player", {
            events: {
              onReady: onPlayerReady,
              onStateChange: onPlayerStateChange,
            },
          });
          resolve(); // 유튜브 플레이어 초기화 완료
        } else {
          console.error("Video not found for this user.");
          reject(new Error("Video not found"));
        }
      })
      .catch((error) => {
        console.error("Error loading user videos data:", error);
        reject(error); // 유튜브 플레이어 초기화 실패
      });
  });
}

// 유튜브 플레이어가 준비되었을 때 호출될 함수
function onPlayerReady(event) {
  console.log("Player is ready!");
  updateCaptions(); // 초기 자막 업데이트
  player.addEventListener("onStateChange", onPlayerStateChange);
  player.addEventListener("onTimeUpdate", updateCaptions); // 시간 업데이트 시 자막 업데이트
}

// 유튜브 플레이어 상태가 변경될 때 호출될 함수
function onPlayerStateChange(event) {
  if (
    event.data == YT.PlayerState.PLAYING ||
    event.data == YT.PlayerState.PAUSED
  ) {
    updateCaptions();
  } else if (event.data == YT.PlayerState.ENDED) {
    clearInterval(intervalId);
    document.getElementById("caption").innerText = ""; // 동영상이 끝나면 자막 초기화
    currentCaptionIndex = -1; // 자막 인덱스 초기화
  }
}

// 자막 업데이트 함수
function updateCaptions() {
  clearInterval(intervalId); // 기존 인터벌을 초기화하여 중복 실행 방지
  intervalId = setInterval(() => {
    const currentTime = player.getCurrentTime();
    console.log(`Current Time: ${currentTime}`); // 현재 시간을 콘솔에 출력

    let foundCaption = false;
    for (let i = 0; i < captions.length; i++) {
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

// 전체 화면 변경 감지 이벤트 핸들러
document.addEventListener("fullscreenchange", () => {
  const isFullscreen = document.fullscreenElement != null;
  toggleCaptionStyle(isFullscreen);
});

// 전체 화면일 때 자막 스타일을 변경하는 함수
function toggleCaptionStyle(isFullscreen) {
  const captionElement = document.getElementById("caption");
  if (isFullscreen) {
    captionElement.style.position = "absolute";
    captionElement.style.bottom = "50px";
    captionElement.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    captionElement.style.width = "100%";
    captionElement.style.left = "0";
  } else {
    captionElement.style.position = "";
    captionElement.style.bottom = "";
    captionElement.style.backgroundColor = "";
    captionElement.style.width = "";
    captionElement.style.left = "";
  }
}

// JSON 파일에서 데이터 로드 및 유튜브 영상과 자막 초기화
window.addEventListener("load", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const userName = urlParams.get("userName");
  const youtubeId = urlParams.get("youtubeId");

  // 비동기로 유튜브 플레이어와 자막 로드
  try {
    await initializeYouTubePlayer(userName, youtubeId);
    await loadCaptions(userName, youtubeId);
  } catch (error) {
    console.error("An error occurred during initialization:", error);
  }
});
