(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = matchMedia('(hover: hover)').matches;
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];
    const lerp = (a, b, t) => a + (b - a) * t;
  
    window.addEventListener('DOMContentLoaded', () => {
      $('#hero').classList.add('show');
  
      // ---------- smooth scrolling ----------
      let lenis = null;
      if (!reduce && window.Lenis) {
        lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      }
      const menu = $('#mainNav');
      $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const target = id === '#top' ? document.body : $(id);
        if (!target) return;
        e.preventDefault();
        if (menu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(menu).hide();
        if (lenis) lenis.scrollTo(id === '#top' ? 0 : target, { offset: -70, duration: 1.6 });
        else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      }));
  
      // ---------- reveal on scroll ----------
      const targets = $$('.title, .job, #work .col-12, #skills .col-12, .imgbox, #about .col-md-7, #contact > *');
      $$('.skill').forEach((s, i) => s.style.setProperty('--i', i % 6));
      if (!reduce) {
        const io = new IntersectionObserver((entries) => entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        }), { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
        targets.forEach((el) => {
          const sibs = [...el.parentElement.children].filter((c) => targets.includes(c));
          el.style.transitionDelay = Math.min(sibs.indexOf(el), 5) * 110 + 'ms';
          el.classList.add('reveal');
          io.observe(el);
        });
      } else {
        targets.forEach((el) => el.classList.add('in'));
      }
  
      // ---------- rotating role (smooth cross-fade) ----------
      const word = $('#typed');
      if (word && !reduce) {
        const roles = ['software engineer.', 'Odoo developer.', 'front-end developer.'];
        let r = 0;
        setInterval(() => {
          word.classList.add('out');
          setTimeout(() => {
            r = (r + 1) % roles.length;
            word.textContent = roles[r];
            word.classList.remove('out');
            word.classList.add('pre');
            void word.offsetWidth;
            word.classList.remove('pre');
          }, 700);
        }, 3400);
      }
  
      // ---------- hero network canvas ----------
      const cv = $('#net');
      const mouse = { x: -999, y: -999 };
      let w = 0, h = 0, dots = [], heroVisible = true, lastW = 0, ctx = null;
      if (cv && !reduce) {
        ctx = cv.getContext('2d');
        const size = () => {
          if (cv.clientWidth === lastW && dots.length) return;
          const d = devicePixelRatio || 1;
          w = lastW = cv.clientWidth; h = cv.clientHeight;
          cv.width = w * d; cv.height = h * d;
          ctx.setTransform(d, 0, 0, d, 0, 0);
          const n = Math.min(80, Math.floor((w * h) / 18000));
          dots = Array.from({ length: n }, () => ({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
          }));
        };
        size();
        addEventListener('resize', size);
        const hero = cv.parentElement;
        hero.addEventListener('pointermove', (e) => {
          const r = cv.getBoundingClientRect();
          mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
        });
        hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
        new IntersectionObserver((e) => { heroVisible = e[0].isIntersecting; }).observe(cv);
      }
      const seg = (a, b, alpha) => {
        ctx.strokeStyle = `rgba(100,255,218,${alpha})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      };
      const drawNet = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(100,255,218,.55)';
        for (const p of dots) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, 6.283); ctx.fill();
        }
        for (let i = 0; i < dots.length; i++) {
          for (let j = i + 1; j < dots.length; j++) {
            const d = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
            if (d < 130) seg(dots[i], dots[j], 0.16 * (1 - d / 130));
          }
          const m = Math.hypot(dots[i].x - mouse.x, dots[i].y - mouse.y);
          if (m < 170) seg(dots[i], mouse, 0.45 * (1 - m / 170));
        }
      };
  
      // ---------- smoothed values (one animation loop) ----------
      const nav = $('.site-nav'), bar = $('#progress'), tl = $('.timeline'), glow = $('#glow');
      const gl = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2 };
      let prog = 0, fill = 0, scrolled = false;
      if (glow && canHover && !reduce) {
        addEventListener('pointermove', (e) => { gl.tx = e.clientX; gl.ty = e.clientY; glow.style.opacity = 1; }, { passive: true });
      }
  
      const cards = canHover && !reduce ? $$('.project-card').map((el) => {
        const s = { el, rx: 0, ry: 0, lift: 0, trx: 0, tr: 0, tl: 0 };
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          s.tr = ((e.clientX - r.left) / r.width - 0.5) * 8;
          s.trx = -((e.clientY - r.top) / r.height - 0.5) * 8;
          s.tl = 6;
        });
        el.addEventListener('pointerleave', () => { s.tr = s.trx = s.tl = 0; });
        return s;
      }) : [];
  
      const magnets = canHover && !reduce ? $$('.btn-outline, .btn-resume').map((el) => {
        const s = { el, x: 0, y: 0, tx: 0, ty: 0 };
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          s.tx = (e.clientX - (r.left + r.width / 2)) * 0.25;
          s.ty = (e.clientY - (r.top + r.height / 2)) * 0.35;
        });
        el.addEventListener('pointerleave', () => { s.tx = s.ty = 0; });
        return s;
      }) : [];
  
      const frame = (time) => {
        requestAnimationFrame(frame);
        if (lenis) lenis.raf(time);
  
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - innerHeight;
        prog = lerp(prog, max > 0 ? y / max : 0, 0.12);
        bar.style.transform = `scaleX(${prog.toFixed(4)})`;
  
        const isScrolled = y > 30;
        if (isScrolled !== scrolled) { scrolled = isScrolled; nav.classList.toggle('scrolled', scrolled); }
  
        if (tl) {
          const r = tl.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (innerHeight * 0.65 - r.top) / r.height));
          fill = lerp(fill, t, 0.1);
          tl.style.setProperty('--fill', (fill * 100).toFixed(2) + '%');
        }
  
        if (cv && !reduce && heroVisible) {
          cv.style.transform = `translate3d(0, ${(y * 0.25).toFixed(1)}px, 0)`;
          drawNet();
        }
  
        if (glow && canHover && !reduce) {
          gl.x = lerp(gl.x, gl.tx, 0.08); gl.y = lerp(gl.y, gl.ty, 0.08);
          glow.style.transform = `translate3d(${(gl.x - 260).toFixed(1)}px, ${(gl.y - 260).toFixed(1)}px, 0)`;
        }
  
        for (const s of cards) {
          s.rx = lerp(s.rx, s.trx, 0.1); s.ry = lerp(s.ry, s.tr, 0.1); s.lift = lerp(s.lift, s.tl, 0.1);
          s.el.style.transform = `perspective(900px) rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg) translate3d(0, ${(-s.lift).toFixed(2)}px, 0)`;
        }
        for (const s of magnets) {
          s.x = lerp(s.x, s.tx, 0.15); s.y = lerp(s.y, s.ty, 0.15);
          s.el.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0)`;
        }
      };
      requestAnimationFrame(frame);
    });
  })();