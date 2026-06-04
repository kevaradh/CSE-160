import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const scene = new THREE.Scene();
RectAreaLightUniformsLib.init();

const cubeLoader = new THREE.CubeTextureLoader();
scene.background = cubeLoader.load([
  'img/Daylight Box_Right.bmp',
  'img/Daylight Box_Left.bmp',
  'img/Daylight Box_Top.bmp',
  'img/Daylight Box_Bottom.bmp',
  'img/Daylight Box_Front.bmp',
  'img/Daylight Box_Back.bmp',
]);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 30, 120);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2.1;
controls.target.set(0, 0, 0);
controls.update();

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(15, 30, 10);
scene.add(dirLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0xe8d5a3, 0.5);
scene.add(hemisphereLight);

const sandGeo = new THREE.PlaneGeometry(2000, 1000);
const sandMat = new THREE.MeshLambertMaterial({ color: 0xe8d5a3 });
const sand = new THREE.Mesh(sandGeo, sandMat);
sand.rotation.x = -Math.PI / 2;
sand.position.set(0, 0, 500);
scene.add(sand);

const oceanGeo = new THREE.PlaneGeometry(2000, 1000);
const oceanMat = new THREE.MeshPhongMaterial({
  color: 0x29a8c4,
  emissive: 0x0a3a44,
  transparent: true,
  opacity: 0.92,
  shininess: 150,
  specular: 0x88ddee,
});

const ocean = new THREE.Mesh(oceanGeo, oceanMat);
ocean.rotation.x = -Math.PI / 2;
ocean.position.set(0, 0, -500);
scene.add(ocean);

const loader = new GLTFLoader();
loader.load('img/TugBoat.glb', (gltf) => {
  const tugboat = gltf.scene;
  tugboat.position.set(550, 9, -500);
  tugboat.scale.set(25, 25, 25);
  tugboat.rotation.y = Math.PI / 6;
  scene.add(tugboat);
}, undefined, (err) => console.error('TugBoat error:', err));

loader.load('img/Whale_tail.glb', (gltf) => {
  const whale = gltf.scene;
  whale.position.set(-325, 0, -200);
  whale.scale.set(1.5, 1.5, 1.5);
  whale.rotation.y = Math.PI / 4;
  scene.add(whale);
}, undefined, (err) => console.error('Whale error:', err));


const balloon = new THREE.Group();
const balloonCanvas = document.createElement('canvas');
balloonCanvas.width = balloonCanvas.height = 512;
const bCtx = balloonCanvas.getContext('2d');
const stripeColors = ['#e63946','#f4a261','#2a9d8f','#e9c46a','#264653','#e76f51','#a8dadc','#457b9d'];
const stripeW = 512 / stripeColors.length;
stripeColors.forEach((c,i) => { bCtx.fillStyle=c; bCtx.fillRect(i*stripeW,0,stripeW,512); });
const balloonSphere = new THREE.Mesh(
  new THREE.SphereGeometry(12, 32, 32),
  new THREE.MeshPhongMaterial({ map: new THREE.CanvasTexture(balloonCanvas), shininess: 40 })
);
balloonSphere.scale.y = 1.2;
balloon.add(balloonSphere);
const basket = new THREE.Mesh(
  new THREE.BoxGeometry(5, 3, 5),
  new THREE.MeshPhongMaterial({ color: 0x8B4513 })
);
basket.position.set(0, -18, 0);
balloon.add(basket);
const ropeMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
[[ 2, 2],[-2, 2],[ 2,-2],[-2,-2]].forEach(([rx,rz]) => {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(rx*0.5,-10,rz*0.5),
    new THREE.Vector3(rx*1.5,-13,rz*1.5),
    new THREE.Vector3(rx*2,-15,rz*2),
  ]);
  balloon.add(new THREE.Mesh(new THREE.TubeGeometry(curve,10,0.15,6,false), ropeMat));
});
balloon.position.set(-80, 50, -150);
scene.add(balloon);

const airplane = new THREE.Group();
const planeMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee, shininess: 100 });
const planeRed = new THREE.MeshPhongMaterial({ color: 0xcc1111 });
const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.8, 20, 16), planeMat);
fuselage.rotation.z = Math.PI / 2;
airplane.add(fuselage);
const planeNose = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16, 0, Math.PI*2, 0, Math.PI/2), planeMat);
planeNose.rotation.z = -Math.PI / 2;
planeNose.position.set(10, 0, 0);
airplane.add(planeNose);
const wings = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 18), planeMat);
wings.position.set(1, 0, 0);
airplane.add(wings);
const wingStripe = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 1.2), planeRed);
wingStripe.position.set(1, 0, 7);
airplane.add(wingStripe);
const vFin = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 0.4), planeRed);
vFin.position.set(-9, 2, 0);
airplane.add(vFin);
const hFin = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.3, 9), planeMat);
hFin.position.set(-8.5, 0, 0);
airplane.add(hFin);
const stripe = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 5, 16), planeRed);
stripe.rotation.z = Math.PI / 2;
stripe.position.set(2, 0, 0);
airplane.add(stripe);
airplane.position.set(150, 100, -300);
airplane.scale.set(2, 2, 2);
airplane.rotation.y = Math.PI;
scene.add(airplane);

