import { Matrix4, Vector3 } from "../lib/cuon-matrix-cse160";
import { createProgram } from "../lib/cuon-utils";

export default class Cube {
  constructor() {
    this.vertexBuffer = null;
    this.uvBuffer     = null;
    this.normalBuffer = null;
    this.program      = null;

    this.vertices = null;
    this.uvs      = null;
    this.normals  = null;

    this.position    = new Vector3([0, 0, 0]);
    this.rotation    = new Vector3([0, 0, 0]);
    this.scale       = new Vector3([1, 1, 1]);
    this.modelMatrix = new Matrix4();
    this.normalMatrix= new Matrix4();

    this.setVertices();
    this.setUvs();
    this.setNormals();
  }

  setProgram(gl) {
    const vs = `
      precision mediump float;
      attribute vec3 aPosition;
      attribute vec2 uv;
      attribute vec3 normal;

      uniform mat4 modelMatrix;
      uniform mat4 normalMatrix;
      uniform mat4 viewMatrix;
      uniform mat4 projectionMatrix;

      varying vec3 vNormal;
      varying vec2 vUv;

      void main() {
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(aPosition, 1.0);
        vNormal = (normalMatrix * vec4(normal, 1.0)).xyz;
        vUv = uv;
      }
    `;

    const fs = `
      precision mediump float;
      varying vec3 vNormal;
      varying vec2 vUv;

      uniform bool uShowNormal;
      uniform vec3 uColor;

      void main() {
        if (uShowNormal) {
          // Show normals as color — each face different color
          gl_FragColor = vec4(normalize(vNormal) * 0.5 + 0.5, 1.0);
        } else {
          gl_FragColor = vec4(uColor, 1.0);
        }
      }
    `;

    this.program = createProgram(gl, vs, fs);
    if (!this.program) console.error('Failed to create Cube program');
  }

  setNormals() {
    // Each face: 6 vertices all with same outward-pointing normal
    this.normals = new Float32Array([
      // FRONT  (0, 0, 1)
       0, 0, 1,  0, 0, 1,  0, 0, 1,
       0, 0, 1,  0, 0, 1,  0, 0, 1,
      // LEFT   (-1, 0, 0)
      -1, 0, 0, -1, 0, 0, -1, 0, 0,
      -1, 0, 0, -1, 0, 0, -1, 0, 0,
      // RIGHT  (1, 0, 0)
       1, 0, 0,  1, 0, 0,  1, 0, 0,
       1, 0, 0,  1, 0, 0,  1, 0, 0,
      // TOP    (0, 1, 0)
       0, 1, 0,  0, 1, 0,  0, 1, 0,
       0, 1, 0,  0, 1, 0,  0, 1, 0,
      // BACK   (0, 0, -1)
       0, 0,-1,  0, 0,-1,  0, 0,-1,
       0, 0,-1,  0, 0,-1,  0, 0,-1,
      // BOTTOM (0, -1, 0)
       0,-1, 0,  0,-1, 0,  0,-1, 0,
       0,-1, 0,  0,-1, 0,  0,-1, 0,
    ]);
  }

  setVertices() {
    this.vertices = new Float32Array([
      //FRONT
      -0.5,0.5,0.5, -0.5,-0.5,0.5, 0.5,-0.5,0.5,
      -0.5,0.5,0.5, 0.5,-0.5,0.5, 0.5,0.5,0.5,
      //LEFT
      -0.5,0.5,-0.5, -0.5,-0.5,-0.5, -0.5,-0.5,0.5,
      -0.5,0.5,-0.5, -0.5,-0.5,0.5, -0.5,0.5,0.5,
      //RIGHT
      0.5,0.5,0.5, 0.5,-0.5,0.5, 0.5,-0.5,-0.5,
      0.5,0.5,0.5, 0.5,-0.5,-0.5, 0.5,0.5,-0.5,
      //TOP
      -0.5,0.5,-0.5, -0.5,0.5,0.5, 0.5,0.5,0.5,
      -0.5,0.5,-0.5, 0.5,0.5,0.5, 0.5,0.5,-0.5,
      //BACK
      0.5,0.5,-0.5, 0.5,-0.5,-0.5, -0.5,0.5,-0.5,
      -0.5,0.5,-0.5, 0.5,-0.5,-0.5, -0.5,-0.5,-0.5,
      //BOTTOM
      -0.5,-0.5,0.5, -0.5,-0.5,-0.5, 0.5,-0.5,-0.5,
      -0.5,-0.5,0.5, 0.5,-0.5,-0.5, 0.5,-0.5,0.5
    ]);
  }

  setUvs() {
    this.uvs = new Float32Array([
      0.5,0.75, 0.5,0.5, 0.75,0.5, 0.5,0.75, 0.75,0.5, 0.75,0.75,
      0.5,0.5, 0.5,0.25, 0.75,0.25, 0.5,0.5, 0.75,0.25, 0.75,0.5,
      0.25,0.5, 0.25,0.25, 0.5,0.25, 0.25,0.5, 0.5,0.25, 0.5,0.5,
      0.0,0.5, 0.0,0.25, 0.25,0.25, 0.0,0.5, 0.25,0.25, 0.25,0.5,
      0.75,0.5, 0.75,0.25, 1.0,0.5, 1.0,0.5, 0.75,0.25, 1.0,0.25,
      0.5,0.25, 0.5,0.0, 0.75,0.0, 0.5,0.25, 0.75,0.0, 0.75,0.25,
    ]);
  }

  calculateMatrix() {
    let [x, y, z]   = this.position.elements;
    let [rx, ry, rz] = this.rotation.elements;
    let [sx, sy, sz] = this.scale.elements;

    this.modelMatrix
      .setTranslate(x, y, z)
      .rotate(rx, 1, 0, 0)
      .rotate(ry, 0, 1, 0)
      .rotate(rz, 0, 0, 1)
      .scale(sx, sy, sz);

    this.normalMatrix.set(this.modelMatrix).invert().transpose();
  }

  render(gl, camera) {
    if (!this.program) this.setProgram(gl);

    gl.useProgram(this.program);
    this.calculateMatrix();
    camera.calculateViewProjection();

    const aPosition      = gl.getAttribLocation(this.program, 'aPosition');
    const aUv            = gl.getAttribLocation(this.program, 'uv');
    const aNormal        = gl.getAttribLocation(this.program, 'normal');
    const uModel         = gl.getUniformLocation(this.program, 'modelMatrix');
    const uNormal        = gl.getUniformLocation(this.program, 'normalMatrix');
    const uView          = gl.getUniformLocation(this.program, 'viewMatrix');
    const uProj          = gl.getUniformLocation(this.program, 'projectionMatrix');
    const uColor         = gl.getUniformLocation(this.program, 'uColor');

    gl.uniformMatrix4fv(uModel,  false, this.modelMatrix.elements);
    gl.uniformMatrix4fv(uNormal, false, this.normalMatrix.elements);
    gl.uniformMatrix4fv(uView,   false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(uProj,   false, camera.projectionMatrix.elements);
    gl.uniform3f(uColor, 0.8, 0.4, 0.1);  // orange cube

    // Vertex buffer
    if (!this.vertexBuffer) this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    // UV buffer
    if (!this.uvBuffer) this.uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aUv);

    // Normal buffer
    if (!this.normalBuffer) this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
  }
}
