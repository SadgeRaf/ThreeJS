import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

window.alert("Use WASD or arrow keys to move and you can click on the picture");

const scene = new THREE.Scene();
const canvas = document.getElementById('experience-canvas');
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

let character = {
    instance: null,
    moveDistance: 3,
    jumpHeight: 1,
    isMoving: false,
    moveDuration: 0.2,
}

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.75;

const modalContent = {
    Board: {
        title: "I drew This",
        content: "Ill show this same a thousand times if i have to",
    },
    heels: {
        title: "Heels",
        content: "Poorly made character",
    }
    // Add more as needed
};

const modal = document.querySelector(".modal");
const modalTitle = document.querySelector(".title");
const modalText = document.querySelector(".text");
const closeButton = document.querySelector(".exit");
const modalContentDiv = document.querySelector(".modal-content");

function showModal(id) {
    const content = modalContent[id];
    if (content) {
        modalTitle.textContent = content.title;
        modalText.textContent = content.content;
        modal.classList.toggle("hidden");
    }
}

function hideModal() {
    modal.classList.toggle("hidden");
}

let intersectObject = '';
const intersectObjects = [];
const intersectObjectsNames = [
    'heels',
    'Board',
    'Ground',
    'Scene'
]


const loader = new GLTFLoader();

loader.load('./Three.glb', function (glb) {
    glb.scene.traverse((child) => {

        if (intersectObjectsNames.includes(child.name)) {
            intersectObjects.push(child);
        }

        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
        // console.log(child);

        if (child.name === 'heels') {
            character.instance = child;
        }
    })
    scene.add(glb.scene);

}, undefined, function (error) {

    console.error(error);

});

const aspect = sizes.width / sizes.height
const camera = new THREE.OrthographicCamera(
    -aspect * 15,
    aspect * 15,
    15,
    -15,
    1,
    1000);
scene.add(camera);


camera.position.x = 13;
camera.position.y = 11;
camera.position.z = 10;

const controls = new OrbitControls(camera, canvas);
controls.update();

const light = new THREE.AmbientLight(0x404040, 3); // soft white light
scene.add(light);

// White directional light at half intensity shining from the top.
const directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.castShadow = true;
directionalLight.position.set(20, 60, 20);
directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
directionalLight.target.position.set(50, 20, 0);
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
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

function handlePointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

function handleClick(event) {
    console.log(intersectObject);
    if (intersectObject !== '') {
        showModal(intersectObject);
    }

}

function moveCharacter(targetPosition, targetRotation) {
    character.isMoving = true;

    const t1 = gsap.timeline({
        onComplete: () => {
            character.isMoving = false;
        }
    })

    t1.to(character.instance.position, {
        x: targetPosition.x,
        z: targetPosition.z,
        duration: character.moveDuration,
        ease: "power2.out"
    });
    t1.to(character.instance.rotation, {
        y: targetRotation,
        duration: character.moveDuration,
    },
        0
    );
    t1.to(character.instance.position, {
        y: character.instance.position.y + character.jumpHeight,
        duration: character.moveDuration / 2,
        yoyo: true,
        repeat: 1,
    },
        0
    );
}

function handleKeyDown(event) {
    if (character.isMoving) return;

    const targetPosition = new THREE.Vector3().copy(character.instance.position)
    let targetRotation = 0

    switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            targetPosition.x -= character.moveDistance;
            targetRotation = 0
            break;
        case 's':
        case 'arrowdown':
            targetPosition.x += character.moveDistance;
            targetRotation = Math.PI
            break;
        case 'a':
        case 'arrowleft':
            targetPosition.z += character.moveDistance;
            targetRotation = Math.PI / 2
            break;
        case 'd':
        case 'arrowright':
            targetPosition.z -= character.moveDistance;
            targetRotation = -Math.PI / 2
            break;
        default:
            return;


    }
    moveCharacter(targetPosition, targetRotation);
}

closeButton.addEventListener("click", hideModal);
window.addEventListener('resize', handleResize);
window.addEventListener('click', handleClick);
window.addEventListener('pointermove', handlePointerMove);
window.addEventListener('keydown', handleKeyDown);

function animate() {
    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(intersectObjects);

    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
    } else {
        document.body.style.cursor = 'default';
        intersectObject = "";
    }

    for (let i = 0; i < intersects.length; i++) {
        // console.log(intersects[0].object.parent.name);
        intersectObject = intersects[0].object.parent.name;
    }

    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);