const spikeBall = new THREE.Group();
const spikeBallCore = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshLambertMaterial({ color: 0x8B7355 })
);
spikeBall.add(spikeBallCore);
const spikeMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
const spikeDirections = [
  new THREE.Vector3(0,1,0), new THREE.Vector3(0,-1,0),
  new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,-1),
  new THREE.Vector3(1,0,0), new THREE.Vector3(-1,0,0),
  new THREE.Vector3(1,1,0).normalize(), new THREE.Vector3(-1,1,0).normalize(),
  new THREE.Vector3(1,-1,0).normalize(), new THREE.Vector3(-1,-1,0).normalize(),
  new THREE.Vector3(1,0,1).normalize(), new THREE.Vector3(-1,0,1).normalize(),
  new THREE.Vector3(1,0,-1).normalize(), new THREE.Vector3(-1,0,-1).normalize(),
];
spikeDirections.forEach(dir => {
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 8), spikeMat);
  spike.position.copy(dir.clone().multiplyScalar(1.3));
  spike.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
  spikeBall.add(spike);
});
spikeBall.position.set(-50, 3, -100);
spikeBall.scale.set(5, 5, 5);
scene.add(spikeBall);

const kite = new THREE.Group();
const kiteBody = new THREE.Mesh(new THREE.BoxGeometry(2.0,2.4,0.08),
  new THREE.MeshPhongMaterial({ color: 0xff2200, emissive: 0x440000, side: THREE.DoubleSide }));
kiteBody.rotation.z = Math.PI/4;
kite.add(kiteBody);
const sparMat = new THREE.MeshPhongMaterial({ color: 0x5a3010 });
const spar1 = new THREE.Mesh(new THREE.BoxGeometry(2.2,0.08,0.08), sparMat);
spar1.rotation.z = Math.PI/4;
kite.add(spar1);
const spar2 = new THREE.Mesh(new THREE.BoxGeometry(0.08,2.6,0.08), sparMat);
spar2.rotation.z = Math.PI/4;
kite.add(spar2);
[[0xff6600,0.4,0.4],[0xffee00,-0.4,0.4],[0x0066ff,0.4,-0.4],[0x00cc44,-0.4,-0.4]].forEach(([c,px,py]) => {
  const p = new THREE.Mesh(new THREE.BoxGeometry(0.85,0.85,0.09),
    new THREE.MeshPhongMaterial({ color: c, side: THREE.DoubleSide }));
  p.position.set(px,py,0);
  p.rotation.z = Math.PI/4;
  kite.add(p);
});
const stringPoints = [];
for (let i = 0; i <= 20; i++) {
  const ts = i/20;
  stringPoints.push(new THREE.Vector3(ts*4, -ts*12, ts*2));
}
kite.add(new THREE.Mesh(
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stringPoints),30,0.03,6,false),
  new THREE.MeshPhongMaterial({ color: 0xdddddd })
));
[0xff0000,0xff6600,0xffee00,0x00cc00,0x0066ff,0xaa00cc].forEach((c,i) => {
  const seg = new THREE.Mesh(new THREE.BoxGeometry(0.25,0.12,0.08),
    new THREE.MeshPhongMaterial({ color: c }));
  seg.position.set(Math.sin(i*0.8)*0.3,-1.8-i*0.5,0);
  kite.add(seg);
});
kite.position.set(80, 60, -150); 
kite.scale.set(10, 10, 10);
scene.add(kite);

const texLoader = new THREE.TextureLoader();

const soccerTex = texLoader.load('https://threejs.org/examples/textures/checker.png');
soccerTex.wrapS = THREE.RepeatWrapping;
soccerTex.wrapT = THREE.RepeatWrapping;
soccerTex.repeat.set(4, 4);
const soccerBall = new THREE.Mesh(
  new THREE.SphereGeometry(4, 32, 32),
  new THREE.MeshPhongMaterial({ map: soccerTex, shininess: 60 })
);
soccerBall.position.set(-30, 4, 20);
scene.add(soccerBall);

const cubeTexUrls = [
  'https://threejs.org/examples/textures/crate.gif',      // right
  'https://threejs.org/examples/textures/crate.gif',      // left
  'https://threejs.org/examples/textures/hardwood2_diffuse.jpg', // top
  'https://threejs.org/examples/textures/hardwood2_diffuse.jpg', // bottom
  'https://threejs.org/examples/textures/brick_diffuse.jpg',     // front
  'https://threejs.org/examples/textures/brick_diffuse.jpg',     // back
];
const faceMaterials = cubeTexUrls.map(url =>
  new THREE.MeshPhongMaterial({ map: texLoader.load(url), shininess: 30 })
);
const texCube = new THREE.Mesh(
  new THREE.BoxGeometry(8, 8, 8),
  faceMaterials
);
texCube.position.set(30, 4, 300); 
scene.add(texCube);

const sandcastle = new THREE.Group();
const sandMat2 = new THREE.MeshPhongMaterial({ color: 0xe8c87a, emissive: 0x332200 });
const sandDark  = new THREE.MeshPhongMaterial({ color: 0xc8a855, emissive: 0x221100 });
const flagMat   = new THREE.MeshPhongMaterial({ color: 0xdd2200, emissive: 0x440000 });

