// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +   
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

// Global variables
var canvas;
var gl;
var a_Position;
var u_FragColor;
//var g_points = [];
//var g_colors = [];
var u_Size;
var g_shapesList = [];
//var g_sizes = [];
var g_selectedShape = 'point';

class Point {
  constructor () {
    this.type = 'point';
    this.position = [0, 0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 10;
  }

  render () {
    gl.disableVertexAttribArray(a_Position);
    gl.vertexAttrib3f(a_Position, this.position[0], this.position[1], 0.0);
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1f(u_Size, this.size);
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

class Triangle {
  constructor() {
    this.type = 'triangle';
    this.position = [0, 0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 10;
  }

  render() {
    var xy = this.position;
    var s = this.size / 200; 

    gl.uniform4f(u_FragColor,
      this.color[0], this.color[1],
      this.color[2], this.color[3]);

    drawTriangle([
      xy[0],       xy[1] + s,
      xy[0] - s,   xy[1] - s,
      xy[0] + s,   xy[1] - s 
    ]);
  }
}

class Circle {
  constructor() {
    this.type = 'circle';
    this.position = [0, 0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 10;
    this.segments = 10;
  }

  render() {
    var xy = this.position;
    var r = this.size / 200;
    var d = Math.PI * 2 / this.segments;

    gl.uniform4f(u_FragColor,
      this.color[0], this.color[1],
      this.color[2], this.color[3]);

    // Draw circle using triangles
    for (var angle = 0; angle < Math.PI * 2; angle += d) {
      drawTriangle([
        xy[0], xy[1],
        xy[0] + r * Math.cos(angle), 
        xy[1] + r * Math.sin(angle),
        xy[0] + r * Math.cos(angle + d),
        xy[1] + r * Math.sin(angle + d)
      ]);
    }
  }
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();

  // Register mouse click event
  canvas.onmousedown = function(ev) { click(ev); };
  canvas.onmousemove = function(ev) {
    if (ev.buttons == 1) { 
      click(ev);
    }
  }

  // Set background color and clear
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupWebGL() {
  // Get canvas
  canvas = document.getElementById('webgl');
  if (!canvas) {
    console.log('Failed to get canvas');
    return;
  }

  // Get WebGL context
  gl = getWebGLContext(canvas, {preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders');
    return;
  }

  // Get location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get a_Position');
    return;
  }

  // Get location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get u_FragColor');
    return;
  }
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get u_Size');
  return;
  }

}

function click(ev) {
  // Get mouse coordinates
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();
  var shape;

  // Convert to WebGL coordinates (-1 to 1)
  x = ((x - rect.left) - canvas.width/2) / (canvas.width/2);
  y = (canvas.height/2 - (y - rect.top)) / (canvas.height/2);

  if (g_selectedShape == 'point') {
    shape = new Point();
  } else if (g_selectedShape == 'triangle') {
    shape = new Triangle();
  } else if (g_selectedShape == 'circle') {
    shape = new Circle();
    shape.segments = document.getElementById('segmentSlider').value;
  }

  shape.position = [x, y];
  shape.color = [
    document.getElementById('redSlider').value / 255,
    document.getElementById('greenSlider').value / 255,
    document.getElementById('blueSlider').value / 255,
    1.0
  ];
  shape.size = document.getElementById('sizeSlider').value;
  g_shapesList.push(shape);

  renderAllShapes();
}

function renderAllShapes() {
  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw all points
  for (var i = 0; i < g_shapesList.length; i++) {
	  g_shapesList[i].render();
  }
}

function clearCanvas() {
  g_shapesList = [];
  renderAllShapes();
}

function drawTriangle(vertices) {
  var n = 3;
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create buffer');
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function setShape(shape) {
  g_selectedShape = shape;
}

function drawMyPicture() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  var coneColor = [0.82, 0.57, 0.22, 1.0];
  var vanillaColor = [1.0, 0.97, 0.8, 1.0];
  var chocoColor = [0.4, 0.2, 0.0, 1.0];
  var initialColor = [0.6, 0.3, 0.0, 1.0]; // dark brown

  gl.uniform4f(u_FragColor, coneColor[0], coneColor[1], coneColor[2], coneColor[3]);

  drawTriangle([-0.4, 0.0,  0.0, -0.8,  -0.1, 0.0]);
  drawTriangle([-0.1, 0.0,  0.0, -0.8,   0.1, 0.0]);
  drawTriangle([ 0.1, 0.0,  0.0, -0.8,   0.4, 0.0]);
  drawTriangle([-0.4, 0.0, -0.2, -0.4,   0.0, 0.0]);
  drawTriangle([ 0.0, 0.0,  0.2, -0.4,   0.4, 0.0]);
  drawTriangle([-0.2, -0.4, 0.0, -0.8,   0.2, -0.4]);

  gl.uniform4f(u_FragColor, 1.0, 0.97, 0.8, 1.0);

  var centerX = 0.0;
  var centerY = 0.0;  // center of the scoop
  var radius = 0.4;

// Draw semicircle using triangle fan (only top half - Math.PI = 180 degrees)
  var segments = 12;
  var angleStep = Math.PI / segments;

  for (var i = 0; i < segments; i++) {
    var angle1 = i * angleStep;  // start from left
    var angle2 = (i + 1) * angleStep;

    drawTriangle([
      centerX, centerY,                                    // center point
      centerX + radius * Math.cos(angle1),                 // point 1
      centerY + radius * Math.sin(angle1),
      centerX + radius * Math.cos(angle2),                 // point 2
      centerY + radius * Math.sin(angle2)
    ]);
  }

  // SPRINKLES - smaller
  gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
  drawTriangle([-0.05, 0.05,  0.0, 0.12,   0.05, 0.05]);

  gl.uniform4f(u_FragColor, 0.0, 1.0, 0.0, 1.0);
  drawTriangle([ 0.15, 0.05,  0.2, 0.12,   0.25, 0.05]);

  gl.uniform4f(u_FragColor, 0.0, 0.0, 1.0, 1.0);
  drawTriangle([-0.25, 0.05, -0.2, 0.12,  -0.15, 0.05]);

  gl.uniform4f(u_FragColor, 1.0, 1.0, 0.0, 1.0);
  drawTriangle([ 0.05, 0.2,  0.1, 0.27,   0.15, 0.2]);

  gl.uniform4f(u_FragColor, 1.0, 0.4, 0.7, 1.0);
  drawTriangle([-0.15, 0.2, -0.1, 0.27,  -0.05, 0.2]);

  gl.uniform4f(u_FragColor, 1.0, 0.5, 0.0, 1.0);
  drawTriangle([ 0.05, 0.1,  0.1, 0.17,   0.15, 0.1]);

// Purple sprinkle
  gl.uniform4f(u_FragColor, 0.6, 0.0, 1.0, 1.0);
  drawTriangle([-0.1, 0.18, -0.05, 0.25,  0.0, 0.18]);

// K - smaller
  gl.uniform4f(u_FragColor, 1.0, 0.0, 0.5, 1.0);
// K vertical bar
  drawTriangle([-0.18, -0.15, -0.13, -0.15, -0.13, -0.42]);
  drawTriangle([-0.18, -0.15, -0.18, -0.42, -0.13, -0.42]);
// K upper diagonal
  drawTriangle([-0.13, -0.28, 0.02, -0.15,  -0.08, -0.28]);
// K lower diagonal
  drawTriangle([-0.13, -0.28, 0.02, -0.42,  -0.08, -0.28]);

// V - no base triangle
  drawTriangle([ 0.1, -0.15,  0.15, -0.15,  0.22, -0.38]);
  drawTriangle([ 0.22, -0.38,  0.28, -0.15,  0.33, -0.15]);

}
