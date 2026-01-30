import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';

window.alert("Use WASD or arrow keys to move and you can click on the picture");

const scene = new THREE.Scene();
const canvas = document.getElementById('experience-canvas');
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const GRAVIRTY = 30;
const CAPSULE_RADIUS = 0.35;
const CAPSULE_HEIGHT = 1.0;
const JUMP_HEIGHT = 8;
const MOVE_SPEED = 8;
const DELTA_TIME = 1/60; // Fixed delta time for consistent physics

let character = {
    instance: null,
    isMoving: false,
}

let targetRotation = 0;

// Track pressed keys to prevent key repeat
const pressedKeys = new Set();

const colliderOctree = new Octree();
const playerCollider = new Capsule(
    new THREE.Vector3(0, CAPSULE_RADIUS, 0),
    new THREE.Vector3(0, CAPSULE_HEIGHT, 0),
    CAPSULE_RADIUS
);

let playerVelocity = new THREE.Vector3();
let playerOnFloor = false;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.75;

const modalContent = {
    Board: {
        title: "WarmPAWS",
        content: "This is my first project, working with firebase authentication and GSAP",
        link: 'https://warmpaws-55717.web.app'
    },
    Board001: {
        title: "FreelanceMarketplace", 
        content: "My second project, working with nodeJS expressJS and mongoDB",
        link: 'https://freelance-marketplace-8dbfc.web.app'
    },
    Board002: {
        title: "ContestHUB",
        content: "Third Project, working with stripe api user roles dashboard", 
        link: 'https://contest-hub-988e2.web.app'
    },
    heels: {
        title: "Me?",
        content: "Poorly made character",
    }
};

const modal = document.querySelector(".modal");
const modalTitle = document.querySelector(".title");
const modalText = document.querySelector(".text");
const closeButton = document.querySelector(".exit");
const modalContentDiv = document.querySelector(".modal-content");
const visitButton = document.querySelector(".visit");

function showModal(id) {
    const content = modalContent[id];
    if (content) {
        modalTitle.textContent = content.title;
        modalText.textContent = content.content;

        console.log('Modal content for', id, ':', content); // Debug log
        console.log('Link exists:', !!content.link); // Debug log

        if (content.link && content.link.trim() !== '') {
            visitButton.href = content.link;
            visitButton.classList.remove('hidden');
            console.log('Showing visit button with link:', content.link);
        } else {
            visitButton.classList.add('hidden');
            console.log('Hiding visit button - no link');
        }
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
    'Board001',
    'Board002',
    'Ground',
    'Scene'
]


const loader = new GLTFLoader();

loader.load('./Port.glb', function (glb) {
    
    glb.scene.updateMatrixWorld(true);
    
    console.log('=== ALL OBJECTS IN GLB FILE ===');
    glb.scene.traverse((child) => {
        console.log('Object:', child.name, 'Type:', child.type, 'isMesh:', child.isMesh, 'Parent:', child.parent?.name);
        
        // Specifically look for board objects
        if (child.name.includes('Board') || child.name.includes('board')) {
            console.log('🎯 FOUND BOARD OBJECT:', child.name, 'Type:', child.type, 'Parent:', child.parent?.name);
        }
    });
    console.log('=== END OBJECT LIST ===');
    
    // Clear intersect objects and rebuild selectively
    intersectObjects.length = 0;
    
    glb.scene.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Disable raycasting for ground-related meshes
            if (child.name.includes('Plane003') || child.name === 'Ground_Collider' || child.parent?.name === 'Ground') {
                child.raycast = function() {}; // Disable raycasting for this mesh
                console.log('Disabled raycasting for:', child.name);
            }
            
            // Only add board and heels meshes to intersect objects
            if (child.parent && (child.parent.name === 'Board' || child.parent.name === 'Board001' || child.parent.name === 'Board002' || child.parent.name === 'heels')) {
                intersectObjects.push(child);
                console.log('✅ Added clickable mesh:', child.name, 'Parent:', child.parent.name);
            }
        }

        if (child.name === 'heels') {
            character.instance = child;
            playerCollider.start.copy(child.position).add(new THREE.Vector3(0, CAPSULE_RADIUS, 0));
            playerCollider.end.copy(child.position).add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0));
        }
        
        if (child.name === 'Ground_Collider') {
            colliderOctree.fromGraphNode(child);
            // Hide the collider mesh and disable raycasting
            child.visible = false;
            child.raycast = function() {}; // Disable raycasting
        }
    })
    scene.add(glb.scene);
    
    console.log('Total clickable objects loaded:', intersectObjects.length);
    console.log('Clickable objects:', intersectObjects.map(obj => `${obj.name} (parent: ${obj.parent?.name})`));

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
    console.log('Clicked on:', intersectObject); // Debug log
    console.log('Available modal content:', Object.keys(modalContent)); // Debug log
    
    if (intersectObject !== '' && modalContent[intersectObject]) {
        showModal(intersectObject);
    } else {
        console.log('No modal content found for:', intersectObject);
    }
}

