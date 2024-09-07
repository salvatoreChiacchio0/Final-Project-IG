import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as CANNON from "cannon-es"; 
import { characters } from "./helpers"; 

class ThreePhysicsComponent {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  world: CANNON.World;
  clock: THREE.Clock;
  gecko: THREE.Object3D | null = null; 
  geckoBody: CANNON.Body | null = null; 
  moveDirection: { forward: number; right: number } = { forward: 0, right: 0 }; 
  mixer: THREE.AnimationMixer | null = null;
  enemyMixer: THREE.AnimationMixer | null = null;
  enemy: THREE.Object3D | null = null;
  enemyMixer2: THREE.AnimationMixer | null = null;
  enemy2: THREE.Object3D | null = null;
  enemyLife2: number = 10; 
  isEnemy2Alive: boolean = true;

  walkingAction: THREE.AnimationAction | null = null;
  attackAction: THREE.AnimationAction | null = null;
  idleAction: THREE.AnimationAction | null = null;
  currentAction: THREE.AnimationAction | null = null;
  enemyLife: number = 50; 

  geckoDamage: number = 0; 
  lastAttackTime: number = 0; 
  attackCooldown: number = 2000; 
  gameStarted: boolean = false; 
  directionalLight: THREE.DirectionalLight;
  fogEnabled: boolean = false;

  startPositionSecEnemy: THREE.Vector3;
  endPositionSecEnemy: THREE.Vector3;
  moveSpeedSecEnemy: number;
  movingToEndSecEnemy: boolean;

  deadBadge: THREE.Object3D | null = null;

  enemy2dead:boolean = false;
  enemy1dead:boolean = false;
  
  venus: THREE.Mesh | null = null;
  mars: THREE.Mesh | null = null;


   orbitRadius:number = 30; 
   angle:number = 0; 
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.clock = new THREE.Clock();

    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.81, 0);

    this.startPositionSecEnemy = new THREE.Vector3(-10, 0, 10);
    this.endPositionSecEnemy = new THREE.Vector3(0, 0, 10);
    this.moveSpeedSecEnemy = 5;
    this.movingToEndSecEnemy = true;

    this.init();
    this.setupControls(); 
    this.setupFogControl(); 

  }

  init() {
    this.renderer = new THREE.WebGLRenderer();

    
    this.renderer.shadowMap.enabled = true; 
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; 

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true; 
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; 

    document.body.appendChild(this.renderer.domElement);

    const fogColor = 0x050b29; 
    const nearDistance = 2;
    const farDistance = 50;
    if(this.fogEnabled)
    this.scene.fog = new THREE.Fog(fogColor, nearDistance, farDistance);
  
    this.setBackgroundImage(this.scene)
    
    this.camera.position.set(0, 5, -10); 

    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); 
    this.scene.add(ambientLight);



    
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(10, 20, 10); 
    this.directionalLight.castShadow = true; 

    this.directionalLight.shadow.camera.left = -50;
    this.directionalLight.shadow.camera.right = 50;
    this.directionalLight.shadow.camera.top = 50;
    this.directionalLight.shadow.camera.bottom = -50;
    this.directionalLight.shadow.camera.near = 4;
    this.directionalLight.shadow.camera.far = 100;
    this.directionalLight.shadow.mapSize.width = 10240;
    this.directionalLight.shadow.mapSize.height = 10240;
    

    this.scene.add(this.directionalLight);
    
    

    
    
    const textureLoader2 = new THREE.TextureLoader();
    const texture = textureLoader2.load('inspo/rocky.webp'); 

    
    const planeMaterial = new THREE.MeshStandardMaterial({ 
        map: texture 
    });

    
    const planeGeometry = new THREE.PlaneGeometry(50, 50);
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true; 

    
    this.scene.add(plane);


    
    const planeBody = new CANNON.Body({
      mass: 0, 
      shape: new CANNON.Plane(),
    });
    planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(planeBody);

    
    this.addSphere({ x: 2, y: 1, z: 0 });

    
    this.loadGecko();

    this.loadEnemy();
    this.loadEnemy2();


    
    const startButton = document.getElementById("btn-start");
    if (startButton) {
      startButton.addEventListener("click", () => {
        this.gameStarted = true;

        const introductionElement = document.getElementById("introduction");
        if (introductionElement) {
          introductionElement.style.display = "none";
        }
      });
    }
    this.setupLightControl(); 

    const toggleShadowsButton = document.getElementById("btn-shadows");
    if (toggleShadowsButton) {
      console.log("Here");
      
      toggleShadowsButton.addEventListener("click", this.toggleShadows.bind(this));
      this.updateShadowsButtonLabel(toggleShadowsButton);  
    }

        

    
            
    this.createPlanets()
    
        
        this.camera.position.z = 10;
        this.addBackgroundWrite()
    
  }

  createPlanets(){
    const textureLoader = new THREE.TextureLoader();
    const venusTexture = textureLoader.load('inspo/2k_venus_surface.jpg');

    
    const venusGeometry = new THREE.SphereGeometry(3, 42, 42);
    const venusMaterial = new THREE.MeshBasicMaterial({ map: venusTexture });
    this.venus = new THREE.Mesh(venusGeometry, venusMaterial);
    this.venus.position.set(20, 250, 100);
    
    const textureLoader2 = new THREE.TextureLoader();
    const moonTexture2 = textureLoader2.load('inspo/2k_mars.jpg');
    
    const moonGeometry2 = new THREE.SphereGeometry(3, 72, 72);
    const moonMaterial2 = new THREE.MeshBasicMaterial({ map: moonTexture2 });
    this.mars = new THREE.Mesh(moonGeometry2, moonMaterial2);
    this.mars.position.set(20, 350, 340);

    this.scene.add(this.venus);
    this.scene.add(this.mars);
}

  toggleShadows() {

    
    this.renderer.shadowMap.enabled = !this.renderer.shadowMap.enabled;

    
    this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
            object.castShadow = this.renderer.shadowMap.enabled ;
            object.receiveShadow = this.renderer.shadowMap.enabled ;
        }
    });

    
    if (this.directionalLight) {
        this.directionalLight.castShadow = this.renderer.shadowMap.enabled ;
    }

    
    const toggleShadowsButton = document.getElementById("btn-shadows");
    if (toggleShadowsButton) {
        this.updateShadowsButtonLabel(toggleShadowsButton);
    }
}


