// ============================================================
// PUNJABI WEDDING INVITATION — SITE BEHAVIOUR
// ============================================================

const cursorGlow =
  document.getElementById("cursorGlow");

const scrollProgress =
  document.getElementById("scrollProgress");

const petalContainer =
  document.getElementById("petalContainer");

const hero =
  document.getElementById("hero");

const heroContent =
  document.querySelector(".hero-content");

const navbar =
  document.querySelector(".navbar");

const menuButton =
  document.getElementById("menuButton");

const navLinks =
  document.getElementById("navLinks");

const prefersReducedMotion =
  window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

const hasFinePointer =
  window.matchMedia(
    "(pointer: fine)"
  ).matches;

// ------------------------------------------------------------
// LOADING SCREEN
// ------------------------------------------------------------

const loadingScreen =
  document.getElementById("loadingScreen");

if (loadingScreen) {
  const MIN_LOADING_MS = prefersReducedMotion ? 200 : 900;
  const MAX_LOADING_MS = 3000;

  const fontsReady =
    "fonts" in document
      ? document.fonts.ready
      : Promise.resolve();

  const minimumDelay = new Promise((resolve) => {
    window.setTimeout(resolve, MIN_LOADING_MS);
  });

  const safetyTimeout = new Promise((resolve) => {
    window.setTimeout(resolve, MAX_LOADING_MS);
  });

  function hideLoadingScreen() {
    loadingScreen.classList.add("hidden");
    loadingScreen.setAttribute("aria-hidden", "true");
  }

  Promise.race([
    Promise.all([fontsReady, minimumDelay]),
    safetyTimeout
  ]).then(hideLoadingScreen);
}

// ------------------------------------------------------------
// PARTICLES CANVAS
// ------------------------------------------------------------

const particlesCanvas =
  document.getElementById("particles");

if (particlesCanvas) {
  const particlesContext =
    particlesCanvas.getContext("2d");

  let particles = [];
  let particlesFrameId = null;

  function resizeParticlesCanvas() {
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      driftX: Math.random() * 0.3 - 0.15,
      opacity: Math.random() * 0.45 + 0.15,
      radius: Math.random() * 1.7 + 0.6,
      speedY: Math.random() * 0.22 + 0.05,
      x: Math.random() * particlesCanvas.width,
      y: Math.random() * particlesCanvas.height
    };
  }

  function initParticles() {
    const area =
      particlesCanvas.width * particlesCanvas.height;

    // Calmer, softer density overall, and fewer still on small/mobile
    // screens where a dense field feels busy rather than ambient.
    const isNarrowViewport = window.innerWidth < 700;
    const maxParticles = isNarrowViewport ? 26 : 55;
    const areaDivisor = isNarrowViewport ? 32000 : 27000;

    const count =
      Math.min(maxParticles, Math.floor(area / areaDivisor));

    particles =
      Array.from({ length: count }, createParticle);
  }

  function drawParticles() {
    particlesContext.clearRect(
      0,
      0,
      particlesCanvas.width,
      particlesCanvas.height
    );

    particles.forEach((particle) => {
      particle.y -= particle.speedY;
      particle.x += particle.driftX;

      if (particle.y < -10) {
        particle.y = particlesCanvas.height + 10;
        particle.x = Math.random() * particlesCanvas.width;
      }

      particlesContext.beginPath();
      particlesContext.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        Math.PI * 2
      );
      particlesContext.fillStyle =
        `rgba(244, 216, 163, ${particle.opacity})`;
      particlesContext.fill();
    });

    particlesFrameId =
      requestAnimationFrame(drawParticles);
  }

  resizeParticlesCanvas();
  initParticles();

  if (!prefersReducedMotion) {
    drawParticles();
  }

  window.addEventListener(
    "resize",
    () => {
      resizeParticlesCanvas();
      initParticles();
    },
    { passive: true }
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        if (particlesFrameId) {
          cancelAnimationFrame(particlesFrameId);
          particlesFrameId = null;
        }
      } else if (
        !prefersReducedMotion &&
        !particlesFrameId
      ) {
        drawParticles();
      }
    }
  );
}

