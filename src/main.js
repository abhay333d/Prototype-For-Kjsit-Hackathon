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

function handleScrollEffect(direction) {
  const currentTime = Date.now();
  
  if (currentTime - lastScrollTime >= scrollThrottleDelay) {
    scrollCount = (scrollCount + 1) % 4;

    const headings = document.querySelectorAll('.heading');

    gsap.to(headings, {
      y: `-=${100}%`,
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
