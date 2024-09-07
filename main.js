import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

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

loader.load(
	
	'inspo/homescreen/scene.gltf',
	
	function ( gltf ) {

		scene.add( gltf.scene );

		gltf.animations; 
		gltf.scene; 
		gltf.scenes; 
		gltf.cameras; 
		gltf.asset; 

        if (gltf.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(gltf.scene);
                    gltf.animations.forEach((clip) => {
                        const action = mixer.clipAction(clip);
                        action.play();
                    });
                }
            
                scene.add(gltf.scene);
	},
);



camera.position.set(0.5, 0.15, 0.8002004615465439);



window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    if (mixer) mixer.update(0.01);
    
    scene.rotation.y += 0.001;
 
    renderer.render(scene, camera);
}


animate();
