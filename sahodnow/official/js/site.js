(function () {
  document.documentElement.classList.add("js");
  const page = document.body.dataset.page;
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");

  header.innerHTML = `
    <div class="wrap nav">
      <a class="logo" href="index.html"><span class="mark" aria-hidden="true"></span>SahodNow</a>
      <ul class="nav-links">
        <li><a data-nav="home" href="index.html">Home</a></li>
        <li><a data-nav="product" href="product.html">Product</a></li>
        <li><a data-nav="about" href="about.html">About us</a></li>
        <li><a data-nav="trust" href="trust.html">Trust</a></li>
        <li><a data-nav="contact" href="contact.html">Contact</a></li>
      </ul>
      <div class="nav-right">
        <a class="nav-cta" href="product.html#download">Get the app</a>
        <button class="menu-btn" type="button" aria-label="Menu"><i></i></button>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <div class="wrap">
      <div class="foot">
        <div>
          <a class="logo" href="index.html"><span class="mark"></span>SahodNow</a>
          <p>Less waiting, more living.</p>
        </div>
        <div>
          <a href="product.html">Product</a>
          <a href="about.html">About us</a>
          <a href="trust.html">Trust</a>
          <a href="contact.html">Contact</a>
        </div>
        <div>
          <a href="mailto:support@sahodnow.ph">support@sahodnow.ph</a>
          <a href="mailto:privacy@sahodnow.ph">privacy@sahodnow.ph</a>
          <a href="https://www.sahodnow.ph/privacy">Privacy policy</a>
        </div>
      </div>
      <p class="legal">SahodNow is the online lending platform of Lendwise Financing Corp., an SEC-registered financing company. Final terms appear in the app before you confirm. We never ask for OTP, PIN, or fees outside the official app. © ${new Date().getFullYear()} Lendwise Financing Corp.</p>
    </div>
  `;

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

  const heroSlides = document.querySelector("[data-hero-slides]");
  if (heroSlides) {
    const slides = [...heroSlides.querySelectorAll(".hero-slide")];
    const dots = [...heroSlides.querySelectorAll("[data-hero-dot]")];
    let index = 0;
    let timer;
    const show = (n) => {
      index = (n + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("is-on", i === index));
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
    heroSlides.addEventListener("mouseenter", stop);
    heroSlides.addEventListener("mouseleave", play);
    play();
  }

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
