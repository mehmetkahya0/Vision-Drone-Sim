import * as THREE from 'three';

export class Drone {
    constructor(scene) {
        this.scene = scene;
        this.velocity = new THREE.Vector3();
        this.angularVelocity = 0;
        this.propellerSpeed = 0;
        
        // Physics settings
        this.maxSpeed = 120;
        this.maxVerticalSpeed = 50;
        this.acceleration = 80;
        this.deceleration = 0.94;
        this.airResistance = 0.985;
        this.rotationSpeed = 3.5;
        this.rotationDamping = 0.92;
        this.verticalAcceleration = 60;
        this.gravity = 15;
        this.minAltitude = 2;
        this.maxAltitude = 500;
        
        // Enhanced physics
        this.momentum = new THREE.Vector3(); // Momentum for smooth acceleration
        this.angularMomentum = 0;
        this.mass = 1.2; // Drone mass for realistic inertia
        this.dragCoefficient = 0.08; // Air drag
        this.inertia = 0.7; // Rotational inertia
        this.brakingForce = 0.15; // Braking efficiency
        
        // Tilt settings
        this.tiltRecovery = 0.03;
        this.maxTilt = 0.5;
        this.tiltSpeed = 0.12;
        this.currentTiltX = 0;
        this.currentTiltZ = 0;
        
        // State
        this.isThrottleActive = false;
        this.headlightOn = false;
        
        // Battery simulation
        this.battery = {
            level: 100,
            drainRate: 0.005, // % per second
            drainMultiplier: 1.0 // Higher when moving
        };
        
        this.createDrone();
    }

    createDrone() {
        this.mesh = new THREE.Group();

        // === DRONE BODY - All MeshBasicMaterial for visibility ===
        
        // Main body (dark gray box)
        const bodyGeo = new THREE.BoxGeometry(3, 0.8, 2);
        const bodyMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        this.mesh.add(body);

        // Top cover
        const coverGeo = new THREE.BoxGeometry(2.5, 0.4, 1.5);
        const coverMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
        const cover = new THREE.Mesh(coverGeo, coverMat);
        cover.position.y = 0.6;
        this.mesh.add(cover);

        // Camera housing (sphere at front bottom)
        const camHousingGeo = new THREE.SphereGeometry(0.4, 12, 12);
        const camHousingMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        const camHousing = new THREE.Mesh(camHousingGeo, camHousingMat);
        camHousing.position.set(0, -0.5, 1.2);
        this.mesh.add(camHousing);

        // Camera lens
        const lensGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.2, 12);
        const lensMat = new THREE.MeshBasicMaterial({ color: 0x000066 });
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(0, -0.5, 1.5);
        this.mesh.add(lens);

        // === ARMS AND PROPELLERS ===
        this.propellers = [];
        const armPositions = [
            { x: 2, z: 1.5 },
            { x: -2, z: 1.5 },
            { x: 2, z: -1.5 },
            { x: -2, z: -1.5 }
        ];

        const armMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
        const motorMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const bladeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

