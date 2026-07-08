<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { OrbitControls, Grid } from '@threlte/extras';
  import * as THREE from 'three';
  import { calendar } from './lib/stores/calendar';

  const { flipState, monthData, commitFlip } = calendar;

  let meshGroupRef: THREE.Group | undefined;
  let time = 0;
  let flipProgress = 0;
  let isFlipping = false;
  let flipDir = 1;

  $: if ($flipState !== 'idle' && !isFlipping) {
    isFlipping = true;
    flipProgress = 0;
    flipDir = $flipState === 'forward' ? 1 : -1;
  }

  const PAGE_W = 3.5;
  const PAGE_H = 4.5;

  function buildPageGeometry(progress: number, dir: number): THREE.BufferGeometry {
    const geo = new THREE.PlaneGeometry(PAGE_W, PAGE_H, 24, 32);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) / PAGE_W) + 0.5;
      const t = Math.max(0, Math.min(1, progress));
      const angle = dir * t * Math.PI;
      const curl = Math.sin(u * Math.PI * 2 - t * 6) * Math.sin(angle) * 0.55;
      pos.setZ(i, curl * PAGE_H);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }

  let currentPageGeo = buildPageGeometry(0, 1);
  let flipPageGeo = buildPageGeometry(0, 1);

  useTask((delta) => {
    time += delta;

    if (isFlipping) {
      flipProgress += delta * 2.4;
      flipPageGeo = buildPageGeometry(flipProgress, flipDir);

      if (flipProgress >= 1) {
        isFlipping = false;
        flipProgress = 0;
        currentPageGeo = buildPageGeometry(0, 1);
        commitFlip();
      }
    }

    if (meshGroupRef) {
      meshGroupRef.position.y = Math.sin(time * 0.4) * 0.04;
    }
  });

  function getAccentColor() {
    return $monthData.accent;
  }
</script>

<T.PerspectiveCamera makeDefault position={[0, 1.5, 9]} fov={42}>
  <OrbitControls
    enableZoom
    enablePan={false}
    minPolarAngle={Math.PI / 4}
    maxPolarAngle={Math.PI / 1.8}
    enableDamping
    dampingFactor={0.08}
  />
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.35} />
<T.DirectionalLight position={[5, 8, 6]} intensity={1.2} castShadow />
<T.PointLight position={[-4, 3, 2]} color={getAccentColor()} intensity={0.8} distance={12} />

<Grid
  position={[0, -2.4, 0]}
  cellColor="#ffffff"
  sectionColor={getAccentColor()}
  sectionThickness={1.2}
  cellSize={0.8}
  sectionSize={4}
  fadeDistance={22}
  infiniteGrid
/>

<T.Group bind:ref={meshGroupRef}>
  <T.Mesh geometry={currentPageGeo} receiveShadow>
    <T.MeshStandardMaterial
      color={$monthData.bg}
      roughness={0.9}
      metalness={0.1}
      side={THREE.FrontSide}
    />
  </T.Mesh>

  {#if isFlipping}
    <T.Mesh geometry={flipPageGeo} position={[0, 0, 0.003]} castShadow>
      <T.MeshStandardMaterial
        color="#f5f5f0"
        roughness={0.95}
        metalness={0.0}
        side={THREE.DoubleSide}
        transparent
        opacity={Math.max(0, 1 - flipProgress * 0.7)}
      />
    </T.Mesh>
  {/if}
</T.Group>
