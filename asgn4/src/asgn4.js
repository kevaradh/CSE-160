// CSE160 Assignment 4 — World + Phong Lighting + Spotlight
import getContext from './Context.js';
import Horse from './Horse.js';
import ObjModel from './ObjModel.js';
import Model from './Model.js';

var VSHADER_SOURCE =
  'attribute vec3 a_Position;\n' +
  'attribute vec3 a_Normal;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform vec3 u_LightPos;\n' +
  'uniform vec3 u_SpotLightPos;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec3 v_LightDir;\n' +
  'varying vec3 v_SpotDir;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  vec4 worldPos = u_ModelMatrix * vec4(a_Position, 1.0);\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * worldPos;\n' +
  '  v_Normal   = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));\n' +
  '  v_Position = vec3(worldPos);\n' +
  '  v_LightDir = normalize(u_LightPos - vec3(worldPos));\n' +
  '  v_SpotDir  = normalize(u_SpotLightPos - vec3(worldPos));\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec3 v_LightDir;\n' +
  'varying vec3 v_SpotDir;\n' +
  'varying vec2 v_TexCoord;\n' +
  'uniform vec3  u_Color;\n' +
  'uniform vec3  u_LightColor;\n' +
  'uniform vec3  u_CameraPos;\n' +
  'uniform bool  u_UseTexture;\n' +
  'uniform bool  u_LightOn;\n' +
  'uniform bool  u_SpotLightOn;\n' +
  'uniform bool  u_ShowNormal;\n' +
  'uniform bool  u_NoLight;\n' +
  'uniform vec3  u_SpotLightDir;\n' +
  'uniform float u_SpotCutoff;\n' +
  'uniform sampler2D u_Sampler;\n' +
  'void main() {\n' +
  '  if (u_ShowNormal) { gl_FragColor = vec4(normalize(v_Normal)*0.5+0.5, 1.0); return; }\n' +
  '  vec3 baseColor = u_UseTexture ? vec3(texture2D(u_Sampler, v_TexCoord)) : u_Color;\n' +
  '  if (u_NoLight) { gl_FragColor = vec4(baseColor, 1.0); return; }\n' +
  '  vec3 N = normalize(v_Normal);\n' +
  '  vec3 V = normalize(u_CameraPos - v_Position);\n' +
  '  vec3 finalColor = 0.15 * baseColor;\n' +
  // Point light
  '  if (u_LightOn) {\n' +
  '    vec3 L = normalize(v_LightDir);\n' +
  '    vec3 R = reflect(-L, N);\n' +
  '    float diff = max(dot(N,L), 0.0);\n' +
  '    float spec = pow(max(dot(V,R), 0.0), 32.0);\n' +
  '    finalColor += diff * u_LightColor * baseColor + 0.5*spec*u_LightColor;\n' +
  '  }\n' +
  // Spotlight
  '  if (u_SpotLightOn) {\n' +
  '    vec3 SL = normalize(v_SpotDir);\n' +
  '    vec3 SD = normalize(-u_SpotLightDir);\n' +
  '    float theta = dot(SL, SD);\n' +
  '    if (theta > u_SpotCutoff) {\n' +
  '      float intensity = smoothstep(u_SpotCutoff, 1.0, theta);\n' +
  '      vec3 SR = reflect(-SL, N);\n' +
  '      float sdiff = max(dot(N,SL), 0.0);\n' +
  '      float sspec = pow(max(dot(V,SR), 0.0), 32.0);\n' +
  '      finalColor += intensity*(sdiff*vec3(1.0,0.9,0.7)*baseColor + 0.5*sspec*vec3(1.0,0.9,0.7));\n' +
  '    }\n' +
  '  }\n' +
  '  gl_FragColor = vec4(finalColor, 1.0);\n' +
  '}\n';

// Globals
const gl     = getContext();
const canvas = gl.canvas;
var u_Model, u_View, u_Proj, u_NormalMat;
var u_Color, u_LightColor, u_CameraPos;
var u_LightPos, u_SpotLightPos, u_SpotLightDir, u_SpotCutoff;
var u_UseTexture, u_LightOn, u_SpotLightOn;
var u_ShowNormal, u_NoLight, u_Sampler;
var a_Position, a_Normal, a_TexCoord;
var g_cubeVertBuf, g_cubeNormBuf, g_cubeUVBuf;
var g_sphereVertBuf, g_sphereNormBuf, g_sphereCount;
var g_wallTexture, g_textureReady = false;
var g_matrix = null;

