# Compound Microscope Simulator

An interactive compound brightfield microscope workstation built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. It simulates specimen observation across `40×` to `1000×` magnification, coarse/fine focus depth-of-field blur, illumination and iris diaphragm controls, mechanical X/Y stage movement, `100×` oil immersion requirements, ocular reticle/micrometer calibration, and an animated hardware schematic.

---

## What Has Been Built

* **Full-Viewport Workstation Layout:** Locked to the viewport (`h-screen w-screen overflow-hidden`) with a top action bar (`Auto-Focus` and `Reset`), a **Prepared Slide Tray**, an **Interactive Hardware** schematic, precision optical controls, a circular eyepiece canvas, and four live optical telemetry cards (`Total Mag`, `Num. Aperture`, `FOV Diameter`, `Depth of Field`).
* **Modular Specimen Registry:** Each specimen slide lives in its own file under `src/slides/` and implements `SlideDefinition`, allowing new slides to be added without changing the viewport or control panel logic.
* **Real-Time Optical Canvas Engine:** Renders specimens onto a high-DPI `<canvas>` using `requestAnimationFrame`, computing focus error blur, illumination brightness/warmth, iris contrast, oil-immersion haze at `100×`, optional anatomical labels, an ocular pointer needle, and a calibrated micrometer scale.
* **Multi-Modal Stage & Focus Controls:** Supports dragging inside the eyepiece to pan, adjusting **Stage X / Stage Y** sliders, using **Arrow / WASD** keys to move the slide, scrolling the mouse wheel for fine focus, and clicking parts on the microscope diagram.
* **60fps Animated Hardware Schematic:** Uses `requestAnimationFrame` with damped `lerp` interpolation so the nosepiece turret, objective barrel height/color band, focus knob, dimmer knob, stage Z height, glass slide X shift, X/Y vernier knob, iris aperture bar, and lamp beam animate smoothly as settings change.

---

## Project Structure & Where to Edit

| File / Folder | Responsibility | When to Edit |
| :--- | :--- | :--- |
| `src/types/microscope.ts` | Core TypeScript types (`ObjectivePower`, `SlideCategory`, `MicroscopePartId`, `OpticsState`, `SpecimenLabel`, `SlideDefinition`). | Adding new optical parameters, hardware part IDs, slide categories, or fields on a slide. |
| `src/slides/*.ts` | Individual specimen definitions and custom 2D canvas drawing routines (`onionRootTip.ts`, `humanBloodSmear.ts`, `pondWaterLive.ts`, `leafEpidermis.ts`). | Adding a new prepared slide, changing specimen artwork/animation, adjusting `focalPlane`, or updating anatomical labels. |
| `src/slides/index.ts` | Central `SLIDE_REGISTRY` array and helper lookups (`getSlideById`, `filterSlides`). | Registering or removing a slide file so it appears in the Prepared Slide Tray. |
| `src/App.tsx` | Top-level state (`selectedSlideId`, `optics`, `selectedPart`), keyboard shortcuts, slide switching/reset/auto-focus actions, and 12-column page layout. | Changing initial optics state, adding keyboard shortcuts, modifying top-bar buttons, or adjusting layout proportions. |
| `src/components/MicroscopeDiagram.tsx` | Interactive SVG microscope schematic with `requestAnimationFrame` + `lerp` mechanical animations and click handlers. | Changing how hardware parts look or animate when settings/clicks change, or making new SVG parts clickable. |
| `src/components/ControlPanel.tsx` | Precision controls for **Revolving Nosepiece**, **Focus Adjustment (Z-Axis)**, **Illuminator & Iris Diaphragm**, and **Mechanical Stage Vernier (X / Y)**. | Adding/removing sliders or toggles, changing slider ranges/steps, or customizing vernier/focus readouts. |
| `src/components/MicroscopeViewport.tsx` | Circular eyepiece `<canvas>` renderer, pointer drag/wheel handlers, reticle/micrometer overlay, labels, and bottom telemetry strip. | Changing optical blur/brightness/contrast math, reticle/label rendering, pointer/wheel behavior, or telemetry specs. |
| `src/index.css` & `src/main.tsx` | Tailwind CSS v4 entry (`@import "tailwindcss";`), base reset rules, and React root mount. | Fixing global CSS resets, viewport overflow rules, or root styling conflicts. |

---

## Key Functions, Components & Actions