const scBase = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.5, 1, 16), sandDark);
scBase.position.set(0, 0.5, 0);
sandcastle.add(scBase);
const scTower = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.5, 6, 16), sandMat2);
scTower.position.set(0, 4, 0);
sandcastle.add(scTower);
const scRoof = new THREE.Mesh(new THREE.ConeGeometry(3.5, 3, 16), flagMat);
scRoof.position.set(0, 8.5, 0);
sandcastle.add(scRoof);
[0, Math.PI/2, Math.PI, Math.PI*3/2].forEach(angle => {
  const bat = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 1), sandMat2);
  bat.position.set(Math.cos(angle)*2.8, 7.5, Math.sin(angle)*2.8);
  sandcastle.add(bat);
});
[[-3.5, 3], [3.5, 3]].forEach(([tx, tz]) => {
  const st = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 4, 12), sandMat2);
  st.position.set(tx, 2.5, tz);
  sandcastle.add(st);
  const sr = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2, 12), flagMat);
  sr.position.set(tx, 5.5, tz);
  sandcastle.add(sr);
});
const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3, 8), sandDark);
pole.position.set(0, 11, 0);
sandcastle.add(pole);
const flag = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 0.1), flagMat);
flag.position.set(0.9, 12.2, 0);
sandcastle.add(flag);
sandcastle.scale.set(1.5, 1.5, 1.5);
sandcastle.position.set(60, 0, 30);
scene.add(sandcastle);


function makeLifesaver(x, y, z, rotX = 0) {
  const ls = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const color = i % 2 === 0 ? 0xdd2200 : 0xffffff;
    const seg = new THREE.Mesh(
      new THREE.TorusGeometry(3, 0.7, 8, 6, Math.PI / 4),
      new THREE.MeshPhongMaterial({ color, shininess: 40 })
    );
    seg.rotation.z = (i / 8) * Math.PI * 2;
    ls.add(seg);
  }
  ls.position.set(x, y, z);
  ls.rotation.x = rotX;
  scene.add(ls);
  return ls;
}
const ls1 = makeLifesaver(-60, 1, 50, Math.PI / 2);
const ls2 = makeLifesaver(10, 2, 80, Math.PI / 2);
const ls3 = makeLifesaver(20, 2, -150, Math.PI / 2);
ls3.scale.set(2.5, 2.5, 2.5);
const ls4 = makeLifesaver(-30, 2, -200, Math.PI / 2);
ls4.scale.set(2.5, 2.5, 2.5);


const courtGroup = new THREE.Group();
const whiteMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
const woodMat  = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
const netMat   = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });

[
  [30, 0.1, 0, 0.5, 30],   // left line  [x,y,z, w, d]
  [-30, 0.1, 0, 0.5, 30],  // right line
  [0, 0.1, 15, 30, 0.5],   // front line
  [0, 0.1, -15, 30, 0.5],  // back line
  [0, 0.1, 0, 30, 0.5],    // center line
].forEach(([x,y,z,w,d]) => {
  const line = new THREE.Mesh(new THREE.BoxGeometry(w*2, 0.2, d*2 || 0.5), whiteMat);
  line.position.set(x, y, z);
  courtGroup.add(line);
});

// Net posts
[-32, 32].forEach(x => {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 12, 8), woodMat);
  post.position.set(x, 6, 0);
  courtGroup.add(post);
});

// Net
const net = new THREE.Mesh(new THREE.BoxGeometry(64, 8, 0.3), netMat);
net.position.set(0, 7, 0);
courtGroup.add(net);

// Net top rope
const topRope = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 64, 8), new THREE.MeshPhongMaterial({ color: 0xffcc00 }));
topRope.rotation.z = Math.PI / 2;
topRope.position.set(0, 11, 0);
courtGroup.add(topRope);

// Volleyball
const vball = new THREE.Mesh(
  new THREE.SphereGeometry(2.5, 32, 32),
  new THREE.MeshPhongMaterial({ color: 0xff6600, emissive: 0x221100, shininess: 60 })
);
vball.position.set(-10, 2.5, 5);
courtGroup.add(vball);

courtGroup.position.set(-80, 0, 40);
courtGroup.scale.set(0.5, 0.5, 0.5);
scene.add(courtGroup);

const bucket = new THREE.Group();
const bucketBody = new THREE.Mesh(
  new THREE.CylinderGeometry(3.5, 2.5, 5, 16),
  new THREE.MeshPhongMaterial({ color: 0xff2200, emissive: 0x330000, shininess: 60 })
);
bucketBody.position.set(0, 2.5, 0);
bucket.add(bucketBody);

const bucketRim = new THREE.Mesh(
  new THREE.TorusGeometry(3.5, 0.4, 8, 24),
  new THREE.MeshPhongMaterial({ color: 0xffcc00, shininess: 80 })
);
bucketRim.position.set(0, 5, 0);
bucket.add(bucketRim);

const handle = new THREE.Mesh(
  new THREE.TorusGeometry(3, 0.3, 8, 24, Math.PI),
  new THREE.MeshPhongMaterial({ color: 0xffcc00, shininess: 80 })
);
handle.position.set(0, 5, 0);
handle.rotation.x = -Math.PI / 2;
bucket.add(handle);

