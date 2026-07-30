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

const prefersReducedMotion =
  window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

const hasFinePointer =
  window.matchMedia(
    "(pointer: fine)"
  ).matches;

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

    const count =
      Math.min(70, Math.floor(area / 22000));

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
// SCROLL PROGRESS, NAVBAR AND BACK-TO-TOP VISIBILITY
// ------------------------------------------------------------

const backToTopButton =
  document.getElementById("backToTop");

function updateScrollEffects() {
  const scrollableHeight =
    document.documentElement.scrollHeight -
    window.innerHeight;

  const progress =
    scrollableHeight > 0
      ? window.scrollY / scrollableHeight
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
      window.scrollY > 70
    );
  }

  if (backToTopButton) {
    backToTopButton.classList.toggle(
      "visible",
      window.scrollY > 500
    );
  }
}

window.addEventListener(
  "scroll",
  updateScrollEffects,
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

  const size =
    Math.random() * 9 + 7;

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

  petalContainer.appendChild(petal);

  window.setTimeout(
    () => {
      petal.remove();
    },
    (duration + delay + 1) * 1000
  );
}

if (!prefersReducedMotion) {
  window.setInterval(
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
// OPENING SPARKLES
// ------------------------------------------------------------

function createOpeningSparkles() {
  if (prefersReducedMotion) {
    return;
  }

  const sparkleCount = 30;

  for (
    let index = 0;
    index < sparkleCount;
    index += 1
  ) {
    const spark =
      document.createElement("span");

    spark.className =
      "open-spark";

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

// Comfortable listening level (0 to 1) — adjust to taste.
const MUSIC_TARGET_VOLUME = 0.35;

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
}

function markMusicUnavailable() {
  musicUnavailable = true;

  if (musicToggle) {
    musicToggle.disabled = true;
    musicToggle.classList.add("unavailable");
    musicToggle.setAttribute("aria-label", "Music unavailable");
  }
}

if (backgroundMusic) {
  // The mp3 may be missing or fail to decode — fail gracefully
  // instead of leaving a broken control or throwing console errors.
  backgroundMusic.addEventListener(
    "error",
    markMusicUnavailable
  );
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
        MUSIC_TARGET_VOLUME,
        (MUSIC_TARGET_VOLUME * currentStep) / steps
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

const menuButton =
  document.getElementById("menuButton");

const navLinks =
  document.getElementById("navLinks");

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
    }
  );

  navLinks
    .querySelectorAll("a")
    .forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });
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

function animateCountdownValue(element) {
  if (prefersReducedMotion) {
    return;
  }

  element.animate(
    [
      {
        opacity: 0.3,
        transform:
          "translateY(-8px) scale(0.92)"
      },
      {
        opacity: 1,
        transform:
          "translateY(0) scale(1)"
      }
    ],
    {
      duration: 450,
      easing:
        "cubic-bezier(0.16, 1, 0.3, 1)"
    }
  );
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
    ([key, element]) => {
      if (!element) {
        return;
      }

      const formatted =
        String(values[key]).padStart(2, "0");

      if (element.textContent !== formatted) {
        element.textContent = formatted;
        animateCountdownValue(element);
      }
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
}

// ------------------------------------------------------------
// RSVP FORM (localStorage demo)
// ------------------------------------------------------------

const rsvpForm =
  document.getElementById("rsvpForm");

const formMessage =
  document.getElementById("formMessage");

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
          formMessage.textContent =
            `Thank you, ${entry.name}! Your RSVP has been received.`;
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
