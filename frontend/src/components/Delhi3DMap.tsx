import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Play, Pause, Maximize2, Minimize2, Layers, ChevronDown } from 'lucide-react';
import { ForecastResponse } from '../types';

export type MapMetric = 'pm25' | 'pm10' | 'aqi' | 'temp' | 'humidity';
export type ViewMode = '3d' | '2d' | 'heatmap';

interface Delhi3DMapProps {
  forecastData?: ForecastResponse | null;
  selectedHour: number;
  onSelectHour: (hour: number) => void;
  className?: string;
}

interface StationNode {
  id: string;
  name: string;
  x: number; // Three.js coordinate (-10 to 10)
  z: number;
  basePm25: number;
  baseTemp: number;
  baseHumidity: number;
}

// Geographical distribution of Delhi NCR key stations matching screenshot
const NCR_STATIONS: StationNode[] = [
  { id: 'bawana', name: 'Bawana', x: -1.2, z: -1.5, basePm25: 480, baseTemp: 32, baseHumidity: 62 },
  { id: 'narela', name: 'Narela', x: -0.2, z: -2.8, basePm25: 420, baseTemp: 31, baseHumidity: 65 },
  { id: 'north_delhi', name: 'North Delhi', x: 1.0, z: -1.2, basePm25: 390, baseTemp: 30, baseHumidity: 68 },
  { id: 'sonipat', name: 'Sonipat', x: -1.0, z: -5.0, basePm25: 220, baseTemp: 27, baseHumidity: 72 },
  { id: 'panipat', name: 'Panipat', x: 0.8, z: -7.2, basePm25: 180, baseTemp: 26, baseHumidity: 75 },
  { id: 'rohtak', name: 'Rohtak', x: -5.5, z: -2.5, basePm25: 160, baseTemp: 28, baseHumidity: 58 },
  { id: 'gurugram', name: 'Gurugram', x: -3.2, z: 2.2, basePm25: 280, baseTemp: 31, baseHumidity: 55 },
  { id: 'south_delhi', name: 'South Delhi', x: 0.5, z: 1.8, basePm25: 310, baseTemp: 30, baseHumidity: 64 },
  { id: 'noida', name: 'Noida', x: 3.5, z: 0.8, basePm25: 260, baseTemp: 29, baseHumidity: 70 },
  { id: 'ghaziabad', name: 'Ghaziabad', x: 4.2, z: -1.8, basePm25: 290, baseTemp: 29, baseHumidity: 72 },
  { id: 'faridabad', name: 'Faridabad', x: 2.8, z: 4.5, basePm25: 230, baseTemp: 30, baseHumidity: 66 },
  { id: 'palwal', name: 'Palwal', x: 3.2, z: 7.2, basePm25: 140, baseTemp: 28, baseHumidity: 68 },
];

