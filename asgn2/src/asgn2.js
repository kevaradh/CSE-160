
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec3 a_Normal;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotation;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'void main() {\n' +
  '  gl_Position = u_GlobalRotation * u_ModelMatrix * a_Position;\n' +
  '  v_Position  = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal    = normalize(vec3(u_NormalMatrix * vec4(a_Normal,0.0)));\n' +
  '}\n';

var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'void main() {\n' +
  '  vec3 lightDir = normalize(vec3(1.0, 2.0, 3.0));\n' +
  '  vec3 n        = normalize(v_Normal);\n' +
  '  float diff    = max(dot(n, lightDir), 0.0);\n' +
  '  vec3 base     = vec3(u_FragColor);\n' +
  '  vec3 col      = base * (0.50 + 0.60 * diff);\n' +
  '  col           = min(col, vec3(1.0));\n' +
  '  gl_FragColor  = vec4(col, u_FragColor.a);\n' +
  '}\n';

var canvas;
var gl;
var a_Position;
var a_Normal;
var u_ModelMatrix;
var u_GlobalRotation;
var u_NormalMatrix;
var u_FragColor;

var g_globalRotX = 10;
var g_globalRotY = 20;

var g_frontLegUpper = 0;
var g_frontLegLower = 0;
var g_frontLegHoof  = 0;

var g_FL_upper = 0; var g_FL_lower = 0; var g_FL_hoof = 0;
var g_FR_upper = 0; var g_FR_lower = 0; var g_FR_hoof = 0;
var g_BL_upper = 0; var g_BL_lower = 0; var g_BL_hoof = 0;
var g_BR_upper = 0; var g_BR_lower = 0; var g_BR_hoof = 0;

var g_neckAngle = 25;
var g_headAngle = -10;
var g_tailAngle = 0;
var g_tailTip   = 0;

var g_animating  = false;
var g_galloping  = false;
var g_animTime   = 0;
var g_lastTS     = null;
var g_gallopBob  = 0;

var g_blinkTimer = 0;
var g_blinkT     = 0;
var g_blinking   = false;

var g_poking    = false;
var g_pokeTime  = 0;
var g_pokeBodyY = 0;

var g_dragging   = false;
var g_lastMouseX = 0;
var g_lastMouseY = 0;

var g_frameCount  = 0;
var g_fpsInterval = 0;
var g_needsRedraw = true;

var g_cubeGeo;
var g_cylGeo;
var g_sphGeo;

var g_projMatrix   = new Matrix4();
var g_viewMatrix   = new Matrix4();
var g_rotMatrix    = new Matrix4();
var g_globalMatrix = new Matrix4();
var g_normalMatrix = new Matrix4();

var CLR = {
  body:  [0.76, 0.47, 0.22, 1.0],
  belly: [0.82, 0.55, 0.30, 1.0],
  dark:  [0.50, 0.28, 0.10, 1.0],
  mane:  [0.20, 0.10, 0.02, 1.0],
  hoof:  [0.15, 0.10, 0.08, 1.0],
  nose:  [0.85, 0.65, 0.52, 1.0],
  eye:   [0.05, 0.03, 0.01, 1.0],
  white: [1.00, 1.00, 1.00, 1.0],
  lid:   [0.68, 0.40, 0.16, 1.0],
};

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  buildGeometry();
  connectSliders();
  renderScene();
  g_lastTS = null;
  requestAnimationFrame(tick);
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = getWebGLContext(canvas);
  if (!gl) { console.log('Failed to get WebGL context'); return; }
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.53, 0.75, 0.88, 1.0);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders'); return;
  }
  a_Position       = gl.getAttribLocation (gl.program, 'a_Position');
  a_Normal         = gl.getAttribLocation (gl.program, 'a_Normal');
  u_ModelMatrix    = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  u_NormalMatrix   = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_FragColor      = gl.getUniformLocation(gl.program, 'u_FragColor');
}

