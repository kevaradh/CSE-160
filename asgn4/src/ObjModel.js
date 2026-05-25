// ObjModel.js — Seashell + Torus

export default class ObjModel {
  constructor() {
    this.shellVertBuf = null;
    this.shellNormBuf = null;
    this.shellCount   = 0;
    this.torusVertBuf = null;
    this.torusNormBuf = null;
    this.torusCount   = 0;
  }

  init(gl) {
    this._initShell(gl);
    this._initTorus(gl, 1.0, 0.4, 24, 24);
  }

  _initShell(gl) {
    const verts = [], norms = [];
    const uSteps = 60, vSteps = 60;

    // Scallop/clam shell — flat, wide, wavy edges
    const point = (u, v) => {
      // u = 0..PI (half dome), v = 0..2PI (around shell)
      const r     = u / Math.PI;          // radius grows from 0 to 1
      const waves = 8;                    // number of edge waves
      const waveH = 0.15 * r * r;        // wave height grows toward edge
      const wave  = waveH * Math.cos(waves * v); // wavy edge
      const curve = 0.3 * (1 - r*r);     // shell curves up in center

      const x = r * Math.cos(v);
      const z = r * Math.sin(v);
      const y = curve + wave;             // curved surface + wavy edge
      return [x, y, z];
    };

    const normal = (u, v) => {
      const eps = 0.001;
      const p=point(u,v), pu=point(u+eps,v), pv=point(u,v+eps);
      const du=[(pu[0]-p[0])/eps,(pu[1]-p[1])/eps,(pu[2]-p[2])/eps];
      const dv=[(pv[0]-p[0])/eps,(pv[1]-p[1])/eps,(pv[2]-p[2])/eps];
      const nx=du[1]*dv[2]-du[2]*dv[1];
      const ny=du[2]*dv[0]-du[0]*dv[2];
      const nz=du[0]*dv[1]-du[1]*dv[0];
      const len=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;
      return [nx/len,ny/len,nz/len];
    };

    for (let i=0;i<uSteps;i++) {
      const u1=Math.PI*i/uSteps, u2=Math.PI*(i+1)/uSteps;
      for (let j=0;j<vSteps;j++) {
        const v1=2*Math.PI*j/vSteps, v2=2*Math.PI*(j+1)/vSteps;
        const p1=point(u1,v1),p2=point(u1,v2),p3=point(u2,v2),p4=point(u2,v1);
        const n1=normal(u1,v1),n2=normal(u1,v2),n3=normal(u2,v2),n4=normal(u2,v1);
        verts.push(...p1,...p2,...p3); norms.push(...n1,...n2,...n3);
        verts.push(...p1,...p3,...p4); norms.push(...n1,...n3,...n4);
      }
    }
    this.shellCount=verts.length/3;
    this.shellVertBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,this.shellVertBuf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
    this.shellNormBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,this.shellNormBuf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(norms),gl.STATIC_DRAW);
  }

  _initTorus(gl, R, r, segments, rings) {
    const verts=[], norms=[];
    for (let i=0;i<rings;i++) {
      const t1=2*Math.PI*i/rings, t2=2*Math.PI*(i+1)/rings;
      for (let j=0;j<segments;j++) {
        const p1=2*Math.PI*j/segments, p2=2*Math.PI*(j+1)/segments;
        const pt=(t,p)=>[(R+r*Math.cos(p))*Math.cos(t), r*Math.sin(p), (R+r*Math.cos(p))*Math.sin(t)];
        const nm=(t,p)=>[Math.cos(p)*Math.cos(t), Math.sin(p), Math.cos(p)*Math.sin(t)];
        const v1=pt(t1,p1),v2=pt(t1,p2),v3=pt(t2,p2),v4=pt(t2,p1);
        const n1=nm(t1,p1),n2=nm(t1,p2),n3=nm(t2,p2),n4=nm(t2,p1);
        verts.push(...v1,...v2,...v3); norms.push(...n1,...n2,...n3);
        verts.push(...v1,...v3,...v4); norms.push(...n1,...n3,...n4);
      }
    }
    this.torusCount=verts.length/3;
    this.torusVertBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,this.torusVertBuf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
    this.torusNormBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,this.torusNormBuf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(norms),gl.STATIC_DRAW);
  }

  renderShell(gl, x, y, z, scale, u_Model, u_NormalMat, u_Color, u_UseTexture, a_Position, a_Normal, a_TexCoord) {
    const m=new Matrix4(); m.setTranslate(x,y,z); m.scale(scale,scale,scale);
    gl.uniformMatrix4fv(u_Model,false,m.elements);
    const nm=new Matrix4(); nm.setInverseOf(m); nm.transpose();
    gl.uniformMatrix4fv(u_NormalMat,false,nm.elements);
    gl.uniform3f(u_Color, 1.0, 0.85, 0.82); // bright sandy pink/white
    gl.uniform1i(u_UseTexture,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.shellVertBuf); gl.vertexAttribPointer(a_Position,3,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(a_Position);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.shellNormBuf); gl.vertexAttribPointer(a_Normal,3,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(a_Normal);
    gl.disableVertexAttribArray(a_TexCoord); gl.vertexAttrib2f(a_TexCoord,0,0);
    gl.drawArrays(gl.TRIANGLES,0,this.shellCount);
  }

  renderTorus(gl, x, y, z, scale, u_Model, u_NormalMat, u_Color, u_UseTexture, a_Position, a_Normal, a_TexCoord) {
    const m=new Matrix4(); m.setTranslate(x,y,z); m.scale(scale,scale,scale);
    gl.uniformMatrix4fv(u_Model,false,m.elements);
    const nm=new Matrix4(); nm.setInverseOf(m); nm.transpose();
    gl.uniformMatrix4fv(u_NormalMat,false,nm.elements);
    gl.uniform3f(u_Color,0.7,0.7,0.2);
    gl.uniform1i(u_UseTexture,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.torusVertBuf); gl.vertexAttribPointer(a_Position,3,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(a_Position);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.torusNormBuf); gl.vertexAttribPointer(a_Normal,3,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(a_Normal);
    gl.disableVertexAttribArray(a_TexCoord); gl.vertexAttrib2f(a_TexCoord,0,0);
    gl.drawArrays(gl.TRIANGLES,0,this.torusCount);
  }
}
