# 3D Tent Configurator

A web-based 3D tent configurator built with React, TypeScript, Three.js and React Three Fiber.

The application allows users to select a tent size, customize colors, edit individual tent panels in 2D, add text and logos, transform design elements, preview the result in 3D, calculate dynamic pricing, generate a configuration PDF and send the configuration to a mock Shopify cart endpoint.

---

## Features

### Product Configuration

- 5x5 tent configuration
- 8x8 tent configuration
- Dynamic 3D model switching
- Canopy color customization
- Frame color customization

### 2D Panel Editor

Supports independent editing for:

- Front panel
- Back panel
- Left panel
- Right panel
- Roof panel

Design elements:

- Add text
- Upload logo/image
- Move elements
- Scale elements
- Rotate elements
- Remove elements
- Reset panel configuration

Each panel maintains its own design state.

### 3D Preview

- Real-time 3D tent preview
- Interactive orbit controls
- Zoom support
- Color synchronization
- 2D design synchronization with the 3D model
- Logo and text visualization on configured panels

### Pricing

Pricing is calculated by the backend.

Current pricing:

| Tent Size | Base Price | Variant Price |
|-----------|------------|---------------|
| 5x5       | $699       | $0            |
| 8x8       | $899       | $100          |

Customization pricing:

- $25 per configured design element

The final price is calculated as:

`Base Price + Variant Price + Customization Price`

### PDF Export

Users can download a PDF containing the current configuration and pricing information.

### Cart Integration

The application sends the complete configuration and calculated price to a mock Shopify cart API.

The current implementation intentionally uses a mock cart endpoint for demonstration/assessment purposes.

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Three.js
- React Three Fiber
- React Three Drei
- Zustand
- Axios
- Lucide React
- @react-pdf/renderer

### Backend

- Node.js
- Express
- TypeScript
- CORS

---

## Project Structure

```text
Three.js Assesment/
│
├── backend/
│   ├── src/
│   │   └── server.ts
│   ├── dist/
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   │   └── models/
│   │       └── glb/
│   │           ├── Tent_5_5.glb
│   │           └── Tent_8_8.glb
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── Controls.tsx
│   │   │   ├── Editor2D.tsx
│   │   │   └── ModelViewer.tsx
│   │   │
│   │   ├── pdf/
│   │   │   └── ConfigurationPDF.tsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── textureService.ts
│   │   │
│   │   ├── store/
│   │   │   └── configuratorStore.ts
│   │   │
│   │   ├── types/
│   │   │   └── configurator.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── configurator.css
│   │   └── index.css
│   │
│   └── package.json
│
└── README.md