function connectSliders() {
  function bind(id, fn) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function() {
      fn(+this.value);
      g_needsRedraw = true;
      renderScene();
    });
  }

  bind('rotateX', function(v) { g_globalRotX = v; });
  bind('rotateY', function(v) { g_globalRotY = v; });

  bind('frontLegUpper', function(v) {
    g_frontLegUpper = v; g_FL_upper = v; g_FR_upper = v;
  });
  bind('frontLegLower', function(v) {
    g_frontLegLower = v; g_FL_lower = v; g_FR_lower = v;
  });
  bind('frontLegHoof', function(v) {
    g_frontLegHoof = v; g_FL_hoof = v; g_FR_hoof = v;
  });
  bind('backLegUpper',  function(v) { g_BL_upper = v; g_BR_upper = v; });
  bind('backLegLower',  function(v) { g_BL_lower = v; g_BR_lower = v; });
  bind('backLegHoof',   function(v) { g_BL_hoof  = v; g_BR_hoof  = v; });
  bind('neckAngle',     function(v) { g_neckAngle = v; });
  bind('headAngle',     function(v) { g_headAngle = v; });
  bind('tailAngle',     function(v) { g_tailAngle = v; });
  bind('tailTip',       function(v) { g_tailTip   = v; });

  syncSlider('rotateX', g_globalRotX);
  syncSlider('rotateY', g_globalRotY);

  canvas.style.cursor = 'grab';
  canvas.addEventListener('mousedown', function(ev) {
    if (ev.shiftKey) {
      if (!g_poking) { g_poking = true; g_pokeTime = 0; g_needsRedraw = true; }
      return;
    }
    g_dragging = true;
    g_lastMouseX = ev.clientX; g_lastMouseY = ev.clientY;
    canvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', function() {
    g_dragging = false; canvas.style.cursor = 'grab';
  });
  window.addEventListener('mousemove', function(ev) {
    if (!g_dragging) return;
    var rect = canvas.getBoundingClientRect();
    g_globalRotY = ((ev.clientX - rect.left) / canvas.width  - 0.5) * 360;
    g_globalRotX = ((ev.clientY - rect.top)  / canvas.height - 0.5) * 178;
    g_globalRotX = Math.max(-89, Math.min(89, g_globalRotX));
    syncSlider('rotateX', g_globalRotX);
    syncSlider('rotateY', g_globalRotY);
    g_needsRedraw = true;
  });

  var btn = document.getElementById('animBtn');
  if (btn) {
    btn.addEventListener('click', function() {
      g_animating = !g_animating;
      if (g_animating) g_galloping = false;
      this.textContent = g_animating ? 'Stop Animation' : 'Start Animation';
      if (!g_animating) restoreStandingPose();
    });
  }

  var gallopBtn = document.getElementById('gallopBtn');
  if (gallopBtn) {
    gallopBtn.addEventListener('click', function() {
      g_galloping = !g_galloping;
      if (g_galloping) g_animating = false;
      this.textContent = g_galloping ? 'Stop Gallop' : 'Start Gallop';
      if (!g_galloping) restoreStandingPose();
    });
  }
}

function syncSlider(id, val) {
  var el = document.getElementById(id);
  if (el) el.value = val;
}

function restoreStandingPose() {
  g_FL_upper=0; g_FL_lower=0; g_FL_hoof=0;
  g_FR_upper=0; g_FR_lower=0; g_FR_hoof=0;
  g_BL_upper=0; g_BL_lower=0; g_BL_hoof=0;
  g_BR_upper=0; g_BR_lower=0; g_BR_hoof=0;
  g_neckAngle=25; g_headAngle=-10;
  g_tailAngle=0;  g_tailTip=0;
  g_pokeBodyY=0;  g_gallopBob=0;
  syncSlider('frontLegUpper',0); syncSlider('frontLegLower',0); syncSlider('frontLegHoof',0);
  syncSlider('backLegUpper', 0); syncSlider('backLegLower', 0); syncSlider('backLegHoof', 0);
  syncSlider('neckAngle', g_neckAngle);
  syncSlider('headAngle', g_headAngle);
  syncSlider('tailAngle', 0); syncSlider('tailTip', 0);
  renderScene();
}