### `src/App.tsx`
* **`App()`**: Root workstation component holding `selectedSlideId`, `optics` (`OpticsState`), and `selectedPart` (`MicroscopePartId | null`).
* **`handleSelectSlide(slideId)`**: Switches the active slide, sets `coarseFocus` to `nextSlide.focalPlane`, and resets `fineFocus` and `pan` (`{ x: 0, y: 0 }`).
* **`handlePanChange(pan)`**: Callback passed to `MicroscopeViewport` to update `optics.pan` when dragging the specimen.
* **`handleFineFocusDelta(delta)`**: Adjusts `optics.fineFocus` clamped between `-50` and `+50` (used by mouse wheel scrolling).
* **`handleAutoFocus()`**: Snaps `coarseFocus` to `activeSlide.focalPlane` and resets `fineFocus` to `0`.
* **`handleReset()`**: Restores `INITIAL_OPTICS` (keeping `coarseFocus` aligned to the active slide's `focalPlane`) and clears `selectedPart`.
* **`handleCycleObjective()`**: Cycles `optics.objective` through `4 -> 10 -> 40 -> 100 -> 4` when the nosepiece or objectives are clicked on the schematic.
* **`handleToggleLamp()`**: Flips `optics.lampOn` (`true` / `false`) when clicking the lamp on the schematic.
* **`useEffect` (Keyboard Stage Listener)**: Listens for `ArrowUp/Down/Left/Right` and `W/A/S/D` (ignoring form inputs) and moves `optics.pan` by a magnification-scaled step clamped to `[-220, 220]`.

### `src/components/MicroscopeDiagram.tsx`
* **`lerp(current, target, factor)`**: Linear interpolation helper used inside the `requestAnimationFrame` loop to smoothly ease mechanical values toward their target state.
* **`MicroscopeDiagram(...)`**: Renders the SVG microscope and runs a `requestAnimationFrame` loop that smoothly interpolates:
  * **Nosepiece & Objective Barrel:** Rotates turret angle, adjusts barrel height, and updates the objective color band (`4×` rose, `10×` amber, `40×` cyan, `100×` white).
  * **Stage & Glass Slide:** Shifts stage vertical position (`stageY`) with focus and horizontal slide position (`slideX`) + vernier knob rotation (`vernierAngle`) with `pan`.
  * **Coarse/Fine & Dimmer Knobs:** Rotates dial needles (`-135°` to `+135°`) based on focus and brightness.
  * **Iris & Lamp Beam:** Adjusts iris bar width (`irisWidth`) from `diaphragm` and light cone opacity (`beamStrength`) from `lampOn` and `illumination`.
  * **Click Actions:** Clicking a part calls `onSelectPart(partId)` to highlight the corresponding control card; clicking the nosepiece/objectives also calls `onCycleObjective()`, and clicking the lamp also calls `onToggleLamp()`.

### `src/components/ControlPanel.tsx`
* **`ControlPanel(...)`**: Renders the four control cards and computes live focus error (`deltaZ = effectiveFocus - focalPlane`), sharpness status (`isSharp`), and stage vernier millimeter coordinates (`vernierX`, `vernierY`).
* **Control Actions:**
  * **Objective Buttons (`4×`, `10×`, `40×`, `100×`)**: Sets `optics.objective`.
  * **Immersion Oil Toggle**: Toggles `optics.oilImmersion` (`ON (Oil Bridge)` vs. `OFF (Air Gap)`).
  * **Coarse & Fine Focus Sliders**: Updates `optics.coarseFocus` (`0–100`) and `optics.fineFocus` (`-50` to `+50`).
  * **Lamp Toggle & Brightness / Iris Sliders**: Toggles `optics.lampOn` and updates `optics.illumination` and `optics.diaphragm`.
  * **Stage X & Stage Y Sliders**: Updates `optics.pan.x` and `optics.pan.y` (`-220` to `220`).

### `src/components/MicroscopeViewport.tsx`
* **`MicroscopeViewport(...)`**: Manages the circular eyepiece `<canvas>`, DPR scaling, smoothed pan/zoom state (`smoothStateRef`), and the four bottom telemetry readouts using `OPTICAL_SPECS`.
* **`resizeCanvas()`**: Sizes the square `<canvas>` to fit available container width and height while accounting for `window.devicePixelRatio`.
* **`renderFrame(timeMs)`**: Runs every animation frame to clip to the circular eyepiece, draw a dark field when `lampOn` is false, render the specimen with `ctx.filter` (`blur`, `brightness`, `contrast`), draw visible anatomical labels (`showLabels`), draw the ocular pointer needle and bottom micrometer scale (`showReticle`), and apply radial iris/vignette shading.
* **`handlePointerDown` / `handlePointerMove` / `handlePointerUp`**: Captures pointer drag on the canvas and updates clamped `pan` coordinates scaled by current magnification.
* **`handleWheel`**: Prevents default page scroll on the canvas and calls `onFineFocusDelta` to fine-focus.

### `src/slides/*.ts` & `src/slides/index.ts`
* **`render(ctx, timeMs, optics)` (on each `SlideDefinition`)**: Draws the specimen in local slide coordinates centered around `(0, 0)` (using `timeMs` for animated slides like `pondWaterLiveSlide`).
* **`getSlideById(id)`**: Finds a slide by `id` in `SLIDE_REGISTRY`, falling back to `SLIDE_REGISTRY[0]`.
* **`filterSlides(category, search)`**: Filters `SLIDE_REGISTRY` by `SlideCategory` (or `'All'`) and a case-insensitive search string matching `name`, `stain`, or `category`.

---

## Adding a New Specimen Slide (Quick Checklist)

1. Create `src/slides/<yourSpecimen>.ts` exporting a `SlideDefinition` object (`id`, `name`, `shortTitle`, `subtitle`, `badgeColor`, `category`, `stain`, `description`, `focalPlane`, `requiresOilAt100x`, optional `isAnimated`, `labels`, and `render`).
2. Import and add your slide to `SLIDE_REGISTRY` in `src/slides/index.ts`.
3. Run the app and verify focus (`focalPlane`), `100×` oil behavior (`requiresOilAt100x`), label coordinates, and stage panning.
