const canvas = document.querySelector("[data-tree-canvas]");

if (canvas) {
  const ctx = canvas.getContext("2d");
  const trees = [];
  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.58,
    active: false,
    lastSpawn: 0,
    lastMove: 0
  };

  const config = {
    maxTrees: 22,
    spawnInterval: 90,
    fadeAlpha: 0.085,
    activeWindow: 140
  };

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function createTree(x, y, energy = 1) {
    const trunkHue = 120 + Math.random() * 35;
    trees.push({
      x,
      y,
      age: 0,
      life: 220 + Math.random() * 110,
      branches: [
        {
          x,
          y,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -1.8 - Math.random() * 1.4,
          width: 1.6 + energy * 2.2,
          depth: 0,
          brightness: 0.65 + Math.random() * 0.35
        }
      ],
      hue: trunkHue
    });

    if (trees.length > config.maxTrees) {
      trees.shift();
    }
  }

  function spawnFromPointer(now) {
    if (
      !pointer.active ||
      now - pointer.lastMove > config.activeWindow ||
      now - pointer.lastSpawn < config.spawnInterval
    ) {
      return;
    }

    pointer.lastSpawn = now;
    const spread = 10 + Math.random() * 24;
    createTree(
      pointer.x + (Math.random() - 0.5) * spread,
      pointer.y + 20 + Math.random() * 60,
      0.8 + Math.random() * 0.6
    );
  }

  function updateGlow() {
    document.body.style.setProperty("--glow-x", `${(pointer.x / window.innerWidth) * 100}%`);
    document.body.style.setProperty("--glow-y", `${(pointer.y / window.innerHeight) * 100}%`);
  }

  function drawBranch(tree, branch) {
    const sway = (pointer.x - branch.x) * 0.00045;
    const lift = (pointer.y - branch.y) * 0.00008;

    branch.vx += sway + (Math.random() - 0.5) * 0.014;
    branch.vy -= 0.004 - lift;
    branch.x += branch.vx;
    branch.y += branch.vy;
    branch.width *= 0.993;

    const alpha = Math.max(0.05, (tree.life - tree.age) / tree.life);
    ctx.lineWidth = branch.width;
    ctx.strokeStyle = `hsla(${tree.hue}, 44%, ${46 + branch.brightness * 28}%, ${alpha * 0.55})`;
    ctx.beginPath();
    ctx.moveTo(branch.x, branch.y);
    ctx.lineTo(branch.x - branch.vx * 3.4, branch.y - branch.vy * 3.4);
    ctx.stroke();

    if (branch.width > 0.68 && Math.random() < 0.038 + branch.depth * 0.01) {
      tree.branches.push({
        x: branch.x,
        y: branch.y,
        vx: branch.vx + (Math.random() - 0.5) * 1.5,
        vy: branch.vy - Math.random() * 0.35,
        width: branch.width * (0.72 + Math.random() * 0.08),
        depth: branch.depth + 1,
        brightness: Math.min(1, branch.brightness + 0.08)
      });
    }
  }

  function frame(now) {
    ctx.fillStyle = `rgba(2, 6, 11, ${config.fadeAlpha})`;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    spawnFromPointer(now);

    for (let treeIndex = trees.length - 1; treeIndex >= 0; treeIndex -= 1) {
      const tree = trees[treeIndex];
      tree.age += 1;

      for (let branchIndex = tree.branches.length - 1; branchIndex >= 0; branchIndex -= 1) {
        const branch = tree.branches[branchIndex];
        drawBranch(tree, branch);

        if (
          branch.width < 0.18 ||
          branch.y < -40 ||
          branch.x < -80 ||
          branch.x > window.innerWidth + 80
        ) {
          tree.branches.splice(branchIndex, 1);
        }
      }

      if (tree.age > tree.life || tree.branches.length === 0) {
        trees.splice(treeIndex, 1);
      }
    }

    requestAnimationFrame(frame);
  }

  function movePointer(clientX, clientY) {
    pointer.x = clientX;
    pointer.y = clientY;
    pointer.active = true;
    pointer.lastMove = performance.now();
    updateGlow();
  }

  resize();
  updateGlow();

  window.addEventListener("pointermove", (event) => {
    movePointer(event.clientX, event.clientY);
  });

  window.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      movePointer(touch.clientX, touch.clientY);
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pointer.active = false;
    }
  });

  window.addEventListener("resize", resize);

  requestAnimationFrame(frame);
}
