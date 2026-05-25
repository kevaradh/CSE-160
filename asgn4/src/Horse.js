// Horse.js — improved horse with better neck, mane, tail

export default class Horse {
  constructor() { this.t = 0; }
  animate(t) { this.t = t; }

  render(gl, x, y, z, scale, u_Model, u_NormalMat, u_Color, u_UseTexture,
         a_Position, a_Normal, a_TexCoord, cubeVertBuf, cubeNormBuf, cubeUVBuf) {

    const t = this.t;
    const s = scale;

    const cube = (wx, wy, wz, sxw, syw, szw, r, g, b) => {
      const m = new Matrix4();
      m.setTranslate(wx, wy, wz);
      m.scale(sxw, syw, szw);
      gl.uniformMatrix4fv(u_Model, false, m.elements);
      const nm = new Matrix4(); nm.setInverseOf(m); nm.transpose();
      gl.uniformMatrix4fv(u_NormalMat, false, nm.elements);
      gl.uniform3f(u_Color, r, g, b);
      gl.uniform1i(u_UseTexture, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertBuf);
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
      gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormBuf);
      gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Normal);
      gl.bindBuffer(gl.ARRAY_BUFFER, cubeUVBuf);
      gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_TexCoord);
      gl.drawArrays(gl.TRIANGLES, 0, 36);
    };

    const a  =  0.1*s*Math.sin(t);
    const b2 =  0.1*s*Math.sin(t + Math.PI);

    // Body — 2 overlapping segments, no gap
    cube(x+0.12*s, y+0.50*s, z,        0.70*s,0.45*s, 0.40*s, 0.76,0.47,0.22);
    cube(x-0.38*s, y+0.48*s, z,        0.38*s,0.42*s, 0.38*s, 0.76,0.47,0.22);

    // Neck — shorter, more upright
    cube(x+0.45*s, y+0.72*s, z,        0.22*s,0.18*s, 0.18*s, 0.76,0.47,0.22);
    cube(x+0.50*s, y+0.90*s, z,        0.20*s,0.16*s, 0.16*s, 0.76,0.47,0.22);
    cube(x+0.53*s, y+1.06*s, z,        0.18*s,0.14*s, 0.15*s, 0.76,0.47,0.22);
    cube(x+0.55*s, y+1.20*s, z,        0.16*s,0.12*s, 0.14*s, 0.76,0.47,0.22);

    // Head — more horizontal, lower
    cube(x+0.60*s, y+1.30*s, z,        0.30*s,0.18*s, 0.17*s, 0.76,0.47,0.22);
    // Snout — forward not down
    cube(x+0.82*s, y+1.24*s, z,        0.18*s,0.13*s, 0.14*s, 0.85,0.65,0.52);
    // Nostrils
    cube(x+0.92*s, y+1.22*s, z-0.04*s, 0.03*s,0.03*s,0.02*s, 0.50,0.28,0.10);
    cube(x+0.92*s, y+1.22*s, z+0.04*s, 0.03*s,0.03*s,0.02*s, 0.50,0.28,0.10);
    // Eyes
    cube(x+0.65*s, y+1.35*s, z-0.09*s, 0.05*s,0.05*s,0.02*s, 0.10,0.05,0.00);
    cube(x+0.65*s, y+1.35*s, z+0.09*s, 0.05*s,0.05*s,0.02*s, 0.10,0.05,0.00);
    cube(x+0.66*s, y+1.35*s, z-0.09*s, 0.03*s,0.03*s,0.02*s, 1.00,1.00,1.00);
    cube(x+0.66*s, y+1.35*s, z+0.09*s, 0.03*s,0.03*s,0.02*s, 1.00,1.00,1.00);
    cube(x+0.67*s, y+1.35*s, z-0.09*s, 0.015*s,0.015*s,0.02*s,0.05,0.02,0.00);
    cube(x+0.67*s, y+1.35*s, z+0.09*s, 0.015*s,0.015*s,0.02*s,0.05,0.02,0.00);
    // Ears — on top of head
    cube(x+0.58*s, y+1.46*s, z-0.07*s, 0.04*s,0.09*s,0.03*s, 0.50,0.28,0.10);
    cube(x+0.58*s, y+1.46*s, z+0.07*s, 0.04*s,0.09*s,0.03*s, 0.50,0.28,0.10);

    // Mane — along neck
    cube(x+0.53*s, y+1.18*s, z-0.10*s, 0.04*s,0.16*s,0.03*s, 0.20,0.10,0.02);
    cube(x+0.48*s, y+1.03*s, z-0.10*s, 0.04*s,0.14*s,0.03*s, 0.20,0.10,0.02);
    cube(x+0.42*s, y+0.88*s, z-0.10*s, 0.04*s,0.12*s,0.03*s, 0.20,0.10,0.02);
    cube(x+0.36*s, y+0.74*s, z-0.10*s, 0.04*s,0.10*s,0.03*s, 0.20,0.10,0.02);

    // Tail — curves backward and down from rump
    cube(x-0.52*s, y+0.65*s, z,        0.05*s,0.18*s, 0.05*s, 0.20,0.10,0.02);
    cube(x-0.58*s, y+0.45*s, z,        0.05*s,0.20*s, 0.06*s, 0.20,0.10,0.02);
    cube(x-0.62*s, y+0.22*s, z,        0.05*s,0.22*s, 0.08*s, 0.20,0.10,0.02);

    // Front Left leg
    cube(x+0.30*s, y+0.22*s+a,  z-0.15*s, 0.10*s,0.28*s,0.10*s, 0.76,0.47,0.22);
    cube(x+0.30*s, y-0.10*s+a,  z-0.15*s, 0.08*s,0.20*s,0.08*s, 0.50,0.28,0.10);
    cube(x+0.30*s, y-0.28*s,    z-0.15*s, 0.10*s,0.05*s,0.12*s, 0.15,0.10,0.08);

    // Front Right leg
    cube(x+0.30*s, y+0.22*s+b2, z+0.15*s, 0.10*s,0.28*s,0.10*s, 0.76,0.47,0.22);
    cube(x+0.30*s, y-0.10*s+b2, z+0.15*s, 0.08*s,0.20*s,0.08*s, 0.50,0.28,0.10);
    cube(x+0.30*s, y-0.28*s,    z+0.15*s, 0.10*s,0.05*s,0.12*s, 0.15,0.10,0.08);

    // Back Left leg
    cube(x-0.30*s, y+0.22*s+b2, z-0.15*s, 0.10*s,0.28*s,0.10*s, 0.76,0.47,0.22);
    cube(x-0.30*s, y-0.10*s+b2, z-0.15*s, 0.08*s,0.20*s,0.08*s, 0.50,0.28,0.10);
    cube(x-0.30*s, y-0.28*s,    z-0.15*s, 0.10*s,0.05*s,0.12*s, 0.15,0.10,0.08);

    // Back Right leg
    cube(x-0.30*s, y+0.22*s+a,  z+0.15*s, 0.10*s,0.28*s,0.10*s, 0.76,0.47,0.22);
    cube(x-0.30*s, y-0.10*s+a,  z+0.15*s, 0.08*s,0.20*s,0.08*s, 0.50,0.28,0.10);
    cube(x-0.30*s, y-0.28*s,    z+0.15*s, 0.10*s,0.05*s,0.12*s, 0.15,0.10,0.08);
  }
}
