const intro = document.querySelector(".cinematic-intro");
const canvas = document.querySelector("#ventureScene");
const scanner = document.querySelector("#dealScanner");
const scannerStage = document.querySelector("#scannerStage");
const scannerSignal = document.querySelector("#scannerSignal");

if (intro && canvas) {
  const startDealFlowGalaxy = async () => {
    let THREE;

    try {
      THREE = await import("https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js");
    } catch (error) {
      console.error("The RCVC Deal Flow Galaxy could not load Three.js.", error);
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const colorValue = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const themeColors = () => ({
      accent: new THREE.Color(colorValue("--cp-accent")),
      border: new THREE.Color(colorValue("--cp-border-strong")),
      surface: new THREE.Color(colorValue("--cp-surface")),
      text: new THREE.Color(colorValue("--cp-text"))
    });

    let colors = themeColors();
    let renderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });
    } catch (error) {
      console.error("The RCVC Deal Flow Galaxy requires WebGL.", error);
      return;
    }

    renderer.setClearColor(colors.text, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, 1, .1, 80);
    camera.position.set(0, 0, 14.5);

    let randomState = 739391;
    const random = () => {
      randomState = randomState * 16807 % 2147483647;
      return (randomState - 1) / 2147483646;
    };
    const range = (min, max) => min + (max - min) * random();
    const clamp = value => Math.max(0, Math.min(1, value));
    const smoothstep = value => value * value * (3 - 2 * value);

    const stages = {
      seed: {
        label: "Seed",
        geometry: new THREE.TorusGeometry(.061, .011, 5, 18),
        portfolio: false
      },
      seriesA: {
        label: "Series A",
        geometry: new THREE.OctahedronGeometry(.078, 0),
        portfolio: false
      },
      growth: {
        label: "Growth",
        geometry: new THREE.RingGeometry(.057, .082, 6),
        portfolio: false
      },
      portfolio: {
        label: "Portfolio",
        geometry: new THREE.SphereGeometry(.067, 12, 8),
        portfolio: true
      }
    };

    const chooseStage = value => {
      if (value < .43) return "seed";
      if (value < .73) return "seriesA";
      if (value < .9) return "growth";
      return "portfolio";
    };

    const companyCount = coarsePointer ? 96 : 180;
    const companies = [];
    const stageBuckets = Object.fromEntries(Object.keys(stages).map(key => [key, []]));

    for (let index = 0; index < companyCount; index += 1) {
      const angle = random() * Math.PI * 2;
      const radius = Math.pow(random(), .62) * 8.8;
      const stage = chooseStage(random());
      const base = new THREE.Vector3(
        Math.cos(angle) * radius + range(-.32, .32),
        Math.sin(angle) * radius * .52 + range(-.22, .22),
        range(-4.2, 1.6)
      );
      const company = {
        base,
        current: base.clone(),
        index,
        instanceIndex: stageBuckets[stage].length,
        phase: range(0, Math.PI * 2),
        reveal: stages[stage].portfolio ? .05 : 0,
        score: Math.round(range(58, 98)),
        size: range(.76, 1.36) * (stages[stage].portfolio ? 1.14 : 1),
        stage
      };
      companies.push(company);
      stageBuckets[stage].push(company);
    }

    const stageMeshes = {};
    Object.entries(stages).forEach(([key, stage]) => {
      const baseMaterial = new THREE.MeshBasicMaterial({
        color: stage.portfolio ? colors.accent : colors.border,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: stage.portfolio ? .72 : .48,
        depthWrite: false
      });
      const glowMaterial = new THREE.MeshBasicMaterial({
        blending: THREE.AdditiveBlending,
        color: colors.accent,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: stage.portfolio ? .82 : .64,
        depthWrite: false
      });
      const base = new THREE.InstancedMesh(stage.geometry, baseMaterial, stageBuckets[key].length);
      const glow = new THREE.InstancedMesh(stage.geometry, glowMaterial, stageBuckets[key].length);
      base.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      glow.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      base.frustumCulled = false;
      glow.frustumCulled = false;
      base.renderOrder = 2;
      glow.renderOrder = 3;
      scene.add(base, glow);
      stageMeshes[key] = { base, baseMaterial, glow, glowMaterial };
    });

    const edgeKeys = new Set();
    const edges = [];
    companies.forEach((company, index) => {
      companies
        .map((candidate, candidateIndex) => ({
          candidateIndex,
          distance: company.base.distanceTo(candidate.base)
        }))
        .filter(item => item.candidateIndex !== index && item.distance < 2.45)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2)
        .forEach(({ candidateIndex }) => {
          const from = Math.min(index, candidateIndex);
          const to = Math.max(index, candidateIndex);
          const key = `${from}:${to}`;
          if (edgeKeys.has(key)) return;
          edgeKeys.add(key);
          edges.push({ from, to });
        });
    });

    const edgePositions = new Float32Array(edges.length * 6);
    const edgeGeometry = new THREE.BufferGeometry();
    const edgePositionAttribute = new THREE.BufferAttribute(edgePositions, 3);
    edgePositionAttribute.setUsage(THREE.DynamicDrawUsage);
    edgeGeometry.setAttribute("position", edgePositionAttribute);
    edgeGeometry.setDrawRange(0, 0);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: colors.accent,
      transparent: true,
      opacity: .38,
      depthWrite: false
    });
    const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edgeLines.renderOrder = 1;
    scene.add(edgeLines);

    const dustCount = coarsePointer ? 150 : 320;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let index = 0; index < dustPositions.length; index += 3) {
      const angle = random() * Math.PI * 2;
      const radius = Math.pow(random(), .54) * 10;
      dustPositions[index] = Math.cos(angle) * radius;
      dustPositions[index + 1] = Math.sin(angle) * radius * .52;
      dustPositions[index + 2] = range(-6, 1);
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: colors.border,
      size: .018,
      transparent: true,
      opacity: .28,
      depthWrite: false
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    const raycaster = new THREE.Raycaster();
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector3(24, 24, 0);
    const pointerWorld = pointerTarget.clone();
    const matrix = new THREE.Matrix4();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const midpoint = new THREE.Vector3();
    const lineStart = new THREE.Vector3();
    const lineEnd = new THREE.Vector3();
    const revealRadius = 2.18;
    let pointerActive = false;
    let visible = true;
    let frameId = 0;
    let elapsedBeforePause = 0;
    let startedAt = performance.now();

    const resetScannerCopy = () => {
      if (scannerStage) scannerStage.textContent = "Scan deal flow";
      if (scannerSignal) scannerSignal.textContent = "Move to source";
    };

    const updatePointerTarget = () => {
      if (!pointerActive) return;
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(interactionPlane, pointerTarget);
    };

    const setPointer = event => {
      const rect = intro.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) {
        return;
      }

      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pointerActive = true;
      updatePointerTarget();

      if (scanner) {
        scanner.style.left = `${event.clientX - rect.left}px`;
        scanner.style.top = `${event.clientY - rect.top}px`;
        scanner.classList.add("active");
      }

      if (reducedMotion) render(performance.now());
    };

    const resetPointer = () => {
      pointerActive = false;
      pointer.set(0, 0);
      pointerTarget.set(24, 24, 0);
      scanner?.classList.remove("active");
      resetScannerCopy();
      if (reducedMotion) render(performance.now());
    };

    intro.addEventListener("pointermove", setPointer, { passive: true });
    intro.addEventListener("pointerleave", resetPointer);

    const resize = () => {
      const width = intro.clientWidth;
      const height = intro.clientHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      if (reducedMotion) render(performance.now());
    };

    const applyTheme = () => {
      colors = themeColors();
      renderer.setClearColor(colors.text, 0);
      dustMaterial.color.copy(colors.border);
      edgeMaterial.color.copy(colors.accent);
      Object.entries(stageMeshes).forEach(([key, meshes]) => {
        meshes.baseMaterial.color.copy(stages[key].portfolio ? colors.accent : colors.border);
        meshes.glowMaterial.color.copy(colors.accent);
      });
      if (reducedMotion) render(performance.now());
    };

    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });

    const updateCompanies = elapsed => {
      const shouldScan = pointerActive || coarsePointer;
      let strongest = null;
      let strongestProximity = 0;
      let nearbyCount = 0;

      companies.forEach(company => {
        const drift = reducedMotion ? 0 : Math.sin(elapsed * .32 + company.phase) * .08;
        company.current.set(
          company.base.x + Math.cos(elapsed * .17 + company.phase) * drift,
          company.base.y + Math.sin(elapsed * .22 + company.phase) * .08,
          company.base.z + Math.sin(elapsed * .15 + company.phase) * .13
        );

        const distance = Math.hypot(
          company.current.x - pointerWorld.x,
          company.current.y - pointerWorld.y
        );
        const proximity = shouldScan
          ? smoothstep(clamp(1 - distance / revealRadius))
          : 0;
        company.reveal += (proximity - company.reveal) * (reducedMotion ? 1 : .12);

        if (proximity > .045) nearbyCount += 1;
        if (proximity > strongestProximity) {
          strongest = company;
          strongestProximity = proximity;
        }
      });

      companies.forEach(company => {
        const stage = stages[company.stage];
        const meshes = stageMeshes[company.stage];
        const depthScale = .82 + clamp((company.current.z + 4.2) / 5.8) * .42;
        const isStrongest = company === strongest && strongestProximity > .08;
        const baseScale = company.size * depthScale *
          (1 + company.reveal * .28 + (isStrongest ? company.reveal * .92 : 0));

        if (company.stage === "seriesA") {
          rotation.set(
            elapsed * .14 + company.phase,
            elapsed * .18 + company.phase * .7,
            Math.PI * .25
          );
        } else if (company.stage === "portfolio") {
          rotation.set(0, 0, 0);
        } else {
          rotation.set(
            Math.sin(elapsed * .16 + company.phase) * .16,
            Math.cos(elapsed * .13 + company.phase) * .13,
            company.phase + elapsed * .025
          );
        }
        quaternion.setFromEuler(rotation);

        scale.setScalar(baseScale);
        matrix.compose(company.current, quaternion, scale);
        meshes.base.setMatrixAt(company.instanceIndex, matrix);

        const glowScale = company.reveal > .012
          ? baseScale * (1.12 + company.reveal * 1.55)
          : .001;
        scale.setScalar(glowScale);
        matrix.compose(company.current, quaternion, scale);
        meshes.glow.setMatrixAt(company.instanceIndex, matrix);
      });

      Object.values(stageMeshes).forEach(meshes => {
        meshes.base.instanceMatrix.needsUpdate = true;
        meshes.glow.instanceMatrix.needsUpdate = true;
      });

      if (pointerActive && strongest && nearbyCount > 0) {
        canvas.dataset.strongestStage = strongest.stage;
        if (scannerStage) {
          scannerStage.textContent = `${stages[strongest.stage].label} / Signal ${strongest.score}`;
        }
        if (scannerSignal) {
          scannerSignal.textContent = `${nearbyCount} ${nearbyCount === 1 ? "company" : "companies"} in range`;
        }
      } else {
        delete canvas.dataset.strongestStage;
      }
    };

    const updateEdges = () => {
      let activeEdgeCount = 0;

      edges.forEach(edge => {
        const from = companies[edge.from];
        const to = companies[edge.to];
        const strength = Math.min(from.reveal, to.reveal);
        if (strength < .055) return;

        const growth = smoothstep(clamp((strength - .055) / .58));
        midpoint.copy(from.current).add(to.current).multiplyScalar(.5);
        lineStart.copy(midpoint).lerp(from.current, growth);
        lineEnd.copy(midpoint).lerp(to.current, growth);

        const offset = activeEdgeCount * 6;
        edgePositions[offset] = lineStart.x;
        edgePositions[offset + 1] = lineStart.y;
        edgePositions[offset + 2] = lineStart.z;
        edgePositions[offset + 3] = lineEnd.x;
        edgePositions[offset + 4] = lineEnd.y;
        edgePositions[offset + 5] = lineEnd.z;
        activeEdgeCount += 1;
      });

      edgePositionAttribute.needsUpdate = true;
      edgeGeometry.setDrawRange(0, activeEdgeCount * 2);
      canvas.dataset.activeConnections = String(activeEdgeCount);
    };

    const render = now => {
      if (!visible) return;

      const elapsed = elapsedBeforePause + (now - startedAt) / 1000;
      if (!reducedMotion) {
        const cameraTargetX = pointerActive ? pointer.x * .38 : 0;
        const cameraTargetY = pointerActive ? pointer.y * .22 : 0;
        camera.position.x += (cameraTargetX - camera.position.x) * .025;
        camera.position.y += (cameraTargetY - camera.position.y) * .025;
        camera.lookAt(0, 0, 0);
        dust.rotation.z = elapsed * .004;
        dust.rotation.y = Math.sin(elapsed * .08) * .025;
      }

      if (coarsePointer) {
        pointerTarget.set(
          Math.sin(elapsed * .31) * 4.5,
          Math.cos(elapsed * .24) * 2.25,
          0
        );
      } else {
        updatePointerTarget();
      }

      pointerWorld.lerp(pointerTarget, reducedMotion ? 1 : .1);
      updateCompanies(elapsed);
      updateEdges();
      renderer.render(scene, camera);

      if (!reducedMotion) frameId = requestAnimationFrame(render);
    };

    const visibilityObserver = new IntersectionObserver(entries => {
      const isVisible = entries[0]?.isIntersecting ?? true;
      if (isVisible === visible) return;

      visible = isVisible;
      if (visible) {
        startedAt = performance.now();
        frameId = requestAnimationFrame(render);
      } else {
        elapsedBeforePause += (performance.now() - startedAt) / 1000;
        cancelAnimationFrame(frameId);
      }
    }, { threshold: .01 });

    resize();
    window.addEventListener("resize", resize);
    visibilityObserver.observe(intro);
    canvas.dataset.companyCount = String(companyCount);
    intro.classList.add("scene-ready");
    render(performance.now());
  };

  startDealFlowGalaxy();
}
