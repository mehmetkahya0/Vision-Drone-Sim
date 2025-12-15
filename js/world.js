import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.worldSize = 3000;
        this.tiles = new Map();
        
        // ESRI World Imagery
        this.zoomLevel = 17;
        this.centerLat = 41.0082;
        this.centerLon = 28.9784;
        
        // Detectable objects for YOLO
        this.detectableObjects = [];
        
        // Initialize arrays for dynamic lighting
        this.streetLights = [];
        this.buildingWindows = [];
        
        // Performance: Use shared materials
        this.materials = this.createMaterials();
        
        console.log('Creating satellite terrain...');
        this.createSatelliteTerrain();
        console.log('Creating roads...');
        this.createRoads();
        console.log('Creating buildings...');
        this.createBuildingsOptimized();
        console.log('Creating vehicles...');
        this.createVehiclesOptimized();
        console.log('Creating people...');
        this.createPeopleOptimized();
        console.log('Creating trees...');
        this.createTreesOptimized();
        console.log('Creating traffic lights...');
        this.createTrafficLights();
        // Street lamps temporarily disabled for debugging
        // console.log('Creating street lamps...');
        // this.createStreetLamps();
        console.log('World initialization complete');
    }

    createMaterials() {
        return {
            road: new THREE.MeshLambertMaterial({ color: 0x333333 }),
            sidewalk: new THREE.MeshLambertMaterial({ color: 0x777777 }),
            marking: new THREE.MeshBasicMaterial({ color: 0xffffff }),
            building: [
                new THREE.MeshLambertMaterial({ color: 0x7a7a7a }),
                new THREE.MeshLambertMaterial({ color: 0x5a5a5a }),
                new THREE.MeshLambertMaterial({ color: 0x8a8a8a }),
                new THREE.MeshLambertMaterial({ color: 0x4a6a8a }),
            ],
            tree: {
                trunk: new THREE.MeshLambertMaterial({ color: 0x4a3525 }),
                foliage: new THREE.MeshLambertMaterial({ color: 0x2d5a25 }),
            }
        };
    }

    latLonToTile(lat, lon, zoom) {
        const n = Math.pow(2, zoom);
        const x = Math.floor((lon + 180) / 360 * n);
        const latRad = lat * Math.PI / 180;
        const y = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
        return { x, y };
    }

    createSatelliteTerrain() {
        // Reduced tiles for performance: 6x6 instead of 8x8
        const tilesPerSide = 6;
        const tileWorldSize = this.worldSize / tilesPerSide;
        const centerTile = this.latLonToTile(this.centerLat, this.centerLon, this.zoomLevel);
        const loader = new THREE.TextureLoader();

        // Shared geometry for all tiles
        const tileGeometry = new THREE.PlaneGeometry(tileWorldSize, tileWorldSize);

        for (let i = 0; i < tilesPerSide; i++) {
            for (let j = 0; j < tilesPerSide; j++) {
                const tileX = centerTile.x - Math.floor(tilesPerSide / 2) + i;
                const tileY = centerTile.y - Math.floor(tilesPerSide / 2) + j;
                
                const material = new THREE.MeshLambertMaterial({ color: 0x3d6b35 });
                const tile = new THREE.Mesh(tileGeometry, material);
                tile.rotation.x = -Math.PI / 2;
                tile.position.set(
                    (i - tilesPerSide / 2 + 0.5) * tileWorldSize,
                    0,
                    (j - tilesPerSide / 2 + 0.5) * tileWorldSize
                );
                tile.receiveShadow = true;
                this.scene.add(tile);

                const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${this.zoomLevel}/${tileY}/${tileX}`;
                loader.load(url, (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace;
                    tile.material.map = texture;
                    tile.material.color.set(0xffffff);
                    tile.material.needsUpdate = true;
                });
            }
        }
    }

    createRoads() {
        this.roads = [];
        
        // Fewer, simpler roads
        const roadConfigs = [
            { x: 0, z: 0, width: 18, length: 2800, rotation: 0 },
            { x: 0, z: 350, width: 14, length: 2400, rotation: 0 },
            { x: 0, z: -350, width: 14, length: 2400, rotation: 0 },
            { x: 0, z: 0, width: 18, length: 2800, rotation: Math.PI / 2 },
            { x: 350, z: 0, width: 14, length: 2400, rotation: Math.PI / 2 },
            { x: -350, z: 0, width: 14, length: 2400, rotation: Math.PI / 2 },
        ];

        roadConfigs.forEach(config => {
            const roadGeo = new THREE.PlaneGeometry(config.width, config.length);
            const road = new THREE.Mesh(roadGeo, this.materials.road);
            road.rotation.x = -Math.PI / 2;
            road.rotation.z = config.rotation;
            road.position.set(config.x, 0.1, config.z);
            this.scene.add(road);
            this.roads.push(config);

            this.addSimpleMarkings(config);
        });

        this.intersections = [
            { x: 0, z: 0 },
            { x: 350, z: 0 }, { x: -350, z: 0 },
            { x: 0, z: 350 }, { x: 0, z: -350 },
            { x: 350, z: 350 }, { x: -350, z: 350 },
            { x: 350, z: -350 }, { x: -350, z: -350 },
        ];

        this.addCrosswalks();
    }

    addSimpleMarkings(road) {
        // Reduced dash count
        const dashCount = Math.floor(road.length / 15);
        const dashGeo = new THREE.PlaneGeometry(0.3, 4);
        
        for (let i = 0; i < dashCount; i++) {
            const offset = (i - dashCount / 2) * 15;
            const dash = new THREE.Mesh(dashGeo, this.materials.marking);
            dash.rotation.x = -Math.PI / 2;
            dash.rotation.z = road.rotation;
            
            if (road.rotation === 0) {
                dash.position.set(road.x + offset, 0.12, road.z);
            } else {
                dash.position.set(road.x, 0.12, road.z + offset);
            }
            this.scene.add(dash);
        }
    }

    addCrosswalks() {
        const stripeGeo = new THREE.PlaneGeometry(0.5, 3.5);
        
        this.intersections.forEach(inter => {
            for (let dir = 0; dir < 2; dir++) {
                for (let i = 0; i < 6; i++) {
                    const stripe = new THREE.Mesh(stripeGeo, this.materials.marking);
                    stripe.rotation.x = -Math.PI / 2;
                    stripe.rotation.z = dir * Math.PI / 2;

                    const offset = (i - 3) * 1.2;
                    if (dir === 0) {
                        stripe.position.set(inter.x + offset, 0.13, inter.z + 12);
                    } else {
                        stripe.position.set(inter.x + 12, 0.13, inter.z + offset);
                    }
                    this.scene.add(stripe);
                }
            }
        });
    }

    createBuildingsOptimized() {
        // Fewer buildings with simpler geometry
        const clusters = [
            { cx: 175, cz: 175, count: 8 },
            { cx: -175, cz: 175, count: 8 },
            { cx: 175, cz: -175, count: 8 },
            { cx: -175, cz: -175, count: 8 },
            { cx: 550, cz: 0, count: 6 },
            { cx: -550, cz: 0, count: 6 },
            { cx: 0, cz: 550, count: 6 },
            { cx: 0, cz: -550, count: 6 },
        ];

        clusters.forEach(cluster => {
            for (let i = 0; i < cluster.count; i++) {
                const width = 15 + Math.random() * 25;
                const depth = 15 + Math.random() * 25;
                const height = 15 + Math.random() * 45;
                
                const geo = new THREE.BoxGeometry(width, height, depth);
                const mat = this.materials.building[Math.floor(Math.random() * 4)];
                const building = new THREE.Mesh(geo, mat);

                const angle = Math.random() * Math.PI * 2;
                const radius = 30 + Math.random() * 90;
                building.position.set(
                    cluster.cx + Math.cos(angle) * radius,
                    height / 2,
                    cluster.cz + Math.sin(angle) * radius
                );
                building.castShadow = true;
                building.receiveShadow = true;
                building.userData = { type: 'building', label: 'building' };
                this.scene.add(building);
                this.detectableObjects.push(building);
            }
        });
        
        console.log('Buildings created:', this.detectableObjects.length);
    }

    createVehiclesOptimized() {
        const vehicleTypes = [
            { type: 'car', w: 1.8, h: 1.4, l: 4.5 },
            { type: 'suv', w: 2.0, h: 1.8, l: 4.8 },
            { type: 'truck', w: 2.2, h: 2.4, l: 6 },
            { type: 'bus', w: 2.5, h: 3, l: 10 },
        ];
        
        const colors = [0xff0000, 0x0000ff, 0xffffff, 0x111111, 0x00aa00, 0xff6600, 0xffff00];

        this.roads.forEach(road => {
            // Fewer vehicles per road
            const count = Math.floor(road.length / 120);
            
            for (let i = 0; i < count; i++) {
                const vType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                // Simple box vehicle for debugging
                const vehicle = new THREE.Group();
                const bodyGeo = new THREE.BoxGeometry(vType.w, vType.h, vType.l);
                const bodyMat = new THREE.MeshStandardMaterial({ color: color, metalness: 0.5, roughness: 0.5 });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = vType.h / 2 + 0.3;
                body.castShadow = true;
                vehicle.add(body);
                
                // Wheels
                const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16);
                const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
                [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
                    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
                    wheel.rotation.z = Math.PI / 2;
                    wheel.position.set(sx * vType.w / 2, 0.35, sz * vType.l * 0.35);
                    vehicle.add(wheel);
                });
                
                const progress = (i + 0.5) / count;
                const posAlong = (progress - 0.5) * road.length * 0.85;
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
            }
        });
        
        console.log('Vehicles created');
    }

    createRealisticVehicle(config, color) {
        const vehicle = new THREE.Group();
        const isSedan = config.type === 'car';
        const isSUV = config.type === 'suv';
        const isTruck = config.type === 'truck';
        const isBus = config.type === 'bus';

        // High quality materials with realistic properties
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: color,
            metalness: 0.6,
            roughness: 0.4
        });
        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.9,
            roughness: 0.1
        });
        const glassMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a2a3a, 
            transparent: true, 
            opacity: 0.7,
            metalness: 0.1,
            roughness: 0.1
        });
        const rubberMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.9,
            metalness: 0
        });

        // Main body with rounded edges using higher segments
        const bodyShape = new THREE.Shape();
        const bw = config.w / 2;
        const bl = config.l / 2;
        const radius = 0.15;
        
        // Lower body
        const lowerBodyGeo = new THREE.BoxGeometry(config.w, config.h * 0.5, config.l, 2, 2, 2);
        const lowerBody = new THREE.Mesh(lowerBodyGeo, bodyMat);
        lowerBody.position.y = config.h * 0.25 + 0.35;
        lowerBody.castShadow = true;
        lowerBody.receiveShadow = true;
        vehicle.add(lowerBody);

        // Cabin/Upper body
        if (isSedan || isSUV) {
            // Smooth cabin shape
            const cabinLen = config.l * 0.55;
            const cabinGeo = new THREE.BoxGeometry(config.w * 0.92, config.h * 0.42, cabinLen, 2, 2, 2);
            const cabin = new THREE.Mesh(cabinGeo, bodyMat);
            cabin.position.set(0, config.h * 0.7 + 0.35, -config.l * 0.06);
            cabin.castShadow = true;
            vehicle.add(cabin);

            // Sloped hood
            const hoodGeo = new THREE.BoxGeometry(config.w * 0.94, config.h * 0.12, config.l * 0.3, 2, 1, 2);
            const hood = new THREE.Mesh(hoodGeo, bodyMat);
            hood.position.set(0, config.h * 0.52 + 0.35, config.l * 0.33);
            hood.rotation.x = -0.08;
            vehicle.add(hood);

            // Front grille
            const grilleGeo = new THREE.BoxGeometry(config.w * 0.7, config.h * 0.15, 0.05, 4, 2, 1);
            const grille = new THREE.Mesh(grilleGeo, chromeMat);
            grille.position.set(0, config.h * 0.35 + 0.35, config.l * 0.5);
            vehicle.add(grille);

            // Trunk
            const trunkGeo = new THREE.BoxGeometry(config.w * 0.92, config.h * 0.18, config.l * 0.22, 2, 1, 2);
            const trunk = new THREE.Mesh(trunkGeo, bodyMat);
            trunk.position.set(0, config.h * 0.52 + 0.35, -config.l * 0.38);
            trunk.rotation.x = 0.05;
            vehicle.add(trunk);

            // Roof rails for SUV
            if (isSUV) {
                const railGeo = new THREE.CylinderGeometry(0.03, 0.03, config.l * 0.5, 8);
                [-1, 1].forEach(side => {
                    const rail = new THREE.Mesh(railGeo, chromeMat);
                    rail.rotation.x = Math.PI / 2;
                    rail.position.set(config.w * 0.4 * side, config.h * 0.95 + 0.35, -config.l * 0.05);
                    vehicle.add(rail);
                });
            }
        } else if (isTruck || isBus) {
            const cabinH = config.h * (isBus ? 0.8 : 0.65);
            const cabinGeo = new THREE.BoxGeometry(config.w, cabinH, config.l * (isBus ? 0.92 : 0.32), 2, 2, 2);
            const cabin = new THREE.Mesh(cabinGeo, bodyMat);
            cabin.position.set(0, cabinH / 2 + config.h * 0.5 + 0.35, isBus ? 0 : config.l * 0.32);
            cabin.castShadow = true;
            vehicle.add(cabin);

            if (isTruck) {
                // Truck cargo bed with side walls
                const bedFloorGeo = new THREE.BoxGeometry(config.w * 0.95, 0.1, config.l * 0.55);
                const bedFloor = new THREE.Mesh(bedFloorGeo, new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 }));
                bedFloor.position.set(0, config.h * 0.55 + 0.35, -config.l * 0.2);
                vehicle.add(bedFloor);

                // Bed walls
                const wallGeo = new THREE.BoxGeometry(0.08, config.h * 0.35, config.l * 0.55);
                [-1, 1].forEach(side => {
                    const wall = new THREE.Mesh(wallGeo, bodyMat);
                    wall.position.set(config.w * 0.45 * side, config.h * 0.72 + 0.35, -config.l * 0.2);
                    vehicle.add(wall);
                });
                
                // Back wall
                const backWallGeo = new THREE.BoxGeometry(config.w * 0.95, config.h * 0.35, 0.08);
                const backWall = new THREE.Mesh(backWallGeo, bodyMat);
                backWall.position.set(0, config.h * 0.72 + 0.35, -config.l * 0.47);
                vehicle.add(backWall);
            }
        }

        // Realistic windshield and windows
        if (isSedan || isSUV) {
            // Curved windshield
            const wsGeo = new THREE.PlaneGeometry(config.w * 0.82, config.h * 0.38, 4, 4);
            const windshield = new THREE.Mesh(wsGeo, glassMat);
            windshield.position.set(0, config.h * 0.85 + 0.35, config.l * 0.16);
            windshield.rotation.x = -0.45;
            vehicle.add(windshield);

            // Rear window
            const rwGeo = new THREE.PlaneGeometry(config.w * 0.75, config.h * 0.32, 4, 4);
            const rearWindow = new THREE.Mesh(rwGeo, glassMat);
            rearWindow.position.set(0, config.h * 0.85 + 0.35, -config.l * 0.30);
            rearWindow.rotation.x = 0.35;
            rearWindow.rotation.y = Math.PI;
            vehicle.add(rearWindow);

            // Side windows with door frames
            const swGeo = new THREE.PlaneGeometry(config.l * 0.22, config.h * 0.28, 2, 2);
            [-1, 1].forEach(side => {
                // Front side window
                const frontWin = new THREE.Mesh(swGeo, glassMat);
                frontWin.position.set(config.w * 0.47 * side, config.h * 0.78 + 0.35, config.l * 0.05);
                frontWin.rotation.y = Math.PI / 2 * side;
                vehicle.add(frontWin);
                
                // Rear side window
                const rearWin = new THREE.Mesh(swGeo, glassMat);
                rearWin.position.set(config.w * 0.47 * side, config.h * 0.78 + 0.35, -config.l * 0.15);
                rearWin.rotation.y = Math.PI / 2 * side;
                vehicle.add(rearWin);
            });

            // Door handles
            const handleGeo = new THREE.BoxGeometry(0.12, 0.03, 0.03);
            [-1, 1].forEach(side => {
                [0.08, -0.12].forEach(zPos => {
                    const handle = new THREE.Mesh(handleGeo, chromeMat);
                    handle.position.set(config.w * 0.49 * side, config.h * 0.55 + 0.35, config.l * zPos);
                    vehicle.add(handle);
                });
            });

            // Side mirrors
            const mirrorGeo = new THREE.BoxGeometry(0.08, 0.06, 0.12);
            [-1, 1].forEach(side => {
                const mirror = new THREE.Mesh(mirrorGeo, bodyMat);
                mirror.position.set(config.w * 0.55 * side, config.h * 0.65 + 0.35, config.l * 0.18);
                vehicle.add(mirror);
                
                const mirrorGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.04), glassMat);
                mirrorGlass.position.set(config.w * 0.56 * side, config.h * 0.65 + 0.35, config.l * 0.18);
                mirrorGlass.rotation.y = Math.PI / 2 * side;
                vehicle.add(mirrorGlass);
            });
        } else if (isBus) {
            // Bus windows
            const bwGeo = new THREE.PlaneGeometry(config.l * 0.11, config.h * 0.35, 2, 2);
            for (let i = 0; i < 7; i++) {
                [-1, 1].forEach(side => {
                    const busWin = new THREE.Mesh(bwGeo, glassMat);
                    busWin.position.set(config.w * 0.51 * side, config.h * 1.05 + 0.35, config.l * 0.38 - i * config.l * 0.12);
                    busWin.rotation.y = Math.PI / 2 * side;
                    vehicle.add(busWin);
                });
            }
            // Bus front window
            const bfGeo = new THREE.PlaneGeometry(config.w * 0.85, config.h * 0.45);
            const busFront = new THREE.Mesh(bfGeo, glassMat);
            busFront.position.set(0, config.h * 1.1 + 0.35, config.l * 0.47);
            vehicle.add(busFront);
        }

        // Realistic headlights with housing
        const hlHousingGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.08, 16);
        const hlLensGeo = new THREE.CircleGeometry(0.14, 16);
        const hlLensMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
        [-1, 1].forEach(side => {
            const housing = new THREE.Mesh(hlHousingGeo, chromeMat);
            housing.rotation.x = Math.PI / 2;
            housing.position.set(config.w * 0.35 * side, config.h * 0.38 + 0.35, config.l * 0.49);
            vehicle.add(housing);
            
            const lens = new THREE.Mesh(hlLensGeo, hlLensMat);
            lens.position.set(config.w * 0.35 * side, config.h * 0.38 + 0.35, config.l * 0.51);
            vehicle.add(lens);
        });

        // Realistic taillights
        const tlGeo = new THREE.BoxGeometry(0.22, 0.12, 0.04, 2, 2, 1);
        const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const tlAmberMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        [-1, 1].forEach(side => {
            const tl = new THREE.Mesh(tlGeo, tlMat);
            tl.position.set(config.w * 0.38 * side, config.h * 0.38 + 0.35, -config.l * 0.5 - 0.02);
            vehicle.add(tl);
            
            // Turn signal
            const turnGeo = new THREE.BoxGeometry(0.1, 0.06, 0.04);
            const turn = new THREE.Mesh(turnGeo, tlAmberMat);
            turn.position.set(config.w * 0.38 * side, config.h * 0.48 + 0.35, -config.l * 0.5 - 0.02);
            vehicle.add(turn);
        });

        // Detailed wheels with tire treads
        const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 24);
        const hubGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.30, 16);
        const hubCapGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16);
        const hubCapMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 });

        const wheelPositions = [
            [config.w/2 + 0.12, config.l * 0.35],
            [-config.w/2 - 0.12, config.l * 0.35],
            [config.w/2 + 0.12, -config.l * 0.35],
            [-config.w/2 - 0.12, -config.l * 0.35]
        ];
        
        wheelPositions.forEach(([x, z]) => {
            // Tire
            const wheel = new THREE.Mesh(wheelGeo, rubberMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, 0.38, z);
            wheel.castShadow = true;
            vehicle.add(wheel);

            // Rim
            const hub = new THREE.Mesh(hubGeo, new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 }));
            hub.rotation.z = Math.PI / 2;
            hub.position.set(x, 0.38, z);
            vehicle.add(hub);

            // Hub cap
            const hubCap = new THREE.Mesh(hubCapGeo, hubCapMat);
            hubCap.rotation.z = Math.PI / 2;
            hubCap.position.set(x > 0 ? x + 0.14 : x - 0.14, 0.38, z);
            vehicle.add(hubCap);
        });

        // License plate with frame
        const lpFrameGeo = new THREE.BoxGeometry(0.58, 0.18, 0.02);
        const lpFrame = new THREE.Mesh(lpFrameGeo, chromeMat);
        lpFrame.position.set(0, config.h * 0.22 + 0.35, -config.l * 0.5 - 0.01);
        vehicle.add(lpFrame);

        const lpGeo = new THREE.BoxGeometry(0.52, 0.12, 0.02);
        const lpMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const plate = new THREE.Mesh(lpGeo, lpMat);
        plate.position.set(0, config.h * 0.22 + 0.35, -config.l * 0.5 - 0.02);
        vehicle.add(plate);

        // Antenna for sedans
        if (isSedan) {
            const antennaGeo = new THREE.CylinderGeometry(0.01, 0.015, 0.5, 8);
            const antenna = new THREE.Mesh(antennaGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
            antenna.position.set(-config.w * 0.3, config.h * 1.15 + 0.35, -config.l * 0.25);
            vehicle.add(antenna);
        }

        return vehicle;
    }

    createPeopleOptimized() {
        const colors = [0xff0000, 0x0000ff, 0x00aa00, 0xffff00, 0xff6600, 0x800080];
        
        // Simple person helper
        const createSimplePerson = (color) => {
            const person = new THREE.Group();
            
            // Body
            const bodyGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.0, 8);
            const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7 });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.7;
            body.castShadow = true;
            person.add(body);
            
            // Head
            const headGeo = new THREE.SphereGeometry(0.12, 12, 12);
            const headMat = new THREE.MeshStandardMaterial({ color: 0xf5d0c5, roughness: 0.8 });
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.y = 1.4;
            head.castShadow = true;
            person.add(head);
            
            // Legs
            const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8);
            const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.7 });
            [-0.08, 0.08].forEach(x => {
                const leg = new THREE.Mesh(legGeo, legMat);
                leg.position.set(x, 0.3, 0);
                person.add(leg);
            });
            
            return person;
        };
        
        // At crosswalks only
        this.intersections.forEach(inter => {
            const count = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                const person = createSimplePerson(color);
                
                person.position.set(
                    inter.x + (Math.random() - 0.5) * 8,
                    0,
                    inter.z + (Math.random() > 0.5 ? 10 : -10)
                );
                person.rotation.y = Math.random() * Math.PI * 2;
                person.userData = { type: 'person', label: 'person' };
                this.scene.add(person);
                this.detectableObjects.push(person);
            }
        });

        // Fewer along roads
        this.roads.forEach(road => {
            const count = Math.floor(road.length / 300);
            for (let i = 0; i < count; i++) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                const person = createSimplePerson(color);
                
                const posAlong = (Math.random() - 0.5) * road.length * 0.8;
                const side = Math.random() > 0.5 ? 1 : -1;
                const offset = (road.width / 2 + 1.5) * side;

                if (road.rotation === 0) {
                    person.position.set(road.x + posAlong, 0, road.z + offset);
                } else {
                    person.position.set(road.x + offset, 0, road.z + posAlong);
                }
                person.rotation.y = Math.random() * Math.PI * 2;
                person.userData = { type: 'person', label: 'person' };
                this.scene.add(person);
                this.detectableObjects.push(person);
            }
        });
        
        console.log('People created');
    }

    createRealisticPerson(clothColor) {
        const person = new THREE.Group();
        
        // Skin tones variety
        const skinTones = [0xf5d0c5, 0xd4a574, 0xc68642, 0x8d5524, 0x6b4423];
        const skinColor = skinTones[Math.floor(Math.random() * skinTones.length)];
        const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 });
        
        // Pants colors - realistic
        const pantsColors = [0x1a1a2e, 0x2d3436, 0x0c3b5e, 0x4a3728, 0x1e1e1e, 0x355070, 0x6d6875];
        const pantsMat = new THREE.MeshStandardMaterial({ 
            color: pantsColors[Math.floor(Math.random() * pantsColors.length)],
            roughness: 0.7
        });
        
        // Shirt/top with fabric texture
        const shirtMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.6 });

        // Head - more detailed
        const headGeo = new THREE.SphereGeometry(0.11, 16, 12);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 1.62;
        head.scale.set(1, 1.1, 1);
        head.castShadow = true;
        person.add(head);

        // Face features - nose
        const noseGeo = new THREE.ConeGeometry(0.02, 0.04, 8);
        const nose = new THREE.Mesh(noseGeo, skinMat);
        nose.rotation.x = -Math.PI / 2;
        nose.position.set(0, 1.60, 0.1);
        person.add(nose);

        // Ears
        const earGeo = new THREE.SphereGeometry(0.025, 8, 8);
        [-1, 1].forEach(side => {
            const ear = new THREE.Mesh(earGeo, skinMat);
            ear.position.set(side * 0.11, 1.62, 0);
            ear.scale.set(0.6, 1, 0.5);
            person.add(ear);
        });

        // Hair - more realistic styles
        const hairStyles = [0x1a1a1a, 0x3d2314, 0x8b4513, 0xdaa520, 0x2f1810, 0x4a3c31];
        const hairColor = hairStyles[Math.floor(Math.random() * hairStyles.length)];
        const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 });
        
        // Hair style variants
        const hairType = Math.floor(Math.random() * 3);
        if (hairType === 0) {
            // Short hair
            const hairGeo = new THREE.SphereGeometry(0.115, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
            const hair = new THREE.Mesh(hairGeo, hairMat);
            hair.position.y = 1.68;
            person.add(hair);
        } else if (hairType === 1) {
            // Medium hair
            const hairGeo = new THREE.SphereGeometry(0.13, 12, 8);
            const hair = new THREE.Mesh(hairGeo, hairMat);
            hair.position.y = 1.67;
            hair.scale.set(1, 0.9, 1.1);
            person.add(hair);
        } else {
            // Long hair (ponytail hint)
            const hairGeo = new THREE.SphereGeometry(0.12, 12, 8);
            const hair = new THREE.Mesh(hairGeo, hairMat);
            hair.position.y = 1.67;
            person.add(hair);
            
            const ponytailGeo = new THREE.CylinderGeometry(0.03, 0.02, 0.2, 8);
            const ponytail = new THREE.Mesh(ponytailGeo, hairMat);
            ponytail.position.set(0, 1.55, -0.08);
            ponytail.rotation.x = 0.3;
            person.add(ponytail);
        }

        // Neck
        const neckGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.1, 12);
        const neck = new THREE.Mesh(neckGeo, skinMat);
        neck.position.y = 1.47;
        person.add(neck);

        // Torso - more realistic shape
        const torsoGeo = new THREE.CylinderGeometry(0.14, 0.11, 0.45, 12);
        const torso = new THREE.Mesh(torsoGeo, shirtMat);
        torso.position.y = 1.18;
        torso.castShadow = true;
        person.add(torso);

        // Shoulders
        const shoulderGeo = new THREE.SphereGeometry(0.06, 8, 8);
        [-1, 1].forEach(side => {
            const shoulder = new THREE.Mesh(shoulderGeo, shirtMat);
            shoulder.position.set(side * 0.16, 1.35, 0);
            shoulder.scale.set(1.2, 0.8, 1);
            person.add(shoulder);
        });

        // Upper arms
        const upperArmGeo = new THREE.CapsuleGeometry(0.04, 0.2, 4, 8);
        [-1, 1].forEach(side => {
            const upperArm = new THREE.Mesh(upperArmGeo, shirtMat);
            upperArm.position.set(side * 0.2, 1.2, 0);
            upperArm.rotation.z = side * 0.12;
            person.add(upperArm);
        });

        // Lower arms (skin visible)
        const lowerArmGeo = new THREE.CapsuleGeometry(0.035, 0.18, 4, 8);
        [-1, 1].forEach(side => {
            const lowerArm = new THREE.Mesh(lowerArmGeo, skinMat);
            lowerArm.position.set(side * 0.22, 0.95, 0);
            lowerArm.rotation.z = side * 0.1;
            person.add(lowerArm);
        });

        // Hands
        const handGeo = new THREE.SphereGeometry(0.035, 8, 8);
        [-1, 1].forEach(side => {
            const hand = new THREE.Mesh(handGeo, skinMat);
            hand.position.set(side * 0.24, 0.8, 0);
            hand.scale.set(1, 1.3, 0.6);
            person.add(hand);
        });

        // Belt
        const beltGeo = new THREE.CylinderGeometry(0.115, 0.115, 0.04, 12);
        const beltMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 });
        const belt = new THREE.Mesh(beltGeo, beltMat);
        belt.position.y = 0.93;
        person.add(belt);

        // Belt buckle
        const buckleGeo = new THREE.BoxGeometry(0.04, 0.035, 0.015);
        const buckleMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 });
        const buckle = new THREE.Mesh(buckleGeo, buckleMat);
        buckle.position.set(0, 0.93, 0.11);
        person.add(buckle);

        // Hips
        const hipsGeo = new THREE.CylinderGeometry(0.11, 0.10, 0.12, 12);
        const hips = new THREE.Mesh(hipsGeo, pantsMat);
        hips.position.y = 0.85;
        person.add(hips);

        // Upper legs (thighs)
        const thighGeo = new THREE.CapsuleGeometry(0.055, 0.25, 4, 8);
        [-1, 1].forEach(side => {
            const thigh = new THREE.Mesh(thighGeo, pantsMat);
            thigh.position.set(side * 0.065, 0.62, 0);
            thigh.castShadow = true;
            person.add(thigh);
        });

        // Lower legs
        const calfGeo = new THREE.CapsuleGeometry(0.045, 0.25, 4, 8);
        [-1, 1].forEach(side => {
            const calf = new THREE.Mesh(calfGeo, pantsMat);
            calf.position.set(side * 0.065, 0.32, 0);
            person.add(calf);
        });

        // Feet/Shoes - more realistic
        const shoeGeo = new THREE.BoxGeometry(0.08, 0.05, 0.16, 2, 1, 2);
        const shoeColors = [0x1a1a1a, 0x3a3a3a, 0x5a3825, 0x2a2a4a];
        const shoeMat = new THREE.MeshStandardMaterial({ 
            color: shoeColors[Math.floor(Math.random() * shoeColors.length)],
            roughness: 0.7
        });
        [-1, 1].forEach(side => {
            const shoe = new THREE.Mesh(shoeGeo, shoeMat);
            shoe.position.set(side * 0.065, 0.025, 0.02);
            shoe.castShadow = true;
            person.add(shoe);
            
            // Shoe sole
            const soleGeo = new THREE.BoxGeometry(0.085, 0.02, 0.17);
            const soleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
            const sole = new THREE.Mesh(soleGeo, soleMat);
            sole.position.set(side * 0.065, 0.01, 0.02);
            person.add(sole);
        });

        // Random accessories (bag, phone in hand, etc.)
        if (Math.random() > 0.6) {
            // Backpack or bag
            const bagGeo = new THREE.BoxGeometry(0.18, 0.25, 0.08);
            const bagColors = [0x2a2a2a, 0x4a3020, 0x1a3a5a, 0x5a1a1a];
            const bagMat = new THREE.MeshStandardMaterial({ 
                color: bagColors[Math.floor(Math.random() * bagColors.length)],
                roughness: 0.8
            });
            const bag = new THREE.Mesh(bagGeo, bagMat);
            bag.position.set(0, 1.1, -0.12);
            person.add(bag);
        }

        return person;
    }

    createTreesOptimized() {
        // Fewer trees
        const treeCount = 100;
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 4, 5);
        const foliageGeo = new THREE.SphereGeometry(2.5, 5, 4);
        
        for (let i = 0; i < treeCount; i++) {
            let x, z, attempts = 0;
            do {
                x = (Math.random() - 0.5) * this.worldSize * 0.85;
                z = (Math.random() - 0.5) * this.worldSize * 0.85;
                attempts++;
            } while (this.isOnRoad(x, z) && attempts < 8);

            if (attempts < 8) {
                const tree = new THREE.Group();
                
                const trunk = new THREE.Mesh(trunkGeo, this.materials.tree.trunk);
                trunk.position.y = 2;
                tree.add(trunk);
                
                const foliage = new THREE.Mesh(foliageGeo, this.materials.tree.foliage);
                foliage.position.y = 5.5;
                foliage.castShadow = true;
                tree.add(foliage);
                
                tree.position.set(x, 0, z);
                tree.userData = { type: 'tree', label: 'tree' };
                this.scene.add(tree);
            }
        }
    }

    isOnRoad(x, z) {
        for (const road of this.roads) {
            const hw = road.width / 2 + 4;
            if (road.rotation === 0) {
                if (Math.abs(z - road.z) < hw && Math.abs(x - road.x) < road.length / 2) return true;
            } else {
                if (Math.abs(x - road.x) < hw && Math.abs(z - road.z) < road.length / 2) return true;
            }
        }
        return false;
    }

    createTrafficLights() {
        const poleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 3.5, 5);
        const boxGeo = new THREE.BoxGeometry(0.35, 1, 0.35);

        this.intersections.forEach(inter => {
            for (let i = 0; i < 4; i++) {
                const tl = new THREE.Group();
                
                const pole = new THREE.Mesh(poleGeo, poleMat);
                pole.position.y = 1.75;
                tl.add(pole);

                const box = new THREE.Mesh(boxGeo, poleMat);
                box.position.y = 3.8;
                tl.add(box);

                // Lights
                const lightGeo = new THREE.CircleGeometry(0.1, 6);
                const lights = [
                    { color: 0xff0000, y: 4.1 },
                    { color: 0xffff00, y: 3.8 },
                    { color: 0x00ff00, y: 3.5 }
                ];
                lights.forEach(l => {
                    const light = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: l.color }));
                    light.position.set(0, l.y, 0.18);
                    tl.add(light);
                });

                const angle = (i * Math.PI / 2) + Math.PI / 4;
                tl.position.set(
                    inter.x + Math.cos(angle) * 10,
                    0,
                    inter.z + Math.sin(angle) * 10
                );
                tl.rotation.y = angle + Math.PI;
                tl.userData = { type: 'traffic_light', label: 'traffic light' };
                this.scene.add(tl);
                this.detectableObjects.push(tl);
            }
        });
    }

    createStreetLamps() {
        // Street lamp materials
        const poleMat = new THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            metalness: 0.8, 
            roughness: 0.3 
        });
        const lampMat = new THREE.MeshStandardMaterial({ 
            color: 0x222222, 
            metalness: 0.6, 
            roughness: 0.4 
        });
        const lightGlassMat = new THREE.MeshBasicMaterial({ 
            color: 0xffffaa, 
            transparent: true, 
            opacity: 0.9 
        });
        
        // Shared geometries
        const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 7, 6);
        const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 2, 6);
        const lampHousingGeo = new THREE.BoxGeometry(0.6, 0.3, 0.4);
        const lampGlassGeo = new THREE.PlaneGeometry(0.5, 0.35);
        
        // Store street light references for night mode
        this.streetLights = [];
        
        // Add lamps along roads
        const roads = [
            // Main horizontal roads
            { z: 0, startX: -1200, endX: 1200, side: 12 },
            { z: 350, startX: -1000, endX: 1000, side: 10 },
            { z: -350, startX: -1000, endX: 1000, side: 10 },
        ];
        
        const verticalRoads = [
            // Main vertical roads  
            { x: 0, startZ: -1200, endZ: 1200, side: 12 },
            { x: 350, startZ: -1000, endZ: 1000, side: 10 },
            { x: -350, startZ: -1000, endZ: 1000, side: 10 },
        ];
        
        // Lamp spacing
        const spacing = 50;
        
        // Horizontal roads - lamps on both sides
        roads.forEach(road => {
            for (let x = road.startX; x <= road.endX; x += spacing) {
                // Skip intersections
                if (Math.abs(x) < 15 || Math.abs(x - 350) < 15 || Math.abs(x + 350) < 15) continue;
                
                [-1, 1].forEach(sideSign => {
                    const lamp = this.createSingleLamp(poleGeo, armGeo, lampHousingGeo, lampGlassGeo, poleMat, lampMat, lightGlassMat);
                    lamp.position.set(x, 0, road.z + road.side * sideSign);
                    lamp.rotation.y = sideSign > 0 ? 0 : Math.PI;
                    this.scene.add(lamp);
                });
            }
        });
        
        // Vertical roads - lamps on both sides
        verticalRoads.forEach(road => {
            for (let z = road.startZ; z <= road.endZ; z += spacing) {
                // Skip intersections
                if (Math.abs(z) < 15 || Math.abs(z - 350) < 15 || Math.abs(z + 350) < 15) continue;
                
                [-1, 1].forEach(sideSign => {
                    const lamp = this.createSingleLamp(poleGeo, armGeo, lampHousingGeo, lampGlassGeo, poleMat, lampMat, lightGlassMat);
                    lamp.position.set(road.x + road.side * sideSign, 0, z);
                    lamp.rotation.y = sideSign > 0 ? Math.PI / 2 : -Math.PI / 2;
                    this.scene.add(lamp);
                });
            }
        });
        
        console.log('Street lamps created:', this.streetLights.length);
    }
    
    createSingleLamp(poleGeo, armGeo, lampHousingGeo, lampGlassGeo, poleMat, lampMat, lightGlassMat) {
        const lamp = new THREE.Group();
        
        // Pole
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 3.5;
        pole.castShadow = true;
        lamp.add(pole);
        
        // Curved arm (simplified as angled cylinder)
        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.set(0, 7, 0.8);
        arm.rotation.x = Math.PI / 6;
        lamp.add(arm);
        
        // Lamp housing
        const housing = new THREE.Mesh(lampHousingGeo, lampMat);
        housing.position.set(0, 6.8, 1.5);
        lamp.add(housing);
        
        // Lamp glass (bottom of housing - the actual light source)
        const glass = new THREE.Mesh(lampGlassGeo, lightGlassMat);
        glass.rotation.x = -Math.PI / 2;
        glass.position.set(0, 6.6, 1.5);
        lamp.add(glass);
        
        // Point light for illumination
        const light = new THREE.PointLight(0xffeecc, 0.8, 40, 2);
        light.position.set(0, 6.5, 1.5);
        light.castShadow = false; // Performance: disable shadow for street lights
        lamp.add(light);
        
        // Store reference for night mode intensity adjustments
        this.streetLights.push(light);
        
        return lamp;
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
        // For MeshBasicMaterial, we adjust color brightness based on intensity
        if (this.buildingWindows) {
            this.buildingWindows.forEach(win => {
                if (win.material) {
                    // Brighter yellow for night, dimmer for day
                    if (intensity > 0.5) {
                        win.material.color.setHex(0xffffaa);
                        win.material.opacity = 0.95;
                    } else if (intensity > 0) {
                        win.material.color.setHex(0xddcc88);
                        win.material.opacity = 0.7;
                    } else {
                        win.material.color.setHex(0x88aacc);
                        win.material.opacity = 0.4;
                    }
                }
            });
        }
    }
}
