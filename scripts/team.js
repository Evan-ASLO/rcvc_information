const teams = window.RCVC_TEAM;
if (!Array.isArray(teams)) {
  throw new Error("content/team.js must define window.RCVC_TEAM.");
}

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#039;"
})[character]);

let globalIndex = 0;
$("#teamNavLinks").innerHTML = teams.map(team =>
  `<a href="#${escapeHtml(team.id)}">${escapeHtml(team.title)}</a>`
).join("");

const memberCard = member => {
  globalIndex += 1;
  const initials = member.placeholder
    ? "RC"
    : member.name
      .split(/\s+/)
      .map(part => part.replace(/[()]/g, "")[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  const linkedIn = member.linkedin || "";
  const tag = linkedIn ? "a" : "article";
  const linkAttributes = linkedIn
    ? `href="${escapeHtml(linkedIn)}" target="_blank" rel="noreferrer"`
    : "";

  return `
    <${tag} class="member-card ${member.placeholder ? "placeholder vacancy" : ""} ${linkedIn ? "" : "disabled"}" ${linkAttributes}>
      <div class="member-top">
        <span class="member-number">${String(globalIndex).padStart(2, "0")}</span>
        <span class="linkedin-pill">${linkedIn ? "in View profile ↗" : member.placeholder ? "Open roster slot" : "LinkedIn hidden"}</span>
      </div>
      <div class="member-bottom">
        <span class="avatar">${escapeHtml(initials)}</span>
        <h3>${escapeHtml(member.name)}</h3>
        <p>${escapeHtml(member.role)}</p>
      </div>
    </${tag}>`;
};

$("#teamSections").innerHTML = teams.map(team => `
  <section class="team-section" id="${escapeHtml(team.id)}">
    <div class="section-shell">
      <div class="section-head reveal">
        <span class="kicker">${escapeHtml(team.index)} / Team</span>
        <div><h2>${escapeHtml(team.title)}</h2><p class="section-desc">${escapeHtml(team.description)}</p></div>
      </div>
      ${team.roles.map(role => `
        <div class="role-block reveal">
          <div class="role-heading">${escapeHtml(role.title)}</div>
          <div class="member-grid">${role.members.map(memberCard).join("")}</div>
        </div>`).join("")}
    </div>
  </section>`).join("") + `
  <section><div class="section-shell">
    <div class="roster-note">
      <p><strong>Profile privacy:</strong> Add an approved URL to a member's <code>linkedin</code> field in <code>content/team.js</code> to activate their profile card.</p>
      <span class="kicker">Profile links / Opt-in</span>
    </div>
  </div></section>`;

const actualMemberCount = teams
  .flatMap(team => team.roles)
  .flatMap(role => role.members)
  .filter(member => !member.placeholder)
  .length;
$("#memberCount").textContent = String(actualMemberCount).padStart(2, "0");

if (window.location.hash) {
  requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView());
}

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

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: .1 });
$$(".reveal").forEach(element => observer.observe(element));
