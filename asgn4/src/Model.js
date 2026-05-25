// Model.js — adapted from lab Model.js to work with asgn4.js Phong shader
// Matrix4 comes from the lib script tag in HTML — it's a global

export default class Model {
  constructor(gl, filePath) {
    this.filePath    = filePath;
    this.color       = [0.6, 0.2, 0.8, 1.0]; // purple
    this.matrix      = new Matrix4();
    this.isFullyLoaded = false;
    this.vertexBuffer  = null;
    this.normalBuffer  = null;

    this.getFileContent(gl);
  }

  async parseModel(fileContent) {
    const lines       = fileContent.split('\n');
    const allVertices = [];
    const allNormals  = [];
    const unpackedVerts   = [];
    const unpackedNormals = [];

    for (let i = 0; i < lines.length; i++) {
      const line   = lines[i].trim();
      const tokens = line.split(/\s+/);

      if (tokens[0] === 'v') {
        allVertices.push(
          parseFloat(tokens[1]),
          parseFloat(tokens[2]),
          parseFloat(tokens[3])
        );
      } else if (tokens[0] === 'vn') {
        allNormals.push(
          parseFloat(tokens[1]),
          parseFloat(tokens[2]),
          parseFloat(tokens[3])
        );
      } else if (tokens[0] === 'f') {
        for (const face of [tokens[1], tokens[2], tokens[3]]) {
          const indices     = face.split('//');
          const vertexIndex = (parseInt(indices[0]) - 1) * 3;
          const normalIndex = (parseInt(indices[1]) - 1) * 3;
          unpackedVerts.push(
            allVertices[vertexIndex],
            allVertices[vertexIndex + 1],
            allVertices[vertexIndex + 2]
          );
          unpackedNormals.push(
            allNormals[normalIndex],
            allNormals[normalIndex + 1],
            allNormals[normalIndex + 2]
          );
        }
      }
    }

    this.modelData = {
      vertices: new Float32Array(unpackedVerts),
      normals:  new Float32Array(unpackedNormals)
    };
    this.isFullyLoaded = true;
    console.log('Model loaded:', this.filePath, unpackedVerts.length/3, 'vertices');
  }

  async getFileContent(gl) {
    try {
      const response = await fetch(this.filePath);
      if (!response.ok) throw new Error(`Could not load "${this.filePath}"`);
      const fileContent = await response.text();
      await this.parseModel(fileContent);

      // Create buffers after parsing
      this.vertexBuffer = gl.createBuffer();
      this.normalBuffer = gl.createBuffer();
    } catch(e) {
      console.error('Model load error:', e);
    }
  }

  render(gl, x, y, z, scale, u_Model, u_NormalMat, u_Color, u_UseTexture, a_Position, a_Normal, a_TexCoord) {
    if (!this.isFullyLoaded) return;

    // Set position and scale
    this.matrix.setTranslate(x, y, z);
    this.matrix.scale(scale, scale, scale);

    gl.uniformMatrix4fv(u_Model, false, this.matrix.elements);

    const nm = new Matrix4();
    nm.setInverseOf(this.matrix);
    nm.transpose();
    gl.uniformMatrix4fv(u_NormalMat, false, nm.elements);

    gl.uniform3f(u_Color, this.color[0], this.color[1], this.color[2]);
    gl.uniform1i(u_UseTexture, 0);

    // Vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.modelData.vertices, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Normals
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.modelData.normals, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    // Disable UV
    gl.disableVertexAttribArray(a_TexCoord);
    gl.vertexAttrib2f(a_TexCoord, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, this.modelData.vertices.length / 3);
  }
}
