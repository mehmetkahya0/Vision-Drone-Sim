# Quick Start Guide 🚀

## First Time Setup (30 seconds)

1. **Open the Simulator**
   - Open `index.html` in your web browser
   - Wait for "Loading Drone Simulator..." to disappear (~3 seconds)

2. **Ready to Fly!**
   - You're now at altitude 0
   - The drone is ready to take off

## Your First Flight (5 minutes)

### Step 1: Take Off
```
Press SPACE to ascend
→ Drone rises to ~30m altitude
→ Battery starts draining
```

### Step 2: Basic Movement
```
Press W to move forward
Press A to strafe left
Press D to strafe right
Press S to move backward
→ You're now flying!
```

### Step 3: Rotate
```
Press Q to rotate left
Press E to rotate right
→ Change your facing direction
```

### Step 4: Experience the Drone Camera
```
Press C to toggle drone camera fullscreen
→ See what the drone "sees"
Press C again to go back to normal view
→ Better for situational awareness
```

### Step 5: Change Environment
```
Press M to change environment
→ Cycles through 6 different scenes
Try: Sunset, Night City, Desert
```

### Step 6: Land
```
Press SHIFT to descend
→ Drone loses altitude
→ Land when you reach the ground
```

## Keyboard Quick Reference

```
MOVEMENT          CAMERA             UTILITIES
─────────         ──────             ──────
W   Forward       C   FPV Toggle     R   Reset Position
S   Backward      M   Change Env     L   Headlight
A   Left          V   Record Flight
D   Right
Q   Rotate L
E   Rotate R
Space  Up
Shift  Down
```

## Key Features to Try

### 🌅 Switch Environments
Press **M** to see:
- City Day (bright, balanced)
- Sunset (warm, dramatic)
- Night City (dark, challenging)
- Desert (clear, extreme)
- Stormy (foggy, windy)
- Overcast (soft, calm)

### 💡 Use the Headlight
- Press **L** to toggle headlight
- Essential in Night City
- Try in all environments

### 📹 Enable Drone Camera
- Press **C** for first-person view
- Shows real-time object detection
- Press again to go back

### 📊 Check Your Status
Bottom-left HUD shows:
- **Altitude**: How high you are
- **Speed**: Current velocity
- **Position**: GPS coordinates
- **Heading**: Direction facing
- **Battery**: Power remaining

### 🎥 Record Your Flight
- Press **V** to start recording
- "🔴 RECORDING STARTED" appears
- Press **V** again to stop
- File downloads as CSV

### 🤖 Watch Object Detection
- Top-right panel shows detected objects
- Fly near vehicles, people, traffic lights
- See bounding boxes in drone camera

### 📈 Monitor Performance
- Below telemetry shows:
  - **FPS**: Frames per second
  - **Frame**: Time per frame (ms)
  - **Drone**: Your position
  - **Wind**: Wind speed

## Tips for Better Flying

### 🎯 Smooth Flight
1. Use gentle input (don't mash keys)
2. Let momentum carry you
3. Plan ahead when turning
4. Avoid sudden altitude changes

### 🔋 Manage Battery
- Battery drains faster when:
  - Flying at high speeds
  - Continuously ascending
  - Using headlight
- Plan ~3 minutes for active flight
- Hover to conserve at 20%

### 💨 Handle Wind
- Wind indicator shows current speed
- Wind is stronger at low altitude
- Fly higher to escape wind
- Compensate when flying against wind

### 🌙 Night Flying
1. Enable headlight (L)
2. Use Drone Camera (C) for detail
3. Fly slower for control
4. Streets have ambient lighting

### 🏜️ Desert Flying
- Extreme brightness
- Highest visibility
- Perfect for speed tests
- Best for photography

## Common Issues

### "Simulator won't start"
✅ Solution: Wait longer (models loading)
✅ Refresh page (F5)
✅ Check browser console (F12)

### "Drone won't take off"
✅ Solution: Press SPACE to ascend
✅ Check battery (should be 100%)

### "Can't see objects for detection"
✅ Solution: Fly in daytime environments
✅ Get altitude 15-40m
✅ Face nearby buildings/streets

### "Very low FPS"
✅ Solution: Reduce fullscreen resolution
✅ Disable scan lines (edit code)
✅ Close other tabs
✅ Use dedicated GPU browser

### "Headlight not working"
✅ Solution: Press L again
✅ Check you're in dark environment
✅ Night City is best

## Challenge Modes

### ⏱️ Speed Run
- Reach 100+ m/s
- Time how long you last
- Compare with friends

### 🌙 Night Navigation
- Fly in Night City
- Use only headlight vision
- Detect objects without direct sight
- Navigate streets blindfolded (no 3rd person cam)

### 💨 Wind Challenge
- Fly in Stormy environment
- Overcome wind gusts
- Maintain stable altitude
- Land at specific location

### 🎯 Detection Scavenger Hunt
- Find specific objects:
  - 5 cars
  - 3 people
  - 1 traffic light
  - Record and export flight path

### 🔋 Battery Conservation
- Longest flight without battery death
- Minimum battery required: 5%
- Use slow movements to conserve
- Hover to save power

## Advanced Tips

### Camera Control
- Third-person camera auto-follows drone
- Rotates when drone rotates
- Stays behind drone for best view
- Zoom not available (fly closer instead)

### Recording Analysis
- Export CSV to Excel or Sheets
- Create flight path graphs
- Analyze speed profiles
- Compare different flying styles

### Flight Patterns
- **Smooth S-curves**: Best for battery life
- **Circles**: Test rotation smoothness
- **Altitude changes**: Test gravity response
- **Speed bursts**: Test acceleration

### Drone Camera Features
- Shows real-time detection boxes
- Fullscreen for immersive flying
- Scan line effect (retro feel)
- Brightness auto-adjusted

## Next Steps

1. **Read FEATURES.md** for detailed feature list
2. **Check CHANGELOG.md** for what's new
3. **Try all 6 environments** with different styles
4. **Record a flight** and analyze the data
5. **Experiment** with physics settings (edit code)
6. **Share recordings** with friends

## Keyboard Map Image
```
┌─────────────────────────────────────┐
│     MOVEMENT         UTILITIES       │
│  Q  W  E            R L  M  V       │
│  A  S  D            (1)  (2) (3) (4)│
│  UP/DOWN                            │
│  (SPACE/SHIFT)                      │
│                                     │
│  C = Change Camera                  │
└─────────────────────────────────────┘

(1) Reset to start
(2) Headlight on/off
(3) Switch environment
(4) Record flight
```

## Enjoy Your Flight! 🚁✨

For questions or issues, check:
- **README.md** - Complete documentation
- **FEATURES.md** - Advanced features guide
- **CHANGELOG.md** - What's new in v2.0
- Browser Console (F12) - Error messages

---

**Happy flying! Share your best flights! 📹🎬**
