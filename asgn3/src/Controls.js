// ============================================================
//  Controls.js — Step 7 (Matsuda Chapter 7)
//  Keyboard input: W/S/A/D/Q/E
// ============================================================

class Controls {
  constructor(camera) {
    this.camera = camera;
    this.speed  = 0.5;  // fast like Poly Track
    this.keys   = {};

    // Register key events
    document.addEventListener('keydown', function(ev) {
      this.keys[ev.key] = true;
    }.bind(this));

    document.addEventListener('keyup', function(ev) {
      this.keys[ev.key] = false;
    }.bind(this));

    // Mouse drag to look around
    this.dragging    = false;
    this.lastMouseX  = 0;
    this.lastMouseY  = 0;

    var canvas = document.getElementById('webgl');
    canvas.addEventListener('mousedown', function(ev) {
      this.dragging   = true;
      this.lastMouseX = ev.clientX;
      this.lastMouseY = ev.clientY;
    }.bind(this));

    document.addEventListener('mouseup', function() {
      this.dragging = false;
    }.bind(this));

    document.addEventListener('mousemove', function(ev) {
      if (!this.dragging) return;
      var dx = ev.clientX - this.lastMouseX;
      var dy = ev.clientY - this.lastMouseY;
      this.lastMouseX = ev.clientX;
      this.lastMouseY = ev.clientY;
      if (dx !== 0) this.camera.panLeft(-dx * 0.3);
      if (dy !== 0) this.camera.panUp(dy * 0.3);
    }.bind(this));
  }

  // Step 7: Called every frame — check keys and move camera
  update() {
    // Step 7: W = moveForward
    if (this.keys['w'] || this.keys['W']) this.camera.moveForward(this.speed);
    // Step 7: S = moveBackwards
    if (this.keys['s'] || this.keys['S']) this.camera.moveBackwards(this.speed);
    // Step 7: A = moveLeft
    if (this.keys['a'] || this.keys['A']) this.camera.moveLeft(this.speed);
    // Step 7: D = moveRight
    if (this.keys['d'] || this.keys['D']) this.camera.moveRight(this.speed);
    // Step 7: Q = panLeft
    if (this.keys['q'] || this.keys['Q']) this.camera.panLeft(2.0);
    // Step 7: E = panRight
    if (this.keys['e'] || this.keys['E']) this.camera.panRight(2.0);
  }
}