bucket.position.set(85, 0, 20);
scene.add(bucket);

const shovel = new THREE.Group();
const shovelStick = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 0.5, 18, 8),
  new THREE.MeshPhongMaterial({ color: 0x8B4513, shininess: 20 })
);
shovelStick.position.set(0, 9, 0);
shovel.add(shovelStick);

const shovelBlade = new THREE.Mesh(
  new THREE.BoxGeometry(6, 0.5, 7),
  new THREE.MeshPhongMaterial({ color: 0xaaaaaa, shininess: 120, specular: 0xffffff })
);
shovelBlade.position.set(0, 0, 0);
shovel.add(shovelBlade);

const grip = new THREE.Mesh(
  new THREE.BoxGeometry(4, 1, 1),
  new THREE.MeshPhongMaterial({ color: 0x5a3010, shininess: 20 })
);
grip.position.set(0, 18.5, 0);
shovel.add(grip);

shovel.scale.set(0.5,0.5,0.5);
shovel.rotation.z = Math.PI / 8; // slightly leaning
shovel.position.set(80, 0, 25);
scene.add(shovel);

const iceCreamCart = new THREE.Group();
const cartBody = new THREE.Mesh(
  new THREE.BoxGeometry(12, 8, 7),
  new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 40 })
);
cartBody.position.set(0, 5, 0);
iceCreamCart.add(cartBody);

const cartLid = new THREE.Mesh(
  new THREE.BoxGeometry(12.5, 1, 7.5),
  new THREE.MeshPhongMaterial({ color: 0x88ddff, shininess: 60 })
);
cartLid.position.set(0, 9.5, 0);
iceCreamCart.add(cartLid);

const wheelMat = new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 40 });
[[-4.5, -3], [4.5, -3], [-4.5, 3], [4.5, 3]].forEach(([wx, wz]) => {
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1, 16), wheelMat);
  wheel.rotation.x = Math.PI / 2;
  wheel.position.set(wx, 1.5, wz);
  iceCreamCart.add(wheel);
});

const cartPole = new THREE.Mesh(
  new THREE.CylinderGeometry(0.3, 0.3, 18, 8),
  new THREE.MeshPhongMaterial({ color: 0xaaaaaa, shininess: 60 })
);
cartPole.position.set(0, 19, 0);
iceCreamCart.add(cartPole);

[0xff2200, 0xffee00, 0xff2200, 0xffee00, 0xff2200, 0xffee00, 0xff2200, 0xffee00].forEach((c, i) => {
  const seg = new THREE.Mesh(
    new THREE.ConeGeometry(9, 4, 8, 1, false, (i / 8) * Math.PI * 2, Math.PI / 4),
    new THREE.MeshPhongMaterial({ color: c, side: THREE.DoubleSide })
  );
  seg.position.set(0, 30, 0);
  iceCreamCart.add(seg);
});

[[-3, 0], [0, 0], [3, 0]].forEach(([cx, cz], i) => {
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, 4, 8),
    new THREE.MeshPhongMaterial({ color: 0xd4a574, shininess: 20 })
  );
  cone.position.set(cx, 12, cz);
  cone.rotation.z = Math.PI;
  iceCreamCart.add(cone);

  const scoopColors = [0xff69b4, 0x8B4513, 0xfffacd];
  const scoop = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 12, 12),
    new THREE.MeshPhongMaterial({ color: scoopColors[i], shininess: 60 })
  );
  scoop.position.set(cx, 9.5, cz);
  iceCreamCart.add(scoop);
});

const icSignCanvas = document.createElement('canvas');
icSignCanvas.width = 256; icSignCanvas.height = 64;
const icCtx = icSignCanvas.getContext('2d');
icCtx.fillStyle = '#ff69b4';
icCtx.fillRect(0, 0, 256, 64);
icCtx.fillStyle = '#ffffff';
icCtx.font = 'bold 24px Arial';
icCtx.textAlign = 'center';
icCtx.textBaseline = 'middle';
icCtx.fillText('🍦 ICE CREAM', 128, 32);
const icSign = new THREE.Mesh(
  new THREE.BoxGeometry(10, 3, 0.3),
  new THREE.MeshPhongMaterial({ map: new THREE.CanvasTexture(icSignCanvas) })
);
icSign.position.set(0, 6, 3.7);
iceCreamCart.add(icSign);

iceCreamCart.position.set(-115, 0, 20);
iceCreamCart.scale.set(0.8, 0.8, 0.8);
scene.add(iceCreamCart);

const towelGroup = new THREE.Group();
const towelCanvas = document.createElement('canvas');
towelCanvas.width = 256; towelCanvas.height = 256;
const tCtx = towelCanvas.getContext('2d');
['#e63946','#ffffff','#457b9d','#ffffff','#e63946','#ffffff','#457b9d','#ffffff'].forEach((c,i) => {
  tCtx.fillStyle = c; tCtx.fillRect(0, i*32, 256, 32);
});
const towel = new THREE.Mesh(
  new THREE.BoxGeometry(20, 0.3, 14),
  new THREE.MeshPhongMaterial({ map: new THREE.CanvasTexture(towelCanvas) })
);
towel.position.set(0, 0.15, 0);
towelGroup.add(towel);

