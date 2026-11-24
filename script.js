"use strict";

const root = document.documentElement;
const header = document.querySelector(".site-header");
const themeToggle = document.querySelector(".theme-toggle");
const themeColor = document.querySelector('meta[name="theme-color"]');
const menuToggle = document.querySelector(".menu-toggle");
const navPanel = document.querySelector(".nav-panel");
const navLinks = [...document.querySelectorAll(".nav-link")];
const sections = [...document.querySelectorAll("main section[id]")];

function setTheme(theme) {
  root.dataset.theme = theme;
  try {
    localStorage.setItem("portfolio-theme", theme);
  } catch {
    // The theme still works when storage is unavailable, notably on some file:// setups.
  }
  const isDark = theme === "dark";

  themeToggle.setAttribute("aria-label", isDark ? "Activer le mode clair" : "Activer le mode sombre");
  themeColor.setAttribute("content", isDark ? "#07111f" : "#f5f8fc");
}

setTheme(root.dataset.theme);

themeToggle.addEventListener("click", () => {
  setTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

function closeMenu() {
  navPanel.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Ouvrir le menu");
  document.body.classList.remove("menu-open");
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  navPanel.classList.toggle("open", !isOpen);
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Ouvrir le menu" : "Fermer le menu");
  document.body.classList.toggle("menu-open", !isOpen);
});

navLinks.forEach((link) => link.addEventListener("click", closeMenu));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 820) closeMenu();
});

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 20);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const activeLinkObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
);

sections.forEach((section) => activeLinkObserver.observe(section));

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealElements = document.querySelectorAll(".reveal");

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

const profileImage = document.querySelector("#profile-image");
const profilePlaceholder = document.querySelector(".portrait-placeholder");

function showProfilePlaceholder() {
  profileImage.style.display = "none";
  profilePlaceholder.style.display = "flex";
}

profileImage.addEventListener("error", showProfilePlaceholder);
if (profileImage.complete && profileImage.naturalWidth === 0) showProfilePlaceholder();

const carousel = document.querySelector(".carousel");
const track = carousel.querySelector(".carousel-track");
const slides = [...carousel.querySelectorAll(".project-card")];
const previousButton = document.querySelector(".prev-button");
const nextButton = document.querySelector(".next-button");
const indicatorsContainer = document.querySelector(".carousel-indicators");
const currentSlideLabel = document.querySelector(".current-slide");
let currentIndex = 0;
let autoplayId = null;
let touchStartX = 0;

slides.forEach((slide, index) => {
  slide.setAttribute("aria-label", `${index + 1} sur ${slides.length}`);

  const indicator = document.createElement("button");
  indicator.className = "carousel-indicator";
  indicator.type = "button";
  indicator.setAttribute("aria-label", `Afficher le projet ${index + 1}`);
  indicator.addEventListener("click", () => {
    goToSlide(index);
    restartAutoplay();
  });
  indicatorsContainer.appendChild(indicator);
});

const indicators = [...document.querySelectorAll(".carousel-indicator")];

function goToSlide(index) {
  currentIndex = (index + slides.length) % slides.length;
  track.style.transform = `translateX(-${currentIndex * 100}%)`;
  currentSlideLabel.textContent = String(currentIndex + 1).padStart(2, "0");

  slides.forEach((slide, slideIndex) => {
    const isHidden = slideIndex !== currentIndex;
    slide.setAttribute("aria-hidden", String(isHidden));
    slide.inert = isHidden;
  });

  indicators.forEach((indicator, indicatorIndex) => {
    const isActive = indicatorIndex === currentIndex;
    indicator.classList.toggle("active", isActive);
    indicator.setAttribute("aria-current", isActive ? "true" : "false");
  });
}

function nextSlide() {
  goToSlide(currentIndex + 1);
}

function previousSlide() {
  goToSlide(currentIndex - 1);
}

function startAutoplay() {
  if (reducedMotion) return;
  stopAutoplay();
  autoplayId = window.setInterval(nextSlide, 6000);
}

function stopAutoplay() {
  if (autoplayId !== null) {
    window.clearInterval(autoplayId);
    autoplayId = null;
  }
}

function restartAutoplay() {
  stopAutoplay();
  startAutoplay();
}

previousButton.addEventListener("click", () => {
  previousSlide();
  restartAutoplay();
});

nextButton.addEventListener("click", () => {
  nextSlide();
  restartAutoplay();
});

carousel.addEventListener("mouseenter", stopAutoplay);
carousel.addEventListener("mouseleave", startAutoplay);
carousel.addEventListener("focusin", stopAutoplay);
carousel.addEventListener("focusout", (event) => {
  if (!carousel.contains(event.relatedTarget)) startAutoplay();
});

carousel.addEventListener(
  "touchstart",
  (event) => {
    touchStartX = event.changedTouches[0].clientX;
    stopAutoplay();
  },
  { passive: true }
);

carousel.addEventListener(
  "touchend",
  (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 50) {
      distance < 0 ? nextSlide() : previousSlide();
    }
    startAutoplay();
  },
  { passive: true }
);

carousel.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    nextSlide();
    restartAutoplay();
  }
  if (event.key === "ArrowLeft") {
    previousSlide();
    restartAutoplay();
  }
});

document.querySelectorAll('a[href="#"]').forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});

goToSlide(0);
startAutoplay();