var g_lightOn     = true;
var g_spotLightOn = true;
var g_showNormal  = false;
var g_lightPos    = [16, 6, 16];
var g_lightColor  = [1.0, 1.0, 1.0];
var g_spotPos     = [16, 5, 14];  // above horse and spheres
var g_spotDir     = [0, -1, 0];   // pointing straight down
var g_spotCutoff  = 0.85;  // wider cone to cover objects
var g_startTime   = null;

var g_eyeX=16, g_eyeY=6, g_eyeZ=30;
var g_rotX=18, g_rotY=0;
var g_dragging=false, g_lastX=0, g_lastY=0;

const horse     = new Horse();
const objModel  = new ObjModel();
let   teapot    = null; // loaded after gl is ready

function main() {
  gl.enable(gl.DEPTH_TEST);
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) { console.log('Failed to init shaders'); return; }

  u_Model       = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_View        = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_Proj        = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  u_NormalMat   = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_Color       = gl.getUniformLocation(gl.program, 'u_Color');
  u_LightColor  = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_CameraPos   = gl.getUniformLocation(gl.program, 'u_CameraPos');
  u_LightPos    = gl.getUniformLocation(gl.program, 'u_LightPos');
  u_SpotLightPos= gl.getUniformLocation(gl.program, 'u_SpotLightPos');
  u_SpotLightDir= gl.getUniformLocation(gl.program, 'u_SpotLightDir');
  u_SpotCutoff  = gl.getUniformLocation(gl.program, 'u_SpotCutoff');
  u_UseTexture  = gl.getUniformLocation(gl.program, 'u_UseTexture');
  u_LightOn     = gl.getUniformLocation(gl.program, 'u_LightOn');
  u_SpotLightOn = gl.getUniformLocation(gl.program, 'u_SpotLightOn');
  u_ShowNormal  = gl.getUniformLocation(gl.program, 'u_ShowNormal');
  u_NoLight     = gl.getUniformLocation(gl.program, 'u_NoLight');
  u_Sampler     = gl.getUniformLocation(gl.program, 'u_Sampler');
  a_Position    = gl.getAttribLocation(gl.program,  'a_Position');
  a_Normal      = gl.getAttribLocation(gl.program,  'a_Normal');
  a_TexCoord    = gl.getAttribLocation(gl.program,  'a_TexCoord');

  g_matrix    = new Matrix4();
  g_startTime = performance.now();

  initCubeBuffers();
  initSphereBuffers(24);
  initWallTexture();
  objModel.init(gl);

  // Load teapot OBJ using Model.js (same as lab)
  teapot = new Model(gl, 'teapot.obj');

  var proj = new Matrix4();
  proj.setPerspective(60, canvas.width/canvas.height, 0.1, 500);
  gl.uniformMatrix4fv(u_Proj, false, proj.elements);

  canvas.addEventListener('mousedown', e => { g_dragging=true; g_lastX=e.clientX; g_lastY=e.clientY; });
  window.addEventListener('mouseup',   () => { g_dragging=false; });
  window.addEventListener('mousemove', e => {
    if (!g_dragging) return;
    g_rotY += (e.clientX-g_lastX)*0.4; g_rotX += (e.clientY-g_lastY)*0.4;
    g_rotX = Math.max(-80, Math.min(80, g_rotX));
    g_lastX=e.clientX; g_lastY=e.clientY;
  });
  window.addEventListener('keydown', e => {
    var rad=g_rotY*Math.PI/180, spd=0.5;
    if (e.key==='w'||e.key==='W') { g_eyeX+=Math.sin(rad)*spd; g_eyeZ-=Math.cos(rad)*spd; }
    if (e.key==='s'||e.key==='S') { g_eyeX-=Math.sin(rad)*spd; g_eyeZ+=Math.cos(rad)*spd; }
    if (e.key==='a'||e.key==='A') { g_eyeX-=Math.cos(rad)*spd; g_eyeZ-=Math.sin(rad)*spd; }
    if (e.key==='d'||e.key==='D') { g_eyeX+=Math.cos(rad)*spd; g_eyeZ+=Math.sin(rad)*spd; }
  });

  // Buttons
  document.getElementById('btnLight').addEventListener('click', function() {
    g_lightOn = !g_lightOn;
    this.textContent = g_lightOn ? '💡 Point Light: ON' : '💡 Point Light: OFF';
    this.style.background = g_lightOn ? '#2a6' : '#622';
  });
  document.getElementById('btnSpot').addEventListener('click', function() {
    g_spotLightOn = !g_spotLightOn;
    this.textContent = g_spotLightOn ? '🔦 Spot Light: ON' : '🔦 Spot Light: OFF';
    this.style.background = g_spotLightOn ? '#26a' : '#622';
  });
  document.getElementById('btnNormal').addEventListener('click', function() {
    g_showNormal = !g_showNormal;
    this.textContent = g_showNormal ? 'Normals: ON' : 'Normals: OFF';
    this.style.background = g_showNormal ? '#2a6' : '#444';
  });

  // Point light position sliders
  document.getElementById('sliderX').addEventListener('input', function() { g_lightPos[0]=parseFloat(this.value); document.getElementById('lxVal').textContent=this.value; });
  document.getElementById('sliderY').addEventListener('input', function() { g_lightPos[1]=parseFloat(this.value); document.getElementById('lyVal').textContent=this.value; });
  document.getElementById('sliderZ').addEventListener('input', function() { g_lightPos[2]=parseFloat(this.value); document.getElementById('lzVal').textContent=this.value; });
  // Light color sliders
  document.getElementById('sliderR').addEventListener('input', function() { g_lightColor[0]=parseFloat(this.value); document.getElementById('lrVal').textContent=parseFloat(this.value).toFixed(2); });
  document.getElementById('sliderG').addEventListener('input', function() { g_lightColor[1]=parseFloat(this.value); document.getElementById('lgVal').textContent=parseFloat(this.value).toFixed(2); });
  document.getElementById('sliderB').addEventListener('input', function() { g_lightColor[2]=parseFloat(this.value); document.getElementById('lbVal').textContent=parseFloat(this.value).toFixed(2); });
  // Spotlight cutoff
  document.getElementById('sliderCutoff').addEventListener('input', function() { g_spotCutoff=parseFloat(this.value); document.getElementById('cutoffVal').textContent=parseFloat(this.value).toFixed(2); });

  window.addEventListener('resize', () => {
    gl.viewport(0,0,canvas.width,canvas.height);
    var p=new Matrix4(); p.setPerspective(60,canvas.width/canvas.height,0.1,500);
    gl.uniformMatrix4fv(u_Proj,false,p.elements);
  });

  tick();
}

