// Mockup-Donation-Page — plain vanilla JS (no framework).
// - Smooth scroll for in-page anchors (e.g. "Ways to give")
// - FAQ <details> accordion behaviour (only one open at a time)

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id && id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else if (id === "#") {
        // Demo links — prevent page jump.
        e.preventDefault();
      }
    });
  });

  const faqs = document.querySelectorAll("details");
  faqs.forEach((d) => {
    d.addEventListener("toggle", () => {
      if (d.open) {
        faqs.forEach((other) => {
          if (other !== d) other.open = false;
        });
      }
    });
  });
});
