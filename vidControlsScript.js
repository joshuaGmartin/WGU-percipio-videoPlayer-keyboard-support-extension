// ====================================================
// WGU Academy Percipio Video Player Keyboard Shortcuts
// Created by: Joshua George Martin (2025)
//
// Description: Enables keyboard shortcuts for video playback control
//
// Hotkeys:
// Left Arrow   - Step back five seconds (adjustable in code)
// Right Arrow  - Step ahead five seconds (adjustable in code)
// Space Bar    - Play/Pause
// "F" Key      - Toggle fullscreen
// "C" Key      - Toggle captions
// "<"          - Decrease playback speed (adjustable in code)
// ">"          - Increase playback speed (adjustable in code)
//
// ====================================================

// ======================================
// Pre-load: Wait for video element to appear
// ======================================
const observer = new MutationObserver((mutations, obs) => {
  const video = document.getElementById("media-player_html5_api");

  if (video) {
    obs.disconnect(); // Stop observing when video element is loaded
    runScript(); // Initialize
  }
});

// Start monitoring DOM changes to detect when video loads
observer.observe(document.body, { childList: true, subtree: true });

// ======================================
// Main Script
// ======================================
function runScript() {
  // ======================================
  // Declarations
  // ======================================
  // User settings
  const setTimeSkip = 5; // Adjust step forward/back time (in seconds)
  const playbackRateInterval = 0.25; // Adjust playback speed step
  // Elements
  const video = document.getElementById("media-player_html5_api");
  const videoPlayer = document.getElementById("media-player");
  // Simulated events
  const enterKeyEvent = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    which: 13,
    keyCode: 13,
    bubbles: true,
    cancelable: true,
  });
  const spaceKeyEvent = new KeyboardEvent("keydown", {
    key: " ",
    code: "Space",
    which: 32,
    keyCode: 32,
    bubbles: true,
    cancelable: true,
  });
  // variables
  // keep track of recent adjustments for UX
  let recentTimeSkipTracker = [];
  let recentMessageTracker = [];
  // * Must re-declare all captions related buttons on each toggle (button declarations in helper functions)
  // (I think this is because the caption button/menu is re-rendered on each click?)

  // ======================================
  // Initialization
  // ======================================
  handleAddEventListeners();

  // ======================================
  // Event Listeners
  // ======================================
  function handleAddEventListeners() {
    document.addEventListener("keydown", function (event) {
      switch (event.key) {
        // Step back/ahead
        case "ArrowLeft":
          adjustVidTime(-1 * setTimeSkip);
          break;
        case "ArrowRight":
          adjustVidTime(setTimeSkip);
          break;
        // Play/pause
        case " ":
          event.preventDefault(); // Space bar defaults to scroll down
          video.paused ? video.play() : video.pause();
          break;
        // Toggle fullscreen
        case "f":
          document.fullscreenElement
            ? document.exitFullscreen()
            : videoPlayer.requestFullscreen();
          break;
        // Toggle captions
        case "c":
          handleCaptionToggle();
          break;
        // Adjust playback rate
        case "<":
          adjustPlaybackRate(-1 * playbackRateInterval);
          break;
        case ">":
          adjustPlaybackRate(playbackRateInterval);
      }
    });

    //Bug Fix: avoid play button focus by non allowing any focus within videoPlayer (allows seamless UX after script upload)
    // I think parts of the <video> still load dynamically even after MutationObserver or window.onload
    videoPlayer.addEventListener("focusin", () => {
      // document.activeElement.blur();
      videoPlayer.activeElement.blur();
    });
  }

  // ======================================
  // Main Functions
  // ======================================
  function adjustVidTime(n) {
    // Show video progress bar
    wantVidPlayerActive(true);
    video.currentTime += n;
    recentTimeSkipTracker.push(1);

    // If array is not empty, there has been a more recent adjustment. Only close progress bar on last adjustment
    setTimeout(() => {
      recentTimeSkipTracker.shift();
      if (recentTimeSkipTracker.length === 0) wantVidPlayerActive(false);
    }, 1000);
  }

  function adjustPlaybackRate(n) {
    // Error if playback < 0 or > 16
    if (video.playbackRate + n >= 0 && video.playbackRate + n <= 16) {
      video.playbackRate += n;
      handleTempMessage(video.playbackRate.toFixed(2) + "x");
    }
  }

  // * See declarations note on caption buttons
  // There seems to be a more standard way to toggle captions with video.textTracks,
  // but this player seems to be using something custom for captions. Must simulate user clicks
  function handleCaptionToggle() {
    const firstDelay = 200;

    // Function needs differ if video playing/paused (ex: need video menu, need play video again)
    if (video.paused) {
      // Video menu already open; caption button exists. Open cation menu
      clickCaptionBtn();
      // Let caption menu render, then toggle captions
      setTimeout(pressEnterOnCaptionToggle, firstDelay);
      // Let page settings change, then close menu.
      setTimeout(clickCaptionBtn, firstDelay * 2);
    }
    // Video currently playing
    else if (!video.paused) {
      // Need video menu first for caption button to exist
      wantVidPlayerActive(true);

      // Let video menu render
      setTimeout(() => {
        // Open caption menu
        clickCaptionBtn();
        // Play video again if was already playing (opening captions menu pause video)
        document.dispatchEvent(spaceKeyEvent);
      }, firstDelay);

      // Let caption menu render, then toggle captions
      setTimeout(pressEnterOnCaptionToggle, firstDelay * 2);

      // Let page settings change, then close menus.
      setTimeout(() => {
        clickCaptionBtn();
        wantVidPlayerActive(false);
      }, firstDelay * 3);
    }
  }

  function handleTempMessage(message) {
    // Avoid overlap
    removeTempMessage();
    const tempMessageElm = createTempMessage(message);
    videoPlayer.prepend(tempMessageElm);
    recentMessageTracker.push(1);

    // If array is not empty, there has been a more recent adjustment. Avoid removeTempMessage() overlap
    setTimeout(() => {
      recentMessageTracker.shift();
      if (recentMessageTracker.length === 0) removeTempMessage();
    }, 1000);
  }

  // ======================================
  // Helper Functions
  // ======================================
  // Show video player menu
  function wantVidPlayerActive(bool) {
    if (bool) {
      videoPlayer.classList.remove("vjs-user-inactive");
      videoPlayer.classList.add("vjs-user-active");
    } else if (!bool) {
      videoPlayer.classList.remove("vjs-user-active");
      videoPlayer.classList.add("vjs-user-inactive");
    }
  }

  // * See declarations note on caption buttons
  function clickCaptionBtn() {
    let capBtn = document.getElementById("video-player-cc-settings-button");
    capBtn.click();
  }

  // * See declarations note on caption buttons
  function pressEnterOnCaptionToggle() {
    const capTog = document.getElementById("captionsToggle");
    // capTog.click() would not work, unsure why. Something to do with element focus inside the video element?
    capTog.dispatchEvent(enterKeyEvent);
  }
}

function createTempMessage(message) {
  const tempMessage = document.createElement("div");
  tempMessage.id = "temp-vid-message"; // Able to find for removal
  tempMessage.textContent = message;

  Object.assign(tempMessage.style, {
    fontSize: "xx-large",
    fontWeight: "bolder",
    color: "white",
    backgroundColor: "rgba(0, 0, 0, 0.393)",
    position: "absolute",
    top: "75%",
    left: "45%",
    zIndex: "99",
    padding: "1rem",
  });

  return tempMessage;
}

function removeTempMessage() {
  const tempMessage = document.getElementById("temp-vid-message");
  if (tempMessage) tempMessage.remove();
}