const umbPole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 18, 8),
  new THREE.MeshPhongMaterial({ color: 0xaaaaaa }));
umbPole.position.set(-8, 9, -5);
towelGroup.add(umbPole);

[0xff2200,0xffee00,0xff2200,0xffee00,0xff2200,0xffee00,0xff2200,0xffee00].forEach((c,i) => {
  const seg = new THREE.Mesh(
    new THREE.ConeGeometry(8, 3, 8, 1, false, (i/8)*Math.PI*2, Math.PI/4),
    new THREE.MeshPhongMaterial({ color: c, side: THREE.DoubleSide })
  );
  seg.position.set(-8, 19, -5);
  towelGroup.add(seg);
});

[-1.5, 1.5].forEach(x => {
  const lens = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.3, 8, 24),
    new THREE.MeshPhongMaterial({ color: 0x111111 }));
  lens.rotation.x = Math.PI / 2;
  lens.position.set(x, 0.5, 2);
  towelGroup.add(lens);
});
const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1, 6),
  new THREE.MeshPhongMaterial({ color: 0x111111 }));
bridge.rotation.z = Math.PI / 2;
bridge.position.set(0, 0.5, 2);
towelGroup.add(bridge);

const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 5, 16),
  new THREE.MeshPhongMaterial({ color: 0x44aaff, transparent: true, opacity: 0.8 }));
bottle.position.set(5, 2.5, 3);
towelGroup.add(bottle);

const sunscreen = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 4, 16),
  new THREE.MeshPhongMaterial({ color: 0xff6600 }));
sunscreen.position.set(7, 2, 3);
towelGroup.add(sunscreen);

const wm = new THREE.Mesh(new THREE.ConeGeometry(3, 1, 3),
  new THREE.MeshPhongMaterial({ color: 0xff69b4 }));
wm.position.set(-3, 0.5, 4);
towelGroup.add(wm);
const wmRind = new THREE.Mesh(new THREE.ConeGeometry(3.2, 0.8, 3),
  new THREE.MeshPhongMaterial({ color: 0x2d8a2d }));
wmRind.position.set(-3, 0.2, 4);
towelGroup.add(wmRind);

const chairGroup = new THREE.Group();
const chairMat = new THREE.MeshPhongMaterial({ color: 0x1155aa });
const chairMetal = new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 80 });
const seat = new THREE.Mesh(new THREE.BoxGeometry(10, 0.8, 6), chairMat);
seat.position.set(0, 3, 0);
chairGroup.add(seat);
const back = new THREE.Mesh(new THREE.BoxGeometry(10, 0.8, 7), chairMat);
back.rotation.x = Math.PI / 5;
back.position.set(0, 6, -4);
chairGroup.add(back);
[[-4,-3],[4,-3],[-4,3],[4,3]].forEach(([lx,lz]) => {
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,4,8), chairMetal);
  leg.position.set(lx, 1, lz);
  chairGroup.add(leg);
});
chairGroup.position.set(15, 0, -4);
towelGroup.add(chairGroup);

towelGroup.position.set(20, 0, 40);
towelGroup.scale.set(0.8, 0.8, 0.8);
scene.add(towelGroup);

