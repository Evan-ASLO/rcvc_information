const intro = document.querySelector(".cinematic-intro");
const canvas = document.querySelector("#ventureScene");

if (intro && canvas) {
  const startVentureScene = async () => {
    let THREE;

    try {
      THREE = await import("https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js");
    } catch (error) {
      console.error("The RCVC venture signal scene could not load Three.js.", error);
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
      console.error("The RCVC venture signal scene requires WebGL.", error);
      return;
    }

    renderer.setClearColor(colors.text, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 80);
    camera.position.set(0, 0, 13);

    const field = new THREE.Group();
    scene.add(field);

    const ambientLight = new THREE.AmbientLight(colors.surface, 1.8);
    const signalLight = new THREE.PointLight(colors.accent, 22, 18, 1.7);
    signalLight.position.set(3, 1, 5);
    scene.add(ambientLight, signalLight);

    let randomState = 48271;
    const random = () => {
      randomState = randomState * 16807 % 2147483647;
      return (randomState - 1) / 2147483646;
    };
    const range = (min, max) => min + (max - min) * random();
    const smoothstep = value => value * value * (3 - 2 * value);

    const nodeGeometry = new THREE.IcosahedronGeometry(.11, 1);
    const haloGeometry = new THREE.RingGeometry(.16, .185, 32);
    const nodes = [];
    const nodeCount = coarsePointer ? 24 : 38;

    for (let index = 0; index < nodeCount; index += 1) {
      const anchor = index < 7;
      const base = new THREE.Vector3(
        range(-6.6, 6.6) + (index % 3 === 0 ? 1.1 : 0),
        range(-3.5, 3.5),
        range(-2.4, 1.6)
      );
      const scale = range(.65, 1.45) * (anchor ? 1.22 : 1);
      const material = new THREE.MeshStandardMaterial({
        color: anchor ? colors.surface : colors.border,
        emissive: colors.accent,
        emissiveIntensity: anchor ? .42 : .08,
        metalness: .24,
        roughness: .34,
        transparent: true,
        opacity: anchor ? .48 : .035,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(nodeGeometry, material);
      mesh.position.copy(base);
      mesh.scale.setScalar(scale);

      const haloMaterial = new THREE.MeshBasicMaterial({
        color: colors.accent,
        transparent: true,
        opacity: anchor ? .09 : 0,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const halo = new THREE.Mesh(haloGeometry, haloMaterial);
      halo.position.copy(base);
      halo.scale.setScalar(scale);
      halo.lookAt(camera.position);

      const node = {
        anchor,
        base,
        halo,
        mesh,
        phase: range(0, Math.PI * 2),
        reveal: anchor ? .18 : 0,
        scale
      };
      nodes.push(node);
      field.add(mesh, halo);
    }

    const edges = [];
    nodes.forEach((node, index) => {
      const nearby = nodes
        .map((candidate, candidateIndex) => ({
          candidateIndex,
          distance: node.base.distanceTo(candidate.base)
        }))
        .filter(item => item.candidateIndex > index && item.distance < 3.8)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2);

      nearby.forEach(({ candidateIndex }) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          node.base,
          nodes[candidateIndex].base
        ]);
        const material = new THREE.LineBasicMaterial({
          color: colors.accent,
          transparent: true,
          opacity: .018,
          depthWrite: false
        });
        const line = new THREE.Line(geometry, material);
        edges.push({ from: index, to: candidateIndex, geometry, line, material });
        field.add(line);
      });
    });

    const coreMaterial = new THREE.MeshStandardMaterial({
      color: colors.surface,
      emissive: colors.accent,
      emissiveIntensity: .54,
      metalness: .45,
      roughness: .2,
      transparent: true,
      opacity: .7
    });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.72, 2), coreMaterial);
    core.position.set(2.65, .18, -.2);
    field.add(core);

    const rings = [1.12, 1.52, 2.02].map((radius, index) => {
      const material = new THREE.MeshBasicMaterial({
        color: index === 1 ? colors.accent : colors.border,
        transparent: true,
        opacity: index === 1 ? .22 : .12,
        depthWrite: false
      });
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, .009, 8, 96),
        material
      );
      ring.position.copy(core.position);
      ring.rotation.set(
        Math.PI * (.18 + index * .16),
        Math.PI * (.12 + index * .21),
        index * .7
      );
      field.add(ring);
      return { material, ring };
    });

    const dustPositions = new Float32Array((coarsePointer ? 90 : 170) * 3);
    for (let index = 0; index < dustPositions.length; index += 3) {
      dustPositions[index] = range(-8.5, 8.5);
      dustPositions[index + 1] = range(-4.8, 4.8);
      dustPositions[index + 2] = range(-4, 1);
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: colors.border,
      size: .022,
      transparent: true,
      opacity: .32,
      depthWrite: false
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    field.add(dust);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointerWorld = new THREE.Vector3(20, 20, 0);
    const pointerTarget = new THREE.Vector3(20, 20, 0);
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    let pointerActive = false;
    let visible = true;
    let frameId = 0;
    let elapsedBeforePause = 0;
    let startedAt = performance.now();

    const setPointer = event => {
      const rect = intro.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) {
        pointerActive = false;
        return;
      }

      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(interactionPlane, pointerTarget);
      pointerActive = true;
    };

    const resetPointer = () => {
      pointerActive = false;
      pointer.set(0, 0);
    };

    intro.addEventListener("pointermove", setPointer, { passive: true });
    intro.addEventListener("pointerleave", resetPointer);

    const resize = () => {
      const width = intro.clientWidth;
      const height = intro.clientHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const applyTheme = () => {
      colors = themeColors();
      ambientLight.color.copy(colors.surface);
      signalLight.color.copy(colors.accent);
      coreMaterial.color.copy(colors.surface);
      coreMaterial.emissive.copy(colors.accent);
      dustMaterial.color.copy(colors.border);
      nodes.forEach(node => {
        node.mesh.material.color.copy(node.anchor ? colors.surface : colors.border);
        node.mesh.material.emissive.copy(colors.accent);
        node.halo.material.color.copy(colors.accent);
      });
      edges.forEach(edge => edge.material.color.copy(colors.accent));
      rings.forEach((item, index) => item.material.color.copy(index === 1 ? colors.accent : colors.border));
    };

    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });

    const updateEdges = () => {
      edges.forEach(edge => {
        const fromNode = nodes[edge.from];
        const toNode = nodes[edge.to];
        const positions = edge.geometry.attributes.position.array;
        positions[0] = fromNode.mesh.position.x;
        positions[1] = fromNode.mesh.position.y;
        positions[2] = fromNode.mesh.position.z;
        positions[3] = toNode.mesh.position.x;
        positions[4] = toNode.mesh.position.y;
        positions[5] = toNode.mesh.position.z;
        edge.geometry.attributes.position.needsUpdate = true;
        edge.material.opacity = .012 + Math.max(fromNode.reveal, toNode.reveal) * .42;
      });
    };

    const render = now => {
      if (!visible) return;

      const elapsed = elapsedBeforePause + (now - startedAt) / 1000;
      const autoScan = coarsePointer || !pointerActive;

      if (autoScan) {
        pointerTarget.set(
          Math.sin(elapsed * .34) * 4.8,
          Math.cos(elapsed * .27) * 2.4,
          0
        );
      }
      pointerWorld.lerp(pointerTarget, reducedMotion ? 1 : .075);
      signalLight.position.set(pointerWorld.x, pointerWorld.y, 4.4);

      nodes.forEach((node, index) => {
        const drift = reducedMotion ? 0 : Math.sin(elapsed * .36 + node.phase) * .12;
        node.mesh.position.set(
          node.base.x + Math.cos(elapsed * .21 + node.phase) * drift,
          node.base.y + drift,
          node.base.z + Math.sin(elapsed * .18 + index) * .07
        );
        node.halo.position.copy(node.mesh.position);

        const distance = node.mesh.position.distanceTo(pointerWorld);
        const proximity = smoothstep(Math.max(0, Math.min(1, 1 - distance / 3.15)));
        node.reveal += (proximity - node.reveal) * (reducedMotion ? 1 : .085);
        const reveal = node.anchor ? Math.max(.16, node.reveal) : node.reveal;
        node.mesh.material.opacity = (node.anchor ? .3 : .025) + reveal * .74;
        node.mesh.material.emissiveIntensity = (node.anchor ? .3 : .04) + reveal * 1.8;
        node.halo.material.opacity = reveal * .34;
        const activeScale = node.scale * (1 + reveal * .62);
        node.mesh.scale.setScalar(activeScale);
        node.halo.scale.setScalar(node.scale * (1 + reveal * 1.4));
      });

      updateEdges();

      if (!reducedMotion) {
        core.rotation.x = elapsed * .13;
        core.rotation.y = elapsed * .2;
        rings.forEach((item, index) => {
          item.ring.rotation.z += .0006 * (index % 2 ? -1 : 1);
          item.ring.rotation.y += .00035 * (index + 1);
        });
        dust.rotation.z = elapsed * .007;
        field.rotation.y += ((pointer.x * .055) - field.rotation.y) * .025;
        field.rotation.x += ((pointer.y * -.025) - field.rotation.x) * .025;
      }

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
    intro.classList.add("scene-ready");
    render(performance.now());
  };

  startVentureScene();
}
