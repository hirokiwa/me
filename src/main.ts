import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector<HTMLCanvasElement>('#model-canvas');

if (!canvas) {
  throw new Error('Canvas not found');
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
});
const controls = new OrbitControls(camera, renderer.domElement);

const createPointMaterial = () =>
  new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.01,
    sizeAttenuation: true,
  });

const createPointCloud = (geometry: THREE.BufferGeometry) => {
  geometry.computeVertexNormals();

  const points = new THREE.Points(geometry, createPointMaterial());
  points.rotation.set(0, 0, Math.PI);
  points.scale.set(0.7, 0.7, 0.7);

  return points;
};

const loadPointCloud = () => {
  const plyLoader = new PLYLoader();

  plyLoader.load('/hirokiwa_model.ply', (geometry) => {
    const points = createPointCloud(geometry);
    scene.add(points);
  });
};

const updateCanvasSize = () => {
  const { width, height } = canvas.getBoundingClientRect();

  if (width === 0 || height === 0) {
    return;
  }

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

const observeCanvasSize = () => {
  if (typeof ResizeObserver === 'undefined') {
    window.addEventListener('resize', updateCanvasSize);
    return;
  }

  const resizeObserver = new ResizeObserver(() => {
    updateCanvasSize();
  });

  resizeObserver.observe(canvas);
  window.addEventListener('resize', updateCanvasSize);
};

const tick = () => {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

const initializeScene = () => {
  camera.position.z = 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  controls.enableDamping = true;
  controls.autoRotate = true;
};

initializeScene();
loadPointCloud();
updateCanvasSize();
observeCanvasSize();
tick();
