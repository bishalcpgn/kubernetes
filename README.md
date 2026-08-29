# DevSecOps Kubernetes Training Lab Guide

A free, hands-on Kubernetes training guide with a **DevSecOps** focus,
taking you from a fresh laptop with Minikube all the way to securing production-grade
clusters.

🔗 **Live site:** https://bishalcpgn.github.io/kubernetes/

No build step, no framework: just static HTML, CSS, and a little JavaScript. Every lab
runs on a laptop with Minikube and maps to a real production practice.

## What is inside

The guide is split into a setup page, three main tiers, and a set of appendices:

- **Section 0: Setup.** Install kubectl and Minikube, and learn how kubeconfig and
  contexts work.
- **Section 1: Foundations.** Kubernetes architecture, the core objects, the `kubectl`
  debugging toolkit, and Labs 1 to 6 (from Pods and Services to StatefulSets, DaemonSets,
  Jobs, and CronJobs).
- **Section 2: Production Operations.** Labs 7 to 10: the Gateway API, Helm packaging,
  observability with Prometheus and Grafana, and GitOps with Argo CD.
- **Section 3: DevSecOps Deep Dive.** Labs 11 to 17: image and manifest scanning with
  Trivy, Pod Security Standards, least-privilege RBAC, NetworkPolicies, policy-as-code
  with Kyverno, supply-chain signing with Cosign, and runtime detection with Falco.
- **Appendices.** Cleanup cheat sheet, common errors and troubleshooting, where to go
  next, and a glossary.

That is 22 chapters across the three main tiers, with 17 runnable labs.

## Project structure

```
index.html              Landing page and full table of contents (links into html/).
html/
  section-0-setup.html                    Setup and prerequisites.
  section-1-foundations.html              Foundations + Labs 1-6.
  section-2-production-operations.html    Production tooling + Labs 7-10.
  section-3-devsecops-deep-dive.html      Security + Labs 11-17.
  appendices.html                         Cleanup, troubleshooting, glossary.
css/
  style.css       Base theme, typography, callouts, tables, code blocks.
  app.css         Section reading layout, SVG figures, command steps, headings.
  themes.css      Light/dark palette tokens (toggled via the data-theme attribute).
js/
  app.js          Builds the sidebar and the "On this page" rail, the prev/next nav,
                  and enhances code blocks and callouts.
SECTION-STYLE-RULES.txt   Formatting conventions that keep every page consistent.
```

Each content page is self-contained: open it directly or reach it from the table of
contents in `index.html`. A sidebar, a right-hand "On this page" rail, and prev/next
cards are added by `js/app.js`, and a light/dark toggle switches the theme.


## Contributing

Fixes of any size are welcome: a typo, a corrected command, a version bump, or a whole
new lab. The fastest path for a small change is to click **"Edit this page on GitHub"**
at the bottom of any section on the live site; GitHub will fork the repo and open a pull
request for you.

To keep the pages consistent, follow the conventions in
**[SECTION-STYLE-RULES.txt](SECTION-STYLE-RULES.txt)**. The easiest way to match the
house style is to copy the pattern of a similar existing section.

## License

Released under the **Creative Commons Attribution 4.0 International** license
(see [LICENSE](LICENSE)). Copyright (c) 2026 Bishal Chapagain