// ------------------------------------------------------------
// CURSOR GLOW
// ------------------------------------------------------------

if (
  cursorGlow &&
  hasFinePointer &&
  !prefersReducedMotion
) {
  let currentX =
    window.innerWidth / 2;

  let currentY =
    window.innerHeight / 2;

  let targetX = currentX;
  let targetY = currentY;

  document.addEventListener(
    "mousemove",
    (event) => {
      targetX = event.clientX;
      targetY = event.clientY;

      cursorGlow.style.opacity = "1";
    }
  );

  document.addEventListener(
    "mouseleave",
    () => {
      cursorGlow.style.opacity = "0";
    }
  );

  function animateCursorGlow() {
    currentX +=
      (targetX - currentX) * 0.12;

    currentY +=
      (targetY - currentY) * 0.12;

    cursorGlow.style.left =
      `${currentX}px`;

    cursorGlow.style.top =
      `${currentY}px`;

    requestAnimationFrame(
      animateCursorGlow
    );
  }

  animateCursorGlow();
}

// ------------------------------------------------------------
// MOUSE SPARKLE TRAIL (desktop only)
// ------------------------------------------------------------

if (hasFinePointer && !prefersReducedMotion) {
  const SPARKLE_INTERVAL_MS = 90;
  let lastSparkleTime = 0;

  document.addEventListener(
    "mousemove",
    (event) => {
      const now = performance.now();

      if (now - lastSparkleTime < SPARKLE_INTERVAL_MS) {
        return;
      }

      lastSparkleTime = now;

      const spark = document.createElement("span");
      spark.className = "trail-spark";
      spark.style.left = `${event.clientX}px`;
      spark.style.top = `${event.clientY}px`;
      spark.style.setProperty(
        "--drift-x",
        `${(Math.random() - 0.5) * 30}px`
      );

      document.body.appendChild(spark);

      window.setTimeout(() => {
        spark.remove();
      }, 900);
    },
    { passive: true }
  );
}

// ------------------------------------------------------------
// SCROLL PROGRESS, NAVBAR AND BACK-TO-TOP VISIBILITY
// ------------------------------------------------------------

const backToTopButton =
  document.getElementById("backToTop");

let lastScrollY = window.scrollY;

function updateScrollEffects() {
  const currentScrollY = window.scrollY;

  const scrollableHeight =
    document.documentElement.scrollHeight -
    window.innerHeight;

  const progress =
    scrollableHeight > 0
      ? currentScrollY / scrollableHeight
      : 0;

  if (scrollProgress) {
    scrollProgress.style.transform =
      `scaleX(${
        Math.min(
          Math.max(progress, 0),
          1
        )
      })`;
  }

  if (navbar) {
    navbar.classList.toggle(
      "navbar-scrolled",
      currentScrollY > 70
    );

    // Hide the navbar while scrolling down, bring it back on the way up.
    // Skipped while the mobile menu is open — see MOBILE MENU below for
    // why (a transformed navbar would break the menu panel's position).
    const mobileMenuOpen =
      navLinks && navLinks.classList.contains("open");

    if (!mobileMenuOpen) {
      if (currentScrollY > lastScrollY && currentScrollY > 160) {
        navbar.classList.add("nav-hidden");
      } else {
        navbar.classList.remove("nav-hidden");
      }
    }
  }

  if (backToTopButton) {
    backToTopButton.classList.toggle(
      "visible",
      currentScrollY > 500
    );
  }

  lastScrollY = currentScrollY;
}

// rAF-throttled: no matter how many "scroll" events the browser fires,
// the actual work runs at most once per animation frame.
let scrollTicking = false;

window.addEventListener(
  "scroll",
  () => {
    if (!scrollTicking) {
      scrollTicking = true;

      window.requestAnimationFrame(() => {
        updateScrollEffects();
        scrollTicking = false;
      });
    }
  },
  { passive: true }
);

