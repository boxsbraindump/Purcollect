const isGitHubPages = window.location.hostname.endsWith("github.io") && window.location.pathname.startsWith("/Purcollect");

if (isGitHubPages) {
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "./assets/app.css";
  document.head.appendChild(stylesheet);
  import(/* @vite-ignore */ "./assets/app.js");
} else {
  import(/* @vite-ignore */ "/src/main.jsx");
}
