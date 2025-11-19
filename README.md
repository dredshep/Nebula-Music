
# Nebula Stream

Nebula Stream is a modern, high-fidelity web music client designed for Subsonic-compatible servers (Navidrome, Gonic, Airsonic, etc.). Built with performance, aesthetics, and user experience in mind, it mimics the feel of native desktop applications.

## 🚀 Features

*   **Modern UI/UX**: Glassmorphism design, smooth transitions, and animated backgrounds.
*   **Offline Ready**: Intelligent caching of API responses and images via IndexedDB.
*   **Audio Engine**: 
    *   Pitch control (Vinyl Mode).
    *   Playback speed adjustment.
    *   Real-time audio visualizers (Bars, Wave, Circle, Mirror).
*   **Library Management**:
    *   Browse by Artists, Albums, Songs.
    *   Manage Playlists (Create, Delete, Reorder via Drag & Drop).
    *   Favorites/Starring system.
*   **Discovery**:
    *   Random suggested mixes.
    *   Most Played tracking (Local).
    *   Recent & Frequent album views.
*   **Subsonic Integration**: Full support for standard Subsonic API authentication.

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