function tick() {
  var t = (performance.now()-g_startTime)/1000.0;
  // Animate point light
  g_lightPos[0] = 16 + Math.cos(t*0.5)*8;
  g_lightPos[2] = 16 + Math.sin(t*0.5)*8;
  // Spotlight moves between objects — exact positions
  var cycle = Math.floor((t * 0.2) % 8);
  if (cycle === 0)      { g_spotPos[0]=16; g_spotPos[2]=18; } // Horse
  else if (cycle === 1) { g_spotPos[0]=22; g_spotPos[2]=10; } // Red sphere
  else if (cycle === 2) { g_spotPos[0]=13; g_spotPos[2]=20; } // Blue sphere
  else if (cycle === 3) { g_spotPos[0]=10; g_spotPos[2]=10; } // Orange cube
  else if (cycle === 4) { g_spotPos[0]=20; g_spotPos[2]=22; } // Seashell
  else if (cycle === 5) { g_spotPos[0]=8;  g_spotPos[2]=14; } // Torus
  else if (cycle === 6) { g_spotPos[0]=16; g_spotPos[2]=21; } // Teapot
  else                  { g_spotPos[0]=16; g_spotPos[2]=18; } // back to Horse
  g_spotPos[1] = 5;
  g_spotDir[0] = 0; g_spotDir[1] = -1; g_spotDir[2] = 0;
  horse.animate(t*2.0);
  renderScene();
  requestAnimationFrame(tick);
}

