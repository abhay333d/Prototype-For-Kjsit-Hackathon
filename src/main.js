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
const textures = [
  './csilla/color.png',
  './earth/map.jpg',
  './venus/map.jpg',
  './volcanic/color.png'
];
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

const spheresMesh = [];

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

let lastScrollTime = 0;
const scrollThrottleDelay = 2000; // 2 seconds
let scrollCount = 0;

let lastTouchY = 0;
let isTouching = false;

// Event listeners for both wheel (desktop) and touch (mobile)
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

const clock = new THREE.Clock();

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  for (let i = 0; i < spheresMesh.length; i++) {
    spheresMesh[i].rotation.y = clock.getElapsedTime() * 0.035;
  }
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


//AR Part

window.addEventListener('DOMContentLoaded', () => {
  const arButton = document.getElementById('ar-button');
  // const supported = navigator.xr && navigator.xr.supportsSession('immersive-ar');
  // if(!supported){
  //   arButton.textContent = 'AR Not Supported';
  //   arButton.disabled = true;
  //   return;
  // }
  const initializeAR = () => {
    const boxGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(0, 0, -0.3);
    scene.add(box);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemisphereLight.position.set(0, 1, 0);
    scene.add(hemisphereLight);

    let currentSession = null;
    //Start
    const startAR = async() => {
      currentSession = await navigator.xr.requestSession('immersive-ar',{optionalFeatures:['dom-overlay'],domOverlay:{root:document.body}});
      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType('local');
      await renderer.xr.setSession(currentSession);
      arButton.textContent = 'Stop AR';

      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });};

      const controller = renderer.xr.getController(0);

      controller.addEventListener('selectstart', ()=>{
        console.log('selectstart');
      });

      controller.addEventListener('selectend', ()=>{
        console.log('selectend');
      }); 

      controller.addEventListener('select', ()=>{
        console.log('select');
      });

      const end = async() => {
        currentSession.end();
        renderer.clear();
        renderer.setAnimationLoop(null);
        arButton.style.display = 'none';

        // Refresh the website
        window.location.reload();
      };
      arButton.addEventListener('click', ()=>{
        if(currentSession){
          end();
        }else{
          startAR();
        }
      });
    };


  initializeAR();
});
