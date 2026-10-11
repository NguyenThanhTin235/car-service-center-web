'use client';
import React, { MouseEvent, useRef } from 'react';

export type MarkerType = 'DAMAGE' | 'RUST' | 'MISSING' | 'DENT' | 'SCRATCH' | 'OTHER';

export interface Finding {
  id: string | number;
  type: MarkerType;
  partId: string;
  partName: string;
  x: number;
  y: number;
  note: string;
  jobId?: string | number;
  jobName?: string;
  photos?: string[];
}

interface InteractiveCarSVGProps {
  findings: Finding[];
  selectedTool: MarkerType | null;
  onAddFinding: (finding: Omit<Finding, 'id'>) => void;
  onRemoveFinding?: (id: string | number) => void;
  highlightedFindingId?: string | number | null;
  onSelectFinding?: (id: string | number) => void;
}

export const getMarkerTypeName = (type: MarkerType): string => {
  switch (type) {
    case 'DAMAGE': return 'Hư hỏng';
    case 'RUST': return 'Rỉ sét';
    case 'MISSING': return 'Thiếu';
    case 'DENT': return 'Móp méo';
    case 'SCRATCH': return 'Trầy xước';
    default: return 'Khác';
  }
};

export default function InteractiveCarSVG({
  findings,
  selectedTool,
  onAddFinding,
  onRemoveFinding,
  highlightedFindingId,
  onSelectFinding,
}: InteractiveCarSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleClick = (e: MouseEvent<SVGSVGElement>) => {
    if (!selectedTool) return;

    const target = e.target as SVGElement;
    const partId = target.getAttribute('id') || target.getAttribute('data-part-id');
    const partName = target.getAttribute('data-part-name');

    if (!partId || !partName) return;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const x = ((e.clientX - svgRect.left) / svgRect.width) * 100;
    const y = ((e.clientY - svgRect.top) / svgRect.height) * 100;

    onAddFinding({
      type: selectedTool,
      partId,
      partName,
      x,
      y,
      note: '',
      photos: []
    });
  };

  const renderMarkerIcon = (type: MarkerType) => {
    switch (type) {
      case 'DAMAGE': return 'X';
      case 'RUST': return 'R';
      case 'MISSING': return 'M';
      case 'DENT': return 'D';
      case 'SCRATCH': return 'S';
      default: return 'X';
    }
  };

  const getMarkerColor = (type: MarkerType) => {
    switch (type) {
      case 'DAMAGE': return 'bg-[#B22222]'; // Dark red
      case 'RUST': return 'bg-[#B8860B]'; // Dark goldenrod
      case 'MISSING': return 'bg-[#6A5ACD]'; // Slate blue
      case 'DENT': return 'bg-[#4682B4]'; // Steel blue
      case 'SCRATCH': return 'bg-[#708090]'; // Slate gray
      default: return 'bg-gray-500';
    }
  };

  const getMarkerBadgeStyle = (type: MarkerType) => {
    switch (type) {
      case 'DAMAGE':
        return { color: 'text-[#B22222]', bgColor: 'bg-[#B22222]', lightBg: 'bg-[#FCE8E8]', border: 'border-[#B22222]/20' };
      case 'RUST':
        return { color: 'text-[#B8860B]', bgColor: 'bg-[#B8860B]', lightBg: 'bg-[#FDF6E3]', border: 'border-[#B8860B]/20' };
      case 'MISSING':
        return { color: 'text-[#6A5ACD]', bgColor: 'bg-[#6A5ACD]', lightBg: 'bg-[#EAE6F9]', border: 'border-[#6A5ACD]/20' };
      case 'DENT':
        return { color: 'text-[#4682B4]', bgColor: 'bg-[#4682B4]', lightBg: 'bg-[#E5F0F9]', border: 'border-[#4682B4]/20' };
      case 'SCRATCH':
        return { color: 'text-[#708090]', bgColor: 'bg-[#708090]', lightBg: 'bg-[#F1F5F9]', border: 'border-[#708090]/20' };
      default:
        return { color: 'text-gray-700', bgColor: 'bg-gray-600', lightBg: 'bg-gray-100', border: 'border-gray-200' };
    }
  };

  return (
    <div className="relative w-full border border-gray-300 bg-white rounded-md overflow-hidden" style={{ aspectRatio: '1.25/1' }}>
      <svg
        ref={svgRef}
        viewBox="0 0 1000 800"
        className={`w-full h-full ${selectedTool ? 'cursor-crosshair' : 'cursor-default'}`}
        onClick={handleClick}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>
            {`
              .car-part { fill: #f8fafc; stroke: #2C3E50; stroke-width: 1.5; stroke-linejoin: round; transition: fill 0.2s; }
              .car-part:hover { fill: #e2e8f0; cursor: pointer; }
              .view-title { font-family: sans-serif; font-size: 13px; font-weight: bold; fill: #7F8C8D; letter-spacing: 0.5px; }
              .sub-label { font-family: sans-serif; font-size: 11px; font-weight: bold; fill: #95A5A6; letter-spacing: 1px; }
              .grid-border { fill: none; stroke: #BDC3C7; stroke-width: 1; }
              .ground-line { stroke: #95A5A6; stroke-width: 1; stroke-dasharray: 6 6; }
              .door-handle { fill: none; stroke: #2C3E50; stroke-width: 1.5; rx: 3px; }
            `}
          </style>
        </defs>

        {/* --- GRID BORDERS --- */}
        <rect x="0" y="0" width="1000" height="280" className="grid-border" />
        <rect x="0" y="280" width="260" height="240" className="grid-border" />
        <rect x="260" y="280" width="480" height="240" className="grid-border" />
        <rect x="740" y="280" width="260" height="240" className="grid-border" />
        <rect x="0" y="520" width="1000" height="280" className="grid-border" />

        {/* ==================== 1. BÊN LÁI ==================== */}
        <g transform="translate(0, 0)">
          <text x="15" y="25" className="view-title">1. BÊN LÁI (PHẢI)</text>
          <text x="140" y="45" className="sub-label">ĐUÔI XE</text>
          <text x="830" y="45" className="sub-label">ĐẦU XE</text>
          <line x1="80" y1="245" x2="920" y2="245" className="ground-line" />
          
          {/* Wheels */}
          <circle id="ds-rear-wheel" data-part-name="Bên lái - Bánh sau" className="car-part" cx="270" cy="205" r="38" />
          <circle cx="270" cy="205" r="28" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
          <circle cx="270" cy="205" r="12" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
          
          <circle id="ds-front-wheel" data-part-name="Bên lái - Bánh trước" className="car-part" cx="730" cy="205" r="38" />
          <circle cx="730" cy="205" r="28" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
          <circle cx="730" cy="205" r="12" fill="none" stroke="#2C3E50" strokeWidth="1.5" />

          {/* Wheel Arch Lips */}
          <path d="M 205,205 A 65,65 0 0 1 335,205" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
          <path d="M 665,205 A 65,65 0 0 1 795,205" fill="none" stroke="#2C3E50" strokeWidth="1.5" />

          {/* Body Parts */}
          <path id="ds-rear-bumper" data-part-name="Bên lái - Cản sau" className="car-part" 
                d="M 180,120 L 180,140 L 170,140 L 170,205 L 120,205 Q 110,205 110,195 L 115,140 Q 120,120 140,120 L 180,120 Z" />

          <path id="ds-rear-fender" data-part-name="Bên lái - Vè/Tai sau" className="car-part" 
                d="M 340,115 Q 325,150 325,185 L 325,205 A 55,55 0 0 0 215,205 L 170,205 L 170,140 L 180,140 L 180,120 L 300,120 Q 320,120 340,115 Z" />
          
          <path id="ds-rear-door" data-part-name="Bên lái - Cửa sau" className="car-part" 
                d="M 340,115 L 490,115 L 490,205 L 325,205 L 325,185 Q 325,150 340,115 Z" />
                
          <path id="ds-front-door" data-part-name="Bên lái - Cửa trước" className="car-part" 
                d="M 490,115 L 650,115 L 650,205 L 490,205 Z" />

          <path id="ds-front-fender" data-part-name="Bên lái - Vè/Tai trước" className="car-part" 
                d="M 650,115 L 810,115 L 810,205 L 785,205 A 55,55 0 0 0 675,205 L 650,205 L 650,115 Z" />

          <path id="ds-front-bumper" data-part-name="Bên lái - Cản trước" className="car-part" 
                d="M 810,115 L 820,115 Q 860,115 870,140 L 870,185 Q 870,205 850,205 L 810,205 L 810,115 Z" />

          <path id="ds-roof" data-part-name="Bên lái - Mép mui xe" className="car-part" 
                d="M 340,115 L 400,35 L 560,35 L 650,115 Z" />

          {/* Windows */}
          <path id="ds-rear-window" data-part-name="Bên lái - Kính cửa sau" className="car-part" fill="#ffffff"
                d="M 350,105 L 405,45 Q 410,40 420,40 L 480,40 Q 485,40 485,45 L 485,105 Q 485,110 480,110 L 360,110 Q 350,110 350,105 Z" />
          <path id="ds-front-window" data-part-name="Bên lái - Kính cửa trước" className="car-part" fill="#ffffff"
                d="M 495,105 L 495,45 Q 495,40 500,40 L 545,40 Q 555,40 560,45 L 630,105 Q 635,110 625,110 L 500,110 Q 495,110 495,105 Z" />

          {/* Crease Lines */}
          <line x1="330" y1="195" x2="490" y2="195" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
          <line x1="490" y1="195" x2="650" y2="195" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
          <line x1="120" y1="195" x2="170" y2="195" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
          <line x1="170" y1="195" x2="215" y2="195" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
          <line x1="785" y1="195" x2="810" y2="195" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
          <line x1="810" y1="195" x2="860" y2="195" fill="none" stroke="#2C3E50" strokeWidth="1.5" />

          {/* Door Handles */}
          <rect x="420" y="130" width="35" height="10" rx="5" className="car-part" fill="#f8fafc" />
          <rect x="530" y="130" width="35" height="10" rx="5" className="car-part" fill="#f8fafc" />

          {/* Lights */}
          <path d="M 115,145 L 160,145 L 160,165 L 112,165 Z" className="car-part" fill="#ffffff" />
          <path d="M 830,145 L 870,145 L 868,165 L 830,165 Z" className="car-part" fill="#ffffff" />

          {/* Mirror */}
          <path id="ds-mirror" data-part-name="Bên lái - Gương chiếu hậu" className="car-part" 
                d="M 640,115 L 660,95 M 655,95 L 675,80 L 690,100 L 670,115 Z" />
        </g>

        {/* ==================== 2. ĐUÔI XE ==================== */}
        <g transform="translate(0, 280)">
          <text x="10" y="25" className="view-title">2. ĐUÔI XE</text>
          <line x1="20" y1="225" x2="240" y2="225" className="ground-line" />
          
          {/* Wheels */}
          <rect x="40" y="180" width="25" height="45" rx="4" className="car-part" />
          <rect x="195" y="180" width="25" height="45" rx="4" className="car-part" />

          {/* Body */}
          <path id="rear-roof" data-part-name="Đuôi xe - Mép mui sau" className="car-part" 
                d="M 80,70 L 180,70 L 210,120 L 50,120 Z" />
          <path id="rear-window" data-part-name="Đuôi xe - Kính chắn gió sau" className="car-part" fill="#ffffff"
                d="M 90,80 L 170,80 L 195,115 L 65,115 Z" />
          <path id="rear-trunk" data-part-name="Đuôi xe - Cửa cốp sau" className="car-part" 
                d="M 50,120 L 210,120 L 220,180 L 40,180 Z" />
          <path id="rear-bumper" data-part-name="Đuôi xe - Cản sau" className="car-part" 
                d="M 35,180 L 225,180 L 220,215 L 40,215 Z" />
          
          {/* Lights & Plate */}
          <rect id="rear-left-light" data-part-name="Đuôi xe - Đèn hậu trái" className="car-part" x="45" y="125" width="45" height="20" />
          <rect id="rear-right-light" data-part-name="Đuôi xe - Đèn hậu phải" className="car-part" x="170" y="125" width="45" height="20" />
          <rect id="rear-plate" data-part-name="Đuôi xe - Biển số" className="car-part" x="100" y="185" width="60" height="15" rx="2" />
        </g>

        {/* ==================== 3. MUI XE / NHÌN TỪ TRÊN ==================== */}
        <g transform="translate(260, 280)">
          <text x="10" y="25" className="view-title">3. MUI XE / NHÌN TỪ TRÊN</text>
          
          {/* Mirrors */}
          <path id="roof-ds-mirror" data-part-name="Mui xe - Gương bên lái" className="car-part" 
                d="M 370,40 L 380,10 L 400,15 L 390,45 Z" />
          <path id="roof-ps-mirror" data-part-name="Mui xe - Gương bên phụ" className="car-part" 
                d="M 370,200 L 380,230 L 400,225 L 390,195 Z" />

          {/* Body */}
          <rect id="roof-body" data-part-name="Thân xe nhìn từ trên" className="car-part" 
                x="30" y="40" width="420" height="160" rx="30" />
          
          {/* Windows */}
          <path id="roof-rear-window" data-part-name="Kính chắn gió sau (nhìn từ trên)" className="car-part" fill="#ffffff"
                d="M 120,50 L 160,65 L 160,175 L 120,190 Z" />
          <path id="roof-front-window" data-part-name="Kính chắn gió trước (nhìn từ trên)" className="car-part" fill="#ffffff"
                d="M 340,65 L 380,50 L 380,190 L 340,175 Z" />
          
          {/* Roof Center */}
          <rect id="roof-center" data-part-name="Mui xe - Nóc xe" className="car-part" 
                x="160" y="65" width="180" height="110" />

          {/* Cut Lines */}
          <line x1="120" y1="50" x2="160" y2="65" className="car-part" />
          <line x1="120" y1="190" x2="160" y2="175" className="car-part" />
          <line x1="380" y1="50" x2="340" y2="65" className="car-part" />
          <line x1="380" y1="190" x2="340" y2="175" className="car-part" />

          {/* Front arrow & label */}
          <g transform="translate(390, 215)">
            <text x="0" y="10" className="sub-label">ĐẦU XE</text>
            <path d="M 45,-2 L 75,-2 M 70,-7 L 75,-2 L 70,3" fill="none" stroke="#95A5A6" strokeWidth="1.5" />
          </g>

          {/* Labels */}
          <text x="75" y="125" className="sub-label" textAnchor="middle">CỐP SAU</text>
          <text x="250" y="125" className="sub-label" textAnchor="middle">MUI XE</text>
          <text x="405" y="125" className="sub-label" textAnchor="middle">NẮP CA-PÔ</text>
          
          <text x="140" y="60" className="sub-label">Sau-Phải</text>
          <text x="140" y="190" className="sub-label">Sau-Trái</text>
          <text x="320" y="60" className="sub-label">Trước-Phải</text>
          <text x="320" y="190" className="sub-label">Trước-Trái</text>
        </g>

        {/* ==================== 4. ĐẦU XE ==================== */}
        <g transform="translate(740, 280)">
          <text x="10" y="25" className="view-title">4. ĐẦU XE</text>
          <line x1="20" y1="225" x2="240" y2="225" className="ground-line" />
          
          {/* Wheels */}
          <rect x="40" y="180" width="25" height="45" rx="4" className="car-part" />
          <rect x="195" y="180" width="25" height="45" rx="4" className="car-part" />

          {/* Mirrors */}
          <path d="M 50,120 L 20,100 L 30,85 L 60,105 Z" className="car-part" />
          <path d="M 210,120 L 240,100 L 230,85 L 200,105 Z" className="car-part" />

          {/* Body */}
          <path id="front-roof" data-part-name="Đầu xe - Mép mui trước" className="car-part" 
                d="M 80,70 L 180,70 L 210,120 L 50,120 Z" />
          <path id="front-window" data-part-name="Đầu xe - Kính chắn gió trước" className="car-part" fill="#ffffff"
                d="M 90,80 L 170,80 L 195,115 L 65,115 Z" />
          <path id="front-hood" data-part-name="Đầu xe - Nắp ca-pô" className="car-part" 
                d="M 50,120 L 210,120 L 215,150 L 45,150 Z" />
          <path id="front-grille" data-part-name="Đầu xe - Lưới tản nhiệt" className="car-part" 
                d="M 45,150 L 215,150 L 220,180 L 40,180 Z" />
          <path id="front-bumper" data-part-name="Đầu xe - Cản trước" className="car-part" 
                d="M 35,180 L 225,180 L 220,215 L 40,215 Z" />
                
          {/* Lights & Plate */}
          <rect id="front-left-light" data-part-name="Đầu xe - Đèn pha trái" className="car-part" x="45" y="145" width="45" height="20" />
          <rect id="front-right-light" data-part-name="Đầu xe - Đèn pha phải" className="car-part" x="170" y="145" width="45" height="20" />
          <rect id="front-plate" data-part-name="Đầu xe - Biển số trước" className="car-part" x="100" y="185" width="60" height="15" rx="2" />
          
          <rect x="90" y="155" width="80" height="15" className="car-part" />
        </g>

        {/* ==================== 5. BÊN PHỤ ==================== */}
        <g transform="translate(0, 520)">
          <text x="15" y="25" className="view-title">5. BÊN PHỤ (TRÁI)</text>
          <text x="140" y="45" className="sub-label">ĐẦU XE</text>
          <text x="830" y="45" className="sub-label">ĐUÔI XE</text>
          <line x1="80" y1="245" x2="920" y2="245" className="ground-line" />
          
          {/* Mirrored Group */}
          <g transform="translate(1000, 0) scale(-1, 1)">
            {/* Wheels */}
            <circle id="ps-rear-wheel" data-part-name="Bên phụ - Bánh sau" className="car-part" cx="270" cy="205" r="38" />
            <circle cx="270" cy="205" r="28" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
            <circle cx="270" cy="205" r="12" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
            
            <circle id="ps-front-wheel" data-part-name="Bên phụ - Bánh trước" className="car-part" cx="730" cy="205" r="38" />
            <circle cx="730" cy="205" r="28" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
            <circle cx="730" cy="205" r="12" fill="none" stroke="#2C3E50" strokeWidth="1.5" />

            {/* Wheel Arch Lips */}
            <path d="M 205,205 A 65,65 0 0 1 335,205" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
            <path d="M 665,205 A 65,65 0 0 1 795,205" fill="none" stroke="#2C3E50" strokeWidth="1.5" />

            {/* Body Parts */}
            <path id="ps-rear-bumper" data-part-name="Bên phụ - Cản sau" className="car-part" 
                  d="M 180,120 L 180,140 L 170,140 L 170,205 L 120,205 Q 110,205 110,195 L 115,140 Q 120,120 140,120 L 180,120 Z" />

            <path id="ps-rear-fender" data-part-name="Bên phụ - Vè/Tai sau" className="car-part" 
                  d="M 340,115 Q 325,150 325,185 L 325,205 A 55,55 0 0 0 215,205 L 170,205 L 170,140 L 180,140 L 180,120 L 300,120 Q 320,120 340,115 Z" />
            
            <path id="ps-rear-door" data-part-name="Bên phụ - Cửa sau" className="car-part" 
                  d="M 340,115 L 490,115 L 490,205 L 325,205 L 325,185 Q 325,150 340,115 Z" />
                  
            <path id="ps-front-door" data-part-name="Bên phụ - Cửa trước" className="car-part" 
                  d="M 490,115 L 650,115 L 650,205 L 490,205 Z" />

            <path id="ps-front-fender" data-part-name="Bên phụ - Vè/Tai trước" className="car-part" 
                  d="M 650,115 L 810,115 L 810,205 L 785,205 A 55,55 0 0 0 675,205 L 650,205 L 650,115 Z" />

            <path id="ps-front-bumper" data-part-name="Bên phụ - Cản trước" className="car-part" 
                  d="M 810,115 L 820,115 Q 860,115 870,140 L 870,185 Q 870,205 850,205 L 810,205 L 810,115 Z" />

            <path id="ps-roof" data-part-name="Bên phụ - Mép mui xe" className="car-part" 
                  d="M 340,115 L 400,35 L 560,35 L 650,115 Z" />

            {/* Windows */}
            <path id="ps-rear-window" data-part-name="Bên phụ - Kính cửa sau" className="car-part" fill="#ffffff"
                  d="M 350,105 L 405,45 Q 410,40 420,40 L 480,40 Q 485,40 485,45 L 485,105 Q 485,110 480,110 L 360,110 Q 350,110 350,105 Z" />
            <path id="ps-front-window" data-part-name="Bên phụ - Kính cửa trước" className="car-part" fill="#ffffff"
                  d="M 495,105 L 495,45 Q 495,40 500,40 L 545,40 Q 555,40 560,45 L 630,105 Q 635,110 625,110 L 500,110 Q 495,110 495,105 Z" />

            {/* Crease Lines */}
            <line x1="330" y1="195" x2="490" y2="195" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
            <line x1="490" y1="195" x2="650" y2="195" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
            <line x1="120" y1="195" x2="170" y2="195" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
            <line x1="170" y1="195" x2="215" y2="195" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
            <line x1="785" y1="195" x2="810" y2="195" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
            <line x1="810" y1="195" x2="860" y2="195" fill="none" stroke="#2C3E50" strokeWidth="1.5" />

            {/* Door Handles */}
            <rect x="420" y="130" width="35" height="10" rx="5" className="car-part" fill="#f8fafc" />
            <rect x="530" y="130" width="35" height="10" rx="5" className="car-part" fill="#f8fafc" />

            {/* Lights */}
            <path d="M 115,145 L 160,145 L 160,165 L 112,165 Z" className="car-part" fill="#ffffff" />
            <path d="M 830,145 L 870,145 L 868,165 L 830,165 Z" className="car-part" fill="#ffffff" />

            {/* Mirror */}
            <path id="ps-mirror" data-part-name="Bên phụ - Gương chiếu hậu" className="car-part" 
                  d="M 640,115 L 660,95 M 655,95 L 675,80 L 690,100 L 670,115 Z" />
          </g>
        </g>
      </svg>

      {/* RENDER MARKERS OVERLAY */}
      {findings.map((finding, index) => {
        const isHighlighted = highlightedFindingId !== undefined && highlightedFindingId !== null && String(highlightedFindingId) === String(finding.id);
        const markerLabel = getMarkerTypeName(finding.type);
        return (
          <div
            key={finding.id}
            className={`absolute transition-transform duration-150 ${isHighlighted ? 'scale-125 z-40' : 'hover:scale-110 z-20'}`}
            style={{
              left: `${finding.x}%`,
              top: `${finding.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectFinding?.(finding.id);
            }}
          >
            <div className="relative group">
              <div
                className={`w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-md cursor-pointer transition-all ${getMarkerColor(
                  finding.type
                )} ${isHighlighted ? 'ring-4 ring-primary/40 ring-offset-1' : ''}`}
              >
                {renderMarkerIcon(finding.type)}
              </div>

              {/* Tooltip tiếng Việt hiện đại */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center w-max max-w-[260px] z-50 pointer-events-none drop-shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="bg-white text-slate-800 rounded-lg p-2.5 border border-slate-200/90 shadow-xl flex flex-col gap-1.5 text-left w-full">
                  {/* Dòng 1: Badge số thứ tự + Badge Loại vết + Badge số lượng ảnh */}
                  <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      {(() => {
                        const badgeStyle = getMarkerBadgeStyle(finding.type);
                        return (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeStyle.lightBg} ${badgeStyle.color} ${badgeStyle.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.bgColor}`}></span>
                            {markerLabel}
                          </span>
                        );
                      })()}
                    </div>

                    {finding.photos && finding.photos.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#6A5ACD] bg-[#EAE6F9] px-1.5 py-0.5 rounded">
                        <span className="material-symbols-outlined text-[12px]">image</span>
                        {finding.photos.length} ảnh
                      </span>
                    )}
                  </div>

                  {/* Dòng 2: Tên bộ phận */}
                  <div className="text-[11px] font-bold text-slate-900 leading-snug">
                    {finding.partName}
                  </div>

                  {/* Dòng 3: Ghi chú nếu có */}
                  {finding.note && (
                    <div className="text-[10px] text-slate-600 bg-slate-50 rounded p-1.5 border border-slate-100 italic line-clamp-2">
                      "{finding.note}"
                    </div>
                  )}

                  {/* Dòng 4: Công việc nếu có */}
                  {finding.jobName && (
                    <div className="flex items-center gap-1 text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                      <span className="material-symbols-outlined text-[11px]">build</span>
                      {finding.jobName}
                    </div>
                  )}
                </div>

                {/* Pointer Arrow góc xoay hướng xuống marker */}
                <div className="w-2.5 h-2.5 bg-white border-r border-b border-slate-200/90 transform rotate-45 -mt-1.5"></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
