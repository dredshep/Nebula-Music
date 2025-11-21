
<div align="center">
  <br />
  <img src="./logo.svg" alt="Nebula Stream Logo" width="120" height="120" />
  <h1>Nebula Stream</h1>
  <p>A high-fidelity, glassmorphic music client for the modern web.</p>
</div>

Nebula Stream is a modern web music client designed for Subsonic-compatible servers (Navidrome, Gonic, Airsonic, etc.). Built with performance, aesthetics, and user experience in mind, it mimics the feel of native desktop applications while fully supporting mobile devices.

## 🚀 Features

*   **Modern UI/UX**: Glassmorphism design, smooth transitions, and animated backgrounds.
*   **Mobile-First Experience**: 
    *   Dedicated bottom navigation bar for mobile devices.
    *   Touch-optimized library tabs and controls.
    *   Responsive layouts optimized for Phones, Tablets (Portrait/Landscape), and Desktops.
*   **Smart Search**: 
    *   Spotlight-style command palette (`Cmd+K`) for instant access.
    *   Semantic search across Artists, Albums, and Songs.
    *   Real-time results as you type.
*   **Audio Engine**: 
    *   Pitch control (Vinyl Mode).
    *   Playback speed adjustment.
    *   Integrated Volume control.
    *   **High-Performance Visualizers**: Robust, high-DPI capable rendering engine supporting multiple modes (Bars, Wave, Circle, Mirror, Spectrum, Particles, Hexagon).
*   **Enhanced Player**:
    *   Synchronized Lyrics view.
    *   Immersive "Zen Mode" visualizer.
    *   Queue management.
*   **Library Management**:
    *   Browse by Artists, Albums, Songs.
    *   Manage Playlists (Create, Delete, Reorder via Drag & Drop).
    *   Favorites/Starring system.
*   **Discovery**:
    *   Rotating Featured Hero section.
    *   Random suggested mixes (Flow State, Nostalgia Trip, Daily Mix).
    *   Most Played tracking (Local).
    *   Recent & Frequent album views.
*   **Subsonic Integration**: Full support for standard Subsonic API authentication.
*   **Offline Ready**: Intelligent caching of API responses and images via IndexedDB.

## 🛠 Tech Stack

*   **Framework**: React 18
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **Visualization**: Web Audio API + HTML5 Canvas
*   **Storage**: IndexedDB (via custom wrapper)

## 📦 Deployment (Vercel)

1.  **Fork/Clone** this repository.
2.  **Import** the project into Vercel.
3.  **Build Settings**:
    *   Framework Preset: `Vite`
    *   Build Command: `npm run build`
    *   Output Directory: `dist`
4.  **Deploy**!

## 🔧 Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
3.  Open `http://localhost:3000` in your browser.

## 📝 License

MIT
