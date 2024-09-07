import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { characters } from './helpers';


let currentCharacterIndex = 0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

let mixer; 


const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);


const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5.5, 5, 5).normalize(); 
scene.add(directionalLight);

const loader = new GLTFLoader();
let  actions = [], activeAction;

function loadCharacterModel(path) {
    loader.load(
        path,
        function (gltf) {
            scene.add(gltf.scene);
           
            if (gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(gltf.scene);
                actions = gltf.animations.map((clip) => mixer.clipAction(clip));
                
                activeAction = actions[0];
                activeAction.play();
                const buttonContainer = document.getElementById('buttonContainer');
                buttonContainer.classList.add("display-none")
                buttonContainer.classList.remove("display-block")

                if (gltf.animations.length > 1) {
                    console.log(">1");
                    buttonContainer.classList.remove("display-none")

                    buttonContainer.classList.add("display-block")
                    createAnimationButtons(gltf.animations);
                }
            }
            localStorage.setItem('character',currentCharacterIndex);
        },
      
    );
}

function createAnimationButtons(animations) {
    const buttonContainer = document.getElementById('buttonContainer');
    buttonContainer.innerHTML = ''; 
    
    animations.forEach((animation, index) => {        
        const button = document.createElement('button');
        button.innerText = `${animation.name}`;
        button.addEventListener('click', () => switchAnimation(index));
        button.classList.add('btn-animation');
        buttonContainer.appendChild(button);
    });
}

function switchAnimation(index) {
    if (actions[index] !== activeAction) {
        activeAction.fadeOut(0.5);
        activeAction = actions[index];
        activeAction.reset().fadeIn(0.5).play();
    }
}


function setCameraForObject(){
    if (mixer) mixer.stopAllAction();
            scene.clear();
            scene.add(ambientLight);
            scene.add(directionalLight);
    camera.position.set(0.813969349200308, characters[currentCharacterIndex].y_dist, characters[currentCharacterIndex].z_dist);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    if (mixer) mixer.update(0.01);

    scene.rotation.y += 0.002;

    renderer.render(scene, camera);
}



animate();

function updateCharacterInfo() {
    localStorage.setItem('character',currentCharacterIndex)
    const character = characters[currentCharacterIndex];

    document.getElementById('character-name').textContent = character.name;
    
    document.getElementById('character-type').textContent = character.type;
    document.getElementById('character-stats').textContent = 
    `Health: ${character.stats.health}
Damage: ${character.stats.damage}
Weapon: ${character.weapon}`;

    setCameraForObject()
    loadCharacterModel(character.objPath);
    scene.rotation.y = 0;

}

document.getElementById('prev-character').addEventListener('click', () => {
    currentCharacterIndex = (currentCharacterIndex - 1 + characters.length) % characters.length;
    updateCharacterInfo();
});

document.getElementById('next-character').addEventListener('click', () => {
    currentCharacterIndex = (currentCharacterIndex + 1) % characters.length;
    updateCharacterInfo();
});


updateCharacterInfo();