updateScrollEffects();

if (backToTopButton) {
  backToTopButton.addEventListener(
    "click",
    () => {
      window.scrollTo({
        top: 0,
        behavior:
          prefersReducedMotion
            ? "auto"
            : "smooth"
      });
    }
  );
}

// ------------------------------------------------------------
// FLOATING PETALS
// ------------------------------------------------------------

function createPetal() {
  if (
    !petalContainer ||
    document.hidden ||
    prefersReducedMotion
  ) {
    return;
  }

  const petal =
    document.createElement("span");

  petal.className =
    "floating-petal";

  // Occasional larger, softer-focus petals give a subtle sense of depth
  // among the smaller sharp ones.
  const isSoftFocus = Math.random() < 0.25;

  const size =
    isSoftFocus
      ? Math.random() * 8 + 15
      : Math.random() * 8 + 6;

  const duration =
    Math.random() * 8 + 10;

  const delay =
    Math.random() * 1.3;

  petal.style.left =
    `${Math.random() * 100}vw`;

  petal.style.width =
    `${size}px`;

  petal.style.height =
    `${size * 1.3}px`;

  petal.style.animationDuration =
    `${duration}s`;

  petal.style.animationDelay =
    `${delay}s`;

  petal.style.opacity =
    String(
      Math.random() * 0.35 + 0.35
    );

  petal.style.setProperty(
    "--petal-blur",
    `${isSoftFocus ? Math.random() * 1.5 + 1 : Math.random() * 0.6}px`
  );

  // A gentle random wander left/right rather than every petal tracing
  // the exact same S-curve.
  const spinDirection = Math.random() < 0.5 ? 1 : -1;

  petal.style.setProperty("--drift-a", `${Math.random() * 70 - 25}px`);
  petal.style.setProperty("--drift-b", `${Math.random() * 90 - 20}px`);
  petal.style.setProperty("--drift-c", `${Math.random() * 100 - 60}px`);
  petal.style.setProperty("--rotate-a", `${spinDirection * (Math.random() * 100 + 80)}deg`);
  petal.style.setProperty("--rotate-b", `${spinDirection * (Math.random() * 180 + 220)}deg`);
  petal.style.setProperty("--rotate-c", `${spinDirection * (Math.random() * 260 + 420)}deg`);

  petalContainer.appendChild(petal);

  window.setTimeout(
    () => {
      petal.remove();
    },
    (duration + delay + 1) * 1000
  );
}

let petalIntervalId = null;

if (!prefersReducedMotion) {
  petalIntervalId = window.setInterval(
    createPetal,
    950
  );

  for (
    let index = 0;
    index < 7;
    index += 1
  ) {
    window.setTimeout(
      createPetal,
      index * 250
    );
  }

  // Stop spawning entirely while the tab isn't visible, instead of
  // firing on a timer and immediately bailing out each time.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (petalIntervalId) {
        window.clearInterval(petalIntervalId);
        petalIntervalId = null;
      }
    } else if (!petalIntervalId) {
      petalIntervalId = window.setInterval(createPetal, 950);
    }
  });
}

// ------------------------------------------------------------
// HERO MOUSE MOVEMENT
// ------------------------------------------------------------

if (
  hero &&
  heroContent &&
  hasFinePointer &&
  !prefersReducedMotion
) {
  hero.addEventListener(
    "mousemove",
    (event) => {
      const bounds =
        hero.getBoundingClientRect();

      const horizontal =
        (
          event.clientX -
          bounds.left
        ) /
        bounds.width -
        0.5;

      const vertical =
        (
          event.clientY -
          bounds.top
        ) /
        bounds.height -
        0.5;

      heroContent.style.setProperty(
        "--hero-x",
        `${horizontal * 14}px`
      );

      heroContent.style.setProperty(
        "--hero-y",
        `${vertical * 10}px`
      );
    }
  );

  hero.addEventListener(
    "mouseleave",
    () => {
      heroContent.style.setProperty(
        "--hero-x",
        "0px"
      );

      heroContent.style.setProperty(
        "--hero-y",
        "0px"
      );
    }
  );
}