function tick(timestamp) {
  if (g_lastTS === null) g_lastTS = timestamp;
  var dt = (timestamp - g_lastTS) / 1000;
  g_lastTS = timestamp;

  g_fpsInterval += dt;
  if (g_fpsInterval >= 1.0) {
    var el = document.getElementById('fpsDisplay');
    if (el) {
      var active = g_animating || g_galloping || g_blinking || g_poking;
      el.textContent = active
        ? 'FPS: ' + g_frameCount + ' | Rendering'
        : 'FPS: ' + g_frameCount + ' | Idle (optimized)';
    }
    g_frameCount = 0; g_fpsInterval = 0;
  }

  updateAnimationAngles(dt);

  if (g_needsRedraw || g_animating || g_galloping || g_blinking || g_poking) {
    renderScene();
    g_frameCount++;
    g_needsRedraw = false;
  }

  requestAnimationFrame(tick);
}

function updateAnimationAngles(dt) {

  g_blinkTimer += dt;
  if (!g_blinking && g_blinkTimer > 2.5) {
    g_blinking = true; g_blinkT = 0; g_blinkTimer = 0;
  }
  if (g_blinking) {
    g_blinkT += dt / 0.30;
    if (g_blinkT >= 1.0) { g_blinkT = 0; g_blinking = false; }
  }

  if (g_animating) {
    g_animTime += dt * 2.0;
    var t = g_animTime;

    g_FL_upper =  35 * Math.sin(t);
    g_FL_lower =  30 * Math.sin(t);
    g_FL_hoof  =  15 * Math.sin(t - 0.3);

    g_FR_upper =  35 * Math.sin(t + Math.PI);
    g_FR_lower =  30 * Math.sin(t + Math.PI);
    g_FR_hoof  =  15 * Math.sin(t + Math.PI - 0.3);

    g_BL_upper = -30 * Math.sin(t);
    g_BL_lower = -25 * Math.sin(t);
    g_BL_hoof  = -10 * Math.sin(t - 0.3);

    g_BR_upper = -30 * Math.sin(t + Math.PI);
    g_BR_lower = -25 * Math.sin(t + Math.PI);
    g_BR_hoof  = -10 * Math.sin(t + Math.PI - 0.3);

    g_neckAngle = 25 + 6  * Math.sin(t * 2);
    g_headAngle = -10 + 5 * Math.sin(t * 2 + 0.3);
    g_tailAngle = 18 * Math.sin(t * 1.5);
    g_tailTip   = 12 * Math.sin(t * 1.5 + 0.4);
  }

  if (g_galloping) {
    g_animTime += dt * 2.5;
    var t = g_animTime;

    var fUpper =  40 * Math.sin(t);
    var fLower = -55 * Math.max(0, Math.sin(t + 0.5));  
    var fHoof  = -30 * Math.max(0, Math.sin(t + 0.3));

    g_FL_upper = fUpper; g_FL_lower = fLower; g_FL_hoof = fHoof;
    g_FR_upper = fUpper; g_FR_lower = fLower; g_FR_hoof = fHoof;

    var bp     = t + Math.PI * 0.7;
    var bUpper = -38 * Math.sin(bp);
    var bLower =  60 * Math.max(0, Math.sin(bp + 0.5)); 
    var bHoof  =  28 * Math.max(0, Math.sin(bp + 0.3));

    g_BL_upper = bUpper; g_BL_lower = bLower; g_BL_hoof = bHoof;
    g_BR_upper = bUpper; g_BR_lower = bLower; g_BR_hoof = bHoof;

    g_neckAngle = 28 + 12 * Math.sin(t);
    g_headAngle = -5  + 10 * Math.sin(t + 0.3);
    g_tailAngle = 30  * Math.sin(t + Math.PI);
    g_tailTip   = 20  * Math.sin(t + Math.PI + 0.4);

    g_gallopBob = 0.08 * Math.abs(Math.sin(t));
  }

  if (g_poking) {
    g_pokeTime += dt * 0.6;
    var pt = g_pokeTime;

    if (pt <= 1.0) {
      if (pt < 0.15) {
        var p = pt / 0.15;
        g_FL_upper = -20*p; g_FL_lower = 25*p;
        g_FR_upper = -20*p; g_FR_lower = 25*p;
        g_BL_upper =  18*p; g_BL_lower = 15*p;
        g_BR_upper =  18*p; g_BR_lower = 15*p;
        g_neckAngle = 25 + 18*p;
        g_headAngle = -10 + 28*p;
        g_tailAngle = 20*p;
        g_pokeBodyY = -0.06*p;
      } else if (pt < 0.5) {
        var p = (pt - 0.15) / 0.35;
        g_FL_upper = -20 + (-55)*p; g_FL_lower = 25 + 55*p;
        g_FR_upper = -20 + (-55)*p; g_FR_lower = 25 + 55*p;
        g_BL_upper =  18 -   8*p;
        g_BR_upper =  18 -   8*p;
        g_neckAngle = 43 + 14*p;
        g_headAngle = 18 + 10*p;
        g_tailAngle = 20 + 18*p;
        g_pokeBodyY = -0.06 + 0.28*p;
      } else if (pt < 0.72) {
        var p = (pt - 0.5) / 0.22;
        var shake = 22 * Math.sin(p * Math.PI * 5);
        g_FL_upper = -75; g_FL_lower = 80;
        g_FR_upper = -75; g_FR_lower = 80;
        g_BL_upper = 10; g_BR_upper = 10;
        g_neckAngle = 57 + shake*0.3;
        g_headAngle = 28 + shake;
        g_tailAngle = 38 + 10*Math.sin(p*Math.PI*4);
        g_pokeBodyY = 0.22;
      } else {
        var p = (pt - 0.72) / 0.28;
        g_FL_upper = -75 + 75*p; g_FL_lower = 80 - 80*p;
        g_FR_upper = -75 + 75*p; g_FR_lower = 80 - 80*p;
        g_BL_upper = 10 - 10*p;  g_BR_upper = 10 - 10*p;
        g_neckAngle = 57 - 32*p;
        g_headAngle = 28 - 38*p;
        g_tailAngle = 38 - 38*p;
        g_pokeBodyY = 0.22 - 0.22*p;
      }
    } else {
      g_poking = false; g_pokeTime = 0; g_pokeBodyY = 0;
      restoreStandingPose();
    }
  }
}

