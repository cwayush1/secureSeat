import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function CameraController({ targetCoords }) {
    const { camera } = useThree();

    useEffect(() => {
        if (targetCoords && targetCoords.x != null) {
            const x = parseFloat(targetCoords.x);
            const y = parseFloat(targetCoords.y);
            const z = parseFloat(targetCoords.z);
            
            if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                camera.position.set(x, y, z);
                camera.lookAt(0, 0, 0); // Always look at pitch center
                camera.updateProjectionMatrix();
            }
        }
    }, [targetCoords, camera]);

    return null;
}

function ProceduralField() {
    return (
        <group>
            {/* The Main Outfield Grass */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[80, 64]} />
                <meshStandardMaterial color="#2d6438" roughness={0.8} />
            </mesh>

            {/* Boundary Rope (Torus) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.4, 0]} receiveShadow castShadow>
                <torusGeometry args={[76, 0.4, 16, 100]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.3} />
            </mesh>

            {/* The 30-Yard Circle (White dashed look or solid line) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <ringGeometry args={[45, 45.5, 64]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>

            {/* The Central Pitch (Khaki Box) */}
            <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
                <boxGeometry args={[10, 0.5, 30]} />
                <meshStandardMaterial color="#d4b878" roughness={0.9} />
            </mesh>

            {/* Creases (White Blocks on Pitch) */}
            <mesh position={[0, 0.51, 10]}>
                <boxGeometry args={[10, 0.05, 0.5]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 0.51, -10]}>
                <boxGeometry args={[10, 0.05, 0.5]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Wickets */}
            <mesh position={[0, 1.5, 9.8]} castShadow>
                <boxGeometry args={[1.5, 3, 0.1]} />
                <meshStandardMaterial color="#fbbf24" roughness={0.5} />
            </mesh>
            <mesh position={[0, 1.5, -9.8]} castShadow>
                <boxGeometry args={[1.5, 3, 0.1]} />
                <meshStandardMaterial color="#fbbf24" roughness={0.5} />
            </mesh>
        </group>
    );
}

