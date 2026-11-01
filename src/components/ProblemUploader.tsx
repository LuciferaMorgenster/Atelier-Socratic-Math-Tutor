import React, { useState, useRef } from 'react';
import { UploadCloud, Camera, BookOpen, ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react';

interface ProblemUploaderProps {
  onProblemSelected: (imageBase64: string, note?: string) => Promise<void>;
  isLoading: boolean;
}

interface SampleProblemDef {
  id: string;
  title: string;
  topic: string;
  formula: string;
  description: string;
  header: string;
  equation: string;
  note: string;
}

// Sample realistic problems
const SAMPLE_PROBLEMS: SampleProblemDef[] = [
  {
    id: 'parts',
    title: 'Integration by Parts',
    topic: 'Calculus II',
    formula: '\\int x \\cdot e^{2x} \\, dx',
    description: 'Find the antiderivative using the product structure.',
    header: 'Evaluate the indefinite integral:',
    equation: '∫ x · e^(2x) dx',
    note: 'Show all steps cleanly',
  },
  {
    id: 'implicit',
    title: 'Implicit Differentiation',
    topic: 'Calculus I',
    formula: 'x^3 + y^3 = 6xy',
    description: 'Find dy/dx for the Folium of Descartes.',
    header: 'Find dy/dx using implicit differentiation:',
    equation: 'x³ + y³ = 6xy',
    note: 'Differentiate both sides with respect to x',
  },
  {
    id: 'partial_fractions',
    title: 'Partial Fractions',
    topic: 'Advanced Algebra',
    formula: '\\frac{5x - 2}{(x-1)(x+2)}',
    description: 'Decompose the rational function into partial fractions.',
    header: 'Decompose into partial fractions:',
    equation: '(5x - 2) / [(x - 1)(x + 2)]',
    note: 'Find constants A and B',
  },
  {
    id: 'trig_sub',
    title: 'Trig Substitution',
    topic: 'Calculus II',
    formula: '\\int \\frac{dx}{\\sqrt{9 - x^2}}',
    description: 'Evaluate using trigonometric substitution.',
    header: 'Evaluate the integral:',
    equation: '∫ 1 / √(9 - x²) dx',
    note: 'Determine the right substitution for x',
  },
];

// Helper to construct a real raster PNG image using HTML5 Canvas
function createMathSamplePng(header: string, equation: string, note: string): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 340;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background parchment
  ctx.fillStyle = '#FAF6EE';
  ctx.fillRect(0, 0, 600, 340);

  // Fine grid lines
  ctx.strokeStyle = '#E8DEC8';
  ctx.lineWidth = 0.8;
  for (let x = 0; x < 600; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 340);
    ctx.stroke();
  }
  for (let y = 0; y < 340; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(600, y);
    ctx.stroke();
  }

  // Margin rule
  ctx.strokeStyle = '#E5998A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(65, 0);
  ctx.lineTo(65, 340);
  ctx.stroke();

  // Header
  ctx.fillStyle = '#6B5E52';
  ctx.font = 'italic 16px Georgia, serif';
  ctx.fillText(header, 85, 65);

  // Equation card box
  ctx.fillStyle = '#F4EFE6';
  ctx.strokeStyle = '#D8CEBE';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(85, 95, 460, 110, 8);
  } else {
    ctx.rect(85, 95, 460, 110);
  }
  ctx.fill();
  ctx.stroke();

  // Equation text
  ctx.fillStyle = '#2A2421';
  ctx.font = 'bold 26px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(equation, 315, 160);
  ctx.textAlign = 'left';

  // Note
  ctx.fillStyle = '#8C3A1E';
  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Note: ${note}`, 85, 255);

  // Footer label
  ctx.fillStyle = '#8C8178';
  ctx.font = '12px monospace';
  ctx.fillText('Atelier Math Examination Problem Card', 85, 290);

  return canvas.toDataURL('image/png');
}

export const ProblemUploader: React.FC<ProblemUploaderProps> = ({
  onProblemSelected,
  isLoading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [studentNote, setStudentNote] = useState('');
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSelectedFilePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmUpload = () => {
    if (!selectedFilePreview || isLoading) return;
    onProblemSelected(selectedFilePreview, studentNote);
  };

  const handleSelectSample = (sample: SampleProblemDef) => {
    if (isLoading) return;
    const pngDataUrl = createMathSamplePng(sample.header, sample.equation, sample.note);
    setSelectedFilePreview(pngDataUrl);
    onProblemSelected(
      pngDataUrl,
      studentNote || `I would like help working through this problem step by step: ${sample.title} (${sample.equation}).`
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-4">
      {/* Intro hero banner */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold font-serif-atelier text-[#2A2421]">
          Bring Your Calculus or Algebra Problem
        </h2>
        <p className="text-sm md:text-base text-[#6B5E52] max-w-xl mx-auto leading-relaxed">
          Upload a handwritten or printed math problem. Rather than handing you the answer, your tutor will help you unpack Step 1 and patiently guide your intuition.
        </p>
      </div>

      {/* Main Upload Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 md:p-8 text-center transition-all bg-[#FAF7F2] ${
          dragActive
            ? 'border-[#C85A32] bg-[#FAF2EB]'
            : 'border-[#DED4C5] hover:border-[#C85A32]/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {selectedFilePreview ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative max-h-64 max-w-md rounded-xl overflow-hidden border border-[#D8CEBE] shadow-xs bg-white">
              <img
                src={selectedFilePreview}
                alt="Selected math problem"
                className="max-h-64 object-contain mx-auto"
              />
            </div>

            <div className="w-full max-w-md text-left space-y-2">
              <label className="text-xs font-semibold text-[#52463D]">
                Where are you getting stuck? (Optional)
              </label>
              <input
                type="text"
                value={studentNote}
                onChange={(e) => setStudentNote(e.target.value)}
                placeholder="e.g. 'I don't know how to pick u and dv', 'The fraction looks scary'"
                className="w-full px-3 py-2 text-xs bg-white border border-[#DED4C5] rounded-lg text-[#2A2421] placeholder-[#8C8178] focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedFilePreview(null)}
                className="px-4 py-2 text-xs font-medium text-[#6B5E52] hover:text-[#2A2421] transition-colors cursor-pointer"
              >
                Choose another
              </button>

              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={isLoading}
                className="px-6 py-2.5 bg-[#C85A32] hover:bg-[#B34B26] disabled:bg-[#D5CABB] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Problem...</span>
                  </>
                ) : (
                  <>
                    <span>Begin Socratic Guidance</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#C85A32]/10 flex items-center justify-center text-[#C85A32]">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#2A2421]">
                Drag and drop a photo of your math problem here
              </p>
              <p className="text-xs text-[#7A6D61]">
                High-resolution photos of handwritten notebook work or textbook exercises work great
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white hover:bg-[#F2EDE4] text-[#2A2421] text-xs font-semibold rounded-lg border border-[#DED4C5] shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>Browse Photo</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-4 py-2 bg-[#FAF2EB] hover:bg-[#F5E6DA] text-[#8C3A1E] text-xs font-semibold rounded-lg border border-[#E8C2B0] shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>Snap with Camera</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sample Problem Cards for Zero-Friction 1-Click Exploration */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2A2421]">
            <BookOpen className="w-4 h-4 text-[#C85A32]" />
            <span>Or try a challenge problem from the Atelier Archive</span>
          </div>
          <span className="text-[11px] text-[#7A6D61]">1-click instant start</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAMPLE_PROBLEMS.map((problem) => (
            <button
              key={problem.id}
              onClick={() => handleSelectSample(problem)}
              disabled={isLoading}
              className="text-left p-3.5 bg-white hover:bg-[#FDFBF7] rounded-xl border border-[#E3D9CC] hover:border-[#C85A32] shadow-2xs hover:shadow-xs transition-all group cursor-pointer disabled:opacity-50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#8C3A1E] font-medium mb-1.5">
                  <span>{problem.topic}</span>
                  <span className="text-[10px] text-[#7A6D61]">Card</span>
                </div>
                <h4 className="text-xs font-semibold text-[#2A2421] mb-2">{problem.title}</h4>
                <div className="p-2 bg-[#FAF7F2] rounded-lg border border-[#EAE2D5] font-serif text-center text-xs font-semibold text-[#2A2421] mb-2 group-hover:border-[#C85A32]/40 transition-colors">
                  {problem.equation}
                </div>
                <p className="text-[11px] text-[#6B5E52] leading-relaxed line-clamp-2">
                  {problem.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-[11px] text-[#C85A32] font-medium">
                <span>Start Step 1</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
