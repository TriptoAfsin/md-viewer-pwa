<p align="center">
  <img src="public/favicon.svg" width="80" height="80" alt="MD View logo" />
</p>

<h1 align="center">MD View</h1>

<p align="center">
  A sleek, lightweight Progressive Web App for viewing Markdown files on any device.
  <br />
  Open local <code>.md</code> files with the system file picker, read them beautifully formatted with syntax-highlighted code blocks, and export to PDF or plain text — all offline, all private.
</p>

<p align="center">
  <a href="https://github.com/TriptoAfsin/md-viewer-pwa">GitHub</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#getting-started">Getting Started</a> &middot;
  <a href="#contributing">Contributing</a> &middot;
  <a href="#license">License</a>
</p>

---

## Features

- **System file picker** — open any `.md` file from your device
- **Drag & drop** — drop files directly onto the page
- **Paste markdown** — paste raw markdown text to preview instantly
- **Beautiful rendering** — clean, typographic Markdown display with GFM support
- **Code syntax highlighting** — VS Code-quality highlighting powered by Shiki with 10 selectable themes
- **Light & dark mode** — respects system preference with manual toggle
- **Export to PDF** — text-based, selectable PDF output via jsPDF
- **Export to plain text** — stripped markdown formatting
- **Right-click context menu** — copy, export, and open files from the context menu
- **Recent files** — quickly see your previously opened files
- **Mobile-first** — optimized for phones and tablets, works great on desktop too
- **Offline-ready** — full PWA with service worker, install it and use it anywhere
- **Privacy-first** — files never leave your device, zero server processing

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 8](https://vite.dev/) with React Compiler
- [Tailwind CSS 4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) components
- [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm)
- [Shiki](https://shiki.style/) syntax highlighter
- [jsPDF](https://github.com/parallax/jsPDF) for PDF export
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) for offline support

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE)
