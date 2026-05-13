// ============================================================
//  Camera.js — Step 6 (Matsuda Chapter 7)
//  Camera class with eye, at, up, viewMatrix, projectionMatrix
// ============================================================

class Camera {
  constructor() {
    // Step 6: Initialize attributes as specified
    this.fov = 60;
    this.eye = new Vector3([16, 8, 35]);  // high up outside south wall
    this.at  = new Vector3([16, 0, 16]);  // looking at entire village
    this.up  = new Vector3([0,  1,  0]);

    this.viewMatrix       = new Matrix4();
    this.projMatrix       = new Matrix4();

    this.updateView();
    this.updateProjection(window.innerWidth / window.innerHeight);
  }

  // Update view matrix using setLookAt (Matsuda step 6)
  updateView() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
      this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
    );
  }

  // Update projection matrix (Matsuda step 6)
  updateProjection(aspect) {
    this.projMatrix.setPerspective(this.fov, aspect, 0.1, 1000);
  }

  // Step 6: moveForward
  // f = at - eye, normalize, scale by speed, add to eye and at
  moveForward(speed) {
    var f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    f.mul(speed);
    this.eye.add(f);
    this.at.add(f);
    this.updateView();
  }

  // Step 6: moveBackwards
  // b = eye - at
  moveBackwards(speed) {
    var b = new Vector3();
    b.set(this.eye);
    b.sub(this.at);
    b.normalize();
    b.mul(speed);
    this.eye.add(b);
    this.at.add(b);
    this.updateView();
  }

  // Step 6: moveLeft
  moveLeft(speed) {
    var f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();

    // s = up x f using manual cross product
    var ux = this.up.elements[0], uy = this.up.elements[1], uz = this.up.elements[2];
    var fx = f.elements[0],       fy = f.elements[1],       fz = f.elements[2];
    var s = new Vector3([
      uy*fz - uz*fy,
      uz*fx - ux*fz,
      ux*fy - uy*fx
    ]);
    s.normalize();
    s.mul(speed);

    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  // Step 6: moveRight
  moveRight(speed) {
    var f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();

    // s = f x up
    var fx = f.elements[0],       fy = f.elements[1],       fz = f.elements[2];
    var ux = this.up.elements[0], uy = this.up.elements[1], uz = this.up.elements[2];
    var s = new Vector3([
      fy*uz - fz*uy,
      fz*ux - fx*uz,
      fx*uy - fy*ux
    ]);
    s.normalize();
    s.mul(speed);

    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  // Step 6: panLeft
  // Rotate forward vector f around up vector by alpha degrees
  panLeft(alpha) {
    var f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);

    var rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

    var f_prime = rotationMatrix.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(f_prime);
    this.updateView();
  }

  // Step 6: panRight
  // Same as panLeft but negative alpha
  panRight(alpha) {
    this.panLeft(-alpha);
  }

  // Vertical mouse look
  panUp(alpha) {
    var f = new Vector3();
    f.set(this.at); f.sub(this.eye);
    var fx = f.elements[0], fy = f.elements[1], fz = f.elements[2];
    var ux = this.up.elements[0], uy = this.up.elements[1], uz = this.up.elements[2];
    var right = new Vector3([
      fy*uz - fz*uy,
      fz*ux - fx*uz,
      fx*uy - fy*ux
    ]);
    right.normalize();
    var rotMat = new Matrix4();
    rotMat.setRotate(alpha, right.elements[0], right.elements[1], right.elements[2]);
    var fp = rotMat.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(fp);
    this.updateView();
  }
}
