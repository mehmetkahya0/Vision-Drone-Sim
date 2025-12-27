# Vision Drone Simulator 🚁

A highly advanced 3D drone flight simulator built with Three.js, featuring realistic physics, AI object detection, and comprehensive telemetry systems.

## ✨ Features

### Core Flight System
- **Realistic Flight Physics**
  - Gravity and air resistance simulation
  - Momentum-based acceleration for smooth movement
  - Dynamic drag coefficient that increases with speed
  - Battery drain system affecting performance
  - Altitude limits and collision detection with smooth bouncing

- **Advanced Drone Model**
  - Detailed drone mesh with propellers, arms, and landing gear
  - Realistic propeller animations synchronized with speed
  - LED lights (green front, red rear) with point light glows
  - Camera housing with lens detail
  - Working headlight with spotlight and adjustable intensity
  - Tilt animation based on movement direction

### Environmental System
- **6 Dynamic Environments**
  - 🌞 City Day - Bright daylight with green landscape
  - 🌅 Sunset - Warm orange tones, dramatic lighting
  - 🌃 Night City - Low light with artificial street lighting
  - 🏜️ Desert - High visibility, extreme sun intensity
  - 🌧️ Stormy - Reduced visibility with atmospheric fog
  - ☁️ Overcast - Soft, diffuse lighting

- **Dynamic Lighting**
  - Ambient light that adjusts per environment
  - Hemisphere lighting for natural sky effects
  - Directional sun that follows drone for consistent shadows
  - Environment-specific light intensity presets

### Physics Enhancements
- **Wind System**
  - Dynamic wind direction and speed simulation
  - Gust events with random timing
  - Wind effects scale with altitude
  - Visual indication in performance HUD

- **Battery Management**
  - Realistic battery drain (0-100%)
  - Drain rate increases with speed and thrust
  - Low battery warning (< 20% turns red)
  - Performance degradation when battery is critical

- **Improved Collision System**
  - Ground collision with bounce reduction
  - Altitude limits with velocity clamping
  - Smooth horizontal speed limiting

### Camera Systems
- **Third-Person View**
  - Drone-following camera with smooth lerp interpolation
  - Adjustable offset and look-ahead distance
  - Dynamic sun positioning relative to drone

- **First-Person Drone Camera (FPV)**
  - Mounted on drone's camera housing
  - Fullscreen toggle capability
  - Real-time rendering to canvas
  - Brightness and contrast enhancement
  - Scan line effect for cinematic feel
  - Timestamp overlay with recording indicator

### AI Object Detection
- **COCO-SSD Real-Time Detection**
  - Multi-class object detection on drone camera feed
  - Bounding box visualization with object labels
  - Confidence score display
  - Color-coded boxes per object class
  - Performance-optimized (100ms update interval)

- **Detectable Classes**
  - person, car, truck, bus
  - motorcycle, bicycle
  - traffic light, stop sign
  - Dynamic color coding for easy identification

### Recording & Telemetry
- **Flight Recording**
  - Automatic recording of all flight parameters
  - CSV export with full trajectory data
  - Position, velocity, rotation tracking
  - Speed calculations
  - Playback potential for analysis

- **Real-Time HUD Display**
  - Altitude (meters)
  - Speed (m/s)
  - GPS Position coordinates
  - Heading (degrees)
  - Battery percentage (dynamic color)
  - FPS counter
  - Frame time monitoring
  - Wind speed indicator

### User Interface
- **Drone Telemetry Panel**
  - Real-time flight data
  - Battery status with color coding
  - Located bottom-left of screen

- **Performance Monitor**
  - FPS counter
  - Frame time in milliseconds
  - Wind speed display
  - Drone position in real-time

- **Detection Info Panel**
  - Active object detection count
  - Model loading status
  - Detected objects list with counts
  - Located top-right of screen

- **Control Guide**
  - Comprehensive keyboard mapping
  - Located bottom-right of screen
  - Always visible reference

## 🎮 Controls

### Movement Controls
| Key | Action |
|-----|--------|
| **W** | Move Forward |
| **S** | Move Backward |
| **A** | Strafe Left |
| **D** | Strafe Right |
| **Q** | Rotate Left |
| **E** | Rotate Right |
| **Space** | Ascend (Increase Altitude) |
| **Shift** | Descend (Decrease Altitude) |

### Camera & View Controls
| Key | Action |
|-----|--------|
| **C** | Toggle Drone Camera (FPV) Fullscreen |
| **M** | Switch Environment |

### Flight Utilities
| Key | Action |
|-----|--------|
| **R** | Reset Drone Position |
| **L** | Toggle Headlight |
| **V** | Record/Stop Flight Recording |

## 📊 Technical Specifications

