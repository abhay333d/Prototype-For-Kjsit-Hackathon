import './style.css'

import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import gsap from 'gsap';

// Initialize scene, camera and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#canvas'),
  antialias: true
});



const radius = 1.3;
const segments = 64;
const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
const textures = [
  './csilla/color.png',
  './earth/map.jpg',
  './venus/map.jpg',
  './volcanic/color.png'
]
const spheres = new THREE.Group();
const orbitRadius = 4.5;

// Create a large sphere for the starfield background
const starfieldGeometry = new THREE.SphereGeometry(50, 64, 64);
const starfieldTexture = new THREE.TextureLoader().load('./stars.jpg');
starfieldTexture.colorSpace = THREE.SRGBColorSpace;
starfieldTexture.wrapS = THREE.RepeatWrapping;
starfieldTexture.wrapT = THREE.RepeatWrapping;
const starfieldMaterial = new THREE.MeshStandardMaterial({
  map: starfieldTexture,
  side: THREE.BackSide, // Render on the inside of the sphere
  opacity: 0.7,
  transparent: true
});
const starfield = new THREE.Mesh(starfieldGeometry, starfieldMaterial);
scene.add(starfield);




for (let i = 0; i < 4; i++) {

  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(textures[i]);
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.SphereGeometry(radius, segments, segments);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const sphere = new THREE.Mesh(geometry, material);



  const angle = (i * Math.PI * 2) / 4;
  sphere.position.x = orbitRadius*Math.cos(angle);
  sphere.position.z = orbitRadius*Math.sin(angle);

  spheres.add(sphere);
}
spheres.rotation.x = 0.1;
spheres.position.y = -0.8;
scene.add(spheres);

const loader = new RGBELoader();
loader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonlit_golf_1k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
});


// Set renderer size and pixel ratio
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
 

// Position camera
camera.position.z = 9;


// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

