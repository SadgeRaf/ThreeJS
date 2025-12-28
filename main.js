import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const canvas = document.getElementById('experience-canvas')
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const light = new THREE.AmbientLight(0x404040, 3); // soft white light
scene.add(light);

const loader = new GLTFLoader();

loader.load('./Three.glb', function (glb) {
    glb.scene.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    })
    scene.add(glb.scene);

}, undefined, function (error) {

    console.error(error);

});

const aspect = sizes.width / sizes.height
const camera = new THREE.OrthographicCamera(
    -aspect * 50,
    aspect * 50,
    50,
    -50,
    1,
    1000);
scene.add(camera);


camera.position.x = 13.098375590544478;
camera.position.y = 11.918674548494824;
camera.position.z = 10.514142313888662;

const controls = new OrbitControls(camera, canvas);
controls.update();

// White directional light at half intensity shining from the top.
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.castShadow = true;
directionalLight.position.set(10,50,0);
directionalLight.target.position.set(50,20,0);
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.top = -100;
directionalLight.shadow.normalBias = 0.1;
scene.add(directionalLight);

const shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
scene.add(shadowHelper);
const directionalHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
scene.add(directionalHelper);

function handleResize() {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    const aspect = sizes.width / sizes.height;
    camera.left = -aspect * 50;
    camera.right = aspect * 50;
    camera.top = 50;
    camera.bottom = -50;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener('resize', handleResize);

function animate() {

    renderer.render(scene, camera);

}
renderer.setAnimationLoop(animate);