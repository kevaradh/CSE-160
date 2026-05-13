// ============================================================
//  Assignment 3 – Virtual World
//  Following Matsuda Chapter 5 (Textures) and Chapter 7 (Camera)
// ============================================================

// ── Step 5 (Matsuda p.179-181) ────────────────────────────────
// Vertex shader with all three matrices as uniforms
// gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +       // Step 1: position attribute
  'attribute vec2 a_TexCoord;\n' +       // Step 1: UV/texture coordinate attribute
  'uniform mat4 u_ModelMatrix;\n' +      // Step 5: model matrix
  'uniform mat4 u_ViewMatrix;\n' +       // Step 5: view matrix
  'uniform mat4 u_ProjectionMatrix;\n' + // Step 5: projection matrix
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  // Step 5: exactly as Matsuda PerspectiveView_mvp
  '  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +       // Step 1: pass UV to fragment shader
  '}\n';

// ── Step 3 & 4 (Matsuda p.179-181) ───────────────────────────
// Multiple textures (Matsuda p.183)
// u_whichTexture: 0=base color only, 1=brick texture, 2=grass texture
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform sampler2D u_Sampler0;\n' +       // brick texture
  'uniform sampler2D u_Sampler1;\n' +       // grass texture
  'uniform vec4 u_BaseColor;\n' +
  'uniform float u_texColorWeight;\n' +
  'uniform int u_whichTexture;\n' +         // which texture to use
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  vec4 texColor;\n' +
  '  if (u_whichTexture == 1) {\n' +
  '    texColor = texture2D(u_Sampler0, v_TexCoord);\n' +  // brick
  '  } else if (u_whichTexture == 2) {\n' +
  '    texColor = texture2D(u_Sampler1, v_TexCoord);\n' +  // grass
  '  } else {\n' +
  '    texColor = u_BaseColor;\n' +
  '  }\n' +
  '  gl_FragColor = (1.0 - u_texColorWeight) * u_BaseColor + u_texColorWeight * texColor;\n' +
  '}\n';

// ── Globals ───────────────────────────────────────────────────
var gl;
var camera;
var controls;
var g_texture;
var g_texture1;
var g_cubeVertBuf = null;
var g_cubeUVBuf   = null;
var g_a_Position  = -1;
var g_a_TexCoord  = -1;
var g_cubeMatrix  = null;
var u_ModelMatrix_loc, u_ViewMatrix_loc, u_ProjectionMatrix_loc;
var u_Sampler0_loc, u_Sampler1_loc;
var u_BaseColor_loc, u_texColorWeight_loc, u_whichTexture_loc;

// ── Step 10: 32x32 world map ──────────────────────────────────
// Each value = wall height (0=empty, 1-4=wall height)
var g_map = [
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,1,2,3,4,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,4,1,2,0,0,0,4],
  [4,0,0,3,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,4],
  [4,0,0,3,0,0,0,4,0,0,0,1,0,0,0,0,0,0,0,0,2,0,0,3,0,0,0,4,0,0,0,4],
  [4,0,0,1,2,3,4,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,4,1,2,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,3,0,0,0,4,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,3,4,0,0,1,2,3,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,4,1,0,0,2,3,4,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,1,2,3,4,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,4,1,2,0,0,0,4],
  [4,0,0,3,0,0,0,4,0,0,0,1,0,0,0,0,0,0,0,0,2,0,0,3,0,0,0,4,0,0,0,4],
  [4,0,0,1,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,4,0,0,0,4],
  [4,0,0,1,2,0,3,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,1,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,2,0,0,0,3,0,0,0,0,4,0,0,0,1,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,2,3,0,0,4,1,2,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,3,4,0,0,1,2,3,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,4,1,2,3,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,0,0,0,0,4],
  [4,0,0,1,0,0,0,2,0,0,0,3,0,0,0,0,0,0,0,4,0,0,0,1,0,0,2,0,0,0,0,4],
  [4,0,0,3,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,2,0,0,0,0,4],
  [4,0,0,3,4,1,2,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,1,2,3,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,0,2,0,0,0,3,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
];

// ── Bird's eye view toggle ────────────────────────────────────
var g_birdseye  = false;

// ── Auto-walk globals ─────────────────────────────────────────
var g_autoWalk  = true;   // auto moves + WASD also works
var g_autoSpeed = 0.5;
var g_turnTimer = 0;
var g_turning   = false;
var g_turnDir   = 1;