function Seats() {
    // Uses hardware instancing to draw tens of thousands of seats with zero lag
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const seatColor = useMemo(() => new THREE.Color(), []);
    
    // We are placing thousands of seats mathematically across the tiers!
    const seatPositions = useMemo(() => {
        const positions = [];
        const baseRadius = 85; 
        const stepSize = 15;
        const heightStep = 10;
        const TOTAL_TIERS = 7;

        for (let t = 0; t < TOTAL_TIERS; t++) {
            const tierHeight = (t + 1) * heightStep;
            const rStart = baseRadius + t * stepSize;
            
            // Paint 3 rows of seats per grandstand tier
            for (let row = 1; row <= 3; row++) {
                const r = rStart + (row * (stepSize / 4));
                // Space seats evenly based on circumference
                const numSeatsInRow = Math.floor((2 * Math.PI * r) / 1.6); 
                
                for (let s = 0; s < numSeatsInRow; s++) {
                    const theta = (s / numSeatsInRow) * Math.PI * 2;
                    positions.push({
                        x: Math.cos(theta) * r,
                        y: tierHeight + 0.6, // sit firmly on the concrete tier
                        z: Math.sin(theta) * r,
                        rotY: -theta - Math.PI / 2, // Rotate to look exactly at the pitch
                        color: (s % 3 === 0) ? "#1e40af" : "#2563eb" // Alternating blue aesthetic
                    });
                }
            }
        }
        return positions;
    }, []);

    const meshRef = useRef();

    useEffect(() => {
        if (!meshRef.current) return;
        seatPositions.forEach((pos, i) => {
            dummy.position.set(pos.x, pos.y, pos.z);
            dummy.rotation.set(0, pos.rotY, 0);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
            
            seatColor.set(pos.color);
            meshRef.current.setColorAt(i, seatColor);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
        meshRef.current.instanceColor.needsUpdate = true;
    }, [seatPositions, dummy, seatColor]);

    return (
        <instancedMesh ref={meshRef} args={[null, null, seatPositions.length]} castShadow receiveShadow>
            <boxGeometry args={[0.9, 1.2, 1.1]} />
            <meshStandardMaterial roughness={0.8} />
        </instancedMesh>
    );
}

function AdBoards() {
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const boardColor = useMemo(() => new THREE.Color(), []);
    const numBoards = 48; 
    const r = 78; // perfectly snugging the boundary rope
    const meshRef = useRef();

    useEffect(() => {
        if (!meshRef.current) return;
        for (let i = 0; i < numBoards; i++) {
            const theta = (i / numBoards) * Math.PI * 2;
            dummy.position.set(Math.cos(theta) * r, 1.5, Math.sin(theta) * r);
            dummy.rotation.set(0, -theta, 0);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
            
            boardColor.set(i % 2 === 0 ? "#dc2626" : "#f59e0b"); // alternating highly visible sponsor colors
            meshRef.current.setColorAt(i, boardColor);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        meshRef.current.instanceColor.needsUpdate = true;
    }, [dummy, boardColor]);

    return (
        <instancedMesh ref={meshRef} args={[null, null, numBoards]} castShadow receiveShadow>
            {/* Standard digital perimeter hoardings */}
            <boxGeometry args={[10, 3, 0.4]} />
            <meshStandardMaterial roughness={0.3} metalness={0.2} />
        </instancedMesh>
    );
}

function FloodlightTowers() {
    const positions = [
        [150, -150], [-150, -150], [150, 150], [-150, 150]
    ];
    return (
        <group>
            {positions.map((pos, i) => {
                const [x, z] = pos;
                const angle = Math.atan2(z, x); // Calculate exact facing angle so they beam directly onto the pitch
                return (
                    <group key={`tower-${i}`} position={[x, 0, z]}>
                        {/* Metallic Tower Pole */}
                        <mesh position={[0, 100, 0]} castShadow>
                            <cylinderGeometry args={[2, 4, 200, 16]} />
                            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
                        </mesh>
                        
                        {/* Huge LED Array Decking */}
                        <mesh position={[0, 200, 0]} rotation={[0, -angle - Math.PI/2, Math.PI / 6]} castShadow>
                            <boxGeometry args={[40, 15, 2]} />
                            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.2} />
                            {/* Glowing Bright LED Front Grid */}
                            <mesh position={[0, 0, 1.1]}>
                                <boxGeometry args={[38, 13, 0.5]} />
                                <meshBasicMaterial color="#ffffff" />
                            </mesh>
                        </mesh>
                    </group>
                )
            })}
        </group>
    );
}

function ProceduralStands() {
    // Generate enormous tiered rings stepping upwards and outwards safely around the pitch
    const tiers = [];
    const baseRadius = 85; 
    const stepSize = 15;
    const heightStep = 10;
    const TOTAL_TIERS = 7;

    for (let i = 0; i < TOTAL_TIERS; i++) {
        // FLAT TIER (The concrete flooring holding the seats)
        tiers.push(
            <mesh 
                key={i} 
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, (i + 1) * heightStep, 0]} 
                receiveShadow
                castShadow
            >
                <ringGeometry args={[baseRadius + i * stepSize, baseRadius + (i + 1) * stepSize, 64]} />
                <meshStandardMaterial 
                    color={i % 2 === 0 ? "#475569" : "#64748b"} 
                    side={THREE.DoubleSide}
                    roughness={1}
                />
            </mesh>
        );

        // VERTICAL RISER (The concrete inner wall holding the tier up)
        if (i < TOTAL_TIERS - 1) {
            tiers.push(
               <mesh 
                  key={`riser-${i}`}
                  position={[0, (i + 1) * heightStep + (heightStep / 2), 0]} 
                  receiveShadow
                  castShadow
               >
                   <cylinderGeometry args={[baseRadius + (i + 1) * stepSize, baseRadius + (i + 1) * stepSize, heightStep, 64, 1, true]} />
                   <meshStandardMaterial color="#1e293b" side={THREE.DoubleSide} roughness={1} />
               </mesh>
            );
        }
    }

    return <group>{tiers}</group>;
}

export default function Stadium3DViewer({ activeBlockCoords }) {
    return (
        <div style={{ width: '100%', height: '100%', minHeight: '500px', backgroundColor: '#020617', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 80, 150], fov: 60 }}>
                <color attach="background" args={['#020617']} />
                
                {/* Beautiful Stadium Night Lighting */}
                <Environment preset="night" />
                <ambientLight intensity={0.15} />
                <directionalLight position={[0, 200, 0]} intensity={1} castShadow />

                {/* 4 massive floodlights blasting down from the towers to illuminate the pitch */}
                <spotLight position={[150, 200, 150]} angle={0.4} penumbra={0.5} intensity={50000} castShadow />
                <spotLight position={[-150, 200, 150]} angle={0.4} penumbra={0.5} intensity={50000} castShadow />
                <spotLight position={[150, 200, -150]} angle={0.4} penumbra={0.5} intensity={50000} castShadow />
                <spotLight position={[-150, 200, -150]} angle={0.4} penumbra={0.5} intensity={50000} castShadow />

                {/* Draw The Environment Geometry */}
                <ProceduralField />
                <ProceduralStands />
                <Seats />
                <AdBoards />
                <FloodlightTowers />
                
                {/* Handle Camera Position Dynamically */}
                <CameraController targetCoords={activeBlockCoords} />
                
                {/* Allow user to orbit the specific section safely */}
                <OrbitControls enableZoom={true} enablePan={false} maxPolarAngle={Math.PI / 2 - 0.05} maxDistance={250} minDistance={10} autoRotate={false} />
            </Canvas>
        </div>
    );
}