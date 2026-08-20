const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#039;"
})[character]);

const partners = window.RCVC_PARTNERS;
const research = window.RCVC_RESEARCH;
const linkedInFeature = window.RCVC_LINKEDIN_FEATURE;
const testimonials = window.RCVC_TESTIMONIALS;

if (!Array.isArray(partners) || !Array.isArray(research) || !linkedInFeature || !Array.isArray(testimonials)) {
  throw new Error("content/home.js is missing required RCVC home-page data.");
}

const partnerSet = $("#partnerSet");
partnerSet.innerHTML = partners.map(partner => {
  const tag = partner.url ? "a" : "article";
  const linkAttributes = partner.url
    ? ` href="${escapeHtml(partner.url)}" target="_blank" rel="noreferrer"`
    : "";
  return `
    <${tag} class="partner-card"${linkAttributes}>
      <span class="partner-location">${escapeHtml(partner.location)}</span>
      <h3>${escapeHtml(partner.name)}</h3>
      <div class="partner-meta"><span>${escapeHtml(partner.focus)}</span><span>↗</span></div>
    </${tag}>`;
}).join("");

const partnerClone = partnerSet.cloneNode(true);
partnerClone.removeAttribute("id");
partnerClone.setAttribute("aria-hidden", "true");
partnerClone.querySelectorAll("a").forEach(link => {
  link.tabIndex = -1;
});
$("#partnerTrack").appendChild(partnerClone);

const researchEmpty = $(".research-empty");
researchEmpty.insertAdjacentHTML("beforebegin", research.map((publication, index) => `
  <article class="research-card" data-category="${escapeHtml(publication.category)}" data-research-index="${index}" tabindex="0">
    <span class="research-tag">${escapeHtml(publication.tag)}</span>
    <h3>${escapeHtml(publication.title)}</h3>
    <p>${escapeHtml(publication.summary)}</p>
    <div class="card-foot"><span>${escapeHtml(publication.meta)}</span><span>↗</span></div>
  </article>
`).join(""));

$("#linkedinFeatureLabel").textContent = linkedInFeature.label;
$("#linkedinFeatureQuote").textContent = `“${linkedInFeature.quote}”`;
$("#linkedinFeatureLink").href = linkedInFeature.url;

const testimonialDots = $("#testimonialDots");
testimonialDots.innerHTML = testimonials.map((testimonial, index) =>
  `<button class="dot ${index === 0 ? "active" : ""}" data-quote="${index}" aria-label="Testimonial ${index + 1}"></button>`
).join("");

const showTestimonial = index => {
  const testimonial = testimonials[index];
  if (!testimonial) return;
  $("#testimonyCopy").textContent = testimonial.quote;
  $("#testimonyMeta").textContent = testimonial.attribution;
  $$(".dot").forEach(dot => dot.classList.toggle("active", Number(dot.dataset.quote) === index));
};

showTestimonial(0);
$$(".dot").forEach(dot => dot.addEventListener("click", () => showTestimonial(Number(dot.dataset.quote))));

const introVideo = $("#introVideo");
const introSound = $("#introSound");
let introNeedsPlayback = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

introVideo.addEventListener("error", () => {
  console.error("RCVC intro video could not be loaded.");
  $(".cinematic-intro").classList.add("video-error");
});

introSound.addEventListener("click", event => {
  if (introNeedsPlayback || introVideo.paused) {
    introNeedsPlayback = false;
    introVideo.play();
    event.currentTarget.textContent = "Sound on";
    return;
  }
  introVideo.muted = !introVideo.muted;
  event.currentTarget.textContent = introVideo.muted ? "Sound on" : "Sound off";
});

if (introNeedsPlayback) {
  introVideo.pause();
  introSound.textContent = "Play video";
} else {
  introVideo.play().catch(() => {
    introNeedsPlayback = true;
    introSound.textContent = "Play video";
  });
}

