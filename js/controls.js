export class Controls {
    constructor(drone) {
        this.drone = drone;
        this.keys = {};
        this.onToggleDroneCam = null; // Callback for drone cam toggle
        this.onToggleHeadlight = null; // Callback for headlight toggle
        this.onSwitchEnvironment = null; // Callback for environment switch
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Toggle drone cam fullscreen
            if (e.code === 'KeyC') {
                if (this.onToggleDroneCam) {
                    this.onToggleDroneCam();
                }
                e.preventDefault();
            }
            
            // Toggle headlight
            if (e.code === 'KeyL') {
                if (this.onToggleHeadlight) {
                    this.onToggleHeadlight();
                }
                e.preventDefault();
            }
            
            // Switch environment/map
            if (e.code === 'KeyM') {
                if (this.onSwitchEnvironment) {
                    this.onSwitchEnvironment();
                }
                e.preventDefault();
            }
            
            // Prevent default for game controls
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyR', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Handle focus loss
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    }

    update(delta) {
        const direction = { x: 0, z: 0 };

        // Forward/Backward
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            direction.z = 1;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            direction.z = -1;
        }

        // Strafe Left/Right (fixed direction)
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            direction.x = 1;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            direction.x = -1;
        }

        // Apply movement
        if (direction.x !== 0 || direction.z !== 0) {
            this.drone.applyForce(direction, delta);
        }

        // Rotation
        if (this.keys['KeyQ']) {
            this.drone.rotate(1, delta);
        }
        if (this.keys['KeyE']) {
            this.drone.rotate(-1, delta);
        }

        // Vertical movement
        if (this.keys['Space']) {
            this.drone.ascend(delta);
        }
        if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
            this.drone.descend(delta);
        }

        // Reset
        if (this.keys['KeyR']) {
            this.drone.reset();
            this.keys['KeyR'] = false; // Prevent continuous reset
        }
    }
}
