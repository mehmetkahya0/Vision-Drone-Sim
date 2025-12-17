import * as THREE from 'three';
import { Drone } from './drone.js';
import { World } from './world.js';
import { Controls } from './controls.js';

class DroneSimulator {
    constructor() {
        this.init();
        this.animate();
    }

    init() {
        // Environment presets
        this.environments = [
            {
                name: 'City Day',
                skyColor: 0x87CEEB,
                fogColor: 0x87CEEB,
                fogNear: 500,
                fogFar: 2000,
                ambientIntensity: 1.2,
                sunIntensity: 2.0,
                sunColor: 0xffffff,
                sunPosition: { x: 100, y: 200, z: 100 },
                groundColor: 0x3d6b35,
                hdri: null
            },
            {
                name: 'Sunset',
                skyColor: 0xff7b54,
                fogColor: 0xff9966,
                fogNear: 400,
                fogFar: 1800,
                ambientIntensity: 0.8,
                sunIntensity: 2.5,
                sunColor: 0xff8844,
                sunPosition: { x: 200, y: 50, z: 100 },
                groundColor: 0x5a4a35,
                hdri: null
            },
            {
                name: 'Night City',
                skyColor: 0x0a0a1a,
                fogColor: 0x0a0a1a,
                fogNear: 100,
                fogFar: 800,
                ambientIntensity: 0.15,
                sunIntensity: 0.1,
                sunColor: 0x4444aa,
                sunPosition: { x: -100, y: 50, z: -100 },
                groundColor: 0x1a1a2a,
                hdri: null
            },
            {
                name: 'Overcast',
                skyColor: 0x8899aa,
                fogColor: 0x8899aa,
                fogNear: 300,
                fogFar: 1500,
                ambientIntensity: 1.5,
                sunIntensity: 0.8,
                sunColor: 0xcccccc,
                sunPosition: { x: 50, y: 300, z: 50 },
                groundColor: 0x4a5a4a,
                hdri: null
            },
            {
                name: 'Desert',
                skyColor: 0x87CEEB,
                fogColor: 0xd4a574,
                fogNear: 600,
                fogFar: 2500,
                ambientIntensity: 1.4,
                sunIntensity: 3.0,
                sunColor: 0xffffee,
                sunPosition: { x: 0, y: 250, z: 50 },
                groundColor: 0xc4a35a,
                hdri: null
            },
            {
                name: 'Stormy',
                skyColor: 0x3a4a5a,
                fogColor: 0x3a4a5a,
                fogNear: 200,
                fogFar: 1000,
                ambientIntensity: 0.6,
                sunIntensity: 0.4,
                sunColor: 0x8899aa,
                sunPosition: { x: 100, y: 150, z: 100 },
                groundColor: 0x2a3a2a,
                hdri: null
            }
        ];
        this.currentEnvironmentIndex = 0;

        // Main renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 2.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        document.body.appendChild(this.renderer.domElement);
        this.renderer.domElement.id = 'main-canvas';

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 1000, 3000);

