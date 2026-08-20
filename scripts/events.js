const upcomingEvents = window.RCVC_EVENTS;
const eventHighlight = window.RCVC_EVENT_HIGHLIGHT;
if (!Array.isArray(upcomingEvents) || !eventHighlight) {
  throw new Error("content/events.js must define RCVC_EVENTS and RCVC_EVENT_HIGHLIGHT.");
}

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#039;"
})[character]);

$("#eventCount").textContent = String(upcomingEvents.length).padStart(2, "0");
$("#highlightArtworkLabel").textContent = eventHighlight.artworkLabel;
$("#highlightLabel").textContent = eventHighlight.label;
$("#highlightTitle").textContent = eventHighlight.title;
$("#highlightDescription").textContent = eventHighlight.description;
$("#highlightMeta").innerHTML = eventHighlight.meta.map(item => `<span>${escapeHtml(item)}</span>`).join("");
$("#highlightLink").href = eventHighlight.url;

const formatDate = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid event date: ${value}`);
  }
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleString("en-CA", { month: "short" })
  };
};

const downloadCalendar = event => {
  const start = new Date(event.start).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(event.end).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.location}`,
    `DESCRIPTION:${event.description}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
  link.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const renderEvents = filter => {
  const visible = upcomingEvents.filter(event => filter === "all" || event.category === filter);
  $("#eventList").innerHTML = visible.map((event, index) => {
    const date = formatDate(event.start);
    const registration = event.registrationUrl
      ? `<a class="btn" href="${escapeHtml(event.registrationUrl)}" target="_blank" rel="noreferrer">Register ↗</a>`
      : "";
    return `
      <article class="event-card">
        <div class="event-date"><strong>${date.day}</strong><span>${escapeHtml(date.month)}</span></div>
        <div>
          <span class="kicker">${escapeHtml(event.category)}</span>
          <h3>${escapeHtml(event.title)}</h3>
          <p>${escapeHtml(event.location)} · ${escapeHtml(event.description)}</p>
        </div>
        <div class="event-actions">
          <button class="btn alt" data-calendar="${index}">Add to calendar</button>
          ${registration}
        </div>
      </article>`;
  }).join("");
  $("#emptyState").hidden = visible.length > 0;
  $$("[data-calendar]").forEach(button => {
    button.addEventListener("click", () => downloadCalendar(visible[Number(button.dataset.calendar)]));
  });
};

$$(".filter").forEach(button => button.addEventListener("click", () => {
  $$(".filter").forEach(item => item.classList.toggle("active", item === button));
  renderEvents(button.dataset.filter);
}));
renderEvents("all");

$("#themeToggle").addEventListener("click", () => {
  document.documentElement.dataset.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
});

const menuToggle = $("#menuToggle");
const navLinks = $("#navLinks");
menuToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.textContent = open ? "×" : "☰";
});
$$('#navLinks a').forEach(link => link.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.textContent = "☰";
}));

$("#alertForm").addEventListener("submit", event => {
  event.preventDefault();
  event.currentTarget.reset();
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 3800);
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
requestAnimationFrame(() => $(".hero").classList.add("entered"));
const revealTargets = [
  ...$$(".section-head > *"),
  $("#emptyState"),
  ...$$(".past-card > *"),
  ...$$(".alerts > *")
];
revealTargets.forEach((element, index) => {
  element.classList.add("scroll-reveal");
  element.style.setProperty("--reveal-delay", `${index % 2 * 110}ms`);
});

if (reducedMotion) {
  revealTargets.forEach(element => element.classList.add("visible"));
} else {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .14 });
  revealTargets.forEach(element => revealObserver.observe(element));
}

const eventHero = $(".hero");
const eventHeroGrid = $(".hero-grid");
let motionFrame = 0;
const updateHeroMotion = () => {
  const progress = Math.max(0, Math.min(1, window.scrollY / (eventHero.offsetHeight * .78)));
  if (!reducedMotion) {
    eventHeroGrid.style.transform = `translateY(${-progress * 74}px)`;
    eventHeroGrid.style.opacity = String(1 - progress * .42);
    eventHero.style.setProperty("--event-bg-shift", `${progress * 86}px`);
  }
};
const requestHeroMotion = () => {
  if (motionFrame) return;
  motionFrame = requestAnimationFrame(() => {
    updateHeroMotion();
    motionFrame = 0;
  });
};
window.addEventListener("scroll", requestHeroMotion, { passive: true });
window.addEventListener("resize", requestHeroMotion);
updateHeroMotion();