function buildGeometry() {
  g_cubeGeo = buildCubeBuffers();
  g_cylGeo  = buildCylinderBuffers(14);
  g_sphGeo  = buildSphereBuffers(10, 16);
}

function buildCubeBuffers() {
  var positions = new Float32Array([
    -1,-1, 1,  1,-1, 1,  1, 1, 1, -1, 1, 1,
     1,-1,-1, -1,-1,-1, -1, 1,-1,  1, 1,-1,
    -1, 1,-1,  1, 1,-1,  1, 1, 1, -1, 1, 1,
    -1,-1, 1,  1,-1, 1,  1,-1,-1, -1,-1,-1,
     1,-1, 1,  1,-1,-1,  1, 1,-1,  1, 1, 1,
    -1,-1,-1, -1,-1, 1, -1, 1, 1, -1, 1,-1,
  ]);
  var normals = new Float32Array([
     0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
     0, 0,-1,  0, 0,-1,  0, 0,-1,  0, 0,-1,
     0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
     0,-1, 0,  0,-1, 0,  0,-1, 0,  0,-1, 0,
     1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
  ]);
  var indices = new Uint16Array([
     0, 1, 2,  0, 2, 3,   4, 5, 6,  4, 6, 7,
     8, 9,10,  8,10,11,  12,13,14, 12,14,15,
    16,17,18, 16,18,19,  20,21,22, 20,22,23,
  ]);
  return makeGeoBuffers(positions, normals, indices);
}

