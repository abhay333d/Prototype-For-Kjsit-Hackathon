import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

const ARManager = () => {
    document.addEventListener('DOMContentLoaded', () => {
        const initialize = () => {
            const supported = navigator.xr && navigator.xr.isSessionSupported('immersive-ar');
            const arButton = document.querySelector('#ar-button');
            const arEndButton = document.querySelector('#ar-end-button');
            const headings = document.querySelector('#headings');
            
            if (!supported) {
                arButton.textContent = 'AR is not supported on this device';
                arButton.disabled = true;
                return;
            }

            const arCanvas = document.querySelector('#ar-canvas');
            const arScene = new THREE.Scene();
            const arCamera = new THREE.PerspectiveCamera(
                70,
                window.innerWidth / window.innerHeight,
                0.01,
                20
            );
            const arRenderer = new THREE.WebGLRenderer({
                canvas: arCanvas,
                alpha: true,
                powerPreference: "high-performance",
                antialias: false
            });
            arRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            arRenderer.setSize(window.innerWidth, window.innerHeight);

            // Load environment texture
            const loader = new RGBELoader();
            loader.load(
                'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonlit_golf_1k.hdr',
                (texture) => {
                    texture.mapping = THREE.EquirectangularReflectionMapping;
                    arScene.environment = texture;
                }
            );

            // Create model templates
            const radius = 0.04;
            const segments = 64;
            const textures = [
                './earth/map.jpg',
                './csilla/color.png',
                './volcanic/color.png',
                './venus/map.jpg'
            ];

            const models = textures.map(texturePath => {
                const textureLoader = new THREE.TextureLoader();
                const texture = textureLoader.load(texturePath);
                texture.colorSpace = THREE.SRGBColorSpace;
                const geometry = new THREE.SphereGeometry(radius, segments, segments);
                const material = new THREE.MeshStandardMaterial({ 
                    map: texture,
                    envMapIntensity: 1.0
                });
                return new THREE.Mesh(geometry, material);
            });

            // Add light for better visibility
            const light = new THREE.HemisphereLight(0xffffff, 0x080808, 1);
            arScene.add(light);

            // Add controller
            const controller = arRenderer.xr.getController(0);
            arScene.add(controller);

            // Create AR Menu
            const menuGroup = new THREE.Group();
            const menuGeometry = new THREE.PlaneGeometry(0.3, 0.4);
            const menuMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x000000,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            const menuBackground = new THREE.Mesh(menuGeometry, menuMaterial);
            menuGroup.add(menuBackground);

            // Create menu items
            const menuItems = ['Earth', 'Scilla', 'Volcanic', 'Venus'];
            const menuTexts = menuItems.map((text, index) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 256;
                canvas.height = 64;
                
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, canvas.width/2, canvas.height/2);

                const texture = new THREE.CanvasTexture(canvas);
                const material = new THREE.MeshBasicMaterial({ 
                    map: texture,
                    transparent: true,
                    side: THREE.DoubleSide
                });
                const geometry = new THREE.PlaneGeometry(0.25, 0.08);
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.y = 0.15 - (index * 0.08);
                return mesh;
            });

            menuTexts.forEach(text => menuGroup.add(text));
            menuGroup.position.set(0, 0, -1); // Position menu 1 meter in front
            arScene.add(menuGroup);

            // Keep track of the current model
            let currentModel = null;
            let selectedModelIndex = 0;

            // Handle model selection
            controller.addEventListener('select', () => {
                // Raycaster for menu interaction
                const raycaster = new THREE.Raycaster();
                raycaster.setFromXRController(controller);

                // Check intersection with menu items
                const intersects = raycaster.intersectObjects(menuTexts);
                if (intersects.length > 0) {
                    const index = menuTexts.indexOf(intersects[0].object);
                    if (index !== -1) {
                        selectedModelIndex = index;
                        // Update menu item colors
                        menuTexts.forEach((text, i) => {
                            const material = text.material;
                            if (i === index) {
                                material.color.setHex(0x9333ea); // Purple for selected
                            } else {
                                material.color.setHex(0xffffff); // White for unselected
                            }
                        });
                    }
                } else {
                    // Place model if not clicking menu
                    if (currentModel) {
                        arScene.remove(currentModel);
                    }
                    
                    currentModel = models[selectedModelIndex].clone();
                    currentModel.position.applyMatrix4(controller.matrixWorld);
                    
                    const clock = new THREE.Clock();
                    const animate = () => {
                        currentModel.rotation.y = clock.getElapsedTime() * 0.035;
                        requestAnimationFrame(animate);
                    };
                    animate();
                    
                    arScene.add(currentModel);
                }
            });
            
            let currentSession = null;
            const start = async () => {
                try {
                currentSession = await navigator.xr.requestSession('immersive-ar');
                } catch (error) {
                    console.error('Failed to start AR session:', error);
                    if(error.name==='NotSupportedError') {
                        alert('AR/XR hardware not found. Please connect an AR/XR device or try a compatible device.');
                    }
                    else {
                        alert(`AR session failed: ${error.message}`);
                    }
                }
                arRenderer.xr.enabled = true;
                arRenderer.xr.setReferenceSpaceType('local');
                await arRenderer.xr.setSession(currentSession);

                // Hide headings and start button, show end button
                if (headings) headings.style.display = 'none';
                arButton.classList.add('hidden');
                arEndButton.classList.remove('hidden');
                arCanvas.style.display = 'block';
                arRenderer.setAnimationLoop(() => {
                    arRenderer.render(arScene, arCamera);
                })
            }
            const end = () => {
                if (currentSession) {
                    currentSession.end();
                }
                arRenderer.clear();
                arRenderer.setAnimationLoop(null);
                
                // Show headings and start button, hide end button
                if (headings) headings.style.display = 'block';
                arButton.classList.remove('hidden');
                arEndButton.classList.add('hidden');
                arCanvas.style.display = 'none';
            }
            
            arButton.addEventListener('click', start);
            arEndButton.addEventListener('click', end);
        }
        initialize();
    })
}

export default ARManager;