export const Delhi3DMap: React.FC<Delhi3DMapProps> = ({
  forecastData,
  selectedHour,
  onSelectHour,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [metric, setMetric] = useState<MapMetric>('pm25');
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [altitudeSlice, setAltitudeSlice] = useState<number>(200); // 0 to 3000m
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  // Play animation loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      onSelectHour((selectedHour % 72) + 1);
    }, 800);
    return () => clearInterval(interval);
  }, [isPlaying, selectedHour, onSelectHour]);

  // Current hour multiplier from forecastData if available
  const hourFactor = useMemo(() => {
    if (!forecastData || !forecastData.forecast || forecastData.forecast.length === 0) {
      return 1.0;
    }
    const idx = Math.min(Math.max(selectedHour - 1, 0), forecastData.forecast.length - 1);
    const item = forecastData.forecast[idx];
    // Ratio of current hour PM2.5 compared to baseline
    return (item.pm25 || 185) / 200;
  }, [forecastData, selectedHour]);

  // Helper function to get color for a value based on metric
  const getColor = (value: number, m: MapMetric): THREE.Color => {
    if (m === 'pm25' || m === 'pm10' || m === 'aqi') {
      // 0 -> Green, 75 -> Yellow, 150 -> Orange, 250 -> Red, 450+ -> Maroon/Burgundy
      if (value < 50) return new THREE.Color('#22C55E'); // Good (Green)
      if (value < 100) return new THREE.Color('#84CC16'); // Satisfactory
      if (value < 200) return new THREE.Color('#EAB308'); // Moderate (Yellow)
      if (value < 300) return new THREE.Color('#F97316'); // Poor (Orange)
      if (value < 400) return new THREE.Color('#EF4444'); // Very Poor (Red)
      return new THREE.Color('#7F1D1D'); // Severe (Deep Crimson / Maroon)
    } else if (m === 'temp') {
      // 15°C (Cyan) to 42°C (Burning Coral)
      const norm = Math.min(Math.max((value - 15) / 27, 0), 1);
      const c = new THREE.Color();
      c.setHSL(0.65 - norm * 0.65, 0.9, 0.5);
      return c;
    } else {
      // Humidity: 20% (Amber) to 95% (Deep Azure / Ocean Teal)
      const norm = Math.min(Math.max((value - 20) / 75, 0), 1);
      const c = new THREE.Color();
      c.setHSL(0.12 + norm * 0.45, 0.85, 0.5);
      return c;
    }
  };

  // Three.js Scene Setup & Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 460;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#16211A'); // Dark forest terrain tone matching screenshot
    scene.fog = new THREE.FogExp2('#16211A', 0.025);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    if (viewMode === '3d') {
      camera.position.set(0, 18, 20);
      camera.lookAt(0, 0, 0);
    } else if (viewMode === '2d') {
      camera.position.set(0, 26, 0.001);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(0, 22, 14);
      camera.lookAt(0, 0, 0);
    }

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(15, 30, 20);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffaa44, 2, 50);
    pointLight.position.set(0, 8, 0);
    scene.add(pointLight);

    // Terrain Base Plane (Delhi NCR Topography)
    const terrainGeo = new THREE.PlaneGeometry(32, 32, 64, 64);
    // Subtle elevation displacement
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const d = Math.sin(vx * 0.4) * Math.cos(vy * 0.4) * 0.4;
      posAttr.setZ(i, d);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: '#1C2920',
      roughness: 0.85,
      metalness: 0.1,
      wireframe: false,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.1;
    scene.add(terrain);

    // Delhi NCR Border & Yamuna River Glow Ribbon
    const gridHelper = new THREE.GridHelper(28, 28, '#2D3F33', '#243329');
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // Yamuna River curve
    const riverPoints = [
      new THREE.Vector3(1.2, 0.05, -12),
      new THREE.Vector3(1.0, 0.05, -6),
      new THREE.Vector3(1.5, 0.05, -1),
      new THREE.Vector3(2.2, 0.05, 3),
      new THREE.Vector3(3.0, 0.05, 8),
      new THREE.Vector3(3.5, 0.05, 12),
    ];
    const riverCurve = new THREE.CatmullRomCurve3(riverPoints);
    const riverGeo = new THREE.TubeGeometry(riverCurve, 40, 0.18, 8, false);
    const riverMat = new THREE.MeshBasicMaterial({ color: '#2563EB', opacity: 0.8, transparent: true });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    scene.add(riverMesh);

    // Group for 3D Atmospheric Columns
    const columnsGroup = new THREE.Group();
    scene.add(columnsGroup);

    // Generate 3D Extruded Atmospheric Columns
    // In the reference screenshot, there is a dense voxel pillar field centered over Delhi
    const pillarMeshList: THREE.Mesh[] = [];
    const gridSize = 22;
    const step = 0.9;
    const boxGeo = new THREE.BoxGeometry(0.72, 1, 0.72);

    for (let gx = -gridSize / 2; gx <= gridSize / 2; gx++) {
      for (let gz = -gridSize / 2; gz <= gridSize / 2; gz++) {
        const posX = gx * step;
        const posZ = gz * step;

        // Calculate value based on proximity to nearest stations + hotspot in Bawana/North Delhi
        let weightedVal = 0;
        let totalWeight = 0;

        NCR_STATIONS.forEach((st) => {
          const dist = Math.hypot(posX - st.x, posZ - st.z);
          const weight = 1 / (dist * dist + 0.8);
          
          let stationVal = st.basePm25 * hourFactor;
          if (metric === 'temp') stationVal = st.baseTemp + (hourFactor - 1) * 4;
          if (metric === 'humidity') stationVal = st.baseHumidity - (hourFactor - 1) * 8;
          if (metric === 'aqi') stationVal = (st.basePm25 * hourFactor) * 0.9;

          weightedVal += stationVal * weight;
          totalWeight += weight;
        });

        const cellValue = totalWeight > 0 ? weightedVal / totalWeight : 100;
        
        // Altitude threshold filter
        if (cellValue < 40 && metric === 'pm25') continue;

        // Calculate height
        let h = 0.4;
        if (metric === 'pm25' || metric === 'aqi') {
          h = Math.max(0.3, (cellValue / 500) * 6.5);
        } else if (metric === 'temp') {
          h = Math.max(0.3, ((cellValue - 15) / 25) * 5.0);
        } else {
          h = Math.max(0.3, (cellValue / 100) * 5.0);
        }

        // Color
        const color = getColor(cellValue, metric);
        const mat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.3,
          metalness: 0.2,
          transparent: true,
          opacity: 0.88,
        });

        const colMesh = new THREE.Mesh(boxGeo, mat);
        colMesh.scale.set(1, h, 1);
        colMesh.position.set(posX, h / 2, posZ);
        columnsGroup.add(colMesh);
        pillarMeshList.push(colMesh);
      }
    }

    // Location Label Sprites
    const labelsGroup = new THREE.Group();
    scene.add(labelsGroup);

    NCR_STATIONS.forEach((station) => {
      // Create canvas for 2D crisp text sprite
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(15, 23, 18, 0.75)';
        ctx.roundRect(10, 8, 236, 48, 12);
        ctx.fill();
        ctx.strokeStyle = '#3E5042';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(station.name, 128, 32);
      }

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(3.2, 0.8, 1);
      sprite.position.set(station.x, 3.8, station.z);
      labelsGroup.add(sprite);

      // Station ground marker dot
      const dotGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(station.x, 0.05, station.z);
      labelsGroup.add(dot);
    });

    // Altitude horizontal slice plane indicator
    const altNorm = Math.min(Math.max(altitudeSlice / 3000, 0), 1);
    const sliceHeight = altNorm * 6.0;
    const sliceGeo = new THREE.PlaneGeometry(24, 24);
    const sliceMat = new THREE.MeshBasicMaterial({
      color: '#FFFFFF',
      opacity: 0.15,
      transparent: true,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const sliceMesh = new THREE.Mesh(sliceGeo, sliceMat);
    sliceMesh.rotation.x = -Math.PI / 2;
    sliceMesh.position.y = sliceHeight;
    scene.add(sliceMesh);

    // Interactive mouse drag rotation
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      if (viewMode === '3d') {
        scene.rotation.y += deltaX * 0.006;
        camera.position.y = Math.max(6, Math.min(30, camera.position.y - deltaY * 0.05));
        camera.lookAt(0, 0, 0);
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Zoom on wheel
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.015;
      camera.position.z = Math.max(8, Math.min(35, camera.position.z + zoomFactor));
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });

    // Render loop with slow idle rotation
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isDragging && viewMode === '3d') {
        scene.rotation.y += 0.001; // gentle continuous rotation
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElem.removeEventListener('wheel', onWheel);
      renderer.dispose();
      terrainGeo.dispose();
      boxGeo.dispose();
    };
  }, [metric, viewMode, altitudeSlice, hourFactor]);

  const metricDisplayInfo = {
    pm25: { label: 'PM2.5', unit: 'µg/m³', ticks: ['500', '250', '150', '75', '35', '0'] },
    pm10: { label: 'PM10', unit: 'µg/m³', ticks: ['600', '350', '200', '100', '50', '0'] },
    aqi: { label: 'AQI (CPCB)', unit: 'Index', ticks: ['500', '400', '300', '200', '100', '0'] },
    temp: { label: 'Temperature', unit: '°C', ticks: ['42°', '35°', '28°', '22°', '16°', '10°'] },
    humidity: { label: 'Humidity', unit: '%', ticks: ['100%', '80%', '60%', '40%', '20%', '0%'] },
  };

  const currentInfo = metricDisplayInfo[metric];

  return (
    <div
      className={`relative bg-[#FCFAF7] rounded-2xl border border-[#E4DFD5] shadow-xs overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : className
      }`}
    >
      {/* Top Header Controls Bar */}
      <div className="p-4 pb-3 flex items-center justify-between gap-3 border-b border-[#EFEBE3] flex-wrap">
        <div>
          <h2 className="text-base font-bold text-[#1C201C] tracking-tight">
            3D Air Quality Map – Delhi NCR
          </h2>
          <p className="text-xs text-[#666D67] font-normal">
            Real-time {metric === 'temp' ? 'thermal field' : metric === 'humidity' ? 'moisture distribution' : 'pollution distribution'} in 3D atmosphere
          </p>
        </div>

        {/* View & Metric Selector Controls */}
        <div className="flex items-center space-x-2">
          
          {/* View Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#F5F2EB] hover:bg-[#EAE5DC] border border-[#DDD7CC] text-xs font-semibold text-[#1C201C] transition"
            >
              <span>View: {viewMode.toUpperCase()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#666D67]" />
            </button>
            {isViewDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-[#FCFAF7] border border-[#DDD7CC] rounded-xl shadow-lg py-1 z-30">
                {(['3d', '2d', 'heatmap'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setViewMode(mode);
                      setIsViewDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition ${
                      viewMode === mode ? 'bg-[#EAE5DC] font-bold text-[#1C201C]' : 'text-[#3D453F] hover:bg-[#F5F2EB]'
                    }`}
                  >
                    {mode === '3d' ? '3D Perspective' : mode === '2d' ? '2D Topo View' : 'Heatmap Layer'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Metric Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMetricDropdownOpen(!isMetricDropdownOpen)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#F5F2EB] hover:bg-[#EAE5DC] border border-[#DDD7CC] text-xs font-semibold text-[#1C201C] transition"
            >
              <span>Pollutant: {metric === 'pm25' ? 'PM2.5' : metric === 'temp' ? 'Temp (°C)' : metric === 'humidity' ? 'Humidity' : metric.toUpperCase()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#666D67]" />
            </button>
            {isMetricDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-[#FCFAF7] border border-[#DDD7CC] rounded-xl shadow-lg py-1 z-30">
                <div className="px-3 py-1 text-[10px] font-mono text-[#88928A] uppercase border-b border-[#EFEBE3]">
                  Select Variable
                </div>
                {[
                  { id: 'pm25', label: 'PM2.5 (Fine Particulates)' },
                  { id: 'pm10', label: 'PM10 (Coarse Dust)' },
                  { id: 'aqi', label: 'CPCB AQI Index' },
                  { id: 'temp', label: 'Temperature (°C)' },
                  { id: 'humidity', label: 'Relative Humidity (%)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMetric(item.id as MapMetric);
                      setIsMetricDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition ${
                      metric === item.id ? 'bg-[#EAE5DC] font-bold text-[#1C201C]' : 'text-[#3D453F] hover:bg-[#F5F2EB]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Layers Toggle Button */}
          <button
            onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
            className="p-1.5 rounded-lg bg-[#F5F2EB] hover:bg-[#EAE5DC] border border-[#DDD7CC] text-[#3D453F] transition"
            title="Toggle Map Perspective"
          >
            <Layers className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="relative flex-1 w-full min-h-[380px] sm:min-h-[420px] bg-[#141C17] cursor-grab active:cursor-grabbing">
        
        {/* Mount Three.js canvas */}
        <div ref={mountRef} className="absolute inset-0 w-full h-full" />

        {/* Left Floating HUD: Dynamic Color Scale Bar */}
        <div className="absolute top-4 left-4 z-10 bg-[#16221B]/85 backdrop-blur-md px-2.5 py-3 rounded-xl border border-[#2B3B30] text-white text-[11px] font-mono shadow-md pointer-events-none">
          <span className="block text-[10px] text-[#A6B8AC] mb-1.5 font-bold">
            {currentInfo.label} ({currentInfo.unit})
          </span>
          <div className="flex items-center space-x-2">
            {/* Gradient vertical pill */}
            <div
              className={`w-2.5 h-36 rounded-full shadow-inner ${
                metric === 'temp'
                  ? 'bg-gradient-to-b from-[#EF4444] via-[#F59E0B] to-[#3B82F6]'
                  : metric === 'humidity'
                  ? 'bg-gradient-to-b from-[#0284C7] via-[#06B6D4] to-[#F59E0B]'
                  : 'bg-gradient-to-b from-[#7F1D1D] via-[#EF4444] via-[#F97316] via-[#EAB308] to-[#22C55E]'
              }`}
            />
            {/* Scale Numbers */}
            <div className="flex flex-col justify-between h-36 text-[10px] text-[#CBD5CE]">
              {currentInfo.ticks.map((t, idx) => (
                <span key={idx}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Floating HUD: Altitude (m) Scale */}
        <div className="absolute top-4 right-4 z-10 bg-[#16221B]/85 backdrop-blur-md px-3 py-3 rounded-xl border border-[#2B3B30] text-white text-[11px] font-mono shadow-md">
          <span className="block text-[10px] text-[#A6B8AC] mb-1.5 font-bold text-right">
            Altitude (m)
          </span>
          <div className="flex items-center space-x-2.5">
            {/* Tick numbers */}
            <div className="flex flex-col justify-between h-36 text-[10px] text-[#CBD5CE] text-right">
              <span>3000</span>
              <span>2000</span>
              <span>1000</span>
              <span>500</span>
              <span className="text-[#38BDF8] font-bold">200</span>
              <span>0</span>
            </div>

            {/* Vertical Track with Draggable Slider Handle */}
            <div className="relative w-2 h-36 bg-[#2B3B30] rounded-full flex justify-center">
              {/* White altitude slider dot */}
              <div
                className="absolute w-3.5 h-3.5 bg-white rounded-full border-2 border-[#16221B] shadow-md -left-0.75 cursor-pointer hover:scale-110 transition-transform"
                style={{ bottom: `${(altitudeSlice / 3000) * 100}%` }}
                title={`Boundary Layer Cutoff: ${altitudeSlice}m`}
                onClick={() => setAltitudeSlice(altitudeSlice >= 2500 ? 200 : altitudeSlice + 600)}
              />
            </div>
          </div>
        </div>

        {/* Bottom Overlay: 72-Hour Timeline Scrubber Toolbar */}
        <div className="absolute bottom-3 inset-x-4 z-20 flex items-center justify-between bg-[#16221B]/90 backdrop-blur-md rounded-2xl border border-[#2E3F33] p-2 sm:px-4 shadow-xl text-white">
          
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-full bg-[#27372D] hover:bg-[#34483B] flex items-center justify-center text-white transition flex-shrink-0 mr-3 border border-[#3E5244]"
            title={isPlaying ? 'Pause Simulation' : 'Play 72h Timeline'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          {/* Timeline Range Slider with Hour Labels */}
          <div className="flex-1 mx-2 flex flex-col justify-center">
            <input
              type="range"
              min="1"
              max="72"
              value={selectedHour}
              onChange={(e) => onSelectHour(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#2B3B30] rounded-lg appearance-none cursor-pointer accent-[#E5EAE6]"
            />
            <div className="flex justify-between text-[10px] text-[#A6B8AC] font-mono mt-1 px-1">
              <span>Now</span>
              <span>+12h</span>
              <span>+24h</span>
              <span>+36h</span>
              <span>+48h</span>
              <span>+60h</span>
              <span>+72h</span>
            </div>
          </div>

          {/* Fullscreen Expand Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-[#27372D] hover:bg-[#34483B] text-[#CBD5CE] hover:text-white transition ml-3 border border-[#3E5244] flex-shrink-0"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand 3D Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

        </div>

      </div>
    </div>
  );
};