const soccerCanvas2 = document.createElement('canvas');
soccerCanvas2.width = soccerCanvas2.height = 512;
const s2Ctx = soccerCanvas2.getContext('2d');
s2Ctx.fillStyle = '#ffffff';
s2Ctx.fillRect(0, 0, 512, 512);
function drawHex(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    i === 0 ? ctx.moveTo(cx + r*Math.cos(a), cy + r*Math.sin(a))
             : ctx.lineTo(cx + r*Math.cos(a), cy + r*Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = '#111111';
  ctx.fill();
}
[[128,128],[384,128],[256,220],[80,300],[432,300],[192,390],[320,390],[256,60]].forEach(([x,y]) => drawHex(s2Ctx,x,y,55));
const bwSoccerBall = new THREE.Mesh(
  new THREE.SphereGeometry(4, 32, 32),
  new THREE.MeshPhongMaterial({ map: new THREE.CanvasTexture(soccerCanvas2), shininess: 60 })
);
bwSoccerBall.position.set(-45, 4, 75);
scene.add(bwSoccerBall);

const cubeCanvas = document.createElement('canvas');
cubeCanvas.width = cubeCanvas.height = 512;
const cCtx = cubeCanvas.getContext('2d');
const grad = cCtx.createLinearGradient(0, 0, 512, 512);
grad.addColorStop(0, '#00b4d8');   // teal
grad.addColorStop(0.5, '#ff69b4'); // hot pink
grad.addColorStop(1, '#00b4d8');   // teal
cCtx.fillStyle = grad;
cCtx.fillRect(0, 0, 512, 512);
cCtx.strokeStyle = 'rgba(255,255,255,0.4)';
cCtx.lineWidth = 4;
for (let i = 0; i <= 8; i++) {
  cCtx.beginPath(); cCtx.moveTo(i*64, 0); cCtx.lineTo(i*64, 512); cCtx.stroke();
  cCtx.beginPath(); cCtx.moveTo(0, i*64); cCtx.lineTo(512, i*64); cCtx.stroke();
}
const tealPinkTex = new THREE.CanvasTexture(cubeCanvas);
const attractiveCube = new THREE.Mesh(
  new THREE.BoxGeometry(8, 8, 8),
  new THREE.MeshPhongMaterial({ map: tealPinkTex, shininess: 80, specular: 0xffffff })
);
attractiveCube.position.set(55, 4, 70);
scene.add(attractiveCube);
const tkStatue = new THREE.Group();

const tkBase = new THREE.Mesh(
  new THREE.CylinderGeometry(3, 3.5, 1, 16),
  new THREE.MeshPhongMaterial({ color: 0x888880, shininess: 40 })
);
tkBase.position.set(0, 0.5, 0);
tkStatue.add(tkBase);

const tkPillar = new THREE.Mesh(
  new THREE.CylinderGeometry(1.2, 1.5, 5, 16),
  new THREE.MeshPhongMaterial({ color: 0x999990, shininess: 40 })
);
tkPillar.position.set(0, 3.5, 0);
tkStatue.add(tkPillar);

const tkGeo = new THREE.TorusKnotGeometry(4, 1.2, 200, 20, 3, 5);
const tkPalette = [
  new THREE.Color(0x7b3fa0), new THREE.Color(0x2255aa),
  new THREE.Color(0x228877), new THREE.Color(0x4a7a3a),
  new THREE.Color(0x8a4a3a),
];
const tkPos = tkGeo.attributes.position;
const tkColors = new Float32Array(tkPos.count * 3);
for (let i = 0; i < tkPos.count; i++) {
  const t2 = i / tkPos.count;
  const idx = Math.floor(t2 * tkPalette.length) % tkPalette.length;
  const next = (idx + 1) % tkPalette.length;
  const c = tkPalette[idx].clone().lerp(tkPalette[next], (t2 * tkPalette.length) % 1);
  tkColors[i*3] = c.r; tkColors[i*3+1] = c.g; tkColors[i*3+2] = c.b;
}
tkGeo.setAttribute('color', new THREE.BufferAttribute(tkColors, 3));
const torusKnot = new THREE.Mesh(tkGeo,
  new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 150, specular: 0xffffff })
);
torusKnot.position.set(0, 10, 0);
tkStatue.add(torusKnot);

tkStatue.position.set(-40, 0, 40);
scene.add(tkStatue);

const cubeStatue = new THREE.Group();
const goldDodec = new THREE.Mesh(
  new THREE.DodecahedronGeometry(5, 0),
  new THREE.MeshPhongMaterial({ color: 0xffaa00, emissive: 0x442200, shininess: 150 })
);
goldDodec.position.set(0, 5, 0);
cubeStatue.add(goldDodec);
cubeStatue.position.set(-30, 0, 70);
scene.add(cubeStatue);

const cubeOnDodec = new THREE.Mesh(
  new THREE.BoxGeometry(6, 6, 6),
  faceMaterials.map(m => m.clone())
);
cubeOnDodec.position.set(40, 3, 70);
scene.add(cubeOnDodec);

const pinkOcta = new THREE.Mesh(
  new THREE.OctahedronGeometry(6, 0),
  new THREE.MeshPhongMaterial({ color: 0xff69b4, emissive: 0x440011, shininess: 130 })
);
pinkOcta.position.set(30, 6, 60);
scene.add(pinkOcta);
const rainbow = new THREE.Group();
const rainbowColors = [0xff0000,0xff6600,0xffee00,0x00cc00,0x0044ff,0x4400aa,0xaa00cc];
const rainbowMats = [];
rainbowColors.forEach((color,i) => {
  const mat = new THREE.MeshPhongMaterial({
    color, transparent: true, opacity: 0.8,
    side: THREE.DoubleSide, emissive: color, emissiveIntensity: 0.2
  });
  rainbowMats.push(mat);
  rainbow.add(new THREE.Mesh(new THREE.TorusGeometry(80-i*2, 1.2, 8, 50, Math.PI), mat));
});
rainbow.scale.set(2.0, 1.0, 1.0);
rainbow.position.set(-50, 90, -200);
rainbow.rotation.x = 0.1;
scene.add(rainbow);

const ferrisWheel = new THREE.Group();
const fwMetal = new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 120 });
const fwRed   = new THREE.MeshPhongMaterial({ color: 0xdd2200, emissive: 0x440000 });

ferrisWheel.add(new THREE.Mesh(new THREE.TorusGeometry(20, 0.8, 16, 64), fwRed));
ferrisWheel.add(new THREE.Mesh(new THREE.TorusGeometry(15, 0.4, 12, 48), fwMetal));
ferrisWheel.add(new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), fwMetal));

for (let i = 0; i < 8; i++) {
  const angle = (i / 8) * Math.PI * 2;
  const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 20, 8), fwMetal);
  spoke.position.set(Math.cos(angle)*10, Math.sin(angle)*10, 0);
  spoke.rotation.z = angle + Math.PI / 2;
  ferrisWheel.add(spoke);
}