addBackgroundWrite() {
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 1024; 
  canvas.height = 512; 

  
  context!.font = '150px "Delicious Handrawn"';
  context!.fillStyle = 'white';
  context!.textAlign = 'center';
  context!.textBaseline = 'middle';


  
  context!.fillText('Gecko Adventures', canvas.width / 2, canvas.height / 2);

  
  const texture = new THREE.CanvasTexture(canvas);

  
  const material = new THREE.SpriteMaterial({ map: texture });

  
  const sprite = new THREE.Sprite(material);

  
  sprite.position.z = 30; 
  sprite.position.y = 5;  
  
  
  sprite.scale.set(20, 10, 1); 

  
  this.scene.add(sprite);
}


updateShadowsButtonLabel(button: HTMLElement) {
  button.textContent = this.renderer.shadowMap.enabled ? "Disable Shadows" : "Enable Shadows";
}

  
  setupLightControl() {
    
    const lightIntensitySlider = document.getElementById("light-intensity") as HTMLInputElement;

    
    lightIntensitySlider.addEventListener("input", (event) => {
      const intensity = parseFloat(lightIntensitySlider.value);
      this.directionalLight.intensity = intensity; 
    });
  }

  setupFogControl() {
    
    const fogButton = document.getElementById("btn-fog") as HTMLButtonElement;
    
    if (fogButton) {
      fogButton.addEventListener("click", () => this.toggleFog());
      this.updateFogButtonLabel(fogButton);  
    }
  }

  toggleFog() {
    this.fogEnabled = !this.fogEnabled;

    if (this.fogEnabled) {
      
      this.scene.fog = new THREE.Fog(0xcccccc, -10, 50); 
    } else {
      
      this.scene.fog = null;
    }

    
    const fogButton = document.getElementById("btn-fog") as HTMLButtonElement;
    if (fogButton) {
      this.updateFogButtonLabel(fogButton);
    }
  }

  updateFogButtonLabel(button: HTMLButtonElement) {
    button.textContent = this.fogEnabled ? "Disable Fog" : "Enable Fog";
  }
  
  setBackgroundImage(scene){
    var bgTexture = new THREE.TextureLoader().load("inspo/bg-red.jpg");
    bgTexture.minFilter = THREE.LinearMipmapLinearFilter;
    bgTexture.magFilter = THREE.LinearFilter;
    
  }

  addSphere(position: { x: number; y: number; z: number }) {
    
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const sphereMesh = new THREE.Mesh(geometry, material);
    sphereMesh.position.set(position.x, position.y, position.z);
    sphereMesh.castShadow = true; 
    sphereMesh.receiveShadow = false; 
    this.scene.add(sphereMesh);

    
    const radius = 0.5; 
    const shape = new CANNON.Sphere(radius);
    const sphereBody = new CANNON.Body({
      mass: 1, 
      position: new CANNON.Vec3(position.x, position.y, position.z),
      linearDamping: 0.2, 
      angularDamping: 0.2, 
      allowSleep: true, 
    });
    sphereBody.addShape(shape);
    this.world.addBody(sphereBody);

    
    sphereMesh.userData.physicsBody = sphereBody;
  }

  
  loadGecko() {
    const loader = new GLTFLoader();
    const selectedObjectIndex = Number(localStorage.getItem("character")) || 0;
    this.geckoDamage = characters[selectedObjectIndex].stats.damage;

    const element = window.document.getElementById("name");
    if (element !== null) {
      element.textContent = characters[selectedObjectIndex].name;
    }
    const element2 = window.document.getElementById("story");
    if (element2 !== null) {
      element2.textContent = characters[selectedObjectIndex].story;
    }

    loader.load(characters[selectedObjectIndex].objPath, (gltf) => {
      this.gecko = gltf.scene;
      this.mixer = new THREE.AnimationMixer(this.gecko);
      let animationWalking = false;
      this.gecko.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;  
          child.receiveShadow = true;  
        }
      });
      this.scene.add(this.gecko);
      gltf.animations.forEach((animation) => {
        if (animation.name === "Walking") animationWalking = true;
      });

        this.gecko.position.set(0, 0.5, 0); 
        this.gecko.scale.set(characters[selectedObjectIndex].scaleFactor, characters[selectedObjectIndex].scaleFactor, characters[selectedObjectIndex].scaleFactor);
          if(gltf.animations.length >1){
          this.idleAction = this.mixer.clipAction(gltf.animations[2]);
          this.walkingAction = this.mixer.clipAction(gltf.animations[0]);
          this.attackAction = this.mixer.clipAction(gltf.animations[1]);
      }else{
        this.idleAction = this.mixer.clipAction(gltf.animations[0]);
        this.walkingAction = this.mixer.clipAction(gltf.animations[0]);
        this.attackAction = this.mixer.clipAction(gltf.animations[0]);
      }

        
        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 10)); 
        this.geckoBody = new CANNON.Body({
          mass: 2,
          position: new CANNON.Vec3(0, 0.5, 0),
          shape: shape,
          angularDamping: 0.1, 
        });
        this.world.addBody(this.geckoBody);
    
    });
  }

  playAnimation(action: THREE.AnimationAction | null) {
    if (action && this.currentAction !== action) {
      this.currentAction?.fadeOut(0.2); 
      action.reset().fadeIn(0.2).play(); 
      if(this.attackAction) action.timeScale = 1.5; 

      this.currentAction = action;
    }
  }

  
  setupControls() {
    window.addEventListener("keydown", (event) => {
      if (!this.gameStarted) return; 

      switch (event.code) {
        case "KeyW":
          this.playAnimation(this.walkingAction);
          this.rotateGecko(0); 
          this.moveDirection.forward = 1;
          break;
        case "KeyS":
          this.playAnimation(this.walkingAction);
          this.rotateGecko(Math.PI); 
          this.moveDirection.forward = -1;
          break;
        case "KeyA":
          this.playAnimation(this.walkingAction);
          this.rotateGecko(Math.PI / 2); 
          this.moveDirection.right = 1;
          break;
        case "KeyD":
          this.playAnimation(this.walkingAction);
          this.rotateGecko(-Math.PI / 2); 
          this.moveDirection.right = -1;
          break;
        case "Enter":
          this.playAnimation(this.attackAction);
          this.handleAttack(); 
          break;
      }
    });

    window.addEventListener("keyup", (event) => {
      if (!this.gameStarted) return; 

      switch (event.code) {
        case "KeyW":
        case "KeyS":
          this.moveDirection.forward = 0;
          break;
        case "KeyA":
        case "KeyD":
          this.moveDirection.right = 0;
          break;
      }

      this.playAnimation(this.idleAction); 
    });
  }

  rotateGecko(angle: number) {
    if (this.gecko) {
      
      this.gecko.rotation.y = angle;
    }
  }

  updateGeckoMovement(deltaTime) {
    if (!this.geckoBody || !this.gecko) return;

    const moveSpeed = 12;
    const moveZ = this.moveDirection.forward * moveSpeed ;
    const moveX = this.moveDirection.right * moveSpeed ;

    this.geckoBody.velocity.x = moveX;
    this.geckoBody.velocity.z = moveZ;

    
    this.geckoBody.position.y = 0; 
    this.gecko.position.copy(
      this.geckoBody.position as unknown as THREE.Vector3
    );
  }


  updateEnemyLifeDisplay() {
    const lifeDisplay = document.getElementById("enemy-life");
    const lifeDisplay2 = document.getElementById("enemy-life2");

    if (lifeDisplay) {
      lifeDisplay.textContent = `Enemy Cat Life: ${this.enemyLife}`;
    }
    if (lifeDisplay2) {
      lifeDisplay2.textContent = `Enemy Ant Life: ${this.enemyLife2}`;
    }
  }
  
  handleAttack() {
    const currentTime = Date.now(); 
    if (!this.gecko || !this.geckoBody) return;
  
    
    
    
    if (currentTime - this.lastAttackTime >= this.attackCooldown) {
      this.lastAttackTime = currentTime;
  
      
      const attackRange = 10.0; 
      const attackRange2 = 6; 
  
      const geckoPosition = this.gecko.position;
      
      if (this.enemy) {
        const distanceToEnemy = geckoPosition.distanceTo(this.enemy.position);
  
        if (distanceToEnemy < attackRange) {
          
          this.enemyLife -= this.geckoDamage;
          if (this.enemyLife < 0) this.enemyLife = 0;
          this.updateEnemyLifeDisplay(); 
  
          if (this.enemyLife <= 0) {
            
            this.handleEnemyDefeat(this.enemy, this.enemyMixer);
          }
        }
      }
  
      
      if (this.enemy2) {
        const distanceToEnemy2 = geckoPosition.distanceTo(this.enemy2.position);
  
        if (distanceToEnemy2 < attackRange2) {
          
          this.enemyLife2 -= this.geckoDamage;
          if (this.enemyLife2 < 0) this.enemyLife2 = 0;
          this.updateEnemyLifeDisplay(); 
  
          if (this.enemyLife2 <= 0) {
            
            this.handleEnemyDefeat(this.enemy2, this.enemyMixer2);
          }
        }
      }
    }
  }
  
  
  showRestartButton() {
    const restartButton = document.createElement("button");
    restartButton.id = "btn-restart";
    restartButton.textContent = "Restart";
    restartButton.onclick = () => window.location.reload();
    document.body.appendChild(restartButton);
  }
  loadEnemy() {
    const loader = new GLTFLoader();
    const enemyPath = "inspo/cat/source/scene.gltf";

    loader.load(enemyPath, (gltf) => {
      const enemy = gltf.scene;
      enemy.position.set(15, 0, 15);
      enemy.scale.set(0.3, 0.3, 0.3);
      enemy.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;  
          child.receiveShadow = true;  
        }
      });
      this.scene.add(enemy);

      this.enemyMixer = new THREE.AnimationMixer(enemy);
      gltf.animations.forEach((clip) => {
        if (this.enemyMixer) this.enemyMixer.clipAction(clip).play(); 
      });
      
      const shape = new CANNON.Box(new CANNON.Vec3(3, 3, 3)); 

      const enemyBody = new CANNON.Body({
        mass: 2,
        position: new CANNON.Vec3(5, 0, 5),
        linearDamping: 0.1,
        angularDamping: 0.1,
      });
      enemyBody.addShape(shape);
      this.world.addBody(enemyBody);

      enemy.userData.physicsBody = enemyBody;
      (this as any).enemy = enemy;

      this.updateEnemyLifeDisplay();
    });
  }

  loadEnemy2() {
    const loader = new GLTFLoader();
    const enemyPath = "inspo/ant/scene.gltf";

    loader.load(enemyPath, (gltf) => {
      const enemy = gltf.scene;
      enemy.position.set(-15, 0, 10);
      enemy.scale.set(0.6, 0.6, 0.6);
      enemy.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;  
          child.receiveShadow = true;  
        }
      });
      enemy.rotation.y = Math.PI / 2; 

      this.scene.add(enemy);

      this.enemyMixer2 = new THREE.AnimationMixer(enemy);
      if (this.enemyMixer2) {
        const action = this.enemyMixer2.clipAction(gltf.animations[15]);
        action.timeScale = 2; 
        action.play();
      }
      
      
      const shape = new CANNON.Box(new CANNON.Vec3(0.1, 0.1, 0.1)); 

      const enemyBody = new CANNON.Body({
        mass: 2,
        position: new CANNON.Vec3(-15, 0, 10),
        linearDamping: 0.1,
        angularDamping: 0.1,
      });
      enemyBody.addShape(shape);
      this.world.addBody(enemyBody);

      enemy.userData.physicsBody = enemyBody;
      (this as any).enemy2 = enemy;

      this.updateEnemyLifeDisplay();
    });
  }

  updateMovementSecEnemy(deltaTime: number) {
    if (!this.enemy2 || !this.isEnemy2Alive) return; 

    const direction = this.movingToEndSecEnemy ? 1 : -1;
    const distance = this.moveSpeedSecEnemy * deltaTime;
    
    
    const newPosition = this.enemy2.position.clone().add(new THREE.Vector3(
      direction * distance,
      0,
      0
    ));
    
    
    if (this.movingToEndSecEnemy && newPosition.distanceTo(this.endPositionSecEnemy) > 0.1) {
      this.enemy2.position.copy(newPosition);
    } else if (!this.movingToEndSecEnemy && newPosition.distanceTo(this.startPositionSecEnemy) > 0.1) {
      this.enemy2.position.copy(newPosition);
    } else {
      
      this.movingToEndSecEnemy = !this.movingToEndSecEnemy;
      this.enemy2.rotation.y += Math.PI; 
    }

    
    if (this.enemy2.userData.physicsBody) {
      const enemyBody = this.enemy2.userData.physicsBody as CANNON.Body;
      
      enemyBody.position.set(this.enemy2.position.x, this.enemy2.position.y, this.enemy2.position.z);
    }
}

  
  handleEnemyDefeat(enemy: THREE.Object3D, mixer: THREE.AnimationMixer | null) {
    
    if (mixer) {
      mixer.stopAllAction(); 
    }
  
    
    this.addDeadLabel(enemy.position, enemy === this.enemy2 ? 'ant':'cat');
  
    
    if (enemy === this.enemy2) {
      this.isEnemy2Alive = false;
    }
  
    
    if (enemy instanceof THREE.Mesh) {
      (enemy.material as THREE.MeshStandardMaterial).color.set(0x888888); 
    }
  

    if (!this.enemyLife || !this.enemyLife2) {
      this.showRestartButton();
    }
  }
  
  
  addDeadLabel(position: THREE.Vector3,elem:string) {
    
    const loader = new GLTFLoader();
    
    
    loader.load('inspo/dead-badge/scene.gltf', (gltf) => {
      
      const model = gltf.scene;
      model.scale.set(0.02,0.02,0.02)
      model.rotation.x = Math.PI/2

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;  
          child.receiveShadow = true;  
        }
      });
      
      model.position.copy(position);
      if(elem==='cat'){
        model.position.y += 6; 
        if(!this.enemy1dead){
          this.scene.add(model);  
          this.enemy1dead  = !this.enemy1dead
        }

      }else{
      model.position.y += 2; 
      if(!this.enemy2dead){
        this.scene.add(model);  
        this.enemy2dead  = !this.enemy2dead
      }
      }
      this.deadBadge = model;

    }, undefined, (error) => {
      console.error('An error occurred while loading the GLTF model:', error);
    });
  }

  addBoundaries() {
    const boundaryThickness = 0.5; 
    const boundaryHeight = 100; 
    const boundaryWidth = 50; 
    const boundaryDepth = 50; 

    
    const boundaries = [
      {
        position: { x: 0, y: 0, z: -boundaryDepth / 2 },
        size: {
          width: boundaryWidth,
          height: boundaryHeight,
          depth: boundaryThickness,
        },
      }, 
      {
        position: { x: 0, y: 0, z: boundaryDepth / 2 },
        size: {
          width: boundaryWidth,
          height: boundaryHeight,
          depth: boundaryThickness,
        },
      }, 
      {
        position: { x: -boundaryWidth / 2, y: 0, z: 0 },
        size: {
          width: boundaryThickness,
          height: boundaryHeight,
          depth: boundaryDepth,
        },
      }, 
      {
        position: { x: boundaryWidth / 2, y: 0, z: 0 },
        size: {
          width: boundaryThickness,
          height: boundaryHeight,
          depth: boundaryDepth,
        },
      }, 
    ];

    
    boundaries.forEach(({ position, size }) => {
      
      const boundaryGeometry = new THREE.BoxGeometry(
        size.width,
        size.height,
        size.depth
      );
      const boundaryMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        visible: false,
      }); 
      const boundaryMesh = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
      boundaryMesh.position.set(position.x, position.y, position.z);
      this.scene.add(boundaryMesh);

      
      const boundaryShape = new CANNON.Box(
        new CANNON.Vec3(size.width / 2, size.height / 2, size.depth / 2)
      );
      const boundaryBody = new CANNON.Body({
        mass: 0, 
        position: new CANNON.Vec3(position.x, position.y, position.z),
      });
      boundaryBody.addShape(boundaryShape);
      this.world.addBody(boundaryBody);
    });
  }

  updateCamera() {
    if (!this.gecko) return;

    const offset = new THREE.Vector3(0, 2, -6); 
    const geckoPosition = this.gecko.position.clone();
    const cameraPosition = geckoPosition.add(offset);

    
    this.camera.position.lerp(cameraPosition, 0.1);
    this.camera.lookAt(this.gecko.position);
  }


  animate = () => {
    requestAnimationFrame(this.animate);

    
    const deltaTime = this.clock.getDelta();
    this.world.step(1 / 60, deltaTime);

    
    this.updateGeckoMovement(deltaTime);
    this.renderer.shadowMap.needsUpdate = true;

    
    this.updateCamera();


    this.updateMovementSecEnemy(deltaTime);

    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
    if (this.enemyMixer) {
      this.enemyMixer.update(deltaTime); 
    }
    if (this.enemyMixer2) {
      this.enemyMixer2.update(deltaTime); 
    }

    if (this.deadBadge) {
      this.deadBadge.rotation.z += deltaTime; 
    }

    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.physicsBody) {
        const body = object.userData.physicsBody as CANNON.Body;
        object.position.copy(body.position as unknown as THREE.Vector3);

        const quat = new THREE.Quaternion(
          body.quaternion.x,
          body.quaternion.y,
          body.quaternion.z,
          body.quaternion.w
        );
        object.quaternion.copy(quat);
      }
    });

    this.addBoundaries(); 

     
     this.angle += 0.008; 
     if (this.venus) {
         this.venus.position.y = (this.orbitRadius * 1.5) * Math.cos(this.angle * 0.4); 
         this.venus.position.x = (this.orbitRadius * 1.5) * Math.sin(this.angle * 0.4); 
     }
     if (this.mars) {
         this.mars.position.y = (this.orbitRadius*6 ) * Math.cos(this.angle  * 1.1); 
         this.mars.position.x = (this.orbitRadius*6  ) * Math.sin(this.angle * 1.1); 
     }
     
    
    this.renderer.render(this.scene, this.camera);
  };
}


const component = new ThreePhysicsComponent();
component.animate();