        // Third person camera (main view)
        this.mainCamera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            5000
        );
        this.mainCamera.position.set(0, 50, 100);

        // Drone camera (picture-in-picture)
        this.droneCamera = new THREE.PerspectiveCamera(75, 320 / 240, 0.1, 2000);
        
        // Drone cam render target
        this.droneCamCanvas = document.getElementById('drone-cam');
        this.droneCamCtx = this.droneCamCanvas.getContext('2d');
        this.droneCamCanvas.width = 320;
        this.droneCamCanvas.height = 240;
        
        this.droneCamRenderTarget = new THREE.WebGLRenderTarget(320, 240);

        // Lighting
        this.setupLighting();

        // Create world with satellite imagery
        try {
            console.log('Creating world...');
            this.world = new World(this.scene);
            console.log('World created successfully, detectable objects:', this.world.getDetectableObjects().length);
        } catch (e) {
            console.error('Error creating world:', e);
            alert('Error creating world: ' + e.message);
        }

        // Create drone
        this.drone = new Drone(this.scene);
        this.drone.mesh.position.set(0, 50, 0);

        // Attach drone camera to drone (FPV camera position)
        this.drone.mesh.add(this.droneCamera);
        this.droneCamera.position.set(0, -0.3, 1.3); // At camera housing position on drone front
        this.droneCamera.rotation.set(-0.15, Math.PI, 0); // Rotated 180° to look forward, slight downward angle

        // Controls
        this.controls = new Controls(this.drone);
        
        // Drone cam fullscreen toggle
        this.droneCamFullscreen = false;
        this.controls.onToggleDroneCam = () => this.toggleDroneCamFullscreen();
        
        // Headlight toggle
        this.controls.onToggleHeadlight = () => {
            const isOn = this.drone.toggleHeadlight();
            console.log('Headlight:', isOn ? 'ON' : 'OFF');
        };
        
        // Environment/Map switch
        this.controls.onSwitchEnvironment = () => {
            this.switchEnvironment();
        };

        // Camera follow settings - behind the drone
        this.cameraOffset = new THREE.Vector3(0, 12, -35); // Negative Z = behind drone
        this.cameraLookOffset = new THREE.Vector3(0, 0, 10); // Look ahead of drone
        this.cameraSmoothness = 0.08;

        // Clock for delta time
        this.clock = new THREE.Clock();

        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
        }, 1000);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // HUD elements
        this.hudElements = {
            altitude: document.getElementById('altitude'),
            speed: document.getElementById('speed'),
            position: document.getElementById('position'),
            heading: document.getElementById('heading')
        };
        
        // YOLO Detection setup
        this.detectionModel = null;
        this.detections = [];
        this.detectionInterval = 100; // Run detection every 100ms
        this.lastDetectionTime = 0;
        this.initYOLO();
        
        // Apply initial environment
        this.applyEnvironment(this.environments[0]);
    }
    
    switchEnvironment() {
        this.currentEnvironmentIndex = (this.currentEnvironmentIndex + 1) % this.environments.length;
        const env = this.environments[this.currentEnvironmentIndex];
        this.applyEnvironment(env);
        
        // Show notification
        this.showNotification(`🗺️ ${env.name}`);
    }
    
    applyEnvironment(env) {
        // Update sky/background
        this.scene.background = new THREE.Color(env.skyColor);
        
        // Update fog
        this.scene.fog = new THREE.Fog(env.fogColor, env.fogNear, env.fogFar);
        
        // Update ground color
        if (this.world) {
            this.world.setGroundColor(env.groundColor);
        }
        
        // Update ambient light
        if (this.ambientLight) {
            this.ambientLight.intensity = env.ambientIntensity;
        }
        
        // Update hemisphere light
        if (this.hemiLight) {
            this.hemiLight.intensity = env.ambientIntensity * 0.8;
            this.hemiLight.color.setHex(env.skyColor);
        }
        
        // Update sun light
        if (this.sunLight) {
            this.sunLight.intensity = env.sunIntensity;
            this.sunLight.color.setHex(env.sunColor);
            this.sunLight.position.set(env.sunPosition.x, env.sunPosition.y, env.sunPosition.z);
            this.baseSunPosition = new THREE.Vector3(env.sunPosition.x, env.sunPosition.y, env.sunPosition.z);
        }
        
        // Update renderer exposure and world settings based on environment
        if (env.name === 'Night City') {
            this.renderer.toneMappingExposure = 0.8;
            if (this.world) {
                this.world.setStreetLightsIntensity(3.0);
                this.world.setWindowEmissiveIntensity(1.5);
            }
        } else if (env.name === 'Desert') {
            this.renderer.toneMappingExposure = 1.8;
            if (this.world) {
                this.world.setStreetLightsIntensity(0.3);
                this.world.setWindowEmissiveIntensity(0.0);
            }
        } else if (env.name === 'Sunset') {
            this.renderer.toneMappingExposure = 1.4;
            if (this.world) {
                this.world.setStreetLightsIntensity(1.5);
                this.world.setWindowEmissiveIntensity(0.5);
            }
        } else if (env.name === 'Stormy') {
            this.renderer.toneMappingExposure = 1.2;
            if (this.world) {
                this.world.setStreetLightsIntensity(2.0);
                this.world.setWindowEmissiveIntensity(0.8);
            }
        } else if (env.name === 'Overcast') {
            this.renderer.toneMappingExposure = 1.3;
            if (this.world) {
                this.world.setStreetLightsIntensity(0.8);
                this.world.setWindowEmissiveIntensity(0.2);
            }
        } else {
            this.renderer.toneMappingExposure = 1.5;
            if (this.world) {
                this.world.setStreetLightsIntensity(0.5);
                this.world.setWindowEmissiveIntensity(0.0);
            }
        }
        
        console.log('Environment changed to:', env.name);
    }
    
    showNotification(message) {
        // Create or update notification element
        let notif = document.getElementById('env-notification');
        if (!notif) {
            notif = document.createElement('div');
            notif.id = 'env-notification';
            notif.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: #00ff00;
                padding: 20px 40px;
                border-radius: 10px;
                font-size: 24px;
                font-family: 'Segoe UI', Arial, sans-serif;
                border: 2px solid #00ff00;
                z-index: 1000;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(notif);
        }
        
        notif.textContent = message;
        notif.style.opacity = '1';
        
        setTimeout(() => {
            notif.style.opacity = '0';
        }, 1500);
    }
    
    async initYOLO() {
        const statusEl = document.getElementById('detection-status');
        try {
            statusEl.textContent = 'Loading COCO-SSD model...';
            // Load COCO-SSD model (YOLO-like object detection)
            this.detectionModel = await cocoSsd.load({
                base: 'mobilenet_v2'
            });
            statusEl.textContent = 'Model ready ✓';
            statusEl.style.color = '#00ff00';
            console.log('COCO-SSD model loaded successfully');
        } catch (error) {
            console.error('Failed to load detection model:', error);
            statusEl.textContent = 'Model failed to load';
            statusEl.style.color = '#ff0000';
        }
    }
    
    async runDetection() {
        if (!this.detectionModel) return;
        
        const now = performance.now();
        if (now - this.lastDetectionTime < this.detectionInterval) return;
        this.lastDetectionTime = now;
        
        try {
            // Run detection on drone camera canvas
            const predictions = await this.detectionModel.detect(this.droneCamCanvas);
            this.detections = predictions;
            this.updateDetectionUI(predictions);
        } catch (error) {
            console.error('Detection error:', error);
        }
    }
    
    updateDetectionUI(predictions) {
        const listEl = document.getElementById('detection-list');
        
        // Count objects by class
        const counts = {};
        predictions.forEach(pred => {
            const cls = pred.class;
            counts[cls] = (counts[cls] || 0) + 1;
        });
        
        // Update detection list
        let html = '';
        for (const [cls, count] of Object.entries(counts)) {
            html += `<div class="detection-item">${cls}: <span class="detection-count">${count}</span></div>`;
        }
        
        if (predictions.length === 0) {
            html = '<div style="color:#666">No objects detected</div>';
        }
        
        listEl.innerHTML = html;
    }
    
    drawDetectionBoxes() {
        if (!this.detections || this.detections.length === 0) return;
        
        const ctx = this.droneCamCtx;
        const width = this.droneCamCanvas.width;
        const height = this.droneCamCanvas.height;
        
        // Colors for different classes
        const classColors = {
            'person': '#ff0000',
            'car': '#00ff00',
            'truck': '#0088ff',
            'bus': '#ff8800',
            'motorcycle': '#ff00ff',
            'bicycle': '#00ffff',
            'traffic light': '#ffff00',
            'stop sign': '#ff4444',
            'default': '#00ff00'
        };
        
        this.detections.forEach(detection => {
            const [x, y, boxWidth, boxHeight] = detection.bbox;
            const label = detection.class;
            const score = (detection.score * 100).toFixed(1);
            const color = classColors[label] || classColors['default'];
            
            // Draw bounding box
            ctx.strokeStyle = color;
            ctx.lineWidth = this.droneCamFullscreen ? 3 : 2;
            ctx.strokeRect(x, y, boxWidth, boxHeight);
            
            // Draw label background
            const fontSize = this.droneCamFullscreen ? 14 : 10;
            ctx.font = `bold ${fontSize}px Arial`;
            const text = `${label} ${score}%`;
            const textWidth = ctx.measureText(text).width;
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y - fontSize - 4, textWidth + 8, fontSize + 4);
            
            // Draw label text
            ctx.fillStyle = '#000000';
            ctx.fillText(text, x + 4, y - 4);
            
            // Draw corner markers for style
            const markerLen = Math.min(15, boxWidth / 4, boxHeight / 4);
            ctx.lineWidth = this.droneCamFullscreen ? 4 : 3;
            
            // Top-left corner
            ctx.beginPath();
            ctx.moveTo(x, y + markerLen);
            ctx.lineTo(x, y);
            ctx.lineTo(x + markerLen, y);
            ctx.stroke();
            
            // Top-right corner
            ctx.beginPath();
            ctx.moveTo(x + boxWidth - markerLen, y);
            ctx.lineTo(x + boxWidth, y);
            ctx.lineTo(x + boxWidth, y + markerLen);
            ctx.stroke();
            
            // Bottom-left corner
            ctx.beginPath();
            ctx.moveTo(x, y + boxHeight - markerLen);
            ctx.lineTo(x, y + boxHeight);
            ctx.lineTo(x + markerLen, y + boxHeight);
            ctx.stroke();
            
            // Bottom-right corner
            ctx.beginPath();
            ctx.moveTo(x + boxWidth - markerLen, y + boxHeight);
            ctx.lineTo(x + boxWidth, y + boxHeight);
            ctx.lineTo(x + boxWidth, y + boxHeight - markerLen);
            ctx.stroke();
        });
    }

    setupLighting() {
        // Ambient light - much brighter for visibility
        this.ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
        this.scene.add(this.ambientLight);

        // Hemisphere light for natural sky lighting - brighter
        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
        this.scene.add(this.hemiLight);

        // Main directional light (sun) - very bright
        this.sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
        this.sunLight.position.set(100, 200, 100);
        this.baseSunPosition = new THREE.Vector3(100, 200, 100);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -200;
        this.sunLight.shadow.camera.right = 200;
        this.sunLight.shadow.camera.top = 200;
        this.sunLight.shadow.camera.bottom = -200;
        this.scene.add(this.sunLight);
        
        // Add sun target for proper shadow direction
        this.sunLight.target = new THREE.Object3D();
        this.scene.add(this.sunLight.target);
        
        console.log('Lighting setup complete');
    }

    toggleDroneCamFullscreen() {
        this.droneCamFullscreen = !this.droneCamFullscreen;
        
        const canvas = document.getElementById('drone-cam');
        const label = document.getElementById('drone-cam-label');
        
        if (this.droneCamFullscreen) {
            canvas.classList.add('fullscreen');
            label.classList.add('fullscreen');
            label.textContent = '📹 DRONE CAM (Press C to exit)';
            
            // Update render target for fullscreen
            this.droneCamCanvas.width = window.innerWidth;
            this.droneCamCanvas.height = window.innerHeight;
            this.droneCamRenderTarget.setSize(window.innerWidth, window.innerHeight);
            this.droneCamera.aspect = window.innerWidth / window.innerHeight;
            this.droneCamera.updateProjectionMatrix();
        } else {
            canvas.classList.remove('fullscreen');
            label.classList.remove('fullscreen');
            label.textContent = '📹 DRONE CAM';
            
            // Reset to default size
            this.droneCamCanvas.width = 320;
            this.droneCamCanvas.height = 240;
            this.droneCamRenderTarget.setSize(320, 240);
            this.droneCamera.aspect = 320 / 240;
            this.droneCamera.updateProjectionMatrix();
        }
    }

    updateCamera() {
        const dronePosition = this.drone.mesh.position.clone();
        const droneRotation = this.drone.mesh.rotation.y;

        // Calculate camera target position (behind and above drone)
        const offset = this.cameraOffset.clone();
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), droneRotation);
        
        const targetPosition = dronePosition.clone().add(offset);
        
        // Smooth camera movement
        this.mainCamera.position.lerp(targetPosition, this.cameraSmoothness);
        
        // Look at drone
        const lookTarget = dronePosition.clone().add(this.cameraLookOffset);
        this.mainCamera.lookAt(lookTarget);

        // Update sun position relative to drone for consistent shadows
        if (this.baseSunPosition) {
            this.sunLight.position.set(
                dronePosition.x + this.baseSunPosition.x,
                this.baseSunPosition.y,
                dronePosition.z + this.baseSunPosition.z
            );
        } else {
            this.sunLight.position.set(
                dronePosition.x + 100,
                200,
                dronePosition.z + 100
            );
        }
        this.sunLight.target.position.copy(dronePosition);
    }

    updateHUD() {
        const pos = this.drone.mesh.position;
        const velocity = this.drone.velocity;
        const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
        const heading = THREE.MathUtils.radToDeg(this.drone.mesh.rotation.y) % 360;

        this.hudElements.altitude.textContent = pos.y.toFixed(1);
        this.hudElements.speed.textContent = speed.toFixed(1);
        this.hudElements.position.textContent = `${pos.x.toFixed(0)}, ${pos.z.toFixed(0)}`;
        this.hudElements.heading.textContent = ((heading + 360) % 360).toFixed(0);
    }

    renderDroneCam() {
        // Render drone camera view to render target
        this.renderer.setRenderTarget(this.droneCamRenderTarget);
        this.renderer.clear();
        this.renderer.render(this.scene, this.droneCamera);
        this.renderer.setRenderTarget(null);

        // Get current canvas size (dynamic for fullscreen)
        const width = this.droneCamCanvas.width;
        const height = this.droneCamCanvas.height;

        // Read pixels and draw to canvas
        const pixelBuffer = new Uint8Array(width * height * 4);
        this.renderer.readRenderTargetPixels(
            this.droneCamRenderTarget,
            0, 0, width, height,
            pixelBuffer
        );

        const imageData = this.droneCamCtx.createImageData(width, height);
        
        // Brightness boost factor (1.0 = normal, higher = brighter)
        const brightness = 1.6;
        const contrast = 1.15;
        
        // Flip vertically while copying and apply brightness/contrast
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcIdx = ((height - 1 - y) * width + x) * 4;
                const dstIdx = (y * width + x) * 4;
                
                // Apply brightness and contrast
                let r = pixelBuffer[srcIdx];
                let g = pixelBuffer[srcIdx + 1];
                let b = pixelBuffer[srcIdx + 2];
                
                // Contrast adjustment (centered at 128)
                r = ((r - 128) * contrast + 128) * brightness;
                g = ((g - 128) * contrast + 128) * brightness;
                b = ((b - 128) * contrast + 128) * brightness;
                
                // Clamp values
                imageData.data[dstIdx] = Math.min(255, Math.max(0, r));
                imageData.data[dstIdx + 1] = Math.min(255, Math.max(0, g));
                imageData.data[dstIdx + 2] = Math.min(255, Math.max(0, b));
                imageData.data[dstIdx + 3] = pixelBuffer[srcIdx + 3];
            }
        }
        
        this.droneCamCtx.putImageData(imageData, 0, 0);

        // Add scan line effect (only in small mode for performance)
        if (!this.droneCamFullscreen) {
            this.droneCamCtx.fillStyle = 'rgba(0, 255, 0, 0.03)';
            for (let i = 0; i < height; i += 2) {
                this.droneCamCtx.fillRect(0, i, width, 1);
            }
        }
        
        // Run YOLO detection and draw bounding boxes
        this.runDetection();
        this.drawDetectionBoxes();

        // Add timestamp overlay
        this.droneCamCtx.fillStyle = '#00ff00';
        this.droneCamCtx.font = this.droneCamFullscreen ? '16px monospace' : '10px monospace';
        const now = new Date();
        this.droneCamCtx.fillText(
            `REC ● ${now.toLocaleTimeString()}`,
            10, height - 10
        );
        
        // Detection count
        this.droneCamCtx.fillStyle = '#ff6600';
        this.droneCamCtx.fillText(
            `Objects: ${this.detections.length}`,
            10, height - 25
        );
    }

    onWindowResize() {
        this.mainCamera.aspect = window.innerWidth / window.innerHeight;
        this.mainCamera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        // Update controls and drone physics
        this.controls.update(delta);
        this.drone.update(delta);

        // Update third person camera
        this.updateCamera();

        // Update HUD
        this.updateHUD();

        // Render main view
        this.renderer.render(this.scene, this.mainCamera);

        // Render drone camera view
        this.renderDroneCam();
    }
}

// Start the simulator
new DroneSimulator();
