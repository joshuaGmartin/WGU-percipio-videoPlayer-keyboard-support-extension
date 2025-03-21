// ====================================================
// WGU Academy Percipio Video Player Controls Extension for Keyboard Support
// Created by: Joshua George Martin (2025)
// GitHub: https://github.com/joshuaGmartin
// LinkedIn: https://www.linkedin.com/in/joshua-martin-697457277/
//
// Description: Adds keyboard shortcuts for enhanced video playback control
//
// Hotkeys:
// Left Arrow   - Rewind 5 seconds (adjustable)
// Right Arrow  - Skip forward (adjustable)
// Space Bar    - Play/Pause
// "f"          - Toggle fullscreen
// "c"          - Toggle captions
// "<"          - Decrease playback speed (adjustable)
// ">"          - Increase playback speed (adjustable)
//
// ====================================================

// ======================================
// Pre-load: Wait for video element to appear
// ======================================

// Force user to wait for redirect (WGU academy video links redirect to Percipio)
if (
  !window.location.href.startsWith("https://wguacademy.percipio.com/videos/")
) {
  alert(
    'URL must start with "https://wguacademy.percipio.com/videos/"\n\nWait for redirect and run script again.'
  );
}

// Confirm url and run
else if (
  window.location.href.startsWith("https://wguacademy.percipio.com/videos/")
) {
  // Only load script if video element exists
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
    const recentTimeSkipTracker = [];
    const recentMessageTracker = [];
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
      // Keyboard shorcuts
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

      //Bug Fix: avoid play button focus by not allowing any focus within videoPlayer (allows seamless UX after exiting dev tools)
      // (I think parts of the <video> still load dynamically even after MutationObserver or window.onload)
      videoPlayer.addEventListener("focusin", () => {
        document.activeElement.blur();
      });
    }

    // ======================================
    // Main Functions
    // ======================================
    function adjustVidTime(n) {
      // Show video progress bar for UX
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

      // The function's needs differ if video playing/paused (ex: do/don't need video menu or need play video again)
      if (video.paused) {
        // If paused, the video menu is already open and caption button exists. Open cation menu
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
      removeTempMessage(); // Avoid overlap
      videoPlayer.prepend(createTempMessage(message));
      recentMessageTracker.push(1);

      // If array is not empty, there has been a more recent adjustment. Avoid removeTempMessage() overlap (causes message jitter: bad UX)
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
      }
      // Video won't reset itself to inactive if manually set to active
      else if (!bool) {
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
      capTog.dispatchEvent(enterKeyEvent);
      // capTog.click() would not work, unsure why. Something to do with element focus inside the video element?
    }

    function createTempMessage(message) {
      const tempMessage = document.createElement("div");
      tempMessage.id = "temp-vid-message"; // Make findable for removal
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
  }
}