// ------------------------------------------------------------
// 3D TILT CARDS
// ------------------------------------------------------------

function addTiltEffect(
  element,
  strength = 7
) {
  if (
    !element ||
    !hasFinePointer ||
    prefersReducedMotion
  ) {
    return;
  }

  element.addEventListener(
    "mousemove",
    (event) => {
      const bounds =
        element.getBoundingClientRect();

      const mouseX =
        event.clientX - bounds.left;

      const mouseY =
        event.clientY - bounds.top;

      const centerX =
        bounds.width / 2;

      const centerY =
        bounds.height / 2;

      const rotateY =
        (
          (mouseX - centerX) /
          centerX
        ) *
        strength;

      const rotateX =
        -(
          (mouseY - centerY) /
          centerY
        ) *
        strength;

      element.style.setProperty(
        "--mouse-x",
        `${mouseX / bounds.width * 100}%`
      );

      element.style.setProperty(
        "--mouse-y",
        `${mouseY / bounds.height * 100}%`
      );

      element.style.transform =
        `perspective(950px)
         rotateX(${rotateX}deg)
         rotateY(${rotateY}deg)
         translateY(-7px)`;
    }
  );

  element.addEventListener(
    "mouseleave",
    () => {
      element.style.transform =
        "perspective(950px) rotateX(0) rotateY(0)";
    }
  );
}

document
  .querySelectorAll(".tilt-card")
  .forEach((card) => {
    addTiltEffect(card);
  });

// ------------------------------------------------------------
// MAGNETIC BUTTONS
// ------------------------------------------------------------

document
  .querySelectorAll(".magnetic-button")
  .forEach((button) => {
    if (
      !hasFinePointer ||
      prefersReducedMotion
    ) {
      return;
    }

    button.addEventListener(
      "mousemove",
      (event) => {
        const bounds =
          button.getBoundingClientRect();

        const horizontal =
          event.clientX -
          bounds.left -
          bounds.width / 2;

        const vertical =
          event.clientY -
          bounds.top -
          bounds.height / 2;

        button.style.transform =
          `translate(
            ${horizontal * 0.1}px,
            ${vertical * 0.14}px
          )`;
      }
    );

    button.addEventListener(
      "mouseleave",
      () => {
        button.style.transform =
          "translate(0, 0)";
      }
    );
  });

// ------------------------------------------------------------
// SPARKLE BURST (used for the opening seal, and a smaller
// restrained version for a successful RSVP)
// ------------------------------------------------------------

function createOpeningSparkles(options = {}) {
  if (prefersReducedMotion) {
    return;
  }

  const sparkleCount = options.count || 30;
  const hasCustomOrigin =
    typeof options.x === "number" &&
    typeof options.y === "number";

  for (
    let index = 0;
    index < sparkleCount;
    index += 1
  ) {
    const spark =
      document.createElement("span");

    spark.className =
      "open-spark";

    if (hasCustomOrigin) {
      spark.style.left = `${options.x}px`;
      spark.style.top = `${options.y}px`;
    }

    const angle =
      (
        360 /
        sparkleCount
      ) *
      index +
      Math.random() * 12;

    const distance =
      Math.random() * 250 + 90;

    spark.style.setProperty(
      "--spark-angle",
      `${angle}deg`
    );

    spark.style.setProperty(
      "--spark-distance",
      `${distance}px`
    );

    spark.style.animationDelay =
      `${Math.random() * 0.15}s`;

    document.body.appendChild(spark);

    window.setTimeout(
      () => {
        spark.remove();
      },
      1400
    );
  }
}

// ------------------------------------------------------------
// BACKGROUND MUSIC
// ------------------------------------------------------------

const backgroundMusic =
  document.getElementById("backgroundMusic");

const musicToggle =
  document.getElementById("musicToggle");

const musicPanel =
  document.getElementById("musicPanel");

