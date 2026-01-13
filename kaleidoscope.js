const canvas = document.getElementById("kaleidoscope");
const ctx = canvas.getContext("2d");

let w, h, cx, cy;
let rotation = 0;
let tiltX = 0;
let tiltY = 0;

const SEGMENTS = 12;
const SHAPE_COUNT = 40;
const shapes = [];

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  cx = w / 2;
  cy = h / 2;
}
window.addEventListener("resize", resize);
resize();

/* ---------- SHAPES ---------- */
function randomShape() {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    size: 10 + Math.random() * 20,
    speedX: (Math.random() - 0.5) * 0.6,
    speedY: (Math.random() - 0.5) * 0.6,
    type: ["square", "triangle", "star"][Math.floor(Math.random() * 3)],
    angle: Math.random() * Math.PI * 2
  };
}

for (let i = 0; i < SHAPE_COUNT; i++) {
  shapes.push(randomShape());
}

/* ---------- DRAWING ---------- */
function drawShape(s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.angle);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;

  if (s.type === "square") {
    ctx.strokeRect(-s.size / 2, -s.size / 2, s.size, s.size);
  }

  if (s.type === "triangle") {
    ctx.beginPath();
    ctx.moveTo(0, -s.size);
    ctx.lineTo(s.size, s.size);
    ctx.lineTo(-s.size, s.size);
    ctx.closePath();
    ctx.stroke();
  }

  if (s.type === "star") {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      let a = (i * 2 * Math.PI) / 5;
      let r = i % 2 === 0 ? s.size : s.size / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
}

/* ---------- ANIMATION ---------- */
function update() {
  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < SEGMENTS; i++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((Math.PI * 2 / SEGMENTS) * i + rotation);
    if (i % 2 === 0) ctx.scale(-1, 1);
    ctx.translate(-cx, -cy);

    shapes.forEach(s => drawShape(s));
    ctx.restore();
  }

  shapes.forEach(s => {
    s.x += s.speedX + tiltX * 0.05;
    s.y += s.speedY + tiltY * 0.05;
    s.angle += 0.01;

    if (s.x < 0 || s.x > w) s.speedX *= -1;
    if (s.y < 0 || s.y > h) s.speedY *= -1;
  });

  requestAnimationFrame(update);
}
update();

/* ---------- DEVICE SENSORS ---------- */
const btn = document.getElementById("sensorBtn");

btn.addEventListener("click", () => {
  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission().then(permission => {
      if (permission === "granted") {
        window.addEventListener("deviceorientation", handleOrientation);
        btn.style.display = "none";
      }
    });
  } else {
    window.addEventListener("deviceorientation", handleOrientation);
    btn.style.display = "none";
  }
});

function handleOrientation(e) {
  tiltX = e.gamma || 0;
  tiltY = e.beta || 0;
  rotation = tiltX * 0.01;
}

/* ---------- MOUSE (DESKTOP FALLBACK) ---------- */
window.addEventListener("mousemove", e => {
  const dx = e.clientX / w - 0.5;
  rotation = dx * Math.PI;
});