function buildCylinderBuffers(segs) {
  var pos=[], nrm=[], idx=[];
  for (var i=0; i<segs; i++) {
    var a0=(i/segs)*Math.PI*2, a1=((i+1)/segs)*Math.PI*2;
    var c0=Math.cos(a0), s0=Math.sin(a0), c1=Math.cos(a1), s1=Math.sin(a1);
    var b=pos.length/3;
    pos.push(c0,s0,-1, c1,s1,-1, c1,s1,1, c0,s0,1);
    nrm.push(c0,s0,0,  c1,s1,0,  c1,s1,0, c0,s0,0);
    idx.push(b,b+1,b+2, b,b+2,b+3);
    var bb=pos.length/3;
    pos.push(0,0,-1, c0,s0,-1, c1,s1,-1);
    nrm.push(0,0,-1, 0,0,-1, 0,0,-1);
    idx.push(bb,bb+1,bb+2);
    var bt=pos.length/3;
    pos.push(0,0,1, c1,s1,1, c0,s0,1);
    nrm.push(0,0,1, 0,0,1, 0,0,1);
    idx.push(bt,bt+1,bt+2);
  }
  return makeGeoBuffers(new Float32Array(pos), new Float32Array(nrm), new Uint16Array(idx));
}

function buildSphereBuffers(lat, lon) {
  var pos=[], nrm=[], idx=[];
  for (var i=0; i<=lat; i++) {
    var th=(i/lat)*Math.PI, st=Math.sin(th), ct=Math.cos(th);
    for (var j=0; j<=lon; j++) {
      var ph=(j/lon)*2*Math.PI, x=st*Math.cos(ph), y=ct, z=st*Math.sin(ph);
      pos.push(x,y,z); nrm.push(x,y,z);
    }
  }
  for (var i=0; i<lat; i++) for (var j=0; j<lon; j++) {
    var a=i*(lon+1)+j;
    idx.push(a,a+1,a+lon+1, a+1,a+lon+2,a+lon+1);
  }
  return makeGeoBuffers(new Float32Array(pos), new Float32Array(nrm), new Uint16Array(idx));
}

function makeGeoBuffers(positions, normals, indices) {
  function buf(type, data) {
    var b=gl.createBuffer(); gl.bindBuffer(type,b); gl.bufferData(type,data,gl.STATIC_DRAW); return b;
  }
  return { vbo:buf(gl.ARRAY_BUFFER,positions), nbo:buf(gl.ARRAY_BUFFER,normals),
           ibo:buf(gl.ELEMENT_ARRAY_BUFFER,indices), count:indices.length };
}

function drawCube(M, color)     { if (color) setColor(color); drawGeo(g_cubeGeo, M); }
function drawCylinder(M, color) { if (color) setColor(color); drawGeo(g_cylGeo,  M); }
function drawSphere(M, color)   { if (color) setColor(color); drawGeo(g_sphGeo,  M); }

function drawGeo(geo, M) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);
  g_normalMatrix.setInverseOf(M); g_normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
  gl.bindBuffer(gl.ARRAY_BUFFER, geo.vbo);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.bindBuffer(gl.ARRAY_BUFFER, geo.nbo);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geo.ibo);
  gl.drawElements(gl.TRIANGLES, geo.count, gl.UNSIGNED_SHORT, 0);
}

function setColor(c) { gl.uniform4f(u_FragColor, c[0], c[1], c[2], c[3]); }

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var bodyY = g_pokeBodyY + g_gallopBob;

  g_projMatrix.setPerspective(45, canvas.width / canvas.height, 0.1, 100);
  g_viewMatrix.setLookAt(0, 0, 8,  0, 0, 0,  0, 1, 0);
  g_rotMatrix.setTranslate(0, bodyY, 0);
  g_rotMatrix.rotate(g_globalRotX, 1, 0, 0);
  g_rotMatrix.rotate(g_globalRotY, 0, 1, 0);
  g_globalMatrix.set(g_projMatrix);
  g_globalMatrix.multiply(g_viewMatrix);
  g_globalMatrix.multiply(g_rotMatrix);

  gl.uniformMatrix4fv(u_GlobalRotation, false, g_globalMatrix.elements);
  drawHorse();
}

