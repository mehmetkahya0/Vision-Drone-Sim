import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.worldSize = 2000;
        
        // Detectable objects for YOLO
        this.detectableObjects = [];
        
        // Initialize arrays for dynamic lighting
        this.streetLights = [];
        this.buildingWindows = [];
        this.roads = [];
        this.intersections = [];
        
        console.log('World: Starting creation...');
        
        // Create world - all using MeshBasicMaterial for guaranteed visibility
        this.createGround();
        this.createRoads();
        this.createBuildings();
        this.createVehicles();
        this.createPeople();
        this.createTrees();
        this.createTrafficLights();
        this.createStreetLamps();
        
        console.log('World: Creation complete. Total scene objects:', this.scene.children.length);
        console.log('World: Detectable objects:', this.detectableObjects.length);
    }

    createGround() {
        // Simple green ground plane
        const groundGeo = new THREE.PlaneGeometry(this.worldSize, this.worldSize);
        this.groundMaterial = new THREE.MeshBasicMaterial({ color: 0x3d8b3d });
        this.ground = new THREE.Mesh(groundGeo, this.groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -0.1;
        this.scene.add(this.ground);
        console.log('World: Ground created');
    }

    createRoads() {
        const roadMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
        const markingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // Road configurations
        const roadConfigs = [
            { x: 0, z: 0, width: 20, length: 1800, rotation: 0 },
            { x: 0, z: 300, width: 16, length: 1600, rotation: 0 },
            { x: 0, z: -300, width: 16, length: 1600, rotation: 0 },
            { x: 0, z: 0, width: 20, length: 1800, rotation: Math.PI / 2 },
            { x: 300, z: 0, width: 16, length: 1600, rotation: Math.PI / 2 },
            { x: -300, z: 0, width: 16, length: 1600, rotation: Math.PI / 2 },
        ];

        roadConfigs.forEach(config => {
            // Road surface
            const roadGeo = new THREE.PlaneGeometry(config.width, config.length);
            const road = new THREE.Mesh(roadGeo, roadMat);
            road.rotation.x = -Math.PI / 2;
            road.rotation.z = config.rotation;
            road.position.set(config.x, 0.01, config.z);
            this.scene.add(road);
            this.roads.push(config);

            // Center line markings (dashed)
            const dashCount = Math.floor(config.length / 12);
            const dashGeo = new THREE.PlaneGeometry(0.3, 4);
            
            for (let i = 0; i < dashCount; i++) {
                const offset = (i - dashCount / 2) * 12;
                const dash = new THREE.Mesh(dashGeo, markingMat);
                dash.rotation.x = -Math.PI / 2;
                dash.rotation.z = config.rotation;
                
                if (config.rotation === 0) {
                    dash.position.set(config.x + offset, 0.02, config.z);
                } else {
                    dash.position.set(config.x, 0.02, config.z + offset);
                }
                this.scene.add(dash);
            }
        });

        // Intersections
        this.intersections = [
            { x: 0, z: 0 },
            { x: 300, z: 0 }, { x: -300, z: 0 },
            { x: 0, z: 300 }, { x: 0, z: -300 },
            { x: 300, z: 300 }, { x: -300, z: 300 },
            { x: 300, z: -300 }, { x: -300, z: -300 },
        ];

        // Crosswalks at intersections
        const stripeGeo = new THREE.PlaneGeometry(0.6, 4);
        this.intersections.forEach(inter => {
            for (let dir = 0; dir < 2; dir++) {
                for (let i = 0; i < 6; i++) {
                    const stripe = new THREE.Mesh(stripeGeo, markingMat);
                    stripe.rotation.x = -Math.PI / 2;
                    stripe.rotation.z = dir * Math.PI / 2;

                    const offset = (i - 3) * 1.5;
                    if (dir === 0) {
                        stripe.position.set(inter.x + offset, 0.02, inter.z + 12);
                    } else {
                        stripe.position.set(inter.x + 12, 0.02, inter.z + offset);
                    }
                    this.scene.add(stripe);
                }
            }
        });
        
        console.log('World: Roads created:', this.roads.length);
    }

    createBuildings() {
        const buildingColors = [0x888888, 0x777777, 0x999999, 0x6688aa, 0xaa8866, 0x996666, 0x669966];
        
        const clusters = [
            { cx: 150, cz: 150, count: 8 },
            { cx: -150, cz: 150, count: 8 },
            { cx: 150, cz: -150, count: 8 },
            { cx: -150, cz: -150, count: 8 },
            { cx: 450, cz: 0, count: 5 },
            { cx: -450, cz: 0, count: 5 },
            { cx: 0, cz: 450, count: 5 },
            { cx: 0, cz: -450, count: 5 },
            { cx: 450, cz: 300, count: 4 },
            { cx: -450, cz: 300, count: 4 },
            { cx: 450, cz: -300, count: 4 },
            { cx: -450, cz: -300, count: 4 },
        ];

        let buildingCount = 0;
        clusters.forEach(cluster => {
            for (let i = 0; i < cluster.count; i++) {
                const width = 15 + Math.random() * 30;
                const depth = 15 + Math.random() * 30;
                const height = 15 + Math.random() * 60;
                
                const geo = new THREE.BoxGeometry(width, height, depth);
                const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
                const mat = new THREE.MeshBasicMaterial({ color: color });
                const building = new THREE.Mesh(geo, mat);

                const angle = Math.random() * Math.PI * 2;
                const radius = 30 + Math.random() * 70;
                building.position.set(
                    cluster.cx + Math.cos(angle) * radius,
                    height / 2,
                    cluster.cz + Math.sin(angle) * radius
                );
                building.userData = { type: 'building', label: 'building' };
                this.scene.add(building);
                this.detectableObjects.push(building);
                buildingCount++;
                
                // Add windows
                this.addWindowsToBuilding(building, width, height, depth);
            }
        });
        
        console.log('World: Buildings created:', buildingCount);
    }
    
    addWindowsToBuilding(building, width, height, depth) {
        const windowOnMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        const windowOffMat = new THREE.MeshBasicMaterial({ color: 0x334455 });
        const windowSize = 2;
        const spacing = 5;
        
        const floorsCount = Math.floor(height / spacing) - 1;
        const windowsPerFloor = Math.floor(width / spacing) - 1;
        
        const windowGeo = new THREE.PlaneGeometry(windowSize, windowSize * 1.5);
        
        // Limit windows for performance
        for (let floor = 0; floor < Math.min(floorsCount, 8); floor++) {
            for (let w = 0; w < Math.min(windowsPerFloor, 6); w++) {
                const isLit = Math.random() > 0.6;
                const mat = isLit ? windowOnMat : windowOffMat;
                
                // Front face windows
                const win = new THREE.Mesh(windowGeo, mat);
                win.position.set(
                    (w - windowsPerFloor / 2) * spacing + spacing / 2,
                    -height / 2 + 4 + floor * spacing,
                    depth / 2 + 0.1
                );
                building.add(win);
                
                if (isLit) this.buildingWindows.push(win);
            }
        }
    }

    createVehicles() {
        const vehicleTypes = [
            { type: 'car', w: 2, h: 1.5, l: 4, color: null },
            { type: 'truck', w: 2.5, h: 3, l: 8, color: null },
            { type: 'bus', w: 2.5, h: 3.5, l: 12, color: 0xffcc00 },
        ];
        
        const carColors = [0xff0000, 0x0000ff, 0xffff00, 0x00ff00, 0xff6600, 0xffffff, 0x333333, 0x0088ff];

        let vehicleCount = 0;
        this.roads.forEach(road => {
            const count = Math.floor(road.length / 100);
            
            for (let i = 0; i < count; i++) {
                const vType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
                const color = vType.color || carColors[Math.floor(Math.random() * carColors.length)];
                
                const vehicle = new THREE.Group();
                
                // Body
                const bodyGeo = new THREE.BoxGeometry(vType.w, vType.h, vType.l);
                const bodyMat = new THREE.MeshBasicMaterial({ color: color });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = vType.h / 2 + 0.4;
                vehicle.add(body);
                
                // Wheels
                const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
                const wheelMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
                [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
                    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
                    wheel.rotation.z = Math.PI / 2;
                    wheel.position.set(sx * vType.w / 2, 0.4, sz * vType.l * 0.35);
                    vehicle.add(wheel);
                });
                
                // Windows for cars
                if (vType.type === 'car') {
                    const windowGeo = new THREE.BoxGeometry(vType.w * 0.9, vType.h * 0.4, vType.l * 0.4);
                    const windowMat = new THREE.MeshBasicMaterial({ color: 0x333344, transparent: true, opacity: 0.7, map: null });
                    const windows = new THREE.Mesh(windowGeo, windowMat);
                    windows.position.y = vType.h + 0.2;
                    vehicle.add(windows);
                }
                
                // Headlights
                const hlGeo = new THREE.CircleGeometry(0.15, 8);
                const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
                [-0.6, 0.6].forEach(x => {
                    const hl = new THREE.Mesh(hlGeo, hlMat);
                    hl.position.set(x, vType.h / 2 + 0.4, vType.l / 2 + 0.01);
                    vehicle.add(hl);
                });
                
                // Taillights
                const tlGeo = new THREE.CircleGeometry(0.12, 8);
                const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                [-0.6, 0.6].forEach(x => {
                    const tl = new THREE.Mesh(tlGeo, tlMat);
                    tl.rotation.y = Math.PI;
                    tl.position.set(x, vType.h / 2 + 0.4, -vType.l / 2 - 0.01);
                    vehicle.add(tl);
                });
                
                // Position on road
                const progress = (i + 0.5) / count;
                const posAlong = (progress - 0.5) * road.length * 0.8;
                const lane = Math.random() > 0.5 ? 1 : -1;
                const laneOffset = lane * (road.width / 4);

                if (road.rotation === 0) {
                    vehicle.position.set(road.x + posAlong, 0, road.z + laneOffset);
                    vehicle.rotation.y = lane > 0 ? Math.PI / 2 : -Math.PI / 2;
                } else {
                    vehicle.position.set(road.x + laneOffset, 0, road.z + posAlong);
                    vehicle.rotation.y = lane > 0 ? 0 : Math.PI;
                }

                vehicle.userData = { type: 'vehicle', label: vType.type };
                this.scene.add(vehicle);
                this.detectableObjects.push(vehicle);
                vehicleCount++;
            }
        });
        
        console.log('World: Vehicles created:', vehicleCount);
    }

    createPeople() {
        const clothColors = [0xff0000, 0x0000ff, 0x00aa00, 0xffff00, 0xff6600, 0x800080, 0x00aaaa];
        
        let personCount = 0;
        this.intersections.forEach(inter => {
            const count = 2 + Math.floor(Math.random() * 4);
            for (let i = 0; i < count; i++) {
                const clothColor = clothColors[Math.floor(Math.random() * clothColors.length)];
                
                const person = new THREE.Group();
                
                // Body/Torso
                const bodyGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8);
                const bodyMat = new THREE.MeshBasicMaterial({ color: clothColor });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 1.0;
                person.add(body);
                
                // Head
                const headGeo = new THREE.SphereGeometry(0.15, 8, 8);
                const headMat = new THREE.MeshBasicMaterial({ color: 0xffcc99 });
                const head = new THREE.Mesh(headGeo, headMat);
                head.position.y = 1.55;
                person.add(head);
                
                // Legs
                const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
                const legMat = new THREE.MeshBasicMaterial({ color: 0x333366 });
                [-0.1, 0.1].forEach(x => {
                    const leg = new THREE.Mesh(legGeo, legMat);
                    leg.position.set(x, 0.3, 0);
                    person.add(leg);
                });
                
                // Arms
                const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6);
                const armMat = new THREE.MeshBasicMaterial({ color: clothColor });
                [-0.28, 0.28].forEach(x => {
                    const arm = new THREE.Mesh(armGeo, armMat);
                    arm.position.set(x, 1.0, 0);
                    person.add(arm);
                });
                
                // Position near crosswalks
                const side = Math.random() > 0.5 ? 1 : -1;
                person.position.set(
                    inter.x + (Math.random() - 0.5) * 8,
                    0,
                    inter.z + side * (12 + Math.random() * 3)
                );
                person.rotation.y = Math.random() * Math.PI * 2;
                person.userData = { type: 'person', label: 'person' };
                this.scene.add(person);
                this.detectableObjects.push(person);
                personCount++;
            }
        });
        
        console.log('World: People created:', personCount);
    }

    createTrees() {
        const treeCount = 100;
        let created = 0;
        
        for (let i = 0; i < treeCount; i++) {
            let x, z, attempts = 0;
            do {
                x = (Math.random() - 0.5) * this.worldSize * 0.8;
                z = (Math.random() - 0.5) * this.worldSize * 0.8;
                attempts++;
            } while (this.isOnRoad(x, z) && attempts < 10);

            if (attempts < 10) {
                const tree = new THREE.Group();
                
                // Trunk
                const trunkGeo = new THREE.CylinderGeometry(0.4, 0.5, 5, 6);
                const trunkMat = new THREE.MeshBasicMaterial({ color: 0x8b4513 });
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.y = 2.5;
                tree.add(trunk);
                
                // Foliage (sphere or cone randomly)
                const foliageType = Math.random() > 0.5;
                let foliage;
                if (foliageType) {
                    const foliageGeo = new THREE.SphereGeometry(3 + Math.random() * 1, 8, 6);
                    const foliageMat = new THREE.MeshBasicMaterial({ color: 0x228b22 });
                    foliage = new THREE.Mesh(foliageGeo, foliageMat);
                    foliage.position.y = 6 + Math.random() * 2;
                } else {
                    const foliageGeo = new THREE.ConeGeometry(3, 6, 6);
                    const foliageMat = new THREE.MeshBasicMaterial({ color: 0x1a6b1a });
                    foliage = new THREE.Mesh(foliageGeo, foliageMat);
                    foliage.position.y = 7;
                }
                tree.add(foliage);
                
                tree.position.set(x, 0, z);
                tree.userData = { type: 'tree', label: 'tree' };
                this.scene.add(tree);
                created++;
            }
        }
        
        console.log('World: Trees created:', created);
    }

    isOnRoad(x, z) {
        for (const road of this.roads) {
            const hw = road.width / 2 + 8; // Extra margin
            if (road.rotation === 0) {
                if (Math.abs(z - road.z) < hw && Math.abs(x - road.x) < road.length / 2) return true;
            } else {
                if (Math.abs(x - road.x) < hw && Math.abs(z - road.z) < road.length / 2) return true;
            }
        }
        return false;
    }

    createTrafficLights() {
        const poleMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 4, 6);
        const boxGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
        const boxMat = new THREE.MeshBasicMaterial({ color: 0x222222 });

        let tlCount = 0;
        this.intersections.forEach(inter => {
            for (let i = 0; i < 4; i++) {
                const tl = new THREE.Group();
                
                // Pole
                const pole = new THREE.Mesh(poleGeo, poleMat);
                pole.position.y = 2;
                tl.add(pole);

                // Light box
                const box = new THREE.Mesh(boxGeo, boxMat);
                box.position.y = 4.4;
                tl.add(box);

                // Light circles
                const lightGeo = new THREE.CircleGeometry(0.12, 8);
                const lights = [
                    { color: 0xff0000, y: 4.8 },
                    { color: 0xffff00, y: 4.4 },
                    { color: 0x00ff00, y: 4.0 }
                ];
                lights.forEach(l => {
                    const light = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: l.color }));
                    light.position.set(0, l.y, 0.22);
                    tl.add(light);
                });

                const angle = (i * Math.PI / 2) + Math.PI / 4;
                tl.position.set(
                    inter.x + Math.cos(angle) * 12,
                    0,
                    inter.z + Math.sin(angle) * 12
                );
                tl.rotation.y = angle + Math.PI;
                tl.userData = { type: 'traffic_light', label: 'traffic light' };
                this.scene.add(tl);
                this.detectableObjects.push(tl);
                tlCount++;
            }
        });
        
        console.log('World: Traffic lights created:', tlCount);
    }

    createStreetLamps() {
        const poleMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
        const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
        
        const spacing = 50;
        let lampCount = 0;
        
        this.roads.forEach(road => {
            const count = Math.floor(road.length / spacing);
            
            for (let i = 0; i < count; i++) {
                const offset = (i - count / 2) * spacing + spacing / 2;
                
                // Skip near intersections
                const nearIntersection = this.intersections.some(inter => {
                    if (road.rotation === 0) {
                        return Math.abs(road.x + offset - inter.x) < 25 && Math.abs(road.z - inter.z) < 25;
                    } else {
                        return Math.abs(road.x - inter.x) < 25 && Math.abs(road.z + offset - inter.z) < 25;
                    }
                });
                
                if (nearIntersection) continue;
                
                [-1, 1].forEach(side => {
                    const lamp = new THREE.Group();
                    
                    // Pole
                    const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 7, 6);
                    const pole = new THREE.Mesh(poleGeo, poleMat);
                    pole.position.y = 3.5;
                    lamp.add(pole);
                    
                    // Curved arm
                    const armGeo = new THREE.BoxGeometry(0.08, 0.08, 2);
                    const arm = new THREE.Mesh(armGeo, poleMat);
                    arm.position.set(0, 7, side * 1);
                    lamp.add(arm);
                    
                    // Lamp housing
                    const housingGeo = new THREE.BoxGeometry(0.5, 0.25, 0.35);
                    const housing = new THREE.Mesh(housingGeo, poleMat);
                    housing.position.set(0, 6.85, side * 2);
                    lamp.add(housing);
                    
                    // Light surface
                    const lightGeo = new THREE.PlaneGeometry(0.4, 0.25);
                    const light = new THREE.Mesh(lightGeo, lampMat);
                    light.rotation.x = -Math.PI / 2;
                    light.position.set(0, 6.7, side * 2);
                    lamp.add(light);
                    
                    // Point light for actual illumination
                    const pointLight = new THREE.PointLight(0xffffcc, 0.5, 25);
                    pointLight.position.set(0, 6.5, side * 2);
                    lamp.add(pointLight);
                    this.streetLights.push(pointLight);
                    
                    // Position lamp
                    if (road.rotation === 0) {
                        lamp.position.set(road.x + offset, 0, road.z + (road.width / 2 + 2) * side);
                    } else {
                        lamp.position.set(road.x + (road.width / 2 + 2) * side, 0, road.z + offset);
                        lamp.rotation.y = Math.PI / 2;
                    }
                    
                    this.scene.add(lamp);
                    lampCount++;
                });
            }
        });
        
        console.log('World: Street lamps created:', lampCount);
    }

    getDetectableObjects() {
        return this.detectableObjects;
    }
    
    getStreetLights() {
        return this.streetLights || [];
    }
    
    setStreetLightsIntensity(intensity) {
        if (this.streetLights) {
            this.streetLights.forEach(light => {
                light.intensity = intensity;
            });
        }
    }
    
    setWindowEmissiveIntensity(intensity) {
        // Adjust window brightness for night mode
        if (this.buildingWindows) {
            this.buildingWindows.forEach(win => {
                if (win.material) {
                    if (intensity > 0.5) {
                        win.material.color.setHex(0xffffaa);
                    } else {
                        win.material.color.setHex(0xffffcc);
                    }
                }
            });
        }
    }
    
    setGroundColor(hexColor) {
        if (this.groundMaterial) {
            this.groundMaterial.color.setHex(hexColor);
        }
    }
}
