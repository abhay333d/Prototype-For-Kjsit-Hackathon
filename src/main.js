import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import gsap from 'gsap';

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  25,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#canvas'),
  antialias: true
});

const radius = 1.3;
const segments = 64;
const textures = [
  './csilla/color.png',
  './earth/map.jpg',
  './venus/map.jpg',
  './volcanic/color.png'
];
const spheres = new THREE.Group();
const orbitRadius = 4.5;
const spheresMesh = [];

// Create starfield background
const starfieldGeometry = new THREE.SphereGeometry(50, 64, 64);
const starfieldTexture = new THREE.TextureLoader().load('./stars.jpg');
starfieldTexture.colorSpace = THREE.SRGBColorSpace;
starfieldTexture.wrapS = THREE.RepeatWrapping;
starfieldTexture.wrapT = THREE.RepeatWrapping;
const starfieldMaterial = new THREE.MeshStandardMaterial({
  map: starfieldTexture,
  side: THREE.BackSide,
  opacity: 0.7,
  transparent: true
});
const starfield = new THREE.Mesh(starfieldGeometry, starfieldMaterial);
scene.add(starfield);

// Create spheres and add them to the group
for (let i = 0; i < 4; i++) {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(textures[i]);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.SphereGeometry(radius, segments, segments);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const sphere = new THREE.Mesh(geometry, material);
  spheresMesh.push(sphere);
  const angle = (i * Math.PI * 2) / 4;
  sphere.position.x = orbitRadius * Math.cos(angle);
  sphere.position.z = orbitRadius * Math.sin(angle);
  spheres.add(sphere);
}
spheres.rotation.x = 0.1;
spheres.position.y = -0.8;
scene.add(spheres);

// Load environment texture
const loader = new RGBELoader();
loader.load(
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonlit_golf_1k.hdr',
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  }
);

// Set renderer size and camera position
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
camera.position.z = 9;

/* AR Initialization */
window.addEventListener('DOMContentLoaded', () => {
  const arButton = document.getElementById('ar-button');
  let currentSession = null;
  // Flag to check if the 3D models have been revealed in AR
  let modelsShown = false;

  const startAR = async () => {
    try {
      currentSession = await navigator.xr.requestSession('immersive-ar', {
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body }
      });
      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType('local');
      await renderer.xr.setSession(currentSession);
      arButton.textContent = 'Stop AR';
      
      // Hide only the headings and the 3D models (spheres)
      const headings = document.getElementById('headings');
      if (headings) {
        headings.style.display = 'none';
      }
      spheres.visible = false;
      
      // Setup controller event listener(s)
      setupController();

      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });
    } catch (error) {
      console.error('Failed to start AR session:', error);
    }
  };

  const endAR = async () => {
    if (currentSession) {
      await currentSession.end();
      renderer.setAnimationLoop(null);
      arButton.textContent = 'Explore in AR';
      // Refresh the page to restore the original state (including the headings)
      window.location.reload();
    }
  };

  arButton.addEventListener('click', () => {
    if (currentSession) {
      endAR();
      currentSession = null;
    } else {
      startAR();
    }
  });

  /* Controller Setup Function */
  function setupController() {
    const controller = renderer.xr.getController(0);
    scene.add(controller);

    // Try both "selectstart" and "select" events for broader compatibility
    controller.addEventListener('selectstart', onSelect);
    controller.addEventListener('select', onSelect);

    function onSelect() {
      console.log('Controller event triggered.');
      // On first click, reveal the spheres
      if (!modelsShown) {
        spheres.visible = true;
        modelsShown = true;
        console.log('3D models are now visible.');
        return;
      }
      
      // Subsequent taps spawn a box
      console.log('Spawning a box.');
      const boxGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);
      const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      
      // Set box position and orientation based on the controller's world matrix
      box.position.setFromMatrixPosition(controller.matrixWorld);
      box.quaternion.setFromRotationMatrix(controller.matrixWorld);
      scene.add(box);
    }
  }
});

/* Scroll-triggered animations */
let lastScrollTime = 0;
const scrollThrottleDelay = 2000; // 2 seconds
let scrollCount = 0;
let lastTouchY = 0;
let isTouching = false;

window.addEventListener('wheel', (event) => {
  handleScrollEffect(event.deltaY > 0 ? 'down' : 'up');
});
window.addEventListener('touchstart', (event) => {
  lastTouchY = event.touches[0].clientY;
  isTouching = true;
});
window.addEventListener('touchmove', (event) => {
  if (!isTouching) return;
  const currentTouchY = event.touches[0].clientY;
  const direction = currentTouchY < lastTouchY ? 'down' : 'up';
  lastTouchY = currentTouchY;
  handleScrollEffect(direction);
});
window.addEventListener('touchend', () => {
  isTouching = false;
});

function handleScrollEffect(direction) {
  const currentTime = Date.now();
  if (currentTime - lastScrollTime >= scrollThrottleDelay) {
    scrollCount = (scrollCount + 1) % 4;
    const headings = document.querySelectorAll('.heading');
    gsap.to(headings, {
      y: '-=100%',
      duration: 1,
      ease: 'power2.inOut',
      stagger: 0.2
    });
    gsap.to(spheres.rotation, {
      duration: 1,
      y: `-=${Math.PI / 2}`,
      ease: 'power2.inOut'
    });
    if (scrollCount === 0) {
      gsap.to(headings, {
        y: '0',
        duration: 1,
        ease: 'power2.inOut'
      });
    }
    lastScrollTime = currentTime;
  }
}

/* Animation Loop */
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  spheresMesh.forEach((sphere) => {
    sphere.rotation.y = clock.getElapsedTime() * 0.035;
  });
  renderer.render(scene, camera);
}
animate();

/* Handle window resize */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