// ============================================================
//  main()
// ============================================================
function main() {
  var canvas = document.getElementById('webgl');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  gl = getWebGLContext(canvas);
  if (!gl) { console.log('Failed to get WebGL context'); return; }
  gl.enable(gl.DEPTH_TEST);

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to init shaders'); return;
  }

  camera   = new Camera();
  controls = new Controls(camera);
  initTexture();

  u_ModelMatrix_loc      = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix_loc       = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix_loc = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_Sampler0_loc         = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1_loc         = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_BaseColor_loc        = gl.getUniformLocation(gl.program, 'u_BaseColor');
  u_texColorWeight_loc   = gl.getUniformLocation(gl.program, 'u_texColorWeight');
  u_whichTexture_loc     = gl.getUniformLocation(gl.program, 'u_whichTexture');

  var verts = new Float32Array([
    -0.5,0.5,0.5,-0.5,-0.5,0.5,0.5,-0.5,0.5,-0.5,0.5,0.5,0.5,-0.5,0.5,0.5,0.5,0.5,
     0.5,0.5,-0.5,0.5,-0.5,-0.5,-0.5,-0.5,-0.5,0.5,0.5,-0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,
    -0.5,0.5,-0.5,-0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,0.5,
     0.5,0.5,0.5,0.5,-0.5,0.5,0.5,-0.5,-0.5,0.5,0.5,0.5,0.5,-0.5,-0.5,0.5,0.5,-0.5,
    -0.5,0.5,-0.5,-0.5,0.5,0.5,0.5,0.5,0.5,-0.5,0.5,-0.5,0.5,0.5,0.5,0.5,0.5,-0.5,
    -0.5,-0.5,0.5,-0.5,-0.5,-0.5,0.5,-0.5,-0.5,-0.5,-0.5,0.5,0.5,-0.5,-0.5,0.5,-0.5,0.5,
  ]);
  var uvs = new Float32Array([
    0,1,0,0,1,0,0,1,1,0,1,1, 0,1,0,0,1,0,0,1,1,0,1,1,
    0,1,0,0,1,0,0,1,1,0,1,1, 0,1,0,0,1,0,0,1,1,0,1,1,
    0,1,0,0,1,0,0,1,1,0,1,1, 0,1,0,0,1,0,0,1,1,0,1,1,
  ]);
  g_cubeVertBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeVertBuf);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  g_cubeUVBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeUVBuf);
  gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
  g_a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  g_a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  g_cubeMatrix = new Matrix4();

  window.addEventListener('resize', function() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    camera.updateProjection(canvas.width / canvas.height);
  });

  document.addEventListener('keydown', function(ev) {
    if (ev.key === 'b' || ev.key === 'B') {
      g_birdseye = !g_birdseye;
    }
    // F key — add block in front of horse
    if (ev.key === 'f' || ev.key === 'F') {
      var afX = Math.cos(g_horseAngle);
      var afZ = Math.sin(g_horseAngle);
      var acol = Math.floor(g_horseX + afX * 1.5);
      var arow = Math.floor(g_horseZ + afZ * 1.5);
      if (acol > 0 && acol < 31 && arow > 0 && arow < 31) {
        g_map[arow][acol] = Math.min((g_map[arow][acol] || 0) + 1, 4);
        var heightNames = ['', 'Sandy (1)', 'Brick (2)', 'Dark Red (3)', 'Dark Brown (4)'];
        document.getElementById('fps').textContent =
          'Added: ' + heightNames[g_map[arow][acol]] + ' | FPS: ' + g_fps;
      }
    }
    // G key — delete block in front of horse
    if (ev.key === 'g' || ev.key === 'G') {
      var dfX = Math.cos(g_horseAngle);
      var dfZ = Math.sin(g_horseAngle);
      // Check multiple distances to find nearby block
      for (var dist = 1; dist <= 3; dist++) {
        var dcol = Math.floor(g_horseX + dfX * dist);
        var drow = Math.floor(g_horseZ + dfZ * dist);
        if (dcol > 0 && dcol < 31 && drow > 0 && drow < 31 && g_map[drow][dcol] > 0) {
          g_map[drow][dcol] = Math.max(g_map[drow][dcol] - 1, 0);
          console.log('Deleted block at col=' + dcol + ' row=' + drow + ' h=' + g_map[drow][dcol]);
          break;  // only delete one block per keypress
        }
      }
    }
  });

  requestAnimationFrame(tick);
}

