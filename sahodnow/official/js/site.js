(function () {
  document.documentElement.classList.add("js");
  const REG = { sec: "0000000", ca: "0000000" };
  const SUPPORT_EMAIL = "support@sahodnow.ph";
  const page = document.body.dataset.page;
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");

  header.innerHTML = `
    <div class="wrap nav">
      <a class="logo" href="index.html"><span class="mark" aria-hidden="true"></span>SahodNow</a>
      <ul class="nav-links">
        <li><a data-nav="borrow" href="index.html">Borrow</a></li>
        <li><a data-nav="trust" href="trust.html">Trust</a></li>
        <li><a data-nav="contact" href="contact.html">Contact</a></li>
      </ul>
      <div class="nav-right">
        <a class="nav-cta" href="index.html#download">Get the app</a>
        <button class="menu-btn" type="button" aria-label="Menu"><i></i></button>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <div class="wrap">
      <div class="foot">
        <div class="foot-brand">
          <a class="logo" href="index.html"><span class="mark"></span>SahodNow</a>
          <p>Less waiting, more living.</p>
          <address class="foot-address">LendWise Financing Corp.<br>Eton Cyberpod Corinthian, EDSA corner Ortigas Avenue, Barangay Ugong Norte, Quezon City, Metro Manila, Philippines</address>
          <div class="social" aria-label="Official social media">
            <a href="#" aria-label="SahodNow on Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z"/></svg></a>
            <a href="#" aria-label="SahodNow on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3.9" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.3" cy="6.8" r="1.1" fill="currentColor"/></svg></a>
            <a href="#" aria-label="SahodNow on TikTok"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.6 3c.4 2 1.8 3.4 3.9 3.7v3.1c-1.4 0-2.8-.4-3.9-1.2v6.5a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.2a2.5 2.5 0 1 0 1.6 2.3V3h3.1z"/></svg></a>
            <a href="#" aria-label="SahodNow on YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z"/></svg></a>
          </div>
        </div>
        <div>
          <p class="foot-label">Quick links</p>
          <a href="index.html">Borrow</a>
          <a href="trust.html">Trust</a>
          <a href="contact.html">Contact</a>
          <a href="contact.html#ticket">Submit a ticket</a>
        </div>
        <div>
          <p class="foot-label">Terms</p>
          <a href="https://www.sahodnow.ph/terms">Terms of Use</a>
          <a href="https://www.sahodnow.ph/privacy">Privacy Policy</a>
        </div>
      </div>
      <div class="legal-row">
        <img class="seal" src="img/npc-seal.svg" alt="National Privacy Commission DPO/DPS Seal of Registration" />
        <div class="legal">
          <p><strong>SahodNow is a SEC-registered online lending app of LendWise Financing Corp.</strong></p>
          <p>SEC Registration No. <span data-reg="sec"></span> and CA No. <span data-reg="ca"></span><br><a href="https://imessage.sec.gov.ph" target="_blank" rel="noopener noreferrer">Contact the SEC Financing and Lending Companies Division</a></p>
          <p>Final terms appear in the app before you confirm. Itemized breakdown of loan amounts, interest rates, service fees, and penalties are provided in the Disclosure Statement. Study the terms and conditions before proceeding with the loan transaction. We never ask for personal information, OTP, PIN, or fees outside the official app. © ${new Date().getFullYear()} LendWise Financing Corp.</p>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll("[data-reg]").forEach((el) => {
    el.textContent = REG[el.dataset.reg] || "";
  });

  const active = header.querySelector(`[data-nav="${page}"]`);
  if (active) active.classList.add("active");

  const btn = header.querySelector(".menu-btn");
  const links = header.querySelector(".nav-links");
  btn.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    document.body.classList.toggle("menu-open", open);
    btn.setAttribute("aria-label", open ? "Close menu" : "Menu");
    document.body.style.overflow = open ? "hidden" : "";
  });

  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  document.querySelectorAll("[data-hero-slides]").forEach((root) => {
    const groups = [...root.querySelectorAll("[data-slide-group]")];
    const sets = groups.length
      ? groups.map((g) => [...g.querySelectorAll(".hero-slide")])
      : [[...root.querySelectorAll(".hero-slide")]];
    const dots = [...root.querySelectorAll("[data-hero-dot]")];
    const len = sets[0] ? sets[0].length : 0;
    if (!len) return;
    let index = 0;
    let timer;
    const show = (n) => {
      index = (n + len) % len;
      sets.forEach((slides) => slides.forEach((slide, i) => slide.classList.toggle("is-on", i === index)));
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-on", i === index);
        dot.setAttribute("aria-selected", i === index ? "true" : "false");
      });
    };
    const play = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      stop();
      timer = setInterval(() => show(index + 1), 5600);
    };
    const stop = () => clearInterval(timer);
    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        stop();
        show(i);
        play();
      });
    });
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", play);
    play();
  });

  const marquee = document.querySelector("[data-marquee]");
  if (marquee) {
    const track = marquee.querySelector(".logo-track");
    const set = track.querySelector(".logo-set");
    const clone = set.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("img").forEach((img) => { img.alt = ""; });
    track.appendChild(clone);
  }

  const how = document.querySelector("[data-how]");
  if (how) {
    const steps = [...how.querySelectorAll(".how-step")];
    const shots = [...how.querySelectorAll("[data-shot]")];
    const show = (i) => {
      steps.forEach((s, n) => {
        s.classList.toggle("is-on", n === i);
        s.setAttribute("aria-selected", n === i ? "true" : "false");
      });
      shots.forEach((s) => s.classList.toggle("is-on", s.dataset.shot === String(i)));
    };
    steps.forEach((stepBtn, i) => stepBtn.addEventListener("click", () => show(i)));
  }

  const ticket = document.querySelector("[data-ticket]");
  if (ticket) {
    ticket.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(ticket);
      const subject = `Ticket: ${f.get("topic")}`;
      const body = [
        `Topic: ${f.get("topic")}`,
        `Name: ${f.get("name")}`,
        `Mobile: ${f.get("mobile")}`,
        `Email: ${f.get("email")}`,
        "",
        f.get("message"),
      ].join("\n");
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      ticket.querySelector(".ticket-done").hidden = false;
    });
  }

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

    document.querySelectorAll([
      ".hero-copy",
      ".panel-copy",
      ".panel.band .wrap",
      ".page-top .wrap",
      ".chapter > .wrap",
      "main > .wrap",
      ".privacy-band .wrap",
    ].join(",")).forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
  }
})();