const cabinColors = [0xff2200,0xff8800,0xffee00,0x00cc44,0x0066ff,0xaa00cc,0xff00aa,0x00cccc];
const cabins = [];
for (let i = 0; i < 8; i++) {
  const angle = (i / 8) * Math.PI * 2;
  const cabin = new THREE.Group();
  cabin.add(new THREE.Mesh(new THREE.BoxGeometry(4, 3, 2.5),
    new THREE.MeshPhongMaterial({ color: cabinColors[i] })));
  cabin.position.set(Math.cos(angle)*20, Math.sin(angle)*20, 0);
  ferrisWheel.add(cabin);
  cabins.push(cabin);
}

const ferrisStand = new THREE.Group();
const fwLegMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 30, 8), fwLegMat);
legL.position.set(-8, -15, 0); legL.rotation.z = 0.3;
ferrisStand.add(legL);
const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 30, 8), fwLegMat);
legR.position.set(8, -15, 0); legR.rotation.z = -0.3;
ferrisStand.add(legR);
const base = new THREE.Mesh(new THREE.BoxGeometry(30, 1.5, 8),
  new THREE.MeshPhongMaterial({ color: 0x666666 }));
base.position.set(0, -22, 0);
ferrisStand.add(base);

ferrisWheel.position.set(-120, 35, 80);
ferrisStand.position.set(-120, 35, 80);
ferrisWheel.scale.set(1.8, 1.8, 1.8);
ferrisStand.scale.set(1.8, 1.8, 1.8);
scene.add(ferrisWheel);
scene.add(ferrisStand);

const rocket = new THREE.Group();
const rocketWhite = new THREE.MeshPhongMaterial({ color: 0xdddddd, shininess: 80 });
const rocketRed   = new THREE.MeshPhongMaterial({ color: 0xdd1111, emissive: 0x440000 });
const rocketGray  = new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 100 });

const rBody = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.2, 20, 32), rocketWhite);
rocket.add(rBody);
const rNose = new THREE.Mesh(new THREE.ConeGeometry(3, 6, 32), rocketRed);
rNose.position.set(0, 13, 0);
rocket.add(rNose);
for (let i = 0; i < 4; i++) {
  const angle = (i/4) * Math.PI * 2;
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7, 4.5), rocketRed);
  fin.position.set(Math.cos(angle)*3.5, -8, Math.sin(angle)*3.5);
  fin.rotation.y = angle;
  rocket.add(fin);
}
const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 1.8, 3, 24), rocketGray);
nozzle.position.set(0, -11.5, 0);
rocket.add(nozzle);
const flame = new THREE.Mesh(new THREE.ConeGeometry(1.5, 6, 12),
  new THREE.MeshPhongMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 1.0 }));
flame.position.set(0, -17, 0);
flame.rotation.z = Math.PI;
rocket.add(flame);

rocket.position.set(120, 25, 80);
scene.add(rocket);

const dolphins = [];
const dolphinOffsets = [
  [0,   0,   0],    // leader
  [-20, 0,  15],    // back left
  [-20, 0, -15],    // back right
  [-38, 0,  28],    // far left
  [-38, 0, -28],    // far right
];

dolphinOffsets.forEach(([dx, dy, dz], i) => {
  loader.load('img/Dolphin.glb', (gltf) => {
    const d = gltf.scene;
    d.position.set(-100 + dx, 0, -500 + dz);
    d.scale.set(3, 3, 3);
    d.rotation.y = -Math.PI / 2;
    d.traverse(child => {
      if (child.isMesh) {
        child.material.side = THREE.DoubleSide;
        child.material.transparent = false;
        child.material.opacity = 1;
        // Fix black color — use dolphin grey/blue
        if (child.material.color.r < 0.1 && child.material.color.g < 0.1) {
          child.material.color.set(0x4a7a9b);
        }
      }
    });
    scene.add(d);
    dolphins.push({ mesh: d });
  }, undefined, (err) => console.error('Dolphin error:', err));
});

const brickLoader = new THREE.TextureLoader();
const brickTex = brickLoader.load(
  'https://threejs.org/examples/textures/brick_diffuse.jpg',
  () => { console.log('Brick texture loaded!'); },
  undefined,
  () => {
    brickTex.image = null;
  }
);
brickTex.wrapS = THREE.RepeatWrapping;
brickTex.wrapT = THREE.RepeatWrapping;
brickTex.repeat.set(2, 2);

const hut = new THREE.Group();
const hutBox = new THREE.Mesh(
  new THREE.BoxGeometry(20, 20, 20),
  new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.8, metalness: 0.1 })
);
hutBox.position.set(0, 10, 0);
hut.add(hutBox);

const hutRoof = new THREE.Mesh(
  new THREE.ConeGeometry(16, 10, 4),
  new THREE.MeshPhongMaterial({ color: 0xdd2200, emissive: 0x440000 })
);
hutRoof.position.set(0, 25, 0);
hutRoof.rotation.y = Math.PI / 4;
hut.add(hutRoof);

const hutWin = new THREE.Mesh(
  new THREE.BoxGeometry(6, 6, 0.5),
  new THREE.MeshPhongMaterial({ color: 0x88ccff, emissive: 0x002244, shininess: 200 })
);
hutWin.position.set(0, 12, 10.3);
hut.add(hutWin);

const hutDoor = new THREE.Mesh(
  new THREE.BoxGeometry(5, 8, 0.5),
  new THREE.MeshPhongMaterial({ color: 0x5a3010 })
);
hutDoor.position.set(0, 4, 10.3);
hut.add(hutDoor);

