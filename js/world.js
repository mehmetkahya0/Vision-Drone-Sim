import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.tileSize = 256;
        this.worldSize = 4000;
        this.tiles = new Map();
        
        // Satellite tile configuration - ESRI World Imagery (free)
        this.zoomLevel = 17;
        
        // Center coordinates - Istanbul (you can change these)
        this.centerLat = 41.0082;
        this.centerLon = 28.9784;
        
        this.createSatelliteTerrain();
        this.createBuildings();
        this.createTrees();
        this.createTargetObjects(); // Objects for YOLO detection
    }

    // Convert lat/lon to tile coordinates
    latLonToTile(lat, lon, zoom) {
        const n = Math.pow(2, zoom);
        const x = Math.floor((lon + 180) / 360 * n);
        const latRad = lat * Math.PI / 180;
        const y = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
        return { x, y };
    }

    // Get tile URL - ESRI World Imagery (free satellite tiles)
    getTileUrl(x, y, z) {
        return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    }

    createSatelliteTerrain() {
        const tilesPerSide = 8;
        const tileWorldSize = this.worldSize / tilesPerSide;
        
        const centerTile = this.latLonToTile(this.centerLat, this.centerLon, this.zoomLevel);
        const loader = new THREE.TextureLoader();

        // Create tile grid
        for (let i = 0; i < tilesPerSide; i++) {
            for (let j = 0; j < tilesPerSide; j++) {
                const tileX = centerTile.x - Math.floor(tilesPerSide / 2) + i;
                const tileY = centerTile.y - Math.floor(tilesPerSide / 2) + j;
                
                const geometry = new THREE.PlaneGeometry(tileWorldSize, tileWorldSize);
                
                // Placeholder material
                const material = new THREE.MeshStandardMaterial({
                    color: 0x3d6b35,
                    roughness: 0.9,
                    metalness: 0.0
                });

                const tile = new THREE.Mesh(geometry, material);
                tile.rotation.x = -Math.PI / 2;
                tile.position.set(
                    (i - tilesPerSide / 2 + 0.5) * tileWorldSize,
                    0,
                    (j - tilesPerSide / 2 + 0.5) * tileWorldSize
                );
                tile.receiveShadow = true;
                this.scene.add(tile);

                // Load satellite texture
                const url = this.getTileUrl(tileX, tileY, this.zoomLevel);
                
                loader.load(
                    url,
                    (texture) => {
                        texture.colorSpace = THREE.SRGBColorSpace;
                        texture.minFilter = THREE.LinearFilter;
                        texture.magFilter = THREE.LinearFilter;
                        tile.material.map = texture;
                        tile.material.color.set(0xffffff);
                        tile.material.needsUpdate = true;
                    },
                    undefined,
                    (error) => {
                        console.warn(`Failed to load tile ${tileX},${tileY}`);
                    }
                );

                this.tiles.set(`${tileX},${tileY}`, tile);
            }
        }
    }

    createBuildings() {
        // Create building clusters for YOLO detection targets
        const buildingConfigs = [
            { cx: 400, cz: 400, count: 20, spread: 250, minH: 15, maxH: 80 },
            { cx: -500, cz: 300, count: 15, spread: 180, minH: 10, maxH: 50 },
            { cx: 300, cz: -500, count: 12, spread: 200, minH: 8, maxH: 30 },
            { cx: -400, cz: -400, count: 25, spread: 250, minH: 5, maxH: 18 },
            { cx: 0, cz: 600, count: 18, spread: 180, minH: 30, maxH: 120 }
        ];

        const buildingMaterials = [
            new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.6, metalness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.7, metalness: 0.1 }),
            new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.5, metalness: 0.3 }),
            new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.8, metalness: 0.1 }),
            new THREE.MeshStandardMaterial({ color: 0x4a6080, roughness: 0.5, metalness: 0.4 }),
            new THREE.MeshStandardMaterial({ color: 0xb0a090, roughness: 0.7, metalness: 0.1 }),
        ];

        buildingConfigs.forEach(config => {
            for (let i = 0; i < config.count; i++) {
                const width = Math.random() * 30 + 15;
                const depth = Math.random() * 30 + 15;
                const height = Math.random() * (config.maxH - config.minH) + config.minH;

                const geometry = new THREE.BoxGeometry(width, height, depth);
                const material = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)].clone();
                const building = new THREE.Mesh(geometry, material);

                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * config.spread;
                building.position.x = config.cx + Math.cos(angle) * radius;
                building.position.z = config.cz + Math.sin(angle) * radius;
                building.position.y = height / 2;
                building.rotation.y = Math.random() * 0.3 - 0.15;
                
                building.castShadow = true;
                building.receiveShadow = true;
                building.userData.type = 'building';
                building.userData.label = 'building';

                this.scene.add(building);

                // Add windows
                this.addWindows(building, width, height, depth);

                // Roof structures for tall buildings
                if (height > 40 && Math.random() > 0.4) {
                    this.addRoofStructure(building, width, depth, height);
                }
            }
        });
    }

    addWindows(building, width, height, depth) {
        const windowMat = new THREE.MeshStandardMaterial({
            color: 0x6699cc,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.7
        });

        const floorHeight = 4;
        const floors = Math.floor(height / floorHeight);
        const windowsPerRow = Math.floor((width - 4) / 4);
        const windowGeo = new THREE.PlaneGeometry(1.5, 2.2);

        for (let floor = 0; floor < floors; floor++) {
            for (let w = 0; w < windowsPerRow; w++) {
                // Front
                const windowFront = new THREE.Mesh(windowGeo, windowMat);
                windowFront.position.set(
                    building.position.x - width / 2 + 2 + w * 4,
                    floor * floorHeight + 2.5,
                    building.position.z + depth / 2 + 0.05
                );
                this.scene.add(windowFront);

                // Back
                const windowBack = new THREE.Mesh(windowGeo, windowMat);
                windowBack.position.set(
                    building.position.x - width / 2 + 2 + w * 4,
                    floor * floorHeight + 2.5,
                    building.position.z - depth / 2 - 0.05
                );
                windowBack.rotation.y = Math.PI;
                this.scene.add(windowBack);
            }
        }
    }

    addRoofStructure(building, width, depth, height) {
        // Helipad
        if (Math.random() > 0.5) {
            const helipadGeo = new THREE.CylinderGeometry(
                Math.min(width, depth) * 0.25,
                Math.min(width, depth) * 0.25,
                0.3, 32
            );
            const helipadMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
            const helipad = new THREE.Mesh(helipadGeo, helipadMat);
            helipad.position.set(building.position.x, height + 0.15, building.position.z);
            helipad.userData.type = 'helipad';
            helipad.userData.label = 'helipad';
            this.scene.add(helipad);
        }

        // AC units
        const numUnits = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numUnits; i++) {
            const unitGeo = new THREE.BoxGeometry(4, 2.5, 4);
            const unitMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
            const unit = new THREE.Mesh(unitGeo, unitMat);
            unit.position.set(
                building.position.x + (Math.random() - 0.5) * width * 0.4,
                height + 1.25,
                building.position.z + (Math.random() - 0.5) * depth * 0.4
            );
            unit.castShadow = true;
            this.scene.add(unit);
        }
    }

    createTrees() {
        const treeCount = 400;

        for (let i = 0; i < treeCount; i++) {
            const tree = this.createTree();
            
            let attempts = 0;
            let x, z;
            do {
                x = (Math.random() - 0.5) * this.worldSize * 0.9;
                z = (Math.random() - 0.5) * this.worldSize * 0.9;
                attempts++;
            } while (this.isNearBuilding(x, z) && attempts < 15);

            if (attempts < 15) {
                tree.position.set(x, 0, z);
                tree.userData.type = 'tree';
                tree.userData.label = 'tree';
                this.scene.add(tree);
            }
        }
    }

    createTree() {
        const tree = new THREE.Group();

        const trunkHeight = 3 + Math.random() * 5;
        const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, trunkHeight, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        tree.add(trunk);

        const foliageColor = new THREE.Color().setHSL(0.25 + Math.random() * 0.1, 0.6, 0.2 + Math.random() * 0.15);
        const foliageMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.8 });

        if (Math.random() > 0.5) {
            // Pine tree
            const foliageGeo = new THREE.ConeGeometry(3 + Math.random() * 2, 9 + Math.random() * 5, 8);
            const foliage = new THREE.Mesh(foliageGeo, foliageMat);
            foliage.position.y = trunkHeight + 4;
            foliage.castShadow = true;
            tree.add(foliage);
        } else {
            // Deciduous tree
            const radius = 3 + Math.random() * 2.5;
            const foliageGeo = new THREE.SphereGeometry(radius, 8, 8);
            const foliage = new THREE.Mesh(foliageGeo, foliageMat);
            foliage.position.y = trunkHeight + radius * 0.8;
            foliage.castShadow = true;
            tree.add(foliage);
        }

        return tree;
    }

    isNearBuilding(x, z) {
        const areas = [
            { x: 400, z: 400, r: 280 },
            { x: -500, z: 300, r: 210 },
            { x: 300, z: -500, r: 230 },
            { x: -400, z: -400, r: 280 },
            { x: 0, z: 600, r: 210 }
        ];

        for (const area of areas) {
            if (Math.sqrt((x - area.x) ** 2 + (z - area.z) ** 2) < area.r) return true;
        }
        return false;
    }

    createTargetObjects() {
        this.createVehicles();
        this.createPeople();
        this.createStreetObjects();
    }

    createVehicles() {
        const vehicleCount = 60;
        
        for (let i = 0; i < vehicleCount; i++) {
            const vehicle = this.createVehicle();
            vehicle.position.x = (Math.random() - 0.5) * this.worldSize * 0.85;
            vehicle.position.z = (Math.random() - 0.5) * this.worldSize * 0.85;
            vehicle.position.y = 0.5;
            vehicle.rotation.y = Math.random() * Math.PI * 2;
            vehicle.userData.type = 'vehicle';
            vehicle.userData.label = 'car';
            this.scene.add(vehicle);
        }
    }

    createVehicle() {
        const vehicle = new THREE.Group();
        
        const colors = [0xff0000, 0x0000ff, 0x00cc00, 0xffff00, 0xffffff, 0x222222, 0x888888, 0xff6600];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Body
        const bodyGeo = new THREE.BoxGeometry(2.2, 1.2, 4.5);
        const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        vehicle.add(body);

        // Cabin
        const cabinGeo = new THREE.BoxGeometry(2, 0.9, 2.2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.1, metalness: 0.9 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.5, 0.3);
        cabin.castShadow = true;
        vehicle.add(cabin);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        
        [{ x: 1.1, z: 1.3 }, { x: -1.1, z: 1.3 }, { x: 1.1, z: -1.3 }, { x: -1.1, z: -1.3 }].forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos.x, 0.45, pos.z);
            vehicle.add(wheel);
        });

        return vehicle;
    }

    createPeople() {
        const peopleCount = 40;
        
        for (let i = 0; i < peopleCount; i++) {
            const person = this.createPerson();
            person.position.x = (Math.random() - 0.5) * this.worldSize * 0.75;
            person.position.z = (Math.random() - 0.5) * this.worldSize * 0.75;
            person.position.y = 0;
            person.rotation.y = Math.random() * Math.PI * 2;
            person.userData.type = 'person';
            person.userData.label = 'person';
            this.scene.add(person);
        }
    }

    createPerson() {
        const person = new THREE.Group();
        
        const skinColors = [0xf5d0c5, 0xd4a574, 0x8d5524, 0xc68642];
        const clothColors = [0xff0000, 0x0000ff, 0x00cc00, 0xffff00, 0xffffff, 0x222222, 0x800080, 0xff6600];
        
        const skinColor = skinColors[Math.floor(Math.random() * skinColors.length)];
        const clothColor = clothColors[Math.floor(Math.random() * clothColors.length)];

        // Body
        const bodyGeo = new THREE.CapsuleGeometry(0.25, 0.8, 4, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.8 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1;
        body.castShadow = true;
        person.add(body);

        // Head
        const headGeo = new THREE.SphereGeometry(0.22, 8, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.75;
        head.castShadow = true;
        person.add(head);

        // Legs
        const legGeo = new THREE.CapsuleGeometry(0.1, 0.6, 4, 6);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x333355, roughness: 0.8 });
        
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(0.12, 0.35, 0);
        person.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.set(-0.12, 0.35, 0);
        person.add(rightLeg);

        return person;
    }

    createStreetObjects() {
        // Street lights
        for (let i = 0; i < 50; i++) {
            const light = this.createStreetLight();
            light.position.x = (Math.random() - 0.5) * this.worldSize * 0.85;
            light.position.z = (Math.random() - 0.5) * this.worldSize * 0.85;
            light.userData.type = 'streetlight';
            light.userData.label = 'streetlight';
            this.scene.add(light);
        }

        // Benches
        for (let i = 0; i < 25; i++) {
            const bench = this.createBench();
            bench.position.x = (Math.random() - 0.5) * this.worldSize * 0.7;
            bench.position.z = (Math.random() - 0.5) * this.worldSize * 0.7;
            bench.rotation.y = Math.random() * Math.PI * 2;
            bench.userData.type = 'bench';
            bench.userData.label = 'bench';
            this.scene.add(bench);
        }
    }

    createStreetLight() {
        const light = new THREE.Group();
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });

        const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 9, 8);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 4.5;
        pole.castShadow = true;
        light.add(pole);

        const armGeo = new THREE.BoxGeometry(2.5, 0.15, 0.15);
        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.set(1.25, 9, 0);
        light.add(arm);

        const fixtureGeo = new THREE.BoxGeometry(1, 0.35, 0.6);
        const fixtureMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffdd, 
            emissive: 0xffffdd, 
            emissiveIntensity: 0.3 
        });
        const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
        fixture.position.set(2.5, 8.8, 0);
        light.add(fixture);

        return light;
    }

    createBench() {
        const bench = new THREE.Group();
        
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });

        for (let i = 0; i < 4; i++) {
            const plankGeo = new THREE.BoxGeometry(2.5, 0.12, 0.22);
            const plank = new THREE.Mesh(plankGeo, woodMat);
            plank.position.set(0, 0.55, i * 0.28 - 0.42);
            plank.castShadow = true;
            bench.add(plank);
        }

        const legGeo = new THREE.BoxGeometry(0.12, 0.55, 0.7);
        const leftLeg = new THREE.Mesh(legGeo, metalMat);
        leftLeg.position.set(-1, 0.275, 0);
        bench.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, metalMat);
        rightLeg.position.set(1, 0.275, 0);
        bench.add(rightLeg);

        return bench;
    }
}
