(() => {
  const site = window.RCVC_SITE;
  if (!site) {
    throw new Error("content/site.js must load before scripts/site.js");
  }

  document.querySelectorAll("[data-site-link]").forEach(link => {
    const url = site.links[link.dataset.siteLink];
    if (url) link.href = url;
  });

  document.querySelectorAll("[data-footer-year]").forEach(element => {
    element.textContent = site.footer.year;
  });

  document.querySelectorAll("[data-footer-location]").forEach(element => {
    element.textContent = site.footer.location;
  });
})();
