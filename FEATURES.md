# Advanced Features Guide

## Complete Feature List

### 🎮 Flight Control System

#### Movement Mechanics
- **8-Directional Movement**
  - Forward (W) / Backward (S)
  - Left Strafe (A) / Right Strafe (D)
  - Ascend (Space) / Descend (Shift)
  - Rotate Left (Q) / Rotate Right (E)

- **Inertial Flight Model**
  - Momentum-based acceleration
  - Smooth velocity transitions
  - Realistic deceleration
  - Speed-dependent drag

#### Flight Constraints
- **Altitude Limits**: 2m (ground) to 500m (max)
- **Speed Limits**: 120 m/s horizontal, 50 m/s vertical
- **Acceleration**: 80 units/second
- **Natural Recovery**: Auto-leveling when stationary

---

## 🌍 Environmental System

### Six Detailed Environments

#### 1. City Day
- **Sky Color**: Clear Blue (#87CEEB)
- **Lighting**: 1.2x Ambient, 2.0x Sun
- **Visibility**: 500m near, 2000m far
- **Ground**: Green landscape
- **Optimal For**: General practice, daylight flying

#### 2. Sunset
- **Sky Color**: Orange (#ff7b54)
- **Lighting**: 0.8x Ambient, 2.5x Sun (warm)
- **Visibility**: 400m near, 1800m far
- **Ground**: Dark brown
- **Optimal For**: Scenic flying, photography
- **Sun Position**: Low on horizon

#### 3. Night City
- **Sky Color**: Dark Blue-Black (#0a0a1a)
- **Lighting**: 0.15x Ambient, 0.1x Sun (moonlight)
- **Visibility**: 100m near, 800m far
- **Ground**: Dark asphalt
- **Optimal For**: Challenge flying, headlight essential
- **Features**: Street lights and building windows glow

#### 4. Desert
- **Sky Color**: Light Blue (#87CEEB)
- **Lighting**: 1.4x Ambient, 3.0x Sun (intense)
- **Visibility**: 600m near, 2500m far
- **Ground**: Sandy (#c4a35a)
- **Optimal For**: High-speed testing, visibility testing
- **Extreme**: Highest sun intensity

#### 5. Stormy
- **Sky Color**: Dark Gray (#3a4a5a)
- **Lighting**: 0.6x Ambient, 0.4x Sun
- **Visibility**: 200m near, 1000m far
- **Ground**: Dark forest
- **Optimal For**: Challenge mode, wind testing
- **Special**: Enhanced wind effects

#### 6. Overcast
- **Sky Color**: Blue-Gray (#8899aa)
- **Lighting**: 1.5x Ambient, 0.8x Sun
- **Visibility**: 300m near, 1500m far
- **Ground**: Green forest
- **Optimal For**: Balanced conditions, general flying

### Dynamic Lighting Features
- **Ambient Light**: Environment-specific intensity
- **Hemisphere Light**: Natural sky lighting
- **Directional Sun**: Follows drone, 2048x2048 shadow map
- **Exposure Mapping**: Auto-adjusted per environment
- **Color Space**: SRGB for accurate colors

---

## 🔋 Advanced Battery System

### Battery Physics
- **Capacity**: 100% charge
- **Base Drain**: 0.5% per second
- **Speed Multiplier**: +50% drain at max speed
- **Thrust Multiplier**: +30% drain when ascending
- **Formula**: `drain = base * speed_multiplier * thrust_multiplier`

### Battery Impact
- **Performance at 100-50%**: Full capability
- **Performance at 50-20%**: Minor power reduction
- **Performance at 20-0%**: 70% power reduction
  - Max speed reduced
  - Acceleration reduced
  - Max altitude reduced

### Visual Indicators
- **100-50%**: Green (#00ff00)
- **50-20%**: Yellow (#ffff00)
- **20-0%**: Red (#ff0000)

### Example Flight Times
- **Hovering**: ~200 seconds (3.3 min)
- **Light Movement**: ~180 seconds (3 min)
- **Heavy Movement**: ~120 seconds (2 min)
- **Max Speed**: ~60 seconds (1 min)

---

## 💨 Wind Physics System

### Wind Behavior
- **Wind Speed**: 0-40 m/s
- **Direction**: Continuous 360° rotation
- **Gust Events**: Every 2-5 seconds
- **Gust Strength**: 0-15 m/s additional force

### Wind Characteristics
- **Altitude Effect**: Wind force = base * (altitude_factor)
- **Max Altitude Effect**: Wind inactive above 200m
- **Smooth Transitions**: Wind direction changes gradually
- **Random Variation**: ±2 m/s per frame

### Wind Impact
- Affects horizontal movement
- Affects vertical position (updrafts/downdrafts)
- More severe at low altitudes
- Negligible above 200m

### Gust System
- **Occurrence**: Random every 2-5 seconds
- **Duration**: Instantaneous spike
- **Direction**: Random 360°
- **Recovery**: Immediate after gust

### Navigation in Wind
- Fly higher to escape wind (< 200m altitude)
- Compensate by flying against wind direction
- Use throttle boost to overcome gusts
- Monitor wind speed in performance HUD

---

## 📹 Camera Systems

### First-Person View (Drone Camera)
- **FOV**: 75 degrees
- **Aspect Ratio**: 4:3 (320:240 windowed, responsive fullscreen)
- **Near Clip**: 0.1 units
- **Far Clip**: 2000 units
- **Position**: Mounted on drone front camera housing
- **Rotation**: Slight downward angle for coverage

#### Features
- **Real-time Rendering**: Canvas-based rendering
- **Post-Processing**:
  - Brightness boost (1.6x)
  - Contrast enhancement (1.15x)
  - Scan line effect (retro feel)
  - Vertical flip for correct orientation
- **Overlay Information**:
  - Recording indicator (REC ●)
  - Timestamp (HH:MM:SS)
  - Object detection count
  - Live object detection boxes

### Third-Person View
- **FOV**: 60 degrees
- **Follow Distance**: Behind drone (-35Z offset)
- **Height Offset**: 12 units above drone
- **Look Ahead**: 10 units forward
- **Smoothing**: 8% lerp per frame
- **Auto-Update**: Follows drone rotation

### Camera Switching
- **Fullscreen Toggle**: Press C
- **Seamless Transition**: No loading delay
- **Resolution Adaptation**: 
  - Windowed: 320x240
  - Fullscreen: 1920x1080 (responsive)

---

## 🤖 AI Object Detection

### Detection System
- **Model**: COCO-SSD (MobileNetv2 backend)
- **Framework**: TensorFlow.js + WASM acceleration
- **Processing**: GPU accelerated
- **Update Rate**: Every 100ms (10 times per second)

### Detectable Objects (90 classes)
- **Vehicles**: car, truck, bus, motorcycle, bicycle
- **People**: person, sports ball
- **Animals**: dog, cat, bird, sheep, cow, horse
- **Traffic**: traffic light, stop sign, parking meter
- **Infrastructure**: fire hydrant, street sign, bench
- **And 75+ more COCO categories

### Detection Features
- **Bounding Boxes**: Colored per object type
- **Confidence Score**: 0-100% with 1 decimal
- **Label Display**: Object name + score
- **Corner Markers**: Visual enhancements for clarity
- **Live Counter**: Objects detected per frame

### Color Coding
- **Person**: Red (#ff0000)
- **Car**: Green (#00ff00)
- **Truck**: Light Blue (#0088ff)
- **Bus**: Orange (#ff8800)
- **Motorcycle**: Magenta (#ff00ff)
- **Bicycle**: Cyan (#00ffff)
- **Traffic Light**: Yellow (#ffff00)
- **Stop Sign**: Light Red (#ff4444)
- **Default**: Green (#00ff00)

### Detection Tips
- Best accuracy at altitude 10-50m
- Reduces at extreme distances
- Confidence improves with centered objects
- Works in most lighting conditions
- Check "Detection Info" panel for statistics

---

## 🎥 Flight Recording System

### Recording Features
- **Auto-Capture**: Records at frame rate (60fps target)
- **Data Recorded**: Position, velocity, rotation, speed
- **Duration**: Up to 1 minute (3600 frames max)
- **Export Format**: CSV (comma-separated values)

### Recording Controls
- **Start/Stop**: Press V
- **Status**: Shown in notifications
- **File Naming**: `drone-flight-[timestamp].csv`

### CSV Export Format
```
Time,X,Y,Z,VelX,VelY,VelZ,Rotation,Speed
0.000,0.00,50.00,0.00,0.00,0.00,0.00,0.000,0.00
0.017,0.50,50.10,0.80,30.00,6.00,48.00,0.100,48.42
...
```

### Analysis Use Cases
- Flight path visualization
- Speed profiling
- Altitude tracking
- Rotation analysis
- Performance metrics
- Education purposes

### Import Examples
- Excel/Sheets: Direct CSV import
- Python: `pandas.read_csv(filename)`
- Plotting: Create graphs with matplotlib
- Analysis: Calculate statistics

---

## 📊 Performance Monitoring

### Real-Time Metrics
- **FPS**: Frames per second (updated every 1 second)
- **Frame Time**: Milliseconds per frame
- **Wind Speed**: Current wind velocity in m/s
- **Drone Position**: Real-time X, Y, Z coordinates

### Performance HUD Layout
```
┌─────────────────┐
│ FPS: 60         │
│ Frame: 16.7ms   │
│ Drone: 0, 50, 0 │
│ Wind: 5.2m/s    │
└─────────────────┘
```

### Optimization Tips
1. Reduce environment complexity (if available)
2. Lower detection update rate (change in code)
3. Disable scan line effect (code modification)
4. Use smaller fullscreen resolution
5. Close other browser tabs

### Performance Targets
- **Target FPS**: 60 fps
- **Frame Budget**: 16.7ms
- **Quality**: Ultra HD recommended
- **GPU**: Dedicated GPU preferred

---

## 🎛️ Advanced Controls

### Keyboard Mapping
| Category | Key | Function |
|----------|-----|----------|
| **Flight** | W | Forward |
| | S | Backward |
| | A | Strafe Left |
| | D | Strafe Right |
| **Vertical** | Space | Ascend |
| | Shift | Descend |
| **Rotation** | Q | Rotate Left |
| | E | Rotate Right |
| **Utilities** | R | Reset Position |
| **Camera** | C | Toggle FPV Fullscreen |
| | L | Headlight Toggle |
| **Environment** | M | Change Map |
| **Recording** | V | Record/Stop |

### Control Response
- **Acceleration Response**: Smooth with momentum
- **Max Force**: Limited per direction
- **Dampening**: Natural deceleration
- **Recovery**: Auto-level when idle

---

## 💡 Headlight System

### Headlight Features
- **Type**: SpotLight with 100m range
- **Intensity**: 5.0 (when on), 0.0 (when off)
- **Cone Angle**: 30 degrees
- **Penumbra**: 50%
- **Position**: Front of drone

### Visual Effects
- **Lens Color**: 
  - Off: Gray (#444444)
  - On: Warm White (#ffffee)
- **Beam**: Visible on terrain and objects
- **Shadows**: Cast shadows in lit areas

### Headlight Toggle
- **Key**: L
- **Status**: Shown in console
- **Battery Impact**: Minimal drain increase
- **Usage**: Essential for Night mode

---

## 🚁 Drone Model Details

### Physical Components
- **Body**: 3x0.8x2 units (dark gray)
- **Cover**: 2.5x0.4x1.5 units (lighter gray)
- **Camera Housing**: 0.4 unit sphere
- **Arms**: 4 main arms with motors
- **Propellers**: 4 counter-rotating sets
- **Landing Gear**: 4 legs with feet

### LED System
- **Front LEDs**: Green (#00ff00)
- **Rear LEDs**: Red (#ff0000)
- **Point Lights**: Glow effects
- **Brightness**: Adjustable with code

### Propeller System
- **Count**: 4 propellers
- **Rotation**: Alternating directions
- **Speed**: Synchronized with flight
- **Blur Disc**: Opacity shows rotation speed

---

## 🛠️ System Information

### Technical Stack
- **Engine**: Three.js 0.160.0
- **AI/ML**: TensorFlow.js 4.10.0
- **Detection**: COCO-SSD 2.2.3
- **Rendering**: WebGL 2.0
- **Language**: JavaScript (ES6+)

### Browser Support
- **Chrome**: ✅ Fully supported
- **Firefox**: ✅ Fully supported
- **Edge**: ✅ Fully supported
- **Safari**: ✅ Supported
- **Mobile**: Untested

### System Requirements
- **Minimum GPU**: Integrated graphics
- **Recommended GPU**: Dedicated graphics
- **CPU**: Modern multi-core processor
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: ~100MB (models loaded on first run)

---

## 📚 Advanced Usage Examples

### Aerial Photography
1. Switch to Sunset environment
2. Use third-person camera for composition
3. Fly slowly at varied altitudes
4. Use headlight at low altitude if needed
5. Record flight for later analysis

### Object Detection Practice
1. Fly at 20-50m altitude
2. Watch detection panel for objects
3. Fullscreen drone camera for detail
4. Identify different object types
5. Test in different environments

### Wind Challenge
1. Choose Stormy environment
2. Monitor wind speed in performance HUD
3. Fly against wind direction
4. Practice wind compensation
5. Record results for analysis

### Battery Management
1. Note battery drain rate
2. Plan flight duration accordingly
3. Monitor battery in HUD
4. Return to altitude before critical
5. Test different flight patterns

### Performance Testing
1. Monitor FPS in performance HUD
2. Test in different environments
3. Record CPU/GPU usage externally
4. Identify bottlenecks
5. Report findings in console

---

**For more information, see README.md and CHANGELOG.md**