function drawHorse() {
  var M;

  M = new Matrix4(); M.setTranslate(0.35, 0.05, 0);
  M.rotate(6, 0, 0, 1); M.scale(0.55, 0.46, 0.38);
  drawCube(M, CLR.body);

  M = new Matrix4(); M.setTranslate(-0.22, -0.02, 0);
  M.scale(0.52, 0.42, 0.40);
  drawCube(M, CLR.body);

  M = new Matrix4(); M.setTranslate(-0.82, 0.08, 0);
  M.rotate(-10, 0, 0, 1); M.scale(0.40, 0.44, 0.37);
  drawCube(M, CLR.body);

  M = new Matrix4(); M.setTranslate(0.72, 0.35, 0);
  M.rotate(15, 0, 0, 1); M.scale(0.22, 0.20, 0.32);
  drawCube(M, CLR.body);

  M = new Matrix4(); M.setTranslate(0.0, -0.48, 0);
  M.scale(0.80, 0.14, 0.34);
  drawSphere(M, CLR.belly);

  var neckPivot = new Matrix4();
  neckPivot.setTranslate(0.88, 0.32, 0);
  neckPivot.rotate(-g_neckAngle, 0, 0, 1);

  M = new Matrix4(neckPivot); M.translate(0.10, 0.22, 0);
  M.rotate(-8, 0, 0, 1); M.scale(0.18, 0.34, 0.18);
  drawCube(M, CLR.body);

  M = new Matrix4(neckPivot); M.translate(0.22, 0.52, 0);
  M.rotate(5, 0, 0, 1); M.scale(0.14, 0.26, 0.15);
  drawCube(M, CLR.body);

  var headPivot = new Matrix4(neckPivot);
  headPivot.translate(0.30, 0.75, 0);
  headPivot.rotate(g_headAngle, 0, 0, 1);

  M = new Matrix4(headPivot); M.translate(0.10, 0.10, 0);
  M.scale(0.22, 0.20, 0.16);
  drawCube(M, CLR.body);

  M = new Matrix4(headPivot); M.translate(0.28, -0.02, 0);
  M.rotate(12, 0, 0, 1); M.scale(0.20, 0.16, 0.14);
  drawCube(M, CLR.body);

  var muzzlePivot = new Matrix4(headPivot);
  muzzlePivot.translate(0.50, -0.12, 0);
  muzzlePivot.rotate(10, 0, 0, 1);

  M = new Matrix4(muzzlePivot); M.scale(0.16, 0.12, 0.12);
  drawCube(M, CLR.nose);

  for (var ns=-1; ns<=1; ns+=2) {
    M = new Matrix4(muzzlePivot); M.translate(0.14,-0.04,ns*0.07); M.scale(0.04,0.035,0.035);
    drawSphere(M, CLR.dark);
  }

  var lidScale = Math.sin(g_blinkT * Math.PI);
  for (var es=-1; es<=1; es+=2) {
    var ez = es * 0.195;
    M = new Matrix4(headPivot); M.translate(0.09,0.11,ez);       M.scale(0.055,0.055,0.010); drawCube(M,[0,0,0,1]);
    M = new Matrix4(headPivot); M.translate(0.09,0.11,ez+es*0.010); M.scale(0.042,0.042,0.010); drawCube(M,[1,1,1,1]);
    M = new Matrix4(headPivot); M.translate(0.09,0.11,ez+es*0.020); M.scale(0.018,0.022,0.010); drawCube(M,[0,0,0,1]);
    var lidH=0.008+0.055*lidScale, lidY=0.155-0.044*lidScale;
    M = new Matrix4(headPivot); M.translate(0.09,lidY,ez+es*0.025); M.scale(0.055,lidH,0.012);
    drawCube(M,[0.35,0.18,0.05,1]);
  }

  for (var ear=-1; ear<=1; ear+=2) {
    M = new Matrix4(headPivot); M.translate(0.04,0.30,ear*0.10);
    M.rotate(ear*12,1,0,0); M.rotate(-5,0,0,1); M.scale(0.045,0.18,0.04);
    drawCube(M, CLR.dark);
    M = new Matrix4(headPivot); M.translate(0.05,0.28,ear*0.08);
    M.rotate(ear*12,1,0,0); M.rotate(-5,0,0,1); M.scale(0.030,0.13,0.025);
    drawCube(M, CLR.nose);
  }

  for (var mi=0; mi<6; mi++) {
    M = new Matrix4(neckPivot); M.translate(mi*0.10+0.02, 0.40+mi*0.06, -0.06);
    M.rotate(12-mi*5,0,0,1); M.scale(0.055,0.20-mi*0.015,0.042);
    drawCube(M, CLR.mane);
  }

  var tailBase = new Matrix4();
  tailBase.setTranslate(-1.18, 0.22, 0);
  tailBase.rotate(g_tailAngle + 30, 0, 0, 1);

  M = new Matrix4(tailBase); M.translate(-0.12,0.14,0); M.scale(0.10,0.28,0.08);
  drawCube(M, CLR.mane);

  var tailMid = new Matrix4(tailBase);
  tailMid.translate(-0.10, 0.30, 0);
  tailMid.rotate(g_tailTip + 20, 0, 0, 1);

  M = new Matrix4(tailMid); M.translate(-0.10,0.16,0); M.scale(0.08,0.24,0.065);
  drawCube(M, CLR.mane);

  var tailTipM = new Matrix4(tailMid);
  tailTipM.translate(-0.08, 0.34, 0);
  tailTipM.rotate(g_tailTip*0.6+15, 0, 0, 1);

  M = new Matrix4(tailTipM); M.translate(-0.06,0.12,0); M.scale(0.055,0.18,0.050);
  drawCube(M, CLR.mane);

  for (var ts=-1; ts<=1; ts+=2) {
    M = new Matrix4(tailTipM); M.translate(-0.04,0.14,ts*0.04);
    M.rotate(ts*8,1,0,0); M.scale(0.040,0.14,0.035);
    drawCube(M, CLR.mane);
  }

  var legs = [
    [ 0.62, -0.32, g_FL_upper, g_FL_lower, g_FL_hoof, true  ],
    [ 0.62,  0.32, g_FR_upper, g_FR_lower, g_FR_hoof, true  ],
    [-0.62, -0.32, g_BL_upper, g_BL_lower, g_BL_hoof, false ],
    [-0.62,  0.32, g_BR_upper, g_BR_lower, g_BR_hoof, false ],
  ];

  for (var li=0; li<legs.length; li++) {
    var bx=legs[li][0], bz=legs[li][1];
    var upperA=legs[li][2], lowerA=legs[li][3], hoofA=legs[li][4];
    var isFront=legs[li][5];

    var hip = new Matrix4();
    hip.setTranslate(bx, -0.40, bz);
    hip.rotate(isFront ? 8 : -8, 0, 0, 1);
    hip.rotate(upperA, 0, 0, 1);

    M = new Matrix4(hip); M.translate(0,-0.24,0); M.rotate(90,1,0,0); M.scale(0.10,0.10,0.24);
    drawCylinder(M, CLR.body);

    M = new Matrix4(hip); M.translate(0,-0.48,0); M.scale(0.11,0.11,0.11);
    drawSphere(M, CLR.dark);

    var knee = new Matrix4(hip);
    knee.translate(0, -0.48, 0);
    knee.rotate(lowerA, 0, 0, 1);

    M = new Matrix4(knee); M.translate(0,-0.22,0); M.rotate(90,1,0,0); M.scale(0.072,0.072,0.22);
    drawCylinder(M, CLR.dark);

    M = new Matrix4(knee); M.translate(0,-0.44,0); M.scale(0.085,0.085,0.085);
    drawSphere(M, CLR.dark);

    var ankle = new Matrix4(knee);
    ankle.translate(0, -0.44, 0);
    ankle.rotate(hoofA, 0, 0, 1);

    M = new Matrix4(ankle); M.translate(0,-0.045,0); M.scale(0.095,0.055,0.13);
    drawCube(M, CLR.hoof);
  }
}
