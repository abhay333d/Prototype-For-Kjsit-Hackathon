import './style.css'
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import gsap from 'gsap';
import ARManager from './ar';

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

// Optimize renderer
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio
renderer.setSize(window.innerWidth, window.innerHeight);

const radius = 1.3;
const segments = 32; // Reduced from 64 for better performance
const textures = [
  './csilla/color.png',
  './earth/map.jpg',
  './venus/map.jpg',
  './volcanic/color.png'
];

// Create texture loader with optimizations
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = 'anonymous';

// Create starfield background with optimized texture
const starfieldGeometry = new THREE.SphereGeometry(50, 32, 32); // Reduced segments
const starfieldTexture = textureLoader.load('./stars.jpg');
starfieldTexture.colorSpace = THREE.SRGBColorSpace;
starfieldTexture.wrapS = THREE.RepeatWrapping;
starfieldTexture.wrapT = THREE.RepeatWrapping;
starfieldTexture.minFilter = THREE.LinearFilter;
starfieldTexture.generateMipmaps = false; // Disable mipmaps for better performance

const starfieldMaterial = new THREE.MeshStandardMaterial({
  map: starfieldTexture,
  side: THREE.BackSide,
  opacity: 0.7,
  transparent: true
});
const starfield = new THREE.Mesh(starfieldGeometry, starfieldMaterial);
scene.add(starfield);

// Create spheres and add them to the group
const spheres = new THREE.Group();
const orbitRadius = 4.5;
const spheresMesh = [];

// Load textures with optimizations
const planetTextures = textures.map(texturePath => {
  const texture = textureLoader.load(texturePath);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false; // Disable mipmaps
  texture.anisotropy = 1; // Reduce anisotropy
  return texture;
});

// Create spheres with optimized materials
for (let i = 0; i < 4; i++) {
  const geometry = new THREE.SphereGeometry(radius, segments, segments);
  const material = new THREE.MeshStandardMaterial({ 
    map: planetTextures[i],
    envMapIntensity: 1.0,
    roughness: 0.8,
    metalness: 0.2
  });
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

// Load environment texture with optimizations
const loader = new RGBELoader();
loader.load(
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonlit_golf_1k.hdr',
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    scene.environment = texture;
  }
);

camera.position.z = 9;

/* AR Initialization */
ARManager();

/* Scroll-triggered animations */
let lastScrollTime = 0;
const scrollThrottleDelay = 2000; // 2 seconds
let scrollCount = 0;
let lastTouchY = 0;
let isTouching = false;

window.addEventListener('wheel', handleScroll);
window.addEventListener('touchstart', (event) => {
  lastTouchY = event.touches[0].clientY;
  isTouching = true;
});
window.addEventListener('touchmove', handleTouchScroll);
window.addEventListener('touchend', () => {
  isTouching = false;
});

function handleScroll(event) {
  handleScrollEffect(event.deltaY > 0 ? 'down' : 'up');
}

function handleTouchScroll(event) {
  if (!isTouching) return;
  
  const currentTouchY = event.touches[0].clientY;
  const direction = currentTouchY < lastTouchY ? 'down' : 'up';

  lastTouchY = currentTouchY;
  
  handleScrollEffect(direction);
}

// function handleScrollEffect(direction) {
//   const currentTime = Date.now();
  
//   if (currentTime - lastScrollTime >= scrollThrottleDelay) {
//     scrollCount = (scrollCount + 1) % 4;

//     const headings = document.querySelectorAll('.heading');

//     gsap.to(headings, {
//       y: `-=${100}%`,
//       duration: 1,
//       ease: 'power2.inOut',
//       stagger: 0.2
//     });

//     gsap.to(spheres.rotation, {
//       duration: 1,
//       y: `-=${Math.PI / 2}`,
//       ease: 'power2.inOut',
//     });

//     if (scrollCount === 0) {
//       gsap.to(headings, {
//         y: `0`,
//         duration: 1,
//         ease: 'power2.inOut',
//       });
//     }

//     lastScrollTime = currentTime;
//   }
// }

function handleScrollEffect(direction) {
  const currentTime = Date.now();
  
  if (currentTime - lastScrollTime >= scrollThrottleDelay) {
    scrollCount = (scrollCount + 1) % 4;

    const headings = document.querySelectorAll('.heading');

    gsap.to(headings, {
      y: `-${100 * scrollCount}%`, // Set absolute y position based on scrollCount
      duration: 1,
      ease: 'power2.inOut',
      stagger: 0.2
    });

    gsap.to(spheres.rotation, {
      duration: 1,
      y: `-=${Math.PI / 2}`,
      ease: 'power2.inOut',
    });

    if (scrollCount === 0) {
      gsap.to(headings, {
        y: `0`,
        duration: 1,
        ease: 'power2.inOut',
      });
    }

    lastScrollTime = currentTime;
  }
}

/* Animation Loop */
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  for (let i = 0; i < spheresMesh.length; i++) {
    spheresMesh[i].rotation.y = clock.getElapsedTime() * 0.035;
  }
  renderer.render(scene, camera);
}
animate();

/* Handle window resize */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