function playerCollisions() {
    const result = colliderOctree.capsuleIntersect(playerCollider);
    playerOnFloor = false;
    if (result) {
        playerOnFloor = result.normal.y > 0;
        if (!playerOnFloor) {
            playerVelocity.addScaledVector(result.normal, -result.normal.dot(playerVelocity));
        }
        playerCollider.translate(result.normal.multiplyScalar(result.depth));
    }
}

function updatePlayer() {
    if (!character.instance) return;
    
    // Apply gravity when not on floor
    if (!playerOnFloor) {
        playerVelocity.y -= GRAVIRTY * DELTA_TIME;
    } else {
        // Stop downward movement when on floor
        if (playerVelocity.y < 0) {
            playerVelocity.y = 0;
        }
    }

    // Apply friction to horizontal movement
    playerVelocity.x *= 0.95;
    playerVelocity.z *= 0.95;

    // Apply movement with proper delta time
    playerCollider.translate(playerVelocity.clone().multiplyScalar(DELTA_TIME));

    // Check collisions
    playerCollisions();

    // Update character position
    character.instance.position.copy(playerCollider.start);
    character.instance.position.y -= CAPSULE_RADIUS;

    // Update rotation
    character.instance.rotation.y = THREE.MathUtils.lerp(character.instance.rotation.y, targetRotation, 0.1);
    
    // Reset movement flag when velocity is low
    if (Math.abs(playerVelocity.x) < 0.1 && Math.abs(playerVelocity.z) < 0.1) {
        character.isMoving = false;
    }
}

function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    
    // Prevent key repeat - only register initial key press
    if (pressedKeys.has(key)) return;
    pressedKeys.add(key);
    
    switch (key) {
        case 'w':
        case 'arrowup':
            playerVelocity.x -= MOVE_SPEED;
            targetRotation = 0;
            break;
        case 's':
        case 'arrowdown':
            playerVelocity.x += MOVE_SPEED;
            targetRotation = Math.PI;
            break;
        case 'a':
        case 'arrowleft':
            playerVelocity.z += MOVE_SPEED;
            targetRotation = Math.PI / 2;
            break;
        case 'd':
        case 'arrowright':
            playerVelocity.z -= MOVE_SPEED;
            targetRotation = -Math.PI / 2;
            break;
        default:
            return;
    }
    
    // Jump with each movement
    playerVelocity.y = JUMP_HEIGHT;
    character.isMoving = true;
}

function handleKeyUp(event) {
    const key = event.key.toLowerCase();
    pressedKeys.delete(key);
}

closeButton.addEventListener("click", hideModal);
window.addEventListener('resize', handleResize);
window.addEventListener('click', handleClick);
window.addEventListener('pointermove', handlePointerMove);
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

function animate() {
    updatePlayer();

    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(intersectObjects, true); // Add recursive flag

    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
        // Try multiple ways to get the object name
        const hit = intersects[0];
        let objectName = hit.object.name;
        
        // Check if the object or its parents have names we recognize
        if (hit.object.parent && modalContent[hit.object.parent.name]) {
            objectName = hit.object.parent.name;
        } else if (hit.object.parent?.parent && modalContent[hit.object.parent.parent.name]) {
            objectName = hit.object.parent.parent.name;
        } else if (hit.object.parent?.parent?.parent && modalContent[hit.object.parent.parent.parent.name]) {
            objectName = hit.object.parent.parent.parent.name;
        } else if (modalContent[hit.object.name]) {
            objectName = hit.object.name;
        }
        
        intersectObject = objectName;
        
        // Extra logging for boards - check if we're hitting board child meshes
        if (hit.object.parent && (hit.object.parent.name === 'Board' || hit.object.parent.name === 'Board001' || hit.object.parent.name === 'Board002')) {
            console.log('🎯 BOARD CHILD DETECTED - Object:', hit.object.name, 
                       'Parent:', hit.object.parent?.name, 
                       'Final objectName:', objectName);
        }
        
        console.log('Hovering over:', objectName, 'Object:', hit.object.name, 'Parent:', hit.object.parent?.name); // Debug log
    } else {
        document.body.style.cursor = 'default';
        intersectObject = "";
    }

    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);