// ── initTexture() ─────────────────────────────────────────────
function initTexture() {
  var size = 256;
  var c = document.createElement('canvas');
  c.width = size; c.height = size;
  var ctx = c.getContext('2d');

  ctx.fillStyle = '#A0522D';
  ctx.fillRect(0, 0, size, size);

  var blockSize = 8;
  for (var py = 0; py < size; py += blockSize) {
    for (var px = 0; px < size; px += blockSize) {
      var r = 140 + Math.floor(Math.random() * 70);
      var g = 70  + Math.floor(Math.random() * 40);
      var b = 20  + Math.floor(Math.random() * 20);
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.fillRect(px, py, blockSize, blockSize);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  for (var y = 0; y < size; y += blockSize * 4) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(size,y); ctx.stroke();
  }
  for (var x = 0; x < size; x += blockSize * 4) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,size); ctx.stroke();
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  g_texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, g_texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  var c2 = document.createElement('canvas');
  c2.width = 256; c2.height = 256;
  var ctx2 = c2.getContext('2d');
  for (var py = 0; py < 256; py += blockSize) {
    for (var px = 0; px < 256; px += blockSize) {
      var r = 40  + Math.floor(Math.random() * 30);
      var g = 120 + Math.floor(Math.random() * 60);
      var b = 20  + Math.floor(Math.random() * 20);
      ctx2.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx2.fillRect(px, py, blockSize, blockSize);
    }
  }
  g_texture1 = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, g_texture1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c2);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
}

// ── Horse path waypoints through the village ─────────────────
var g_waypoints = [
  [16, 24],  // start south center
  [16, 19],  // north — clear of bridge walls
  [16, 16],  // center
  [16, 13],  // north center
  [13, 13],  // left north
  [11, 16],  // left middle — clear of buildings
  [11, 19],  // left south
  [13, 24],  // south left
  [16, 24],  // back south center
  [19, 24],  // south right
  [21, 19],  // right south — clear of buildings
  [21, 16],  // right middle
  [21, 13],  // right north
  [19, 13],  // back north
  [16, 13],  // center north
  [16, 16],  // center — loops
];
var g_wpIndex    = 0;
var g_horseSpeed = 4.0;  // units per second
var g_jumpHeight = 0;    // current jump height
var g_jumping    = false;
var g_jumpTimer  = 0;

function updateHorse(dt) {
  if (g_waypoints.length === 0) return;

  // Force skip up to 5 waypoints if blocked
  for (var skip = 0; skip < 5; skip++) {
    var target = g_waypoints[g_wpIndex];
    var tx = target[0], tz = target[1];
    var dx = tx - g_horseX;
    var dz = tz - g_horseZ;
    var dist = Math.sqrt(dx*dx + dz*dz);
    if (dist > 0.3) break;  // not at waypoint yet, proceed
    g_wpIndex = (g_wpIndex + 1) % g_waypoints.length;
  }

  var target = g_waypoints[g_wpIndex];
  var tx = target[0], tz = target[1];
  var dx = tx - g_horseX;
  var dz = tz - g_horseZ;
  var dist = Math.sqrt(dx*dx + dz*dz);

  if (dist > 0.01) g_horseAngle = Math.atan2(dz, dx);

  if (dist < 0.3) {
    g_wpIndex = (g_wpIndex + 1) % g_waypoints.length;
  } else {
    var speed = g_horseSpeed * dt;
    var nx = g_horseX + (dx/dist) * speed;
    var nz = g_horseZ + (dz/dist) * speed;

    var hitWall = isBlockedForHorse(nx, nz);
    if (!hitWall) {
      g_horseX = nx;
      g_horseZ = nz;
    } else {
      var nxOnly = g_horseX + (dx/dist) * speed;
      if (!isBlockedForHorse(nxOnly, g_horseZ)) {
        g_horseX = nxOnly;
      } else {
        var nzOnly = g_horseZ + (dz/dist) * speed;
        if (!isBlockedForHorse(g_horseX, nzOnly)) {
          g_horseZ = nzOnly;
        } else {
          // Completely stuck — skip next waypoint
          g_wpIndex = (g_wpIndex + 1) % g_waypoints.length;
        }
      }
    }
  }

  // Jump when near a hurdle (height 1 walls)
  g_jumpTimer += dt;
  var col = Math.floor(g_horseX);
  var row = Math.floor(g_horseZ);
  if (col >= 0 && col < 32 && row >= 0 && row < 32) {
    if (g_map[row][col] === 1 && !g_jumping) {
      g_jumping   = true;
      g_jumpTimer = 0;
    }
  }

  // Jump arc
  if (g_jumping) {
    g_jumpHeight = 0.8 * Math.sin(g_jumpTimer * Math.PI * 2.0);
    if (g_jumpTimer > 0.5) {
      g_jumping    = false;
      g_jumpHeight = 0;
    }
  }

  g_horseTime += dt * 3.0;
}

