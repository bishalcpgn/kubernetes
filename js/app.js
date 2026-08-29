(function(){
    'use strict';

    const THEME_KEY = 'kubernetes-theme';
    const html = document.documentElement;
    let sections = [];
    let navLinks = [];
    let updateTopicMapActive = () => {};
    let syncTopicMapDock = () => {};

    function getInitialTheme() {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    function applyTheme(theme) {
      const btn = document.getElementById('themeToggle');
      html.setAttribute('data-theme', theme);
      localStorage.setItem(THEME_KEY, theme);
      if (!btn) return;
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      btn.innerHTML = theme === 'dark'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }

    function toggleTheme() {
      const current = html.getAttribute('data-theme') || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    }

    function showToast(message) {
      let toast = document.querySelector('.toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(toast._timeout);
      toast._timeout = setTimeout(() => toast.classList.remove('show'), 1800);
    }

    function setupMobileSidebar() {
      const menuToggle = document.getElementById('menuToggle');
      const backdrop = document.querySelector('.sidebar-backdrop');
      const sidebar = document.getElementById('sidebar');
      menuToggle?.addEventListener('click', () => {
        sidebar?.classList.add('open');
        backdrop?.classList.add('show');
      });
      backdrop?.addEventListener('click', () => {
        sidebar?.classList.remove('open');
        backdrop?.classList.remove('show');
      });
    }

    function initKeyboardShortcuts() {
      document.addEventListener('keydown', (event) => {
        const active = document.activeElement?.tagName;
        if (active === 'INPUT' || active === 'TEXTAREA') return;
        if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          document.getElementById('navSearch')?.focus();
          return;
        }
        if (event.key === 't' && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          toggleTheme();
        }
      });
    }

    function initThemeToggle() {
      document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    }

    function initClipboardCopy() {
      document.addEventListener('click', async (event) => {
        const copyBtn = event.target.closest('.copy-btn');
        if (!copyBtn) return;
        const pre = copyBtn.closest('.code-block')?.querySelector('pre');
        if (!pre) return;
        try {
          await navigator.clipboard.writeText(pre.innerText);
          const original = copyBtn.innerHTML;
          copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied';
          copyBtn.classList.add('copied');
          showToast('Copied to clipboard');
          setTimeout(() => { copyBtn.classList.remove('copied'); copyBtn.innerHTML = original; }, 1800);
        } catch {
          showToast('Copy failed - select manually');
        }
      });
    }

    function initSearch(navLinks) {
      const searchInput = document.getElementById('navSearch');
      if (!searchInput) return;
      const filter = () => {
        const query = searchInput.value.trim().toLowerCase();
        navLinks.forEach(link => {
          const text = link.textContent.toLowerCase();
          link.classList.toggle('hidden', !!query && !text.includes(query));
        });
      };
      searchInput.addEventListener('input', filter);
      searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          searchInput.value = '';
          filter();
        }
      });
    }

    function slug(text) {
      return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    function buildSections() {
      const root = document.getElementById('md-root');
      if (!root) return;
      const nodes = Array.from(root.childNodes);
      sections = [];
      let current = null;

      nodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) {
          return;
        }

        if (node.nodeType === Node.ELEMENT_NODE && node.tagName.match(/^H[12]$/)) {
          const title = node.textContent || 'section';
          const id = node.id || slug(title);
          node.id = id;

          const section = document.createElement('section');
          section.className = 'page-section';
          section.id = id;
          section.appendChild(node.cloneNode(true));
          sections.push(section);
          current = section;
          return;
        }

        if (!current) {
          current = document.createElement('section');
          current.className = 'page-section';
          current.id = 'welcome';
          sections.push(current);
        }
        current.appendChild(node.cloneNode(true));
      });

      if (sections.length === 0) {
        const fallback = document.createElement('section');
        fallback.className = 'page-section active';
        fallback.id = 'welcome';
        sections.push(fallback);
      }

      root.innerHTML = '';
      sections.forEach((section, index) => {
        if (index === 0) section.classList.add('active');
        root.appendChild(section);
      });
    }

    function buildNav() {
      const navList = document.querySelector('.nav-list');
      if (!navList) return;
      navList.innerHTML = '';
      navLinks = [];

      GUIDE_NAV.forEach(item => {
        const isCurrentFile = item.file === currentPage;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = isCurrentFile ? '#' + item.id : pageHref(item.file) + '#' + item.id;
        a.className = 'nav-link';
        a.innerHTML = '<span class="nav-num">·</span> ' + item.title;
        if (isCurrentFile) {
          a.addEventListener('click', (event) => {
            event.preventDefault();
            showSection(item.id);
          });
        }
        li.appendChild(a);
        navList.appendChild(li);
        navLinks.push(a);
      });
      const activeSection = sections.find(section => section.classList.contains('active')) || sections[0];
      if (activeSection) {
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + activeSection.id));
      }
    }

    const GITHUB_REPO = 'https://github.com/bishalcpgn/Kubernetes';
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isHtmlPage = window.location.pathname.split('/').includes('html');
    const rootPrefix = isHtmlPage ? '../' : '';
    const contentPrefix = isHtmlPage ? '' : 'html/';
    const currentRepoPath = (isHtmlPage ? 'html/' : '') + currentPage;
    const GITHUB_EDIT_URL = GITHUB_REPO + '/edit/main/' + currentRepoPath;

    function pageHref(file) {
      return file === 'index.html' ? rootPrefix + file : contentPrefix + file;
    }

    const GUIDE_NAV = [
      { file: 'index.html', id: 'devsecops-kubernetes-training-lab-guide', title: 'Guide Home' },
      { file: 'index.html', id: 'table-of-contents', title: 'Table of Contents' },
      { file: 'section-0-setup.html', id: 'section-0-setup-overview', title: 'Section 0: Setup' },
      { file: 'section-0-setup.html', id: '0-prerequisites-and-minikube-installation', title: '0. Prerequisites and Minikube Installation' },
      { file: 'section-1-foundations.html', id: 'section-1-foundations', title: 'Section 1: Foundations' },
      { file: 'section-1-foundations.html', id: '1-kubernetes-theory-and-architecture', title: '1. Kubernetes Theory and Architecture' },
      { file: 'section-1-foundations.html', id: '2-core-working-concepts', title: '2. Core Working Concepts' },
      { file: 'section-1-foundations.html', id: '3-the-kubectl-debugging-toolkit', title: '3. The kubectl Debugging Toolkit' },
      { file: 'section-1-foundations.html', id: '4-lab-1-deploying-your-first-pod-and-service', title: '4. Lab 1: Deploying Your First Pod and Service' },
      { file: 'section-1-foundations.html', id: '5-lab-2-rolling-updates-and-rollbacks', title: '5. Lab 2: Rolling Updates and Rollbacks' },
      { file: 'section-1-foundations.html', id: '6-lab-3-configmaps-and-secrets', title: '6. Lab 3: ConfigMaps and Secrets' },
      { file: 'section-1-foundations.html', id: '7-lab-4-persistent-volumes-and-data-survival', title: '7. Lab 4: Persistent Volumes and Data Survival' },
      { file: 'section-1-foundations.html', id: '8-lab-5-health-probes-and-autoscaling-hpa', title: '8. Lab 5: Health Probes and Autoscaling (HPA)' },
      { file: 'section-1-foundations.html', id: '9-lab-6-other-workload-types-statefulset-daemonset-job-cronjob', title: '9. Lab 6: Other Workload Types' },
      { file: 'section-2-production-operations.html', id: 'section-2-production-operations', title: 'Section 2: Production Operations' },
      { file: 'section-2-production-operations.html', id: '10-lab-7-http-routing-with-the-gateway-api', title: '10. Lab 7: HTTP Routing with the Gateway API' },
      { file: 'section-2-production-operations.html', id: '11-lab-8-packaging-with-helm', title: '11. Lab 8: Packaging with Helm' },
      { file: 'section-2-production-operations.html', id: '12-lab-9-observability-metrics-prometheus-grafana', title: '12. Lab 9: Observability' },
      { file: 'section-2-production-operations.html', id: '13-lab-10-gitops-with-argo-cd', title: '13. Lab 10: GitOps with Argo CD' },
      { file: 'section-3-devsecops-deep-dive.html', id: 'section-3-devsecops-deep-dive', title: 'Section 3: DevSecOps Deep Dive' },
      { file: 'section-3-devsecops-deep-dive.html', id: '14-devsecops-security-theory', title: '14. DevSecOps Security Theory' },
      { file: 'section-3-devsecops-deep-dive.html', id: '15-lab-11-shift-left-scanning-manifests-images-secrets', title: '15. Lab 11: Shift-Left Scanning' },
      { file: 'section-3-devsecops-deep-dive.html', id: '16-lab-12-pod-security-standards-and-admission', title: '16. Lab 12: Pod Security Standards and Admission' },
      { file: 'section-3-devsecops-deep-dive.html', id: '17-lab-13-least-privilege-rbac', title: '17. Lab 13: Least-Privilege RBAC' },
      { file: 'section-3-devsecops-deep-dive.html', id: '18-lab-14-network-microsegmentation', title: '18. Lab 14: Network Microsegmentation' },
      { file: 'section-3-devsecops-deep-dive.html', id: '19-lab-15-policy-as-code-with-kyverno', title: '19. Lab 15: Policy-as-Code with Kyverno' },
      { file: 'section-3-devsecops-deep-dive.html', id: '20-lab-16-supply-chain-security-signing-sboms-verification', title: '20. Lab 16: Supply-Chain Security' },
      { file: 'section-3-devsecops-deep-dive.html', id: '21-lab-17-runtime-security-with-falco', title: '21. Lab 17: Runtime Security with Falco' },
      { file: 'appendices.html', id: 'appendix-a-cleanup-cheatsheet', title: 'Appendix A: Cleanup Cheatsheet' },
      { file: 'appendices.html', id: 'appendix-b-common-errors-and-troubleshooting', title: 'Appendix B: Troubleshooting' },
      { file: 'appendices.html', id: 'appendix-c-what-we-did-not-cover-and-where-to-go-next', title: 'Appendix C: Where to Go Next' },
      { file: 'appendices.html', id: 'appendix-d-glossary', title: 'Appendix D: Glossary' },
    ];
    // GitHub mark SVG path, shared by the header icon and the edit link.
    const GITHUB_ICON =
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">' +
      '<path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.22.7.83.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"/></svg>';

    function sectionTitle(s) {
      const el = s.querySelector('h2, h1');
      return el ? el.textContent.trim() : s.id;
    }

    function makePagerLink(target, dir) {
      if (!target) {
        const spacer = document.createElement('span');
        spacer.className = 'pager-spacer';
        return spacer;
      }
      const a = document.createElement('a');
      a.href = '#' + target.id;
      a.className = 'pager-link pager-' + dir;
      a.innerHTML =
        '<span class="pager-dir">' + (dir === 'prev' ? '← Previous' : 'Next →') + '</span>' +
        '<span class="pager-title"></span>';
      a.querySelector('.pager-title').textContent = sectionTitle(target);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(target.id);   // showSection resets scroll to the top.
      });
      return a;
    }

    function makeCrossPageLink(navItem, dir) {
      const a = document.createElement('a');
      a.href = pageHref(navItem.file) + '#' + navItem.id;
      a.className = 'pager-link pager-' + dir;
      a.innerHTML =
        '<span class="pager-dir">' + (dir === 'prev' ? '← Previous' : 'Next →') + '</span>' +
        '<span class="pager-title"></span>';
      a.querySelector('.pager-title').textContent = navItem.title;
      return a;
    }

    function buildSectionFooters() {
      // Open-source footer on each content section: prev/next navigation plus
      // an "Edit this page on GitHub" link. GitHub's editor auto-forks the repo
      // and walks non-collaborators through opening a pull request.
      // Every section is part of the prev/next chain (including the Table of
      // Contents) so navigation matches the sidebar order exactly.
      const SKIP = new Set(['welcome']);
      const content = sections.filter(s => !SKIP.has(s.id));

      // Find cross-page neighbours from GUIDE_NAV for the first and last sections.
      const navIndices = GUIDE_NAV.reduce((acc, item, idx) => {
        if (item.file === currentPage) acc.push(idx);
        return acc;
      }, []);
      const crossPrev = navIndices.length > 0 && navIndices[0] > 0
        ? GUIDE_NAV[navIndices[0] - 1] : null;
      const crossNext = navIndices.length > 0 && navIndices[navIndices.length - 1] < GUIDE_NAV.length - 1
        ? GUIDE_NAV[navIndices[navIndices.length - 1] + 1] : null;

      content.forEach((section, i) => {
        const footer = document.createElement('footer');
        footer.className = 'section-footer';

        const pager = document.createElement('nav');
        pager.className = 'section-pager';
        pager.setAttribute('aria-label', 'Section navigation');

        const prevNode = content[i - 1]
          ? makePagerLink(content[i - 1], 'prev')
          : (i === 0 && crossPrev ? makeCrossPageLink(crossPrev, 'prev') : makePagerLink(null, 'prev'));
        const nextNode = content[i + 1]
          ? makePagerLink(content[i + 1], 'next')
          : (i === content.length - 1 && crossNext ? makeCrossPageLink(crossNext, 'next') : makePagerLink(null, 'next'));

        pager.appendChild(prevNode);
        pager.appendChild(nextNode);

        const edit = document.createElement('a');
        edit.className = 'edit-on-github';
        edit.href = GITHUB_EDIT_URL;
        edit.target = '_blank';
        edit.rel = 'noopener noreferrer';
        edit.innerHTML = GITHUB_ICON + '<span>Edit this page on GitHub</span>';

        footer.appendChild(pager);
        footer.appendChild(edit);
        section.appendChild(footer);
      });
    }

    function getAnchorSection(hash) {
      const id = hash.replace(/^#/, '');
      if (!id) return null;
      const target = document.getElementById(id);
      if (!target) return null;
      return sections.find(section => section.contains(target)) || null;
    }

    function initAnchorNavigation() {
      const root = document.getElementById('md-root');
      if (!root) return;
      const handleAnchorClick = (event) => {
        const anchor = event.target.closest('a[href^="#"]');
        if (!anchor) return;
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        const section = getAnchorSection(href);
        if (!section) return;
        event.preventDefault();
        showSection(section.id);
        const targetId = href.slice(1);
        const target = document.getElementById(targetId);
        if (target) {
          // Instant jump: this click switched sections, so a smooth scroll
          // would animate the whole page height (jarring).
          setTimeout(() => jumpToElement(target), 0);
        }
      };
      root.addEventListener('click', handleAnchorClick);
    }

    function showSection(id) {
      sections.forEach(section => section.classList.toggle('active', section.id === id));
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + id));
      const section = sections.find(section => section.id === id);
      history.replaceState(null, '', '#' + id);
      // A section switch replaces the whole view, so start at the top.
      // The CSS sets html { scroll-behavior: smooth }, which would otherwise
      // animate the full-page scroll (jarring). Temporarily force instant.
      jumpToTop();
      syncTopicMapDock(section);
      updateTopicMapActive();
    }

    // Run a scroll instantly, overriding the global CSS smooth-scroll
    // (html { scroll-behavior: smooth }), then restore it next frame so other
    // in-page anchor scrolls stay smooth.
    function scrollInstant(doScroll) {
      const root = document.documentElement;
      const prev = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      doScroll();
      requestAnimationFrame(() => { root.style.scrollBehavior = prev; });
    }

    function jumpToTop() {
      scrollInstant(() => window.scrollTo(0, 0));
    }

    function jumpToElement(el) {
      scrollInstant(() => el.scrollIntoView({ block: 'start' }));
    }

    function enhanceCodeBlocks(container) {
      // First pass: split a multi-command bash box into one box per command
      // group, so each command gets its own terminal. The i/ii/iii badges are
      // authored by hand in the HTML as <div class="cmd-step">, not added here.
      container.querySelectorAll('pre').forEach(pre => {
        if (!pre.closest('.code-block')) splitBashIntoBoxes(pre);
      });
      container.querySelectorAll('pre').forEach(pre => {
        if (pre.closest('.code-block')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block';
        const header = document.createElement('div');
        header.className = 'code-block-header';
        const label = document.createElement('span');
        label.className = 'code-block-label';
        const code = pre.querySelector('code');
        const langClass = code ? Array.from(code.classList).find(c => c.startsWith('language-')) : null;
        label.textContent = langClass ? langClass.replace('language-', '') : 'code';
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.setAttribute('aria-label', 'Copy');
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
        header.appendChild(label);
        header.appendChild(copyBtn);
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);
      });
    }

    // Split a multi-command bash <pre> into one sibling <pre> per blank-line-
    // delimited command group. Each becomes its own terminal box.
    //
    // Authors rely on the '#' merge below: a trailing comment group placed after
    // a blank line is folded back into the command box above it, which is how a
    // command and its "# Output:" lines render as ONE box. The corollary is that
    // a LEADING comment group has nothing above it to merge into, so it becomes
    // its own orphan comment box. Keep explanatory comments at the END of a box.
    function splitBashIntoBoxes(pre) {
      const code = pre.querySelector('code');
      if (!code || !code.classList.contains('language-bash')) return;
      // Only split plain-text code (don't clobber any highlight spans).
      if (Array.from(code.childNodes).some(n => n.nodeType === Node.ELEMENT_NODE)) return;
      const raw = code.textContent.replace(/\s+$/, '');
      const rawGroups = raw
        .split(/\n[ \t]*\n/)
        .map(s => s.replace(/^\n+|\n+$/g, ''))
        .filter(s => s.trim().length);
      // Keep each command together with its output: a group that is pure output
      // or comments (starts with '#') is merged back into the command group
      // above it, so a command and its '# output' render as ONE box, not two.
      const groups = [];
      rawGroups.forEach(g => {
        if (groups.length && /^\s*#/.test(g)) {
          groups[groups.length - 1] += '\n\n' + g;
        } else {
          groups.push(g);
        }
      });
      if (groups.length < 2) return;     // single command (incl. its output) — one box
      const frag = document.createDocumentFragment();
      groups.forEach(text => {
        const p = document.createElement('pre');
        p.className = pre.className;      // keep "codehilite" so the badge pass sees it
        if ('noRoman' in pre.dataset) p.dataset.noRoman = '';  // propagate data-no-roman
        const c = document.createElement('code');
        c.className = code.className;     // keep "language-bash"
        c.textContent = text;
        p.appendChild(c);
        frag.appendChild(p);
      });
      pre.parentNode.insertBefore(frag, pre);
      pre.remove();
    }

    function enhanceCallouts(container) {
      // All blockquotes become uniform .callout boxes (green border, green title).
      // Extra classes on the blockquote (e.g. gradient-border, gc-*) are forwarded.
      // A leading <strong> becomes the .callout-title span; mid-sentence <strong>
      // elements are left as body emphasis.
      container.querySelectorAll('blockquote').forEach(bq => {
        const callout = document.createElement('div');
        callout.className = 'callout';
        bq.classList.forEach(c => callout.classList.add(c));

        let first = bq.firstChild;
        while (first && first.nodeType === Node.TEXT_NODE && !first.textContent.trim()) {
          first = first.nextSibling;
        }
        let strong = null;
        if (first?.nodeType === Node.ELEMENT_NODE) {
          if (first.tagName === 'STRONG') strong = first;
          else if (first.tagName === 'P' && first.firstChild?.tagName === 'STRONG') {
            strong = first.firstChild;
          }
        }
        if (strong) {
          const title = document.createElement('span');
          title.className = 'callout-title';
          title.textContent = strong.textContent;
          callout.appendChild(title);
          strong.remove();
        }
        while (bq.firstChild) callout.appendChild(bq.firstChild);
        bq.parentNode.replaceChild(callout, bq);
      });
    }

    function initSubsectionTabs() {
      // Remove any hand-authored in-content topic maps; we build the rail
      // automatically from each section's own h3 headings.
      document.querySelectorAll('.section-topic-map').forEach(tm => tm.remove());

      // One shared floating TOC container on the right rail.
      let tocContainer = document.querySelector('.floating-toc');
      if (!tocContainer) {
        tocContainer = document.createElement('div');
        tocContainer.className = 'floating-toc';
        const contentInner = document.querySelector('.content-inner');
        (contentInner || document.body).appendChild(tocContainer);
      }

      const tocTitleHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg> On this page`;

      // Build a per-section descriptor: its h3 headings become the TOC entries.
      const perSection = sections.map(section => {
        const h3s = Array.from(section.querySelectorAll('h3')).filter(h => h.id);
        return { section, h3s };
      }).filter(d => d.h3s.length > 0);

      function renderToc(desc) {
        const tocTitle = document.createElement('div');
        tocTitle.className = 'floating-toc-title';
        tocTitle.innerHTML = tocTitleHTML;

        const tocList = document.createElement('ul');
        tocList.className = 'floating-toc-list';

        const subLinks = [];
        desc.h3s.forEach(h3 => {
          // Strip a leading "N.N " or "Section X:" number prefix for a clean label.
          const label = h3.textContent.replace(/^\s*(\d+(\.\d+)*|Section\s+[A-Z]|Step\s+\d+)[:.\s-]+/i, '').trim() || h3.textContent.trim();
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = '#' + h3.id;
          a.className = 'floating-toc-link';
          a.textContent = label;
          a.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(h3.id);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
          li.appendChild(a);
          tocList.appendChild(li);
          subLinks.push(a);
        });

        tocContainer.innerHTML = '';
        tocContainer.appendChild(tocTitle);
        tocContainer.appendChild(tocList);

        // ScrollSpy for the active subsection.
        let activeIndex = 0;
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const index = desc.h3s.findIndex(h => h.id === entry.target.id);
              if (index !== -1) {
                activeIndex = index;
                subLinks.forEach((a, i) => a.classList.toggle('active', i === activeIndex));
              }
            }
          });
        }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
        desc.h3s.forEach(h3 => observer.observe(h3));
        return observer;
      }

      // Re-render the rail whenever the active section changes.
      function showForActiveSection() {
        const activeDesc = perSection.find(d => d.section.classList.contains('active'));
        if (activeDesc) {
          renderToc(activeDesc);
          tocContainer.classList.add('visible');
        } else {
          tocContainer.classList.remove('visible');
          tocContainer.innerHTML = '';
        }
      }

      const prevSyncDock = syncTopicMapDock;
      syncTopicMapDock = (activeSection) => {
        prevSyncDock(activeSection);
        showForActiveSection();
      };

      showForActiveSection();
    }

    applyTheme(getInitialTheme());
    setupMobileSidebar();
    initKeyboardShortcuts();
    initThemeToggle();
    initClipboardCopy();
    buildSections();
    buildNav();
    buildSectionFooters();
    enhanceCodeBlocks(document);
    enhanceCallouts(document);
    initSubsectionTabs();
    initSearch(navLinks);
    initAnchorNavigation();
    if (location.hash) {
      const target = location.hash.slice(1);
      let section = sections.find(section => section.id === target);
      if (!section) {
        const anchorSection = getAnchorSection(location.hash);
        if (anchorSection) section = anchorSection;
      }
      if (section) {
        showSection(section.id);
        const anchorTarget = document.getElementById(target);
        if (anchorTarget) {
          // Instant on initial load — no point animating a full-page scroll.
          setTimeout(() => jumpToElement(anchorTarget), 0);
        }
      }
    }
  })();
