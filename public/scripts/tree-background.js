const canvas = document.querySelector("[data-tree-canvas]");

if (canvas) {
  const ctx = canvas.getContext("2d");
  const segments = [];
  let themeColors = getThemeColors(document.documentElement.dataset.theme || "dark");
  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.58,
    lastX: null,
    lastY: null,
    lastAngle: -Math.PI / 2,
    lastSpawn: 0
  };

  const config = {
    spawnInterval: 26,
    minDistance: 10,
    fadeAlpha: 0.075,
    branchFadeStep: 0.016,
    branchScaleExponent: 2.3,
    maxSegments: 900,
    catchUpFactor: 0.78,
    trunkJitter: 10
  };

  function getThemeColors(theme) {
    if (theme === "light") {
      return {
        fadeRgb: "244, 239, 230",
        inkRgb: "84, 70, 52",
        highlightRgb: "150, 126, 92"
      };
    }

    return {
      fadeRgb: "2, 6, 11",
      inkRgb: "132, 150, 126",
      highlightRgb: "214, 226, 205"
    };
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  function scaleChildWidth(width, childCount) {
    return width / Math.pow(childCount, 1 / config.branchScaleExponent);
  }

  function pushSegment(segment) {
    segments.push(segment);

    if (segments.length > config.maxSegments) {
      segments.splice(0, segments.length - config.maxSegments);
    }
  }

  function addSegment(x1, y1, x2, y2, width, opacity, bend) {
    const controlX = x1 + (x2 - x1) * 0.5 + bend * (y2 - y1) * 0.35;
    const controlY = y1 + (y2 - y1) * 0.5 - bend * (x2 - x1) * 0.35;

    pushSegment({
      x1,
      y1,
      cx: controlX,
      cy: controlY,
      x2,
      y2,
      width,
      opacity,
      age: 0
    });
  }

  function branchOut(originX, originY, angle, width, length, depth, sideBias) {
    if (depth <= 0 || width < 0.5 || length < 6) {
      return;
    }

    const splitCount = 1 + (Math.random() > 0.55 ? 1 : 0) + (depth > 1 && Math.random() > 0.8 ? 1 : 0);

    for (let index = 0; index < splitCount; index += 1) {
      const side = splitCount === 1
        ? sideBias * (Math.random() > 0.35 ? 1 : -1)
        : index - (splitCount - 1) / 2;
      const nextAngle = angle + side * (0.2 + Math.random() * 0.55) + (Math.random() - 0.5) * 0.34;
      const elongation = Math.random() > 0.72 ? 1.8 + Math.random() * 1.4 : 1;
      const nextLength = length * (0.32 + Math.random() * 0.58) * elongation;
      const nextWidth = scaleChildWidth(width * (0.7 + Math.random() * 0.16), splitCount);
      const endX = originX + Math.cos(nextAngle) * nextLength;
      const endY = originY + Math.sin(nextAngle) * nextLength;

      addSegment(
        originX,
        originY,
        endX,
        endY,
        nextWidth,
        0.12 + Math.random() * 0.08,
        side * (0.02 + Math.random() * 0.34)
      );

      branchOut(endX, endY, nextAngle, nextWidth, nextLength * (0.82 + Math.random() * 0.08), depth - 1, side || sideBias);
    }
  }

  function createOffshoots(originX, originY, angle, trunkWidth, energy) {
    const branchCount = energy > 1.35 ? 2 : 1;

    for (let index = 0; index < branchCount; index += 1) {
      const side = branchCount === 1 ? (Math.random() > 0.5 ? 1 : -1) : index === 0 ? -1 : 1;
      const spread = 0.22 + Math.random() * 0.74;
      const branchAngle = angle + side * spread + (Math.random() - 0.5) * 0.38;
      const elongation = Math.random() > 0.68 ? 1.9 + Math.random() * 1.2 : 1;
      const branchLength = (8 + energy * (6 + Math.random() * 10) + Math.random() * 24) * elongation;
      const childCount = energy > 1.4 ? 2 : 1;
      const baseWidth = scaleChildWidth(trunkWidth * 0.82, childCount);
      const endX = originX + Math.cos(branchAngle) * branchLength;
      const endY = originY + Math.sin(branchAngle) * branchLength;

      addSegment(
        originX,
        originY,
        endX,
        endY,
        baseWidth,
        0.2,
        side * (0.05 + Math.random() * 0.44)
      );

      if (baseWidth > 0.9) {
        const twigAngle = branchAngle + side * (0.08 + Math.random() * 0.5) + (Math.random() - 0.5) * 0.32;
        const twigElongation = Math.random() > 0.75 ? 1.7 + Math.random() * 1.1 : 1;
        const twigLength = branchLength * (0.24 + Math.random() * 0.42) * twigElongation;
        addSegment(
          endX,
          endY,
          endX + Math.cos(twigAngle) * twigLength,
          endY + Math.sin(twigAngle) * twigLength,
          baseWidth * 0.62,
          0.16,
          side * (0.03 + Math.random() * 0.28)
        );
      }

      branchOut(
        endX,
        endY,
        branchAngle,
        baseWidth * 0.82,
        branchLength * (0.52 + Math.random() * 0.24),
        2,
        side
      );
    }
  }

  function updateGlow() {
    document.body.style.setProperty("--glow-x", `${(pointer.x / window.innerWidth) * 100}%`);
    document.body.style.setProperty("--glow-y", `${(pointer.y / window.innerHeight) * 100}%`);
  }

  function drawSegment(segment) {
    ctx.beginPath();
    ctx.moveTo(segment.x1, segment.y1);
    ctx.quadraticCurveTo(segment.cx, segment.cy, segment.x2, segment.y2);
    ctx.stroke();
  }

  function frame() {
    ctx.fillStyle = `rgba(${themeColors.fadeRgb}, ${config.fadeAlpha})`;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    for (let index = segments.length - 1; index >= 0; index -= 1) {
      const segment = segments[index];
      segment.age += 1;
      segment.opacity -= config.branchFadeStep;

      if (segment.opacity <= 0 || segment.width <= 0.08) {
        segments.splice(index, 1);
        continue;
      }

      ctx.lineCap = "round";
      ctx.lineWidth = segment.width;
      ctx.strokeStyle = `rgba(${themeColors.inkRgb}, ${segment.opacity})`;
      drawSegment(segment);

      if (segment.width < 1.35) {
        ctx.lineWidth = Math.max(0.28, segment.width * 0.45);
        ctx.strokeStyle = `rgba(${themeColors.highlightRgb}, ${segment.opacity * 0.08})`;
        drawSegment(segment);
      }
    }

    requestAnimationFrame(frame);
  }

  function growBranch(clientX, clientY) {
    const hasPreviousPoint = pointer.lastX !== null && pointer.lastY !== null;
    const now = performance.now();

    pointer.x = clientX;
    pointer.y = clientY;
    updateGlow();

    if (!hasPreviousPoint) {
      pointer.lastX = clientX;
      pointer.lastY = clientY;
      return;
    }

    const dx = clientX - pointer.lastX;
    const dy = clientY - pointer.lastY;
    const distance = Math.hypot(dx, dy);

    if (distance < config.minDistance || now - pointer.lastSpawn < config.spawnInterval) {
      return;
    }

    const angle = Math.atan2(dy, dx);
    const smoothAngle = pointer.lastAngle * 0.35 + angle * 0.65 + (Math.random() - 0.5) * 0.18;
    const energy = Math.min(1.7, 0.75 + distance / 20);
    const width = 1.8 + energy * 2.3;
    const targetX = pointer.lastX + dx * config.catchUpFactor;
    const targetY = pointer.lastY + dy * config.catchUpFactor;
    const segmentLength = Math.min(18, distance * 0.34);
    const normalAngle = smoothAngle + Math.PI / 2;
    const jitterMultiplier = Math.random() > 0.62 ? 2.2 + Math.random() * 2.4 : 1;
    const jitter = (Math.random() - 0.5) * 2 * config.trunkJitter * jitterMultiplier;
    const endX =
      targetX +
      Math.cos(smoothAngle) * segmentLength +
      Math.cos(normalAngle) * jitter;
    const endY =
      targetY +
      Math.sin(smoothAngle) * segmentLength +
      Math.sin(normalAngle) * jitter;

    addSegment(
      pointer.lastX,
      pointer.lastY,
      endX,
      endY,
      width,
      0.34,
      (Math.random() - 0.5) * 0.42
    );

    createOffshoots(endX, endY, smoothAngle, width, energy);

    pointer.lastSpawn = now;
    pointer.lastAngle = smoothAngle;
    pointer.lastX = endX;
    pointer.lastY = endY;
  }

  resize();
  updateGlow();

  window.addEventListener("pointermove", (event) => {
    growBranch(event.clientX, event.clientY);
  });

  window.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      growBranch(touch.clientX, touch.clientY);
    },
    { passive: true }
  );

  window.addEventListener("pointerup", () => {
    pointer.lastX = null;
    pointer.lastY = null;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pointer.lastX = null;
      pointer.lastY = null;
    }
  });

  window.addEventListener("themechange", (event) => {
    themeColors = getThemeColors(event.detail.theme);
    for (const segment of segments) {
      segment.opacity = Math.max(segment.opacity, 0.22);
    }
    clearCanvas();
  });

  window.addEventListener("resize", resize);

  requestAnimationFrame(frame);
}
