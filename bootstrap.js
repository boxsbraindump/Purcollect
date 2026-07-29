const isGitHubPages = window.location.hostname.endsWith("github.io") && window.location.pathname.startsWith("/Purcollect");

if (isGitHubPages) {
  const buildVersion = "70554a9";
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = `./assets/app.css?v=${buildVersion}`;
  document.head.appendChild(stylesheet);
  import(/* @vite-ignore */ `./assets/app.js?v=${buildVersion}`);
} else {
  import(/* @vite-ignore */ "/src/main.jsx");
}