const musicSeek =
  document.getElementById("musicSeek");

const musicVolumeSlider =
  document.getElementById("musicVolume");

// Comfortable listening level (0 to 1) — adjust to taste. Mutable: the
// volume slider updates this so a later pause/resume fade-in keeps
// whatever level the visitor chose instead of resetting it.
let musicTargetVolume = 0.35;

// How long the music takes to fade in from silence, in milliseconds.
const MUSIC_FADE_MS = 2200;

let musicUnavailable = false;
let musicFadeIntervalId = null;

function setMusicPlayingState(isPlaying) {
  if (!musicToggle) {
    return;
  }

  musicToggle.classList.toggle(
    "playing",
    isPlaying
  );

  musicToggle.setAttribute(
    "aria-pressed",
    String(isPlaying)
  );

  musicToggle.setAttribute(
    "aria-label",
    isPlaying ? "Pause music" : "Play music"
  );

  if (musicPanel) {
    musicPanel.classList.toggle("visible", isPlaying);
  }
}

function markMusicUnavailable() {
  musicUnavailable = true;

  if (musicToggle) {
    musicToggle.disabled = true;
    musicToggle.classList.add("unavailable");
    musicToggle.setAttribute("aria-label", "Music unavailable");
  }

  if (musicPanel) {
    musicPanel.classList.remove("visible");
  }
}

if (backgroundMusic) {
  // The mp3 may be missing or fail to decode — fail gracefully
  // instead of leaving a broken control or throwing console errors.
  backgroundMusic.addEventListener(
    "error",
    markMusicUnavailable
  );

  // Keep the seek bar in sync with playback, unless the visitor is
  // actively dragging it right now.
  backgroundMusic.addEventListener("timeupdate", () => {
    if (
      !musicSeek ||
      document.activeElement === musicSeek ||
      !Number.isFinite(backgroundMusic.duration) ||
      backgroundMusic.duration <= 0
    ) {
      return;
    }

    musicSeek.value = String(
      (backgroundMusic.currentTime / backgroundMusic.duration) * 100
    );
  });
}

if (musicSeek && backgroundMusic) {
  musicSeek.addEventListener("input", () => {
    if (
      !Number.isFinite(backgroundMusic.duration) ||
      backgroundMusic.duration <= 0
    ) {
      return;
    }

    backgroundMusic.currentTime =
      (Number(musicSeek.value) / 100) * backgroundMusic.duration;
  });
}

if (musicVolumeSlider && backgroundMusic) {
  musicVolumeSlider.value = String(musicTargetVolume * 100);

  musicVolumeSlider.addEventListener("input", () => {
    musicTargetVolume = Number(musicVolumeSlider.value) / 100;
    backgroundMusic.volume = musicTargetVolume;
  });
}

function fadeMusicIn() {
  if (!backgroundMusic) {
    return;
  }

  if (musicFadeIntervalId) {
    window.clearInterval(musicFadeIntervalId);
  }

  const steps = 30;
  const stepDuration = MUSIC_FADE_MS / steps;
  let currentStep = 0;

  backgroundMusic.volume = 0;

  musicFadeIntervalId = window.setInterval(
    () => {
      currentStep += 1;

      backgroundMusic.volume = Math.min(
        musicTargetVolume,
        (musicTargetVolume * currentStep) / steps
      );

      if (currentStep >= steps) {
        window.clearInterval(musicFadeIntervalId);
        musicFadeIntervalId = null;
      }
    },
    stepDuration
  );
}

function playBackgroundMusic() {
  if (!backgroundMusic || musicUnavailable) {
    return;
  }

  fadeMusicIn();

  backgroundMusic
    .play()
    .then(() => setMusicPlayingState(true))
    .catch(() => setMusicPlayingState(false));
}

if (musicToggle && backgroundMusic) {
  musicToggle.addEventListener(
    "click",
    () => {
      if (backgroundMusic.paused) {
        playBackgroundMusic();
      } else {
        backgroundMusic.pause();
        setMusicPlayingState(false);
      }
    }
  );
}

