window.addEventListener('load', function () {
  const toRoman = n => ['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv','xvi','xvii','xviii','xix','xx'][n-1] || n;

  const STYLED_IDS = [
    '0-prerequisites-and-minikube-installation',
    '1-kubernetes-theory-and-architecture',
    '2-core-working-concepts',
    '3-the-kubectl-debugging-toolkit',
    '4-lab-1-deploying-your-first-pod-and-service',
    '5-lab-2-rolling-updates-and-rollbacks',
    '6-lab-3-configmaps-and-secrets',
    '7-lab-4-persistent-volumes-and-data-survival',
    '8-lab-5-health-probes-and-autoscaling-hpa',
    '9-lab-6-other-workload-types-statefulset-daemonset-job-cronjob',
    '10-lab-7-http-routing-with-the-gateway-api',
    '11-lab-8-packaging-with-helm',
    '12-lab-9-observability-metrics-prometheus-grafana',
    '13-lab-10-gitops-with-argo-cd',
    '14-devsecops-security-theory',
    '15-lab-11-shift-left-scanning-manifests-images-secrets',
    '16-lab-12-pod-security-standards-and-admission',
    '17-lab-13-least-privilege-rbac',
    '18-lab-14-network-microsegmentation',
    '19-lab-15-policy-as-code-with-kyverno',
    '20-lab-16-supply-chain-security-signing-sboms-verification',
    '21-lab-17-runtime-security-with-falco',
  ];

  function bashPre(el) {
    const pre = el.matches('pre.codehilite') ? el : el.querySelector(':scope > pre.codehilite');
    if (!pre) return null;
    if ('noRoman' in pre.dataset || 'noRoman' in el.dataset) return null;
    const code = pre.querySelector('code');
    if (!code || !code.classList.contains('language-bash')) return null;
    return pre;
  }

  function extractLeadingComments(codeElem) {
    const body = (codeElem ? codeElem.textContent : '').replace(/^\n+/, '');
    if (!body.trim()) return null;
    const lines = body.split('\n');
    let i = 0;
    const leading = [];
    while (i < lines.length && lines[i].trim().startsWith('#')) {
      leading.push(lines[i].replace(/^#+\s*/, '').trim());
      i++;
    }
    if (!leading.length) return null;
    // strip them from the code element
    codeElem.textContent = lines.slice(i).join('\n').replace(/^\n+/, '');
    return leading.join(' ').replace(/^(?:step\s+)?\d{1,2}\s*[:.)\-]\s+/i, '');
  }

  function processSection(section) {
    section.classList.add('styled-section');
    const groups = []; // { items: [], bashCount, isH4 }
    let current = null;
    Array.from(section.children).forEach(el => {
      if (el.matches('h3') || el.matches('h4')) {
        current = { items: [], bashCount: 0, isH4: el.matches('h4') };
        groups.push(current);
        return;
      }
      if (!current) return;
      current.items.push(el);
      if (bashPre(el)) current.bashCount++;
    });

    groups.forEach(group => {
      let counter = 0;
      group.items.forEach(el => {
        if (group.isH4) el.classList.add('sec2-indented');
        if (group.bashCount < 2) return;
        const pre = bashPre(el);
        if (!pre) return;
        const code = pre.querySelector('code');
        const bodyLines = code ? code.textContent.replace(/^\n+/, '').split('\n') : [];
        if (!bodyLines.some(l => l.trim() && !l.trim().startsWith('#'))) return;
        counter++;

        // create label + roman
        const label = document.createElement('div');
        label.className = 'cmd-label';
        const badge = document.createElement('span');
        badge.className = 'cmd-roman';
        badge.textContent = toRoman(counter);
        label.appendChild(badge);

        // extract leading comments into a title if present
        const titleText = extractLeadingComments(code) || pre.dataset.title || null;
        const wrapper = document.createElement('div');
        wrapper.className = 'cmd-step';

        if (titleText) {
          const titleEl = document.createElement('div');
          titleEl.className = 'cmd-title';
          titleEl.textContent = titleText.charAt(0).toUpperCase() + titleText.slice(1);
          wrapper.appendChild(label);
          wrapper.appendChild(titleEl);
          wrapper.appendChild(pre);
          el.parentNode.insertBefore(wrapper, el);
          wrapper.appendChild(el);
        } else {
          // place label to the left of the existing element
          el.parentNode.insertBefore(wrapper, el);
          wrapper.appendChild(label);
          wrapper.appendChild(el);
        }
      });
    });
  }

  STYLED_IDS.forEach(id => {
    const section = document.getElementById(id);
    if (section && section.classList.contains('page-section')) processSection(section);
  });
});