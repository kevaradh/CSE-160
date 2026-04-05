function drawVector(v, color) {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  var centerX = 200;
  var centerY = 200;
  var scale = 20;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + v.elements[0] * scale,
             centerY - v.elements[1] * scale);
  ctx.stroke();
}

function angleBetween(v1, v2) {
  var dot = Vector3.dot(v1, v2);
  var mag1 = v1.magnitude();
  var mag2 = v2.magnitude();
  var cosAngle = dot / (mag1 * mag2);
  var angleRad = Math.acos(cosAngle);
  return angleRad * (180 / Math.PI); // convert to degrees
}

function areaTriangle(v1, v2) {
  var cross = Vector3.cross(v1, v2);
  return cross.magnitude() / 2;
}

function handleDrawEvent() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  // Step 1: Clear the canvas
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);

  // Step 2: Read x and y from input boxes
  var x = parseFloat(document.getElementById('v1x').value);
  var y = parseFloat(document.getElementById('v1y').value);

  // Step 3: Create v1 and draw it
  var v1 = new Vector3([x, y, 0]);
  drawVector(v1, "red");

  var x2 = parseFloat(document.getElementById('v2x').value);
  var y2 = parseFloat(document.getElementById('v2y').value);
  var v2 = new Vector3([x2, y2, 0]);
  drawVector(v2, "blue");

}

function handleDrawOperationEvent() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  // 1. Clear canvas
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);

  // 2. Read and draw v1
  var x1 = parseFloat(document.getElementById('v1x').value);
  var y1 = parseFloat(document.getElementById('v1y').value);
  var v1 = new Vector3([x1, y1, 0]);
  drawVector(v1, "red");

  // 3. Read and draw v2
  var x2 = parseFloat(document.getElementById('v2x').value);
  var y2 = parseFloat(document.getElementById('v2y').value);
  var v2 = new Vector3([x2, y2, 0]);
  drawVector(v2, "blue");

  // 4. Read operation and scalar
  var op = document.getElementById('operation').value;
  var scalar = parseFloat(document.getElementById('scalar').value);

  if (op === 'add') {
    var v3 = new Vector3([x1, y1, 0]);
    v3.add(v2);
    drawVector(v3, "green");

  } else if (op === 'sub') {
    var v3 = new Vector3([x1, y1, 0]);
    v3.sub(v2);
    drawVector(v3, "green");

  } else if (op === 'mul') {
    var v3 = new Vector3([x1, y1, 0]);
    v3.mul(scalar);
    var v4 = new Vector3([x2, y2, 0]);
    v4.mul(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");

  } else if (op === 'div') {
    var v3 = new Vector3([x1, y1, 0]);
    v3.div(scalar);
    var v4 = new Vector3([x2, y2, 0]);
    v4.div(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");
  
  } else if (op === 'magnitude') {
    console.log("Magnitude of v1: " + v1.magnitude());
    console.log("Magnitude of v2: " + v2.magnitude());

  } else if (op === 'normalize') {
    console.log("Magnitude of v1: " + v1.magnitude());
    console.log("Magnitude of v2: " + v2.magnitude());
    var v3 = new Vector3([x1, y1, 0]);
    var v4 = new Vector3([x2, y2, 0]);
    v3.normalize();
    v4.normalize();
    drawVector(v3, "green");
    drawVector(v4, "green");
  } else if (op === 'angle') {
    var angle = angleBetween(v1, v2);
    console.log("Angle between v1 and v2: " + angle + " degrees");

  } else if (op === 'area') {
    var area = areaTriangle(v1, v2);
    console.log("Area of triangle: " + area);
  }
}



function main() {
  var canvas = document.getElementById('example');
  if (!canvas) {
    console.log('Failed to retrieve the canvas element');
    return;
  }

  var ctx = canvas.getContext('2d');

  // Clear canvas - black background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);

  // Create vector v1
  var v1 = new Vector3([2.25, 2.25, 0]);

  // Draw v1 in red
  drawVector(v1, "red");
}

main();