// ------------------------------------------------------------
// INVITATION OPENING SCREEN
// ------------------------------------------------------------

const introScreen =
  document.getElementById("intro");

const sealButton =
  document.getElementById("sealButton");

if (sealButton) {
  sealButton.addEventListener(
    "click",
    () => {
      if (introScreen) {
        introScreen.classList.add("opened");
      }

      document.body.classList.remove("locked");

      createOpeningSparkles();
      playBackgroundMusic();
    },
    { once: true }
  );
}

// ------------------------------------------------------------
// MOBILE MENU
// ------------------------------------------------------------

function closeMobileMenu() {
  if (!menuButton || !navLinks) {
    return;
  }

  navLinks.classList.remove("open");
  menuButton.classList.remove("active");
  menuButton.setAttribute("aria-expanded", "false");
}

if (menuButton && navLinks) {
  menuButton.addEventListener(
    "click",
    () => {
      const isOpen =
        navLinks.classList.toggle("open");

      menuButton.classList.toggle("active", isOpen);
      menuButton.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      // A transformed navbar becomes the containing block for the
      // fixed-position mobile menu panel, which would misplace it —
      // make sure the navbar is never mid-hide while the menu is open.
      if (isOpen && navbar) {
        navbar.classList.remove("nav-hidden");
      }
    }
  );

  navLinks
    .querySelectorAll("a")
    .forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      navLinks.classList.contains("open")
    ) {
      closeMobileMenu();
      menuButton.focus();
    }
  });
}

// ------------------------------------------------------------
// ACTIVE SECTION HIGHLIGHT (scrollspy)
// ------------------------------------------------------------

if (navLinks && "IntersectionObserver" in window) {
  const sectionLinkMap = new Map();

  navLinks.querySelectorAll('a[href^="#"]').forEach((link) => {
    const targetId = link.getAttribute("href").slice(1);
    const section = document.getElementById(targetId);

    if (section) {
      sectionLinkMap.set(section, link);
    }
  });

  if (sectionLinkMap.size) {
    const scrollSpyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = sectionLinkMap.get(entry.target);
          if (link) {
            link.classList.toggle("active", entry.isIntersecting);

            if (entry.isIntersecting) {
              link.setAttribute("aria-current", "location");
            } else {
              link.removeAttribute("aria-current");
            }
          }
        });
      },
      // A thin horizontal band near the vertical centre of the viewport —
      // whichever section is crossing it is the "current" one.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    sectionLinkMap.forEach((_link, section) => {
      scrollSpyObserver.observe(section);
    });
  }
}

// ------------------------------------------------------------
// COUNTDOWN
// ------------------------------------------------------------

// ============================================================
// WEDDING DATE — change this single line when the date is confirmed.
// Format: "YYYY-MM-DDTHH:MM:SS" using 24-hour time.
// Currently set to a temporary placeholder: 12 December 2026, 12:00 PM.
// ============================================================
const weddingDate =
  new Date("2026-12-12T12:00:00");

const countdownElements = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds")
};

const hasCountdown =
  Object.values(countdownElements).some(
    (element) => element !== null
  );

let countdownIntervalId = null;

// Flips a digit card to a new value: the back face is updated (while
// still hidden, rotated away) then the card rotates so the back face
// becomes the front — a genuine 3D flip rather than a plain swap.
function flipCardTo(card, newValue) {
  const front = card.querySelector(".flip-face-front");
  const back = card.querySelector(".flip-face-back");

  if (!front || !back || front.textContent === newValue) {
    return;
  }

  if (prefersReducedMotion) {
    front.textContent = newValue;
    back.textContent = newValue;
    return;
  }

  back.textContent = newValue;
  card.classList.add("flip-active");

  const handleFlipEnd = () => {
    back.removeEventListener("transitionend", handleFlipEnd);

    // Snap the card back to its resting rotation with transitions
    // disabled, now showing the new value on the front face too —
    // otherwise removing "flip-active" would visibly flip it back.
    card.classList.add("no-transition");
    front.textContent = newValue;
    card.classList.remove("flip-active");

    // Force layout so the no-transition reset is committed before
    // transitions are re-enabled for the next flip.
    void card.offsetHeight;

    card.classList.remove("no-transition");
  };

  back.addEventListener("transitionend", handleFlipEnd);
}

