import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector<HTMLCanvasElement>('#model-canvas');
if (!canvas) {
  throw new Error('Canvas not found');
}

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  50,
  canvas.offsetWidth / canvas.offsetHeight,
  0.1,
  1000,
);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
});
renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;

const plyLoader = new PLYLoader();
plyLoader.load(
  '/hirokiwa_model.ply',
  (geometry) => {
    geometry.computeVertexNormals();
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.01,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geometry, material);
    points.rotation.set(0, 0, Math.PI);
    points.scale.set(0.7, 0.7, 0.7);
    scene.add(points);
  },
);



const handleResize = () => {
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
  camera.updateProjectionMatrix();
};

const tick = () => {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

window.addEventListener('resize', handleResize);

tick();