function renderScene() {
  gl.clearColor(0.4, 0.6, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var rx=g_rotX*Math.PI/180, ry=g_rotY*Math.PI/180;
  var view=new Matrix4();
  view.setLookAt(g_eyeX,g_eyeY,g_eyeZ, g_eyeX+Math.sin(ry)*Math.cos(rx), g_eyeY-Math.sin(rx), g_eyeZ-Math.cos(ry)*Math.cos(rx), 0,1,0);
  gl.uniformMatrix4fv(u_View, false, view.elements);

  gl.uniform1i(u_LightOn,     g_lightOn);
  gl.uniform1i(u_SpotLightOn, g_spotLightOn);
  gl.uniform1i(u_ShowNormal,  g_showNormal);
  gl.uniform3fv(u_LightPos,    g_lightPos);
  gl.uniform3fv(u_LightColor,  g_lightColor);
  gl.uniform3f(u_CameraPos,    g_eyeX, g_eyeY, g_eyeZ);
  gl.uniform3fv(u_SpotLightPos, g_spotPos);
  gl.uniform3fv(u_SpotLightDir, g_spotDir);
  gl.uniform1f(u_SpotCutoff,   g_spotCutoff);

  // Ground
  drawCube(16,-0.5,16, 32,1,32, 0.2,0.7,0.2, false);
  // Walls
  drawCube(16,4,0,   32,8,1, 1,1,1, true);
  drawCube(0, 4,16,  1,8,32, 1,1,1, true);
  drawCube(32,4,16,  1,8,32, 1,1,1, true);
  drawCube(16,4,32,  32,8,1, 1,1,1, true);
  // Objects
  drawCube(10, 1.5, 10,  3,3,3,  0.8,0.4,0.1, false);  // cube on ground
  drawSphere(13, 1, 20, 1.0,   0.2,0.4,0.8);  // blue sphere
  drawSphere(22,2,10, 2.0,   0.8,0.1,0.1);
  // OBJ loaded from file — teapot (purple)
  if (teapot) teapot.render(gl, 16, 0, 21, 0.5, u_Model,u_NormalMat,u_Color,u_UseTexture,a_Position,a_Normal,a_TexCoord);
  // Boost spotlight cutoff temporarily so shell gets more light
  gl.uniform1f(u_SpotCutoff, 0.5); // wider cone for shell
  objModel.renderShell(gl, 20, 0.3, 22, 1.5, u_Model,u_NormalMat,u_Color,u_UseTexture,a_Position,a_Normal,a_TexCoord);
  gl.uniform1f(u_SpotCutoff, g_spotCutoff); // restore
  objModel.renderTorus(gl, 8,  3,   14, 1.2, u_Model,u_NormalMat,u_Color,u_UseTexture,a_Position,a_Normal,a_TexCoord);

  // Horse
  horse.render(gl, 16,1.3,18, 2.0, u_Model,u_NormalMat,u_Color,u_UseTexture,a_Position,a_Normal,a_TexCoord,g_cubeVertBuf,g_cubeNormBuf,g_cubeUVBuf);

  // Yellow cube at point light (no lighting)
  gl.uniform1i(u_NoLight, true);
  drawCube(g_lightPos[0],g_lightPos[1],g_lightPos[2], 0.3,0.3,0.3, 1.0,1.0,0.0, false);
  // Cyan cube at spotlight — small marker
  drawCube(g_spotPos[0],g_spotPos[1],g_spotPos[2], 0.2,0.2,0.2, 0.0,1.0,1.0, false);
  gl.uniform1i(u_NoLight, false);
}

function drawCube(x,y,z, sx,sy,sz, r,g,b, useTexture) {
  g_matrix.setTranslate(x,y,z); g_matrix.scale(sx,sy,sz);
  gl.uniformMatrix4fv(u_Model, false, g_matrix.elements);
  var nm=new Matrix4(); nm.setInverseOf(g_matrix); nm.transpose();
  gl.uniformMatrix4fv(u_NormalMat, false, nm.elements);
  gl.uniform3f(u_Color, r,g,b);
  gl.uniform1i(u_UseTexture, useTexture?1:0);
  if (useTexture && g_textureReady) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, g_wallTexture); gl.uniform1i(u_Sampler, 0); }
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeVertBuf); gl.vertexAttribPointer(a_Position,3,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(a_Position);
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeNormBuf); gl.vertexAttribPointer(a_Normal,3,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(a_Normal);
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeUVBuf);   gl.vertexAttribPointer(a_TexCoord,2,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(a_TexCoord);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawSphere(x,y,z, radius, r,g,b) {
  g_matrix.setTranslate(x,y,z); g_matrix.scale(radius,radius,radius);
  gl.uniformMatrix4fv(u_Model, false, g_matrix.elements);
  var nm=new Matrix4(); nm.setInverseOf(g_matrix); nm.transpose();
  gl.uniformMatrix4fv(u_NormalMat, false, nm.elements);
  gl.uniform3f(u_Color, r,g,b); gl.uniform1i(u_UseTexture, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereVertBuf); gl.vertexAttribPointer(a_Position,3,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(a_Position);
  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereNormBuf); gl.vertexAttribPointer(a_Normal,3,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(a_Normal);
  gl.disableVertexAttribArray(a_TexCoord); gl.vertexAttrib2f(a_TexCoord,0,0);
  gl.drawArrays(gl.TRIANGLES, 0, g_sphereCount);
}

function initWallTexture() {
  var size=256, c=document.createElement('canvas'); c.width=size; c.height=size;
  var ctx=c.getContext('2d'), bsize=16;
  for (var row=0;row<size/bsize;row++) for (var col=0;col<size/bsize;col++) {
    var r=160+Math.floor(Math.random()*40), g2=120+Math.floor(Math.random()*30), b=70+Math.floor(Math.random()*20);
    ctx.fillStyle='rgb('+r+','+g2+','+b+')'; ctx.fillRect(col*bsize,row*bsize,bsize,bsize);
    for (var px=0;px<bsize;px+=2) for (var py=0;py<bsize;py+=2) {
      ctx.fillStyle='rgb('+Math.max(100,Math.min(220,r+Math.floor(Math.random()*30)-15))+','+Math.max(80,Math.min(160,g2+Math.floor(Math.random()*20)-10))+','+Math.max(40,Math.min(100,b+Math.floor(Math.random()*15)-7))+')';
      ctx.fillRect(col*bsize+px,row*bsize+py,2,2);
    }
    ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=1; ctx.strokeRect(col*bsize+0.5,row*bsize+0.5,bsize-1,bsize-1);
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
  g_wallTexture=gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,g_wallTexture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
  g_textureReady=true;
}

function initCubeBuffers() {
  var verts = new Float32Array([
    -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,
    -0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5, 0.5, 0.5,
     0.5, 0.5,-0.5,   0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,
     0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,
    -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,
    -0.5, 0.5,-0.5,  -0.5,-0.5, 0.5,  -0.5, 0.5, 0.5,
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,
     0.5, 0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5,
    -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5,   0.5, 0.5, 0.5,
    -0.5, 0.5,-0.5,   0.5, 0.5, 0.5,   0.5, 0.5,-0.5,
    -0.5,-0.5, 0.5,  -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,
    -0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,
  ]);
  var norms = new Float32Array([
     0, 0, 1,  0, 0, 1,  0, 0, 1,   0, 0, 1,  0, 0, 1,  0, 0, 1,
     0, 0,-1,  0, 0,-1,  0, 0,-1,   0, 0,-1,  0, 0,-1,  0, 0,-1,
    -1, 0, 0, -1, 0, 0, -1, 0, 0,  -1, 0, 0, -1, 0, 0, -1, 0, 0,
     1, 0, 0,  1, 0, 0,  1, 0, 0,   1, 0, 0,  1, 0, 0,  1, 0, 0,
     0, 1, 0,  0, 1, 0,  0, 1, 0,   0, 1, 0,  0, 1, 0,  0, 1, 0,
     0,-1, 0,  0,-1, 0,  0,-1, 0,   0,-1, 0,  0,-1, 0,  0,-1, 0,
  ]);
  var uvs = new Float32Array([
    0,1,0,0,1,0, 0,1,1,0,1,1,  0,1,0,0,1,0, 0,1,1,0,1,1,
    0,1,0,0,1,0, 0,1,1,0,1,1,  0,1,0,0,1,0, 0,1,1,0,1,1,
    0,1,0,0,1,0, 0,1,1,0,1,1,  0,1,0,0,1,0, 0,1,1,0,1,1,
  ]);
  g_cubeVertBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,g_cubeVertBuf); gl.bufferData(gl.ARRAY_BUFFER,verts,gl.STATIC_DRAW);
  g_cubeNormBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,g_cubeNormBuf); gl.bufferData(gl.ARRAY_BUFFER,norms,gl.STATIC_DRAW);
  g_cubeUVBuf  =gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,g_cubeUVBuf);   gl.bufferData(gl.ARRAY_BUFFER,uvs,  gl.STATIC_DRAW);
}

