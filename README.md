# 3D Tent Configurator

A responsive 3D tent product configurator built with:

- React
- TypeScript
- Vite
- Three.js
- React Three Fiber
- Zustand
- Node.js
- Express
- React PDF

## Features

### 3D

- GLB tent models
- 5x5
- 6.5x6.5
- 8x8
- Orbit controls
- Zoom
- Responsive viewer
- Dynamic frame color
- Dynamic panel textures

### 2D Editor

- Front panel
- Back panel
- Left panel
- Right panel
- Roof panel
- Add text
- Upload logo
- Drag elements
- Scale
- Rotation
- Position
- Text color
- Font family
- Font size
- Opacity
- Duplicate
- Delete
- Clear panel

### Pricing

Pricing is calculated by the backend API.

Base:

- $699

Variants:

- 5x5: $699
- 6.5x6.5: $799
- 8x8: $899

Customization:

- Text: $25
- Image: $50

### PDF

The application generates a configuration PDF containing:

- Configuration ID
- Product
- Size
- Panel colors
- Custom elements
- Price breakdown
- 2D preview

### Shopify

The project contains a mock Shopify cart API.

The payload is structured so that it can be connected to the Shopify Storefront API by providing:

- Store domain
- Storefront API token
- Product variant IDs

## Project Structure

```text
THREE.JS ASSESSMENT
│
├── backend
│   ├── src
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
└── frontend
    ├── public
    │   └── models
    │       └── glb
    │
    └── src
        ├── components
        ├── pdf
        ├── services
        ├── store
        ├── types
        ├── App.tsx
        ├── configurator.css
        ├── index.css
        └── main.tsx