const thesisSection = $(".hero");
const thesisRevealItems = [
  { element: $(".thesis-hero-head"), delay: 0, distance: 88, unit: "px" },
  { element: $(".thesis-hero h1 .line:nth-child(1) span"), delay: .08, distance: 145, unit: "%" },
  { element: $(".thesis-hero h1 .line:nth-child(2) span"), delay: .2, distance: 160, unit: "%" },
  { element: $(".thesis-hero .hero-copy"), delay: .38, distance: 92, unit: "px" },
  { element: $(".thesis-hero .actions"), delay: .5, distance: 82, unit: "px" }
];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const setThesisProgress = () => {
  const rect = thesisSection.getBoundingClientRect();
  const rawProgress = Math.max(0, Math.min(1, (window.innerHeight * .82 - rect.top) / (window.innerHeight * .74)));
  thesisRevealItems.forEach(item => {
    const local = Math.max(0, Math.min(1, (rawProgress - item.delay) / (1 - item.delay)));
    const eased = local * local * (3 - 2 * local);
    item.element.style.opacity = String(reducedMotion ? 1 : eased);
    item.element.style.transform = reducedMotion ? "none" : `translateY(${(1 - eased) * item.distance}${item.unit})`;
  });
};

let thesisFrame = 0;
const requestThesisUpdate = () => {
  if (thesisFrame) return;
  thesisFrame = requestAnimationFrame(() => {
    setThesisProgress();
    thesisFrame = 0;
  });
};

window.addEventListener("scroll", requestThesisUpdate, { passive: true });
window.addEventListener("resize", requestThesisUpdate);
setThesisProgress();

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

const cursor = $(".cursor");
window.addEventListener("pointermove", event => {
  cursor.style.left = `${event.clientX}px`;
  cursor.style.top = `${event.clientY}px`;
}, { passive: true });

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: .12 });
$$(".reveal").forEach(element => revealObserver.observe(element));

const sections = $$("main section[id]");
const navAnchors = $$("#navLinks a");
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navAnchors.forEach(anchor => anchor.classList.toggle("active", anchor.hash === `#${entry.target.id}`));
  });
}, { rootMargin: "-40% 0px -50%" });
sections.forEach(section => sectionObserver.observe(section));

$$(".about-item").forEach(item => {
  const activate = () => {
    $$(".about-item").forEach(other => other.classList.toggle("active", other === item));
  };
  item.addEventListener("click", activate);
  item.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  });
});

const filters = $$(".filter");
const researchCards = $$(".research-card");
filters.forEach(filter => filter.addEventListener("click", () => {
  filters.forEach(button => button.classList.toggle("active", button === filter));
  const category = filter.dataset.filter;
  let shown = 0;
  researchCards.forEach(card => {
    const visible = category === "all" || card.dataset.category === category;
    card.hidden = !visible;
    if (visible) shown += 1;
  });
  researchEmpty.style.display = shown ? "none" : "block";
}));

const modal = $("#researchModal");
const modalLink = $("#modalLink");
const openModal = card => {
  const publication = research[Number(card.dataset.researchIndex)];
  if (!publication) return;
  $("#modalTitle").textContent = publication.title;
  $("#modalCopy").textContent = publication.details;
  modalLink.hidden = !publication.url;
  if (publication.url) modalLink.href = publication.url;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
  $("#modalClose").focus();
};

researchCards.forEach(card => {
  card.addEventListener("click", () => openModal(card));
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModal(card);
    }
  });
});

const closeModal = () => {
  modal.classList.remove("open");
  document.body.style.overflow = "";
};
$("#modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
});

const form = $("#contactForm");
form.addEventListener("submit", event => {
  event.preventDefault();
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 4200);
  form.reset();
});

window.addEventListener("scroll", () => {
  const art = $(".hero-art");
  if (art && window.scrollY < window.innerHeight) {
    art.style.transform = `translateY(${window.scrollY * .08}px)`;
  }
}, { passive: true });