function updateCountdown() {
  const remaining =
    weddingDate.getTime() - Date.now();

  const values =
    remaining > 0
      ? {
          days: Math.floor(
            remaining / (1000 * 60 * 60 * 24)
          ),
          hours: Math.floor(
            (remaining / (1000 * 60 * 60)) % 24
          ),
          minutes: Math.floor(
            (remaining / (1000 * 60)) % 60
          ),
          seconds: Math.floor(
            (remaining / 1000) % 60
          )
        }
      : { days: 0, hours: 0, minutes: 0, seconds: 0 };

  Object.entries(countdownElements).forEach(
    ([key, card]) => {
      if (!card) {
        return;
      }

      const formatted =
        String(values[key]).padStart(2, "0");

      flipCardTo(card, formatted);
    }
  );

  if (remaining <= 0 && countdownIntervalId) {
    window.clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }
}

if (hasCountdown) {
  updateCountdown();
  countdownIntervalId =
    window.setInterval(updateCountdown, 1000);
}

// ------------------------------------------------------------
// REVEAL ON SCROLL
// ------------------------------------------------------------

const revealElements =
  document.querySelectorAll(".reveal");

if (revealElements.length) {
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach((element) => {
      element.classList.add("visible");
    });
  }
}

const venueImage =
  document.querySelector(".venue-image");

if (venueImage) {
  if ("IntersectionObserver" in window) {
    const venueObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    venueObserver.observe(venueImage);
  } else {
    venueImage.classList.add("visible");
  }

  // venue.jpg is a CSS background, not an <img>, so it can't fire a
  // native "error" event — probe it directly so a missing photo still
  // gets the same graceful placeholder treatment as everywhere else.
  const venuePhotoProbe = new Image();
  venuePhotoProbe.addEventListener("error", () => {
    venueImage.classList.add("media-missing");
  });
  venuePhotoProbe.src = "assets/venue.jpg";
}

// ------------------------------------------------------------
// MISSING PHOTO FALLBACK
// ------------------------------------------------------------

document
  .querySelectorAll(
    ".story-image-frame img, .gallery-item img, .event-photo img"
  )
  .forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const frame = img.closest(
          ".story-image-frame, .gallery-item, .event-photo"
        );

        if (frame) {
          frame.classList.add("media-missing");
        }

        img.remove();
      },
      { once: true }
    );
  });

// ------------------------------------------------------------
// GALLERY LIGHTBOX
// ------------------------------------------------------------

const lightbox =
  document.getElementById("lightbox");

const lightboxImage =
  document.getElementById("lightboxImage");

const lightboxCaption =
  document.getElementById("lightboxCaption");

const lightboxClose =
  document.getElementById("lightboxClose");

const lightboxPrev =
  document.getElementById("lightboxPrev");

const lightboxNext =
  document.getElementById("lightboxNext");

const galleryTriggers = Array.from(
  document.querySelectorAll(".gallery-trigger")
);

const galleryItems = galleryTriggers.map((trigger) => {
  const img = trigger.querySelector("img");
  const figure = trigger.closest(".gallery-item");
  const captionText = figure
    ? Array.from(
        figure.querySelectorAll("figcaption span, figcaption strong")
      )
        .map((node) => node.textContent.trim())
        .join(" — ")
    : "";

  return {
    src: img ? img.currentSrc || img.src : "",
    alt: img ? img.alt : "",
    caption: captionText
  };
});

let lightboxIndex = 0;
let lightboxLastFocused = null;

