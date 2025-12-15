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
        // Main renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.5;
        document.body.appendChild(this.renderer.domElement);
        this.renderer.domElement.id = 'main-canvas';

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 500, 2000);

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
        this.world = new World(this.scene);

        // Create drone
        this.drone = new Drone(this.scene);
        this.drone.mesh.position.set(0, 30, 0);

        // Attach drone camera to drone (FPV camera position)
        this.drone.mesh.add(this.droneCamera);
        this.droneCamera.position.set(0, -0.3, 1.3); // At camera housing position on drone front
        this.droneCamera.rotation.set(-0.15, Math.PI, 0); // Rotated 180° to look forward, slight downward angle

        // Controls
        this.controls = new Controls(this.drone);
        
        // Drone cam fullscreen toggle
        this.droneCamFullscreen = false;
        this.controls.onToggleDroneCam = () => this.toggleDroneCamFullscreen();

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
    }

    setupLighting() {
        // Ambient light - brighter
        const ambientLight = new THREE.AmbientLight(0x606060, 1.2);
        this.scene.add(ambientLight);

        // Hemisphere light for natural sky lighting - brighter
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x606060, 1.0);
        this.scene.add(hemiLight);

        // Main directional light (sun) - brighter
        this.sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
        this.sunLight.position.set(100, 200, 100);
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
        this.sunLight.position.set(
            dronePosition.x + 100,
            200,
            dronePosition.z + 100
        );
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
        
        // Flip vertically while copying
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcIdx = ((height - 1 - y) * width + x) * 4;
                const dstIdx = (y * width + x) * 4;
                imageData.data[dstIdx] = pixelBuffer[srcIdx];
                imageData.data[dstIdx + 1] = pixelBuffer[srcIdx + 1];
                imageData.data[dstIdx + 2] = pixelBuffer[srcIdx + 2];
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

        // Add timestamp overlay
        this.droneCamCtx.fillStyle = '#00ff00';
        this.droneCamCtx.font = this.droneCamFullscreen ? '16px monospace' : '10px monospace';
        const now = new Date();
        this.droneCamCtx.fillText(
            `REC ● ${now.toLocaleTimeString()}`,
            10, height - 10
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
