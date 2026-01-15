/* =========================
   KALEIDOSCOPE.JS
   HANG-SAFE, ANDROID-SAFE
   ========================= */

var canvas = document.getElementById("kaleidoscope");
var ctx = canvas.getContext("2d");

var w, h, cx, cy;
var rotation = 0;
var tiltX = 0;
var tiltY = 0;

var SEGMENTS = 12;
var SHAPE_COUNT = 9;
var PADDING = 3;
var COLLISION_PASSES = 6;
var MAX_PLACEMENT_ATTEMPTS = 200;

var shapes = [];

/* ---------- RESIZE ---------- */
function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  cx = w / 2;
  cy = h / 2;
}
window.addEventListener("resize", resize);
resize();

/* ---------- STROKE PALETTE ---------- */
var STROKE_PALETTE = [200, 220, 245, 275, 40, 0];

/* ---------- SHAPE CREATION ---------- */
function randomShape() {
  var size = 26 + Math.random() * 18;
  return {
    x: cx + (Math.random() - 0.5) * 200,
    y: cy + (Math.random() - 0.5) * 200,
    size: size,
    r: size * 0.9,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.01,
    type: ["triangle", "rect", "hex"][Math.floor(Math.random() * 3)],
    hue: Math.random() * 360
  };
}

function initShapes() {
  shapes.length = 0;
  var attempts = 0;

  while (shapes.length < SHAPE_COUNT && attempts < MAX_PLACEMENT_ATTEMPTS) {
    attempts++;
    var s = randomShape();
    var ok = true;

    for (var i = 0; i < shapes.length; i++) {
      var o = shapes[i];
      var dx = s.x - o.x;
      var dy = s.y - o.y;
      if (Math.sqrt(dx * dx + dy * dy) < s.r + o.r + PADDING) {
        ok = false;
        break;
      }
    }
    if (ok) shapes.push(s);
  }

  /* graceful fallback */
  if (shapes.length === 0) {
    shapes.push(randomShape());
  }
}
initShapes();

/* ---------- DRAW HELPERS ---------- */
function setColor(h) {
  var strokeHue = STROKE_PALETTE[Math.floor(h / 60) % STROKE_PALETTE.length];
  ctx.fillStyle = "hsla(" + h + ",70%,55%,0.8)";
  ctx.strokeStyle = "hsla(" + strokeHue + ",45%,65%,1)";
  ctx.lineWidth = 2.0;
}

function drawTriangle(size) {
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.87, size * 0.5);
  ctx.lineTo(-size * 0.87, size * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawHex(size) {
  ctx.beginPath();
  for (var i = 0; i < 6; i++) {
    var a = i * Math.PI / 3;
    ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawShape(s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.angle);
  setColor(s.hue);

  if (s.type === "triangle") drawTriangle(s.size);
  else if (s.type === "hex") drawHex(s.size);
  else {
    ctx.fillRect(-s.size, -s.size * 0.6, s.size * 2, s.size * 1.2);
    ctx.strokeRect(-s.size, -s.size * 0.6, s.size * 2, s.size * 1.2);
  }

  ctx.restore();
}

/* ---------- COLLISIONS ---------- */
function solveCollisions() {
  for (var k = 0; k < COLLISION_PASSES; k++) {
    for (var i = 0; i < shapes.length; i++) {
      for (var j = i + 1; j < shapes.length; j++) {
        var a = shapes[i];
        var b = shapes[j];
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        var min = a.r + b.r + PADDING;

        if (d < min && d > 0.001) {
          var nx = dx / d;
          var ny = dy / d;
          var push = (min - d) * 0.5;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }
  }
}

/* ---------- CONSTRAINT ---------- */
function constrain(s) {
  var m = s.r + 6;
  if (s.x < m) s.x = m;
  if (s.x > w - m) s.x = w - m;
  if (s.y < m) s.y = m;
  if (s.y > h - m) s.y = h - m;
}

/* ---------- ANIMATION ---------- */
function update() {
  ctx.clearRect(0, 0, w, h);

  for (var i = 0; i < shapes.length; i++) {
    var s = shapes[i];
    s.x += tiltX * 0.06;
    s.y += tiltY * 0.06;
    s.angle += s.spin;
    s.hue = (s.hue + 0.08) % 360;
    constrain(s);
  }

  solveCollisions();

  for (var k = 0; k < SEGMENTS; k++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((Math.PI * 2 / SEGMENTS) * k + rotation);
    if (k % 2 === 0) ctx.scale(-1, 1);
    ctx.translate(-cx, -cy);

    for (var j = 0; j < shapes.length; j++) {
      drawShape(shapes[j]);
    }
    ctx.restore();
  }

  requestAnimationFrame(update);
}

/* ---------- INPUT ---------- */
var btn = document.getElementById("sensorBtn");

function handleOrientation(e) {
  tiltX = e.gamma || 0;
  tiltY = e.beta || 0;
  rotation = tiltX * 0.01;
}

if (btn) {
  btn.addEventListener("click", function () {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      DeviceOrientationEvent.requestPermission().then(function (p) {
        if (p === "granted") {
          window.addEventListener("deviceorientation", handleOrientation);
          btn.style.display = "none";
        }
      });
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
      btn.style.display = "none";
    }
  });
}

window.addEventListener("mousemove", function (e) {
  rotation = (e.clientX / w - 0.5) * Math.PI;
});

/* ---------- START ---------- */
update();
