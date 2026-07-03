# Orbital View

A beautifully rendered 3D scene of Earth and its lunar companion, built with React and Three.js.

## Features

- **Interactive 3D Model**: Renders a `.glb` model of the Earth and Moon using `@react-three/fiber` and `@react-three/drei`.
- **Dynamic Controls**: Includes a Leva control panel to adjust the scale and position (X, Y, Z) of the 3D model in real-time.
- **Responsive Design**: Automatically adjusts the starting scale and UI layout for both desktop and mobile viewports.
- **Atmospheric Lighting**: Utilizes custom ambient and directional lighting along with a city environment preset to enhance the realism of the scene.
- **Orbit Controls**: Allows the user to rotate the view horizontally while locking the vertical plane to maintain a cinematic perspective.
- **Scroll-Based Rotation**: Dynamically links the rotation of the Earth model to the user's scroll position for an immersive, interactive experience.

## Tech Stack

- [React](https://react.dev/)
- [Three.js](https://threejs.org/)
- [React Three Fiber](https://r3f.docs.pmnd.rs/getting-started/introduction)
- [React Three Drei](https://github.com/pmndrs/drei)
- [Leva](https://github.com/pmndrs/leva)
- [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

1. Ensure all dependencies are installed using `npm install`.
2. Place the `earth_with_moon12.glb` model in the `public` directory.
3. Start the development server with `npm run dev`.
