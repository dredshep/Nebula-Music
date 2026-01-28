<div align="center">
  <br />
  <img src="./logo.svg" alt="Nebula Music Logo" width="120" height="120" />
  <h1>Nebula Music</h1>
  <p>A high-fidelity, glassmorphic music client for the modern web.</p>
</div>

Nebula Music is a modern web music client designed for Subsonic-compatible servers (Navidrome, Gonic, Airsonic, etc.). Built with performance, aesthetics, and user experience in mind, it mimics the feel of native desktop applications while fully supporting mobile devices.

## Features

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

## Changelog

### v1.3
- **Audio Engine**: Fixed playback issues for M4A and ALAC files by implementing smarter transcoding rules and content-length estimation.
- **UI/UX**:
  - Implemented dynamic viewport sizing (`dvh`) to prevent layout shifting on mobile browsers.
  - Fixed Hero section resetting animation/index when player state changes.
  - Added parallax scrolling effects to Artist Detail views.
  - Refined Mini Player and Expanded Player layouts for better responsiveness on small screens.
- **Persistence**: Library filters (Sort, Genre, Year) are now remembered across sessions.

## Tech Stack

*   **Framework**: React 18
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **Visualization**: Web Audio API + HTML5 Canvas
*   **Storage**: IndexedDB (via custom wrapper)

## Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
3.  Open `http://localhost:3000` in your browser.

## License

MIT