function openLightbox(index) {
  if (
    !lightbox ||
    !lightboxImage ||
    !galleryItems.length
  ) {
    return;
  }

  lightboxIndex =
    (index + galleryItems.length) % galleryItems.length;

  const item = galleryItems[lightboxIndex];

  lightboxImage.src = item.src;
  lightboxImage.alt = item.alt;

  if (lightboxCaption) {
    lightboxCaption.textContent = item.caption;
  }

  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");

  if (lightboxClose) {
    lightboxClose.focus();
  }
}

function closeLightbox() {
  if (!lightbox) {
    return;
  }

  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("locked");

  if (lightboxLastFocused) {
    lightboxLastFocused.focus();
  }
}

function showNextLightboxImage(step) {
  openLightbox(lightboxIndex + step);
}

galleryTriggers.forEach((trigger, index) => {
  trigger.addEventListener("click", () => {
    lightboxLastFocused = trigger;
    openLightbox(index);
  });
});

if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
}

if (lightboxPrev) {
  lightboxPrev.addEventListener("click", () => {
    showNextLightboxImage(-1);
  });
}

if (lightboxNext) {
  lightboxNext.addEventListener("click", () => {
    showNextLightboxImage(1);
  });
}

if (lightbox) {
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("open")) {
      return;
    }

    if (event.key === "Escape") {
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      showNextLightboxImage(-1);
    } else if (event.key === "ArrowRight") {
      showNextLightboxImage(1);
    }
  });

  // Swipe support for touch devices.
  let touchStartX = 0;
  let touchStartY = 0;

  lightbox.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    },
    { passive: true }
  );

  lightbox.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      const SWIPE_THRESHOLD = 45;

      if (
        Math.abs(deltaX) > SWIPE_THRESHOLD &&
        Math.abs(deltaX) > Math.abs(deltaY)
      ) {
        showNextLightboxImage(deltaX < 0 ? 1 : -1);
      }
    },
    { passive: true }
  );
}

// ------------------------------------------------------------
// RSVP FORM (localStorage demo)
// ------------------------------------------------------------

const rsvpForm =
  document.getElementById("rsvpForm");

const formMessage =
  document.getElementById("formMessage");

const rsvpSuccess =
  document.getElementById("rsvpSuccess");

const rsvpSuccessName =
  document.getElementById("rsvpSuccessName");

if (rsvpForm) {
  rsvpForm.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      const formData = new FormData(rsvpForm);

      const entry = {
        name: formData.get("name"),
        guests: formData.get("guests"),
        attendance: formData.get("attendance"),
        message: formData.get("message"),
        submittedAt: new Date().toISOString()
      };

      try {
        const existing = JSON.parse(
          window.localStorage.getItem("weddingRsvps") ||
            "[]"
        );

        existing.push(entry);

        window.localStorage.setItem(
          "weddingRsvps",
          JSON.stringify(existing)
        );

        if (formMessage) {
          formMessage.textContent = "";
        }

        // Swap the form for an elegant confirmation — this also stops
        // an accidental second click on Send RSVP, since the button
        // is no longer on screen.
        if (rsvpSuccess) {
          if (rsvpSuccessName && entry.name) {
            rsvpSuccessName.textContent = `, ${entry.name}!`;
          }

          rsvpForm.hidden = true;
          rsvpSuccess.hidden = false;
          rsvpSuccess.focus();

          const rect = rsvpSuccess.getBoundingClientRect();
          createOpeningSparkles({
            count: 14,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          });
        } else if (formMessage) {
          // Fallback if the success panel isn't present for some reason.
          formMessage.textContent =
            `Thank you, ${entry.name}! Your response has been saved on this device.`;
        }

        rsvpForm.reset();
      } catch (error) {
        if (formMessage) {
          formMessage.textContent =
            "Something went wrong saving your RSVP. Please try again.";
        }
      }
    }
  );
}

// ------------------------------------------------------------
// FOOTER YEAR
// ------------------------------------------------------------

const yearElement =
  document.getElementById("year");

if (yearElement) {
  yearElement.textContent =
    String(new Date().getFullYear());
}