const signCanvas = document.createElement('canvas');
signCanvas.width = 256; signCanvas.height = 64;
const sCtx = signCanvas.getContext('2d');
sCtx.fillStyle = '#ff0000';
sCtx.fillRect(0, 0, 256, 64);
sCtx.fillStyle = '#ffffff';
sCtx.font = 'bold 28px Arial';
sCtx.textAlign = 'center';
sCtx.textBaseline = 'middle';
sCtx.fillText('LIFEGUARD', 128, 32);
const sign = new THREE.Mesh(
  new THREE.BoxGeometry(14, 4, 0.5),
  new THREE.MeshPhongMaterial({ map: new THREE.CanvasTexture(signCanvas) })
);
sign.position.set(0, 20, 10.3);
hut.add(sign);

hut.position.set(0, 0, 120);
hut.rotation.y = Math.PI;
scene.add(hut);

const rectLight = new THREE.RectAreaLight(0xffcc00, 20, 8, 8);
rectLight.position.set(0, 12, 110);
rectLight.lookAt(0, 12, 90); // shine toward camera
scene.add(rectLight);

const windowGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(6, 6),
  new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.DoubleSide })
);
windowGlow.position.set(0, 12, 110.1);
scene.add(windowGlow);

let walkMode = false;
window.addEventListener('toggleCameraMode', () => {
  walkMode = !walkMode;
  controls.enabled = !walkMode; // disable orbit when in walk mode
});

const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup',   (e) => { keys[e.key.toLowerCase()] = false; });

function moveCamera() {
  const speed = 2;
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  dir.y = 0;
  dir.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(dir, new THREE.Vector3(0,1,0)).normalize();

  if (keys['w'] || keys['arrowup'])    camera.position.addScaledVector(dir, speed);
  if (keys['s'] || keys['arrowdown'])  camera.position.addScaledVector(dir, -speed);
  if (keys['a'] || keys['arrowleft'])  camera.position.addScaledVector(right, -speed);
  if (keys['d'] || keys['arrowright']) camera.position.addScaledVector(right, speed);
  if (keys['q']) camera.position.y += speed;
  if (keys['e']) camera.position.y -= speed;
}

function animate() {
  requestAnimationFrame(animate);
  const t = Date.now() * 0.001;

  // Black white soccer ball rolls
  bwSoccerBall.rotation.y += 0.01;
  bwSoccerBall.rotation.z += 0.005;

  // Teal/pink cube spins
  attractiveCube.rotation.y += 0.008;
  attractiveCube.rotation.x += 0.005;

  // Dolphins swim across ocean jumping in and out of water
  dolphins.forEach(({ mesh, offsetX, offsetZ }, i) => {
    mesh.position.x -= 0.4;
    if (mesh.position.x < -400) mesh.position.x = 400;

    // Jumping — sine wave at different phases per dolphin
    const jumpY = Math.sin(t * 2.0 + i * 0.8) * 12 - 6;
    mesh.position.y = jumpY;

    // Tilt body with jump direction
    mesh.rotation.z = Math.cos(t * 2.0 + i * 0.8) * 0.4;
  });

  // Balloon bobs
  balloon.position.y = 50 + Math.sin(t * 0.5) * 3;
  balloon.rotation.y += 0.003;

  // Airplane flies left, resets
  airplane.position.x -= 0.3;
  if (airplane.position.x < -400) airplane.position.x = 400;

  // Spiked ball bobs in ocean
  spikeBall.position.y = 3 + Math.sin(t * 0.8) * 2;
  spikeBall.rotation.y += 0.005;

  // Kite sways
  kite.rotation.z = Math.sin(t*1.2)*0.15;
  kite.rotation.x = Math.sin(t*0.8)*0.08;
  kite.position.y = 60 + Math.sin(t*0.6)*3;

  // Soccer ball rolls
  soccerBall.rotation.y += 0.01;
  soccerBall.rotation.z += 0.005;

  // Ocean lifesavers bob
  ls3.position.y = 2 + Math.sin(t * 1.2) * 0.5;
  ls4.position.y = 2 + Math.sin(t * 0.9 + 1) * 0.5;

  // Torus knot statue spins
  torusKnot.rotation.y += 0.006;
  torusKnot.rotation.x += 0.004;

  // Pink octahedron spins
  pinkOcta.rotation.y += 0.009;
  pinkOcta.rotation.x += 0.004;

  // Cube rotates
  cubeOnDodec.rotation.y += 0.008;
  cubeOnDodec.rotation.x += 0.005;
  const rainbowOpacity = 0.5 + Math.sin(t * 0.5) * 0.3;
  rainbowMats.forEach(m => { m.opacity = rainbowOpacity; });

  // Ferris wheel rotates, cabins stay upright
  ferrisWheel.rotation.z += 0.005;
  cabins.forEach(c => { c.rotation.z -= 0.005; });

  // Rocket hovers
  rocket.position.y = 25 + Math.sin(t * 0.8) * 2;
  flame.scale.y = 0.8 + Math.sin(t * 10) * 0.2;

  moveCamera();
  controls.update();
  renderer.render(scene, camera);
}

animate();

