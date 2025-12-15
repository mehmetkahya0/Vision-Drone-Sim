import * as THREE from 'three';

export class Drone {
    constructor(scene) {
        this.scene = scene;
        this.velocity = new THREE.Vector3();
        this.angularVelocity = 0;
        this.propellerSpeed = 0;
        
        // Improved physics settings
        this.maxSpeed = 60;
        this.maxVerticalSpeed = 25;
        this.acceleration = 40;
        this.deceleration = 0.92;
        this.airResistance = 0.98;
        this.rotationSpeed = 2.5;
        this.rotationDamping = 0.9;
        this.verticalAcceleration = 35;
        this.gravity = 12;
        this.minAltitude = 2;
        this.maxAltitude = 500;
        
        // Stability and tilt
        this.tiltRecovery = 0.03;
        this.maxTilt = 0.5; // ~28 degrees max bank
        this.tiltSpeed = 0.12; // How fast drone tilts
        this.currentTiltX = 0;
        this.currentTiltZ = 0;
        
        // State
        this.isThrottleActive = false;
        this.targetAltitude = null;
        
        this.createDrone();
    }

    createDrone() {
        this.mesh = new THREE.Group();

        // Main body
        const bodyGeometry = new THREE.BoxGeometry(3, 0.8, 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.7,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);

        // Top cover
        const coverGeometry = new THREE.BoxGeometry(2.5, 0.4, 1.5);
        const coverMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            metalness: 0.5,
            roughness: 0.4
        });
        const cover = new THREE.Mesh(coverGeometry, coverMaterial);
        cover.position.y = 0.6;
        cover.castShadow = true;
        this.mesh.add(cover);

        // Camera housing
        const cameraHousingGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const cameraHousingMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.8,
            roughness: 0.2
        });
        const cameraHousing = new THREE.Mesh(cameraHousingGeo, cameraHousingMat);
        cameraHousing.position.set(0, -0.5, 1.2);
        cameraHousing.castShadow = true;
        this.mesh.add(cameraHousing);

        // Camera lens
        const lensGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.2, 16);
        const lensMat = new THREE.MeshStandardMaterial({
            color: 0x000033,
            metalness: 0.9,
            roughness: 0.1
        });
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(0, -0.5, 1.5);
        this.mesh.add(lens);

        // Arms and propellers
        this.propellers = [];
        const armPositions = [
            { x: 2, z: 1.5 },
            { x: -2, z: 1.5 },
            { x: 2, z: -1.5 },
            { x: -2, z: -1.5 }
        ];

        armPositions.forEach((pos, index) => {
            // Arm
            const armGeometry = new THREE.BoxGeometry(2, 0.2, 0.3);
            const armMaterial = new THREE.MeshStandardMaterial({
                color: 0x444444,
                metalness: 0.6,
                roughness: 0.4
            });
            const arm = new THREE.Mesh(armGeometry, armMaterial);
            
            const angle = Math.atan2(pos.z, pos.x);
            arm.position.set(pos.x / 2, 0, pos.z / 2);
            arm.rotation.y = -angle;
            arm.castShadow = true;
            this.mesh.add(arm);

            // Motor housing
            const motorGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.4, 16);
            const motorMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.7,
                roughness: 0.3
            });
            const motor = new THREE.Mesh(motorGeometry, motorMaterial);
            motor.position.set(pos.x, 0.2, pos.z);
            motor.castShadow = true;
            this.mesh.add(motor);

            // Propeller
            const propellerGroup = new THREE.Group();
            propellerGroup.position.set(pos.x, 0.5, pos.z);

            const bladeGeometry = new THREE.BoxGeometry(1.8, 0.05, 0.2);
            const bladeMaterial = new THREE.MeshStandardMaterial({
                color: 0x111111,
                metalness: 0.3,
                roughness: 0.7
            });

            const blade1 = new THREE.Mesh(bladeGeometry, bladeMaterial);
            const blade2 = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade2.rotation.y = Math.PI / 2;

            propellerGroup.add(blade1);
            propellerGroup.add(blade2);
            
            // Propeller blur disc (visible when spinning fast)
            const discGeometry = new THREE.CircleGeometry(0.9, 32);
            const discMaterial = new THREE.MeshBasicMaterial({
                color: 0x888888,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide
            });
            const disc = new THREE.Mesh(discGeometry, discMaterial);
            disc.rotation.x = -Math.PI / 2;
            disc.position.y = 0.1;
            propellerGroup.add(disc);
            propellerGroup.userData.disc = disc;

            this.propellers.push(propellerGroup);
            this.mesh.add(propellerGroup);
        });

        // Landing gear
        const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            metalness: 0.5,
            roughness: 0.5
        });

        const legPositions = [
            { x: 1, z: 0.8 },
            { x: -1, z: 0.8 },
            { x: 1, z: -0.8 },
            { x: -1, z: -0.8 }
        ];

        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(pos.x, -1, pos.z);
            leg.castShadow = true;
            this.mesh.add(leg);

            // Foot
            const footGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const foot = new THREE.Mesh(footGeometry, legMaterial);
            foot.position.set(pos.x, -1.6, pos.z);
            foot.castShadow = true;
            this.mesh.add(foot);
        });

        // LED lights
        const ledGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        
        // Front LEDs (green)
        const greenLedMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const frontLeftLed = new THREE.Mesh(ledGeometry, greenLedMaterial);
        frontLeftLed.position.set(0.8, 0, 1);
        this.mesh.add(frontLeftLed);
        
        const frontRightLed = new THREE.Mesh(ledGeometry, greenLedMaterial);
        frontRightLed.position.set(-0.8, 0, 1);
        this.mesh.add(frontRightLed);

        // Rear LEDs (red)
        const redLedMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const rearLeftLed = new THREE.Mesh(ledGeometry, redLedMaterial);
        rearLeftLed.position.set(0.8, 0, -1);
        this.mesh.add(rearLeftLed);
        
        const rearRightLed = new THREE.Mesh(ledGeometry, redLedMaterial);
        rearRightLed.position.set(-0.8, 0, -1);
        this.mesh.add(rearRightLed);

        // Add point lights for LEDs
        const greenLight = new THREE.PointLight(0x00ff00, 0.5, 5);
        greenLight.position.set(0, 0, 1);
        this.mesh.add(greenLight);

        const redLight = new THREE.PointLight(0xff0000, 0.5, 5);
        redLight.position.set(0, 0, -1);
        this.mesh.add(redLight);

        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
    }

    update(delta) {
        // Clamp delta to prevent physics explosion
        delta = Math.min(delta, 0.05);
        
        // Apply gravity with hover compensation
        if (!this.isThrottleActive && this.mesh.position.y > this.minAltitude) {
            this.velocity.y -= this.gravity * delta;
        } else if (this.isThrottleActive) {
            // Slight gravity still applies when throttle is active for realism
            this.velocity.y -= this.gravity * delta * 0.3;
        }
        
        // Air resistance (more resistance at higher speeds)
        const speedFactor = this.velocity.length() / this.maxSpeed;
        const currentAirResistance = this.airResistance - (speedFactor * 0.05);
        this.velocity.x *= currentAirResistance;
        this.velocity.z *= currentAirResistance;
        this.velocity.y *= 0.95; // Vertical damping

        // Apply velocity
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));

        // Ground collision with bounce
        if (this.mesh.position.y < this.minAltitude) {
            this.mesh.position.y = this.minAltitude;
            this.velocity.y = Math.abs(this.velocity.y) * 0.3; // Small bounce
            if (this.velocity.y < 1) this.velocity.y = 0;
        }
        
        // Max altitude limit
        if (this.mesh.position.y > this.maxAltitude) {
            this.mesh.position.y = this.maxAltitude;
            this.velocity.y = Math.min(0, this.velocity.y);
        }

        // Apply horizontal deceleration
        this.velocity.x *= this.deceleration;
        this.velocity.z *= this.deceleration;
        
        // Stop very small velocities
        if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
        if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;

        // Update propeller rotation based on throttle and movement
        const speed = this.velocity.length();
        const baseSpeed = this.mesh.position.y > this.minAltitude + 1 ? 40 : 20;
        const targetPropSpeed = baseSpeed + speed * 1.5 + (this.isThrottleActive ? 20 : 0);
        this.propellerSpeed += (targetPropSpeed - this.propellerSpeed) * 0.15;

        this.propellers.forEach((propeller, index) => {
            const direction = index % 2 === 0 ? 1 : -1;
            propeller.rotation.y += this.propellerSpeed * delta * direction;
            
            // Update blur disc opacity based on speed
            const disc = propeller.userData.disc;
            if (disc) {
                disc.material.opacity = Math.min(0.4, this.propellerSpeed / 80);
            }
        });

        // Realistic tilt based on movement direction and speed
        const forwardVel = this.getLocalVelocity();
        const horizontalSpeed = Math.sqrt(forwardVel.x ** 2 + forwardVel.z ** 2);
        const speedRatio = Math.min(horizontalSpeed / this.maxSpeed, 1);
        
        // Calculate target tilt based on local velocity
        // Forward/backward movement = pitch (rotation.x)
        // Left/right movement = roll (rotation.z)
        const tiltIntensity = 0.015 + speedRatio * 0.01; // More tilt at higher speeds
        
        let targetTiltX = forwardVel.z * tiltIntensity; // Pitch forward (nose down) when moving forward
        let targetTiltZ = -forwardVel.x * tiltIntensity;  // Roll into turns
        
        // Add extra tilt during acceleration (jerky movements)
        if (this.isThrottleActive) {
            targetTiltX *= 1.3;
            targetTiltZ *= 1.3;
        }
        
        // Clamp to max tilt
        targetTiltX = THREE.MathUtils.clamp(targetTiltX, -this.maxTilt, this.maxTilt);
        targetTiltZ = THREE.MathUtils.clamp(targetTiltZ, -this.maxTilt, this.maxTilt);
        
        // Smooth tilt interpolation (faster response, smooth recovery)
        this.currentTiltX += (targetTiltX - this.currentTiltX) * this.tiltSpeed;
        this.currentTiltZ += (targetTiltZ - this.currentTiltZ) * this.tiltSpeed;
        
        this.mesh.rotation.x = this.currentTiltX;
        this.mesh.rotation.z = this.currentTiltZ;
        
        // Natural tilt recovery when not moving
        if (speed < 1) {
            this.mesh.rotation.x *= (1 - this.tiltRecovery);
            this.mesh.rotation.z *= (1 - this.tiltRecovery);
        }
        
        // Reset throttle state (will be set by controls each frame)
        this.isThrottleActive = false;
    }
    
    getLocalVelocity() {
        // Convert world velocity to local velocity
        const localVel = this.velocity.clone();
        const inverseRotation = -this.mesh.rotation.y;
        const cos = Math.cos(inverseRotation);
        const sin = Math.sin(inverseRotation);
        return new THREE.Vector3(
            localVel.x * cos - localVel.z * sin,
            localVel.y,
            localVel.x * sin + localVel.z * cos
        );
    }

    applyForce(direction, delta) {
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);

        const force = new THREE.Vector3();
        
        // Acceleration varies with altitude (thinner air = less control at high altitude)
        const altitudeFactor = Math.max(0.5, 1 - (this.mesh.position.y / this.maxAltitude) * 0.5);
        const currentAcceleration = this.acceleration * altitudeFactor;

        if (direction.z !== 0) {
            force.add(forward.clone().multiplyScalar(direction.z * currentAcceleration * delta));
        }
        if (direction.x !== 0) {
            force.add(right.clone().multiplyScalar(direction.x * currentAcceleration * delta * 0.8)); // Strafe slightly slower
        }

        this.velocity.add(force);
        this.isThrottleActive = true;

        // Clamp horizontal speed with smooth limiting
        const horizontalSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
        if (horizontalSpeed > this.maxSpeed) {
            const scale = this.maxSpeed / horizontalSpeed;
            this.velocity.x *= scale;
            this.velocity.z *= scale;
        }
    }

    ascend(delta) {
        this.velocity.y += this.verticalAcceleration * delta;
        this.velocity.y = Math.min(this.velocity.y, this.maxVerticalSpeed);
        this.isThrottleActive = true;
    }

    descend(delta) {
        this.velocity.y -= this.verticalAcceleration * delta;
        this.velocity.y = Math.max(this.velocity.y, -this.maxVerticalSpeed);
        this.isThrottleActive = true;
    }

    rotate(direction, delta) {
        this.angularVelocity += direction * this.rotationSpeed * delta;
        this.angularVelocity *= this.rotationDamping;
        this.mesh.rotation.y += this.angularVelocity * delta;
    }

    reset() {
        this.mesh.position.set(0, 30, 0);
        this.mesh.rotation.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
        this.angularVelocity = 0;
        this.propellerSpeed = 0;
    }
}
