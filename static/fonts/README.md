# Not currently used

The app switched from a self-hosted "Jorick" font to **Fredoka** (loaded
from Google Fonts in `src/app.html`) since Jorick isn't distributed on
Google Fonts and no font file was provided. This folder is here in case
you want to self-host a real Jorick file later — just drop it in as
`Jorick-Regular.woff2` (or `.woff` / `.ttf` / `.otf`) and add back an
`@font-face` rule in `src/app.css` pointing at `/fonts/Jorick-Regular.*`.