// ── Horse animation state ─────────────────────────────────────
var g_horseTime  = 0;
var g_horseX     = 16;
var g_horseZ     = 24;   // matches first waypoint
var g_horseAngle = -Math.PI / 2;  // facing north

// Horse colors
var HCLR = {
  body:  [0.76, 0.47, 0.22, 1.0],
  dark:  [0.50, 0.28, 0.10, 1.0],
  mane:  [0.20, 0.10, 0.02, 1.0],
  hoof:  [0.15, 0.10, 0.08, 1.0],
  nose:  [0.85, 0.65, 0.52, 1.0],
};

function drawHorseInWorld(u_ModelMatrix, dt) {
  // Use global horse position updated in tick()
  var t = g_horseTime;

  // Leg angles — walk cycle
  var FL =  35 * Math.sin(t);
  var FR =  35 * Math.sin(t + Math.PI);
  var BL = -30 * Math.sin(t);
  var BR = -30 * Math.sin(t + Math.PI);

  // Build horse world transform
  var horseWorld = new Matrix4();
  horseWorld.setTranslate(g_horseX, g_jumpHeight, g_horseZ);
  horseWorld.rotate((-g_horseAngle * 180 / Math.PI), 0, 1, 0);
  horseWorld.scale(0.5, 0.5, 0.5);  // scale down to fit world

  function hDrawCube(local, color) {
    var final = new Matrix4(horseWorld);
    final.multiply(local);
    gl.uniformMatrix4fv(u_ModelMatrix, false, final.elements);
    gl.uniform4fv(u_BaseColor_loc, color);
    gl.uniform1f(u_texColorWeight_loc, 0.0);
    gl.uniform1i(u_whichTexture_loc, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeVertBuf);
    gl.vertexAttribPointer(g_a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(g_a_Position);
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeUVBuf);
    gl.vertexAttribPointer(g_a_TexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(g_a_TexCoord);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }

  // ── Body ─────────────────────────────────────────────────────
  var M = new Matrix4(); M.setTranslate(0, 0.6, 0); M.scale(1.4, 0.55, 0.55);
  hDrawCube(M, HCLR.body);

  // ── Belly ─────────────────────────────────────────────────────
  M = new Matrix4(); M.setTranslate(0, 0.42, 0); M.scale(1.0, 0.2, 0.45);
  hDrawCube(M, HCLR.nose);

  // ── Neck ─────────────────────────────────────────────────────
  M = new Matrix4(); M.setTranslate(0.55, 0.85, 0); M.rotate(-40,0,0,1); M.scale(0.22, 0.65, 0.22);
  hDrawCube(M, HCLR.body);

  // ── Mane along neck ──────────────────────────────────────────
  for (var mi = 0; mi < 6; mi++) {
    M = new Matrix4();
    M.setTranslate(0.45 + mi*0.07, 1.0 + mi*0.07, -0.09);
    M.rotate(15 - mi*4, 0, 0, 1);
    M.scale(0.055, 0.18 - mi*0.01, 0.045);
    hDrawCube(M, HCLR.mane);
  }

  // ── Head ─────────────────────────────────────────────────────
  M = new Matrix4(); M.setTranslate(0.85, 1.35, 0); M.scale(0.30, 0.25, 0.22);
  hDrawCube(M, HCLR.body);

  // ── Nose/muzzle ──────────────────────────────────────────────
  M = new Matrix4(); M.setTranslate(1.10, 1.18, 0); M.scale(0.22, 0.16, 0.16);
  hDrawCube(M, HCLR.nose);

  // ── Eyes ─────────────────────────────────────────────────────
  for (var es = -1; es <= 1; es += 2) {
    M = new Matrix4(); M.setTranslate(0.88, 1.42, es*0.12); M.scale(0.06,0.06,0.04);
    hDrawCube(M, [0,0,0,1]);
  }

  // ── Ears ─────────────────────────────────────────────────────
  for (var ear = -1; ear <= 1; ear += 2) {
    M = new Matrix4(); M.setTranslate(0.78, 1.60, ear*0.09);
    M.rotate(ear*10, 1, 0, 0); M.scale(0.05, 0.18, 0.04);
    hDrawCube(M, HCLR.dark);
  }

  // ── Legs — 4 legs with walk animation ────────────────────────
  var legs = [
    [0.35, -0.32, FL], [0.35, 0.32, FR],
    [-0.35, -0.32, BL], [-0.35, 0.32, BR]
  ];
  for (var i = 0; i < legs.length; i++) {
    var lx = legs[i][0], lz = legs[i][1], angle = legs[i][2];
    // Upper leg
    var hip = new Matrix4();
    hip.setTranslate(lx, 0.2, lz);
    hip.rotate(angle, 0, 0, 1);
    var ul = new Matrix4(hip); ul.translate(0, -0.2, 0); ul.scale(0.12, 0.4, 0.12);
    hDrawCube(ul, HCLR.body);
    // Lower leg
    var knee = new Matrix4(hip); knee.translate(0, -0.4, 0);
    var ll = new Matrix4(knee); ll.translate(0, -0.18, 0); ll.scale(0.10, 0.36, 0.10);
    hDrawCube(ll, HCLR.dark);
    // Hoof
    var hoof = new Matrix4(knee); hoof.translate(0, -0.38, 0); hoof.scale(0.13, 0.08, 0.15);
    hDrawCube(hoof, HCLR.hoof);
  }

  // ── Tail — longer with wag animation ─────────────────────────
  var wagAngle = 25 * Math.sin(t * 2.0);  // wag side to side
  var tailBase = new Matrix4();
  tailBase.setTranslate(-0.68, 0.6, 0);
  tailBase.rotate(35, 0, 0, 1);           // base angle up
  tailBase.rotate(wagAngle, 1, 0, 0);     // wag left/right

  // Tail segment 1
  var t1 = new Matrix4(tailBase);
  t1.translate(0, 0.2, 0); t1.scale(0.09, 0.35, 0.09);
  hDrawCube(t1, HCLR.mane);

  // Tail segment 2 — droops down
  var tail2 = new Matrix4(tailBase);
  tail2.translate(0, 0.38, 0);
  tail2.rotate(-30, 0, 0, 1);
  var t2 = new Matrix4(tail2);
  t2.translate(0, 0.18, 0); t2.scale(0.08, 0.32, 0.08);
  hDrawCube(t2, HCLR.mane);

  // Tail segment 3 — tip
  var tail3 = new Matrix4(tail2);
  tail3.translate(0, 0.35, 0);
  tail3.rotate(-25, 0, 0, 1);
  var t3 = new Matrix4(tail3);
  t3.translate(0, 0.15, 0); t3.scale(0.07, 0.28, 0.07);
  hDrawCube(t3, HCLR.dark);
}

// Tree positions — kept away from horse path
var g_treePositions = [[4,4],[27,4],[4,27],[27,27],[6,16],[26,16]];

function isBlockedForHorse(x, z) {
  // Check map walls
  var col = Math.floor(x);
  var row = Math.floor(z);
  if (col < 0 || col >= 32 || row < 0 || row >= 32) return true;
  if (g_map[row][col] > 0) return true;
  // Check trees
  for (var i = 0; i < g_treePositions.length; i++) {
    var dx = x - g_treePositions[i][0];
    var dz = z - g_treePositions[i][1];
    if (Math.sqrt(dx*dx + dz*dz) < 0.8) return true;
  }
  return false;
}



// Grass patches — horse eats them
var g_grassPatches = [
  {x:12, z:12, alive:true},
  {x:14, z:14, alive:true},
  {x:18, z:12, alive:true},
  {x:20, z:16, alive:true},
  {x:12, z:20, alive:true},
  {x:18, z:22, alive:true},
  {x:10, z:16, alive:true},
  {x:22, z:10, alive:true},
];
var g_fpsCount    = 0;
var g_fpsLastTime = 0;
var g_fps         = 0;

function updateFPS(now) {
  g_fpsCount++;
  if (now - g_fpsLastTime >= 1.0) {
    g_fps         = g_fpsCount;
    g_fpsCount    = 0;
    g_fpsLastTime = now;
    document.getElementById('fps').textContent = 'FPS: ' + g_fps;
  }
}

// ── tick() ────────────────────────────────────────────────────
var g_lastTime2 = 0;

function tick() {
  var now = performance.now() / 1000;
  var dt = now - g_lastTime2;
  g_lastTime2 = now;
  if (dt > 0.1) dt = 0.1;

  // Update horse along waypoint path
  updateHorse(dt);

  // Camera follows horse — only when not dragging mouse
  if (!controls.dragging) {
    var camDist   = 4.0;
    var camHeight = 1.2;
    var behindX   = g_horseX - camDist * Math.cos(g_horseAngle);
    var behindZ   = g_horseZ - camDist * Math.sin(g_horseAngle);
    camera.eye.elements[0] = behindX;
    camera.eye.elements[1] = camHeight + g_jumpHeight;
    camera.eye.elements[2] = behindZ;
    camera.at.elements[0] = g_horseX + 1.5 * Math.cos(g_horseAngle);
    camera.at.elements[1] = 0.6 + g_jumpHeight * 0.3;
    camera.at.elements[2] = g_horseZ + 1.5 * Math.sin(g_horseAngle);
  }

  // Horse eats nearby grass
  for (var gi = 0; gi < g_grassPatches.length; gi++) {
    if (!g_grassPatches[gi].alive) continue;
    var gdx = g_horseX - g_grassPatches[gi].x;
    var gdz = g_horseZ - g_grassPatches[gi].z;
    if (Math.sqrt(gdx*gdx + gdz*gdz) < 1.0) {
      g_grassPatches[gi].alive = false;
      (function(patch) {
        setTimeout(function() { patch.alive = true; }, 10000);
      })(g_grassPatches[gi]);
    }
  }

  camera.updateView();
  controls.update();
  updateFPS(now);

  renderScene();
  requestAnimationFrame(tick);
}


function renderScene() {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0.3, 0.6, 1.0, 1.0);  // original blue sky
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var sr = 0.3, sg = 0.6, sb = 1.0;  // sky blue
  var ambientStr = 1.0;

  var u_ModelMatrix      = u_ModelMatrix_loc;
  var u_ViewMatrix       = u_ViewMatrix_loc;
  var u_ProjectionMatrix = u_ProjectionMatrix_loc;
  var u_Sampler0         = u_Sampler0_loc;
  var u_Sampler1         = u_Sampler1_loc;
  var u_BaseColor        = u_BaseColor_loc;
  var u_texColorWeight   = u_texColorWeight_loc;
  var u_whichTexture     = u_whichTexture_loc;

  gl.uniformMatrix4fv(u_ViewMatrix,       false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projMatrix.elements);

  // Bird's eye view — look straight down from above
  if (g_birdseye) {
    var birdView = new Matrix4();
    birdView.setLookAt(16, 20, 16,
                       16,  0, 16,
                        0,  0, -1);
    gl.uniformMatrix4fv(u_ViewMatrix, false, birdView.elements);
  } else {
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  }

  // Bind both textures (Matsuda p.183)
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, g_texture);
  gl.uniform1i(u_Sampler0, 0);   // brick on unit 0

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, g_texture1);
  gl.uniform1i(u_Sampler1, 1);   // grass on unit 1

  // ── Sky cube — blue ───────────────────────────────────────────
  gl.disable(gl.DEPTH_TEST);
  gl.uniform1i(u_whichTexture, 0);
  gl.uniform1f(u_texColorWeight, 0.0);
  gl.uniform4f(u_BaseColor, 0.3, 0.6, 1.0, 1.0);
  drawCube(u_ModelMatrix,
    [camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]],
    [0,0,0], [500,500,500]);
  gl.enable(gl.DEPTH_TEST);

  // ── Ground — grass texture ───────────────────────────────────
  gl.uniform1i(u_whichTexture, 2);
  gl.uniform1f(u_texColorWeight, 1.0);
  gl.uniform4f(u_BaseColor, 0.3, 0.7, 0.2, 1.0);
  drawCube(u_ModelMatrix, [16, -0.05, 16], [0,0,0], [32, 0.1, 32]);

  // ── River/pool under arch bridges ────────────────────────────
  gl.uniform1i(u_whichTexture, 0);
  gl.uniform1f(u_texColorWeight, 0.0);
  gl.uniform4f(u_BaseColor, 0.0, 0.3, 0.9, 1.0);
  drawCube(u_ModelMatrix, [15.5, -0.03, 10.5], [0,0,0], [6, 0.04, 1.5]);
  drawCube(u_ModelMatrix, [15.5, -0.03, 20.5], [0,0,0], [6, 0.04, 1.5]);

  // ── Walls — different color per height level ──────────────────
  // Height 1 = sandy/tan, 2 = brick orange, 3 = dark red, 4 = dark brown
  var wallColors = [
    [0,0,0,0],                      // 0 = empty
    [0.85, 0.75, 0.50, 1.0],        // 1 = sandy tan — lowest
    [0.75, 0.35, 0.10, 1.0],        // 2 = brick orange — medium
    [0.55, 0.15, 0.05, 1.0],        // 3 = dark red — tall
    [0.25, 0.10, 0.05, 1.0],        // 4 = very dark brown — tallest
  ];

  for (var row = 0; row < 32; row++) {
    for (var col = 0; col < 32; col++) {
      var mapVal = g_map[row][col];
      if (mapVal === 0) continue;

      for (var h = 0; h < mapVal; h++) {
        // Each cube layer gets its own height-based color
        var layerHeight = h + 1;  // 1-based layer
        var clr = wallColors[Math.min(layerHeight, 4)];

        // Mix texture with color based on height
        // Bottom layers more textured, top layers more solid color
        gl.uniform1i(u_whichTexture, 1);
        gl.uniform1f(u_texColorWeight, 0.6);
        gl.uniform4f(u_BaseColor, clr[0], clr[1], clr[2], clr[3]);
        drawCube(u_ModelMatrix, [col, h * 0.5 + 0.25, row], [0,0,0], [1, 0.5, 1]);
      }
    }
  }

  // ── Horse walking around village ─────────────────────────────
  drawHorseInWorld(u_ModelMatrix, 0.016);

  // ── Apple Trees ───────────────────────────────────────────────
  gl.uniform1f(u_texColorWeight, 0.0);
  var trees = [[4,4],[27,4],[4,27],[27,27],[6,16],[26,16]];
  for (var ti = 0; ti < trees.length; ti++) {
    var tx = trees[ti][0], tz = trees[ti][1];
    // Trunk — dark brown
    gl.uniform1i(u_whichTexture, 0);
    gl.uniform4f(u_BaseColor, 0.35, 0.18, 0.05, 1.0);
    drawCube(u_ModelMatrix, [tx, 0.5, tz], [0,0,0], [0.3, 1.0, 0.3]);
    drawCube(u_ModelMatrix, [tx, 1.3, tz], [0,0,0], [0.2, 0.6, 0.2]);
    // Leaves — wider spread like a real tree canopy
    gl.uniform4f(u_BaseColor, 0.1, 0.55, 0.1, 1.0);
    drawCube(u_ModelMatrix, [tx,      2.0, tz],      [0,0,0], [1.6, 0.5, 1.6]);  // wide base
    drawCube(u_ModelMatrix, [tx,      2.5, tz],      [0,0,0], [1.2, 0.5, 1.2]);  // middle
    drawCube(u_ModelMatrix, [tx,      3.0, tz],      [0,0,0], [0.8, 0.4, 0.8]);  // top
    drawCube(u_ModelMatrix, [tx+0.6,  1.8, tz],      [0,0,0], [0.5, 0.4, 0.5]);  // side spread
    drawCube(u_ModelMatrix, [tx-0.6,  1.8, tz],      [0,0,0], [0.5, 0.4, 0.5]);
    drawCube(u_ModelMatrix, [tx,      1.8, tz+0.6],  [0,0,0], [0.5, 0.4, 0.5]);
    drawCube(u_ModelMatrix, [tx,      1.8, tz-0.6],  [0,0,0], [0.5, 0.4, 0.5]);
    // Apples — red dots hidden inside leaves
    gl.uniform4f(u_BaseColor, 0.85, 0.05, 0.05, 1.0);
    drawCube(u_ModelMatrix, [tx+0.2, 2.1, tz+0.2], [0,0,0], [0.15,0.15,0.15]);
    drawCube(u_ModelMatrix, [tx-0.2, 2.2, tz-0.1], [0,0,0], [0.15,0.15,0.15]);
    drawCube(u_ModelMatrix, [tx+0.1, 2.0, tz-0.2], [0,0,0], [0.15,0.15,0.15]);
  }

  // ── Hay patches — horse eats them ────────────────────────────
  for (var gi = 0; gi < g_grassPatches.length; gi++) {
    if (!g_grassPatches[gi].alive) continue;
    var gx = g_grassPatches[gi].x;
    var gz = g_grassPatches[gi].z;
    gl.uniform1i(u_whichTexture, 0);
    gl.uniform1f(u_texColorWeight, 0.0);
    // Hay color — golden yellow
    gl.uniform4f(u_BaseColor, 0.85, 0.72, 0.15, 1.0);
    drawCube(u_ModelMatrix, [gx,      0.12, gz],      [0,0,0], [0.5, 0.25, 0.5]);
    // Darker hay strands
    gl.uniform4f(u_BaseColor, 0.70, 0.55, 0.08, 1.0);
    drawCube(u_ModelMatrix, [gx+0.2,  0.15, gz+0.1],  [0,0,0], [0.15, 0.3, 0.12]);
    drawCube(u_ModelMatrix, [gx-0.15, 0.15, gz-0.1],  [0,0,0], [0.12, 0.28, 0.10]);
    drawCube(u_ModelMatrix, [gx+0.1,  0.15, gz-0.2],  [0,0,0], [0.10, 0.25, 0.12]);
  }

  // ── Blue water pots beside path ───────────────────────────────
  gl.uniform1i(u_whichTexture, 0);
  gl.uniform1f(u_texColorWeight, 0.0);
  var pots = [[15,20],[17,20],[11,17],[11,22],[21,17],[21,22]];
  for (var pi = 0; pi < pots.length; pi++) {
    var px = pots[pi][0], pz = pots[pi][1];
    gl.uniform4f(u_BaseColor, 0.0, 0.3, 1.0, 1.0);
    drawCube(u_ModelMatrix, [px, 0.2, pz], [0,0,0], [0.5, 0.4, 0.5]);
    gl.uniform4f(u_BaseColor, 0.0, 0.15, 0.8, 1.0);
    drawCube(u_ModelMatrix, [px, 0.38, pz], [0,0,0], [0.55, 0.08, 0.55]);
  }

  // ── Fluffy clouds ─────────────────────────────────────────────
  gl.uniform1i(u_whichTexture, 0);
  gl.uniform1f(u_texColorWeight, 0.0);
  var cloudData = [{x:10,y:6,z:16},{x:20,y:7,z:14},{x:15,y:6,z:9}];
  for (var ci = 0; ci < cloudData.length; ci++) {
    var cx = cloudData[ci].x, cy = cloudData[ci].y, cz = cloudData[ci].z;
    gl.uniform4f(u_BaseColor, 1.0, 1.0, 1.0, 1.0);
    drawCube(u_ModelMatrix, [cx,     cy,     cz], [0,0,0], [2.0, 0.5, 0.7]);
    drawCube(u_ModelMatrix, [cx-0.7, cy+0.3, cz], [0,0,0], [0.9, 0.55,0.6]);
    drawCube(u_ModelMatrix, [cx+0.1, cy+0.45,cz], [0,0,0], [1.0, 0.65,0.6]);
    drawCube(u_ModelMatrix, [cx+0.9, cy+0.3, cz], [0,0,0], [0.8, 0.5, 0.6]);
  }

  // ── Flying birds at tree level ────────────────────────────────
  gl.uniform1i(u_whichTexture, 0);
  gl.uniform1f(u_texColorWeight, 0.0);
  gl.uniform4f(u_BaseColor, 0.1, 0.1, 0.15, 1.0);
  var bt = g_horseTime * 0.4;
  var birdData = [
    {x:14+3*Math.cos(bt),     y:3.5, z:18+3*Math.sin(bt)},
    {x:18+3*Math.cos(bt+2.1), y:3.5, z:16+3*Math.sin(bt+2.1)},
  ];
  for (var bi = 0; bi < birdData.length; bi++) {
    var bx = birdData[bi].x, by = birdData[bi].y, bz = birdData[bi].z;
    drawCube(u_ModelMatrix, [bx-0.35, by,     bz], [0,0,0], [0.5, 0.08, 0.08]);
    drawCube(u_ModelMatrix, [bx+0.35, by,     bz], [0,0,0], [0.5, 0.08, 0.08]);
    drawCube(u_ModelMatrix, [bx,      by+0.1, bz], [0,0,0], [0.15,0.08, 0.08]);
  }
}

// ── drawCube() — fast version using pre-built buffers ─────────
function drawCube(u_ModelMatrix, position, rotation, scale) {
  g_cubeMatrix.setTranslate(position[0], position[1], position[2]);
  if (rotation[0]) g_cubeMatrix.rotate(rotation[0], 1, 0, 0);
  if (rotation[1]) g_cubeMatrix.rotate(rotation[1], 0, 1, 0);
  if (rotation[2]) g_cubeMatrix.rotate(rotation[2], 0, 0, 1);
  g_cubeMatrix.scale(scale[0], scale[1], scale[2]);
  gl.uniformMatrix4fv(u_ModelMatrix, false, g_cubeMatrix.elements);
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeVertBuf);
  gl.vertexAttribPointer(g_a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(g_a_Position);
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeUVBuf);
  gl.vertexAttribPointer(g_a_TexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(g_a_TexCoord);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

window.onload = main;