        armPositions.forEach((pos, index) => {
            // Arm
            const armGeo = new THREE.BoxGeometry(2, 0.2, 0.3);
            const arm = new THREE.Mesh(armGeo, armMat);
            const angle = Math.atan2(pos.z, pos.x);
            arm.position.set(pos.x / 2, 0, pos.z / 2);
            arm.rotation.y = -angle;
            this.mesh.add(arm);

            // Motor
            const motorGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.4, 12);
            const motor = new THREE.Mesh(motorGeo, motorMat);
            motor.position.set(pos.x, 0.2, pos.z);
            this.mesh.add(motor);

            // Propeller group
            const propGroup = new THREE.Group();
            propGroup.position.set(pos.x, 0.5, pos.z);

            // Blades
            const bladeGeo = new THREE.BoxGeometry(1.8, 0.05, 0.2);
            const blade1 = new THREE.Mesh(bladeGeo, bladeMat);
            const blade2 = new THREE.Mesh(bladeGeo, bladeMat);
            blade2.rotation.y = Math.PI / 2;
            propGroup.add(blade1);
            propGroup.add(blade2);

            // Blur disc
            const discGeo = new THREE.CircleGeometry(0.9, 24);
            const discMat = new THREE.MeshBasicMaterial({
                color: 0x888888,
                transparent: true,
                opacity: 0.001,
                side: THREE.DoubleSide,
                map: undefined
            });
            const disc = new THREE.Mesh(discGeo, discMat);
            disc.rotation.x = -Math.PI / 2;
            disc.position.y = 0.1;
            disc.visible = false;  // Start invisible, show when spinning
            propGroup.add(disc);
            propGroup.userData.disc = disc;

            this.propellers.push(propGroup);
            this.mesh.add(propGroup);
        });

        // === LANDING GEAR ===
        const legMat = new THREE.MeshBasicMaterial({ color: 0x555555 });
        const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8);
        const footGeo = new THREE.SphereGeometry(0.15, 8, 8);
        
        const legPositions = [
            { x: 1, z: 0.8 },
            { x: -1, z: 0.8 },
            { x: 1, z: -0.8 },
            { x: -1, z: -0.8 }
        ];

        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(pos.x, -1, pos.z);
            this.mesh.add(leg);

            const foot = new THREE.Mesh(footGeo, legMat);
            foot.position.set(pos.x, -1.6, pos.z);
            this.mesh.add(foot);
        });

        // === LED LIGHTS ===
        const ledGeo = new THREE.SphereGeometry(0.1, 8, 8);
        
        // Front LEDs (green)
        const greenMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const frontLeftLed = new THREE.Mesh(ledGeo, greenMat);
        frontLeftLed.position.set(0.8, 0, 1);
        this.mesh.add(frontLeftLed);
        
        const frontRightLed = new THREE.Mesh(ledGeo, greenMat);
        frontRightLed.position.set(-0.8, 0, 1);
        this.mesh.add(frontRightLed);

        // Rear LEDs (red)
        const redMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const rearLeftLed = new THREE.Mesh(ledGeo, redMat);
        rearLeftLed.position.set(0.8, 0, -1);
        this.mesh.add(rearLeftLed);
        
        const rearRightLed = new THREE.Mesh(ledGeo, redMat);
        rearRightLed.position.set(-0.8, 0, -1);
        this.mesh.add(rearRightLed);

        // LED point lights for glow effect
        const greenLight = new THREE.PointLight(0x00ff00, 0.5, 5);
        greenLight.position.set(0, 0, 1);
        this.mesh.add(greenLight);

        const redLight = new THREE.PointLight(0xff0000, 0.5, 5);
        redLight.position.set(0, 0, -1);
        this.mesh.add(redLight);
        
        // === HEADLIGHT ===
        // Headlight housing
        const hlHousingGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.15, 12);
        const hlHousingMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const hlHousing = new THREE.Mesh(hlHousingGeo, hlHousingMat);
        hlHousing.rotation.x = Math.PI / 2;
        hlHousing.position.set(0, -0.6, 1.45);
        this.mesh.add(hlHousing);
        
        // Headlight lens (changes color when on)
        const hlLensGeo = new THREE.CircleGeometry(0.16, 12);
        this.headlightLensMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
        this.headlightLens = new THREE.Mesh(hlLensGeo, this.headlightLensMat);
        this.headlightLens.position.set(0, -0.6, 1.53);
        this.mesh.add(this.headlightLens);
        
        // Spotlight for headlight beam
        this.headlight = new THREE.SpotLight(0xffffff, 0, 100, Math.PI / 6, 0.5, 1);
        this.headlight.position.set(0, -0.6, 1.5);
        this.mesh.add(this.headlight);
        
        // Headlight target (where the light points)
        this.headlightTarget = new THREE.Object3D();
        this.headlightTarget.position.set(0, -30, 80);
        this.mesh.add(this.headlightTarget);
        this.headlight.target = this.headlightTarget;

        // Add drone to scene
        this.scene.add(this.mesh);
        console.log('Drone: Created successfully');
    }
    
    toggleHeadlight() {
        this.headlightOn = !this.headlightOn;
        
        if (this.headlightOn) {
            this.headlight.intensity = 5;
            this.headlightLensMat.color.setHex(0xffffee);
        } else {
            this.headlight.intensity = 0;
            this.headlightLensMat.color.setHex(0x444444);
        }
        
        console.log('Headlight:', this.headlightOn ? 'ON' : 'OFF');
        return this.headlightOn;
    }

    update(delta) {
        delta = Math.min(delta, 0.05);
        
        // Battery drain
        const speed = this.velocity.length();
        this.battery.drainMultiplier = 1.0 + (speed / this.maxSpeed) * 0.5 + (this.isThrottleActive ? 0.3 : 0);
        this.battery.level -= this.battery.drainRate * delta * this.battery.drainMultiplier;
        this.battery.level = Math.max(0, this.battery.level);
        
        // Battery affects performance when low
        const batteryFactor = this.battery.level > 20 ? 1.0 : 0.3 + (this.battery.level / 20) * 0.7;
        
        // Gravity with battery factor
        if (!this.isThrottleActive && this.mesh.position.y > this.minAltitude) {
            this.velocity.y -= this.gravity * delta * batteryFactor;
        } else if (this.isThrottleActive) {
            this.velocity.y -= this.gravity * delta * 0.3 * batteryFactor;
        }
        
        // Drag coefficient - increases with speed
        const speedFactor = speed / this.maxSpeed;
        const dragForce = this.dragCoefficient * speedFactor * speedFactor;
        
        // Air resistance with momentum smoothing
        const resistance = Math.pow(this.airResistance, delta) - (speedFactor * dragForce * delta);
        this.velocity.x *= resistance;
        this.velocity.z *= resistance;
        this.velocity.y *= 0.95;

        // Apply velocity
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));

        // Smooth ground collision with bounce
        if (this.mesh.position.y < this.minAltitude) {
            this.mesh.position.y = this.minAltitude;
            const bounceReduction = 0.2;
            this.velocity.y = Math.abs(this.velocity.y) * bounceReduction;
            if (this.velocity.y < 0.5) this.velocity.y = 0;
        }
        
        // Max altitude constraint
        if (this.mesh.position.y > this.maxAltitude) {
            this.mesh.position.y = this.maxAltitude;
            this.velocity.y = Math.min(0, this.velocity.y);
        }

        // Velocity clamping for stability
        const horizontalSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
        if (horizontalSpeed > this.maxSpeed) {
            const scale = this.maxSpeed / horizontalSpeed;
            this.velocity.x *= scale;
            this.velocity.z *= scale;
        }
        
        if (Math.abs(this.velocity.y) > this.maxVerticalSpeed) {
            this.velocity.y = Math.sign(this.velocity.y) * this.maxVerticalSpeed;
        }

        // Propeller animation based on altitude and speed
        const baseSpeed = this.mesh.position.y > this.minAltitude + 1 ? 40 : 20;
        const targetPropSpeed = baseSpeed + speed * 1.5 + (this.isThrottleActive ? 20 : 0);
        this.propellerSpeed += (targetPropSpeed - this.propellerSpeed) * 0.15;

        this.propellers.forEach((propeller, index) => {
            const direction = index % 2 === 0 ? 1 : -1;
            propeller.rotation.y += this.propellerSpeed * delta * direction;
            
            const disc = propeller.userData.disc;
            if (disc && disc.material) {
                const targetOpacity = Math.min(0.4, this.propellerSpeed / 80);
                disc.visible = targetOpacity > 0.01;
                if (disc.visible) {
                    disc.material.opacity = targetOpacity;
                }
            }
        });

        // Natural tilt based on movement direction and speed
        const forwardVel = this.getLocalVelocity();
        const horizontalVel = Math.sqrt(forwardVel.x ** 2 + forwardVel.z ** 2);
        const speedRatio = Math.min(horizontalVel / this.maxSpeed, 1);
        
        const tiltIntensity = 0.015 + speedRatio * 0.01;
        
        let targetTiltX = forwardVel.z * tiltIntensity;
        let targetTiltZ = -forwardVel.x * tiltIntensity;
        
        if (this.isThrottleActive) {
            targetTiltX *= 1.3;
            targetTiltZ *= 1.3;
        }
        
        targetTiltX = THREE.MathUtils.clamp(targetTiltX, -this.maxTilt, this.maxTilt);
        targetTiltZ = THREE.MathUtils.clamp(targetTiltZ, -this.maxTilt, this.maxTilt);
        
        this.currentTiltX += (targetTiltX - this.currentTiltX) * this.tiltSpeed;
        this.currentTiltZ += (targetTiltZ - this.currentTiltZ) * this.tiltSpeed;
        
        this.mesh.rotation.x = this.currentTiltX;
        this.mesh.rotation.z = this.currentTiltZ;
        
        // Natural recovery when not moving
        if (speed < 1) {
            this.mesh.rotation.x *= (1 - this.tiltRecovery);
            this.mesh.rotation.z *= (1 - this.tiltRecovery);
        }
        
        this.isThrottleActive = false;
    }
    
    getLocalVelocity() {
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
        const yaw = this.mesh.rotation.y;
        const cosYaw = Math.cos(yaw);
        const sinYaw = Math.sin(yaw);
        
        const localForceX = direction.x * this.acceleration * delta;
        const localForceZ = direction.z * this.acceleration * delta;
        
        const worldForceX = localForceX * cosYaw + localForceZ * sinYaw;
        const worldForceZ = -localForceX * sinYaw + localForceZ * cosYaw;
        
        this.velocity.x += worldForceX;
        this.velocity.z += worldForceZ;
        this.isThrottleActive = true;

        const horizontalSpeedSq = this.velocity.x ** 2 + this.velocity.z ** 2;
        const maxSpeedSq = this.maxSpeed ** 2;
        if (horizontalSpeedSq > maxSpeedSq) {
            const scale = this.maxSpeed / Math.sqrt(horizontalSpeedSq);
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
        this.currentTiltX = 0;
        this.currentTiltZ = 0;
    }
}