function initSphereBuffers(divisions) {
  var verts=[],norms=[];
  for (var i=0;i<divisions;i++) { var p1=Math.PI*i/divisions,p2=Math.PI*(i+1)/divisions;
    for (var j=0;j<divisions;j++) { var t1=2*Math.PI*j/divisions,t2=2*Math.PI*(j+1)/divisions;
      var p=[[Math.sin(p1)*Math.cos(t1),Math.cos(p1),Math.sin(p1)*Math.sin(t1)],[Math.sin(p2)*Math.cos(t1),Math.cos(p2),Math.sin(p2)*Math.sin(t1)],[Math.sin(p2)*Math.cos(t2),Math.cos(p2),Math.sin(p2)*Math.sin(t2)],[Math.sin(p1)*Math.cos(t2),Math.cos(p1),Math.sin(p1)*Math.sin(t2)]];
      verts.push(...p[0],...p[1],...p[2]); norms.push(...p[0],...p[1],...p[2]);
      verts.push(...p[0],...p[2],...p[3]); norms.push(...p[0],...p[2],...p[3]);
    }
  }
  g_sphereCount=verts.length/3;
  g_sphereVertBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,g_sphereVertBuf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
  g_sphereNormBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,g_sphereNormBuf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(norms),gl.STATIC_DRAW);
}

main();