### Physics Parameters
- **Max Speed**: 120 m/s (horizontal)
- **Max Vertical Speed**: 50 m/s
- **Gravity**: 15 m/s²
- **Acceleration**: 80 units/s
- **Max Altitude**: 500 meters
- **Min Altitude**: 2 meters (ground level)

### Battery System
- **Starting Capacity**: 100%
- **Drain Rate**: 0.5% per second (base)
- **Speed Multiplier**: +50% drain at max speed
- **Thrust Multiplier**: +30% drain when actively ascending

### Wind Physics
- **Speed Range**: 0-40 m/s
- **Gust Frequency**: 2-5 second intervals
- **Gust Strength**: 0-15 m/s additional
- **Altitude Impact**: Wind effect reduces with height

### Detection System
- **Model**: COCO-SSD (MobileNetv2)
- **Update Rate**: 100ms per detection cycle
- **Resolution**: 320x240 (windowed), adaptive (fullscreen)
- **GPU Accelerated**: TensorFlow.js + WASM

## 🚀 Getting Started

### Installation
1. Ensure you have a modern web browser (Chrome, Firefox, Edge, Safari)
2. Clone or download this project
3. Open `index.html` in your browser
4. Wait for the loading spinner to disappear
5. Start flying!

### First Flight Tips
1. Start at altitude 0 and press Space to take off
2. Use W/A/S/D to move, Q/E to rotate
3. Press L to enable headlight for better visibility
4. Press M to change environments and find your favorite
5. Press C to switch to drone camera view
6. Monitor battery level - it drains faster at high speeds
7. Check wind indicator on performance HUD

## 🔧 Advanced Features

### Wind Navigation
- Wind indicator shows current wind speed and direction
- Wind effects increase at lower altitudes
- Gust events occur randomly every 2-5 seconds
- Practice flying in strong wind for challenge

### Battery Management
- Plan long flights carefully - battery drains continuously
- Battery drains faster when:
  - Flying at high speeds
  - Continuously ascending
  - Using headlight
- Performance decreases when battery drops below 20%

### Recording Analysis
- Flight recordings export as CSV files
- Data includes: time, position (X,Y,Z), velocity components, heading, speed
- Use for performance analysis or flight review
- Timestamped with creation date

### Object Detection
- Detection runs continuously on drone camera feed
- Bounding boxes show in both windowed and fullscreen modes
- Detection info panel shows real-time object counts
- Useful for surveillance and tracking scenarios

## 🎨 Environment Profiles

### City Day (Default)
- Clear blue sky, bright green grass
- Full lighting conditions
- Best for general flight practice

### Sunset
- Orange sky, warm lighting
- Reduced visibility, dramatic shadows
- Ideal for scenic flying

### Night City
- Low ambient light
- Street lights and building windows visible
- Headlight essential
- Challenge mode

### Desert
- Vast open terrain
- High visibility
- Extreme sun intensity
- Test your speed here

### Stormy
- Heavy fog
- Reduced visibility
- Challenging flying conditions
- Windier than other environments

### Overcast
- Soft diffuse lighting
- Medium visibility
- Balanced conditions

## 🐛 Bug Fixes (Latest Update)

- **Fixed**: Three.js uniform rendering error (`Cannot read properties of undefined`)
  - Removed problematic `map: null` properties from materials
  - All materials now render without errors

- **Enhanced**: Physics system with momentum-based acceleration
- **Added**: Battery drain simulation
- **Added**: Wind and gust system
- **Added**: Flight recording and CSV export
- **Added**: Performance monitoring (FPS, frame time)
- **Improved**: Drone model tilt and movement responsiveness

## 📦 Dependencies

### External Libraries
- **Three.js 0.160.0** - 3D rendering
- **TensorFlow.js 4.10.0** - Machine learning
- **COCO-SSD 2.2.3** - Object detection model

### Browser Requirements
- WebGL 2.0 support
- Modern JavaScript (ES6+)
- Canvas 2D API
- Web Workers (for TensorFlow)

## 🎯 Future Enhancements

- [ ] Waypoint navigation system
- [ ] Autonomous flight modes
- [ ] Multi-drone coordination
- [ ] Improved weather effects (rain, snow)
- [ ] Terrain elevation maps
- [ ] Custom flight missions
- [ ] Flight history/playback
- [ ] Performance optimization (LOD system)
- [ ] Mobile/touch controls
- [ ] Online multiplayer

## 📝 License

This project is open source. Feel free to modify and extend it!

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit improvements
- Create new environments
- Optimize performance

## 📞 Support

If you encounter issues:
1. Check console for error messages (F12)
2. Ensure your browser supports WebGL
3. Try a different browser
4. Clear browser cache and reload
5. Check that JavaScript is enabled

---

**Enjoy flying! 🚁✨**
