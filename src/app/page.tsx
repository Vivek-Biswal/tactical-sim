"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  WifiOff, 
  Map, 
  Terminal, 
  Users, 
  CheckCircle2, 
  X,
  Activity,
  Crosshair,
  Radio,
  FileText,
  Clock,
  Target,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

const TopoGridBackground = () => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#F2F0E7]">
    {/* Grid Pattern */}
    <div className="absolute inset-0 opacity-[0.15]" 
         style={{ 
           backgroundImage: 'linear-gradient(#4B5320 1px, transparent 1px), linear-gradient(90deg, #4B5320 1px, transparent 1px)', 
           backgroundSize: '100px 100px' 
         }}>
    </div>
    {/* Sub-grid pattern */}
    <div className="absolute inset-0 opacity-[0.05]" 
         style={{ 
           backgroundImage: 'linear-gradient(#4B5320 1px, transparent 1px), linear-gradient(90deg, #4B5320 1px, transparent 1px)', 
           backgroundSize: '20px 20px' 
         }}>
    </div>
    
    {/* Topographic SVG Lines */}
    <div className="absolute inset-0 opacity-[0.05]">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M 0 200 Q 300 300 500 100 T 1000 400 T 1500 200 T 2000 500" fill="none" stroke="#252B25" strokeWidth="2" />
        <path d="M 0 250 Q 350 350 550 150 T 1050 450 T 1550 250 T 2000 550" fill="none" stroke="#252B25" strokeWidth="1" />
        <path d="M 0 300 Q 400 400 600 200 T 1100 500 T 1600 300 T 2000 600" fill="none" stroke="#252B25" strokeWidth="0.5" />
      </svg>
    </div>

    {/* Edge Coordinates */}
    <div className="absolute top-4 left-4 text-[#687064] text-xs font-mono opacity-50 font-bold tracking-widest">
      LAT 34.0522° N / LONG 118.2437° W
    </div>
    <div className="absolute bottom-4 right-4 text-[#687064] text-xs font-mono opacity-50 font-bold tracking-widest">
      GRID SEC: 4-ALPHA-TANGO
    </div>
  </div>
);

export default function LandingPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const router = useRouter();
  const { setRole } = useAuth();

  const handleRoleLogin = (path: string, roleKey: string) => {
    setIsLoginModalOpen(false);
    setRole(roleKey);
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-[#F2F0E7] text-[#252B25] font-sans selection:bg-[#4B5320] selection:text-[#FFFFFF]">
      
      {/* Navigation - Deep Military Green */}
      <nav className="fixed w-full top-0 z-50 bg-[#26352A] shadow-md border-b border-[#344638]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            <div className="flex items-center gap-3">
              <Shield className="h-10 w-10 text-[#D8C9A7]" />
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-wider text-[#FFFFFF] leading-tight">TACTICAL-SIM</span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#A88B52] leading-tight">DEFENCE TRAINING SYSTEM</span>
              </div>
            </div>
            
            <div className="hidden md:flex gap-8 items-center">
              <a href="#" className="text-[#F2F0E7] hover:text-[#A88B52] text-sm font-bold tracking-widest transition-colors">HOME</a>
              <a href="#features" className="text-[#F2F0E7] hover:text-[#A88B52] text-sm font-bold tracking-widest transition-colors">TRAINING</a>
              <a href="#" className="text-[#F2F0E7] hover:text-[#A88B52] text-sm font-bold tracking-widest transition-colors">SCENARIOS</a>
              <a href="#" className="text-[#F2F0E7] hover:text-[#A88B52] text-sm font-bold tracking-widest transition-colors">ABOUT</a>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-2 border border-[#4B5320] bg-[#344638] px-3 py-1.5 rounded">
                <span className="text-[#D8C9A7] text-[10px] font-bold tracking-widest">SYSTEM STATUS</span>
                <div className="w-2 h-2 rounded-full bg-[#5C7A29] shadow-[0_0_8px_#5C7A29] animate-pulse"></div>
              </div>
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-[#4B5320] hover:bg-[#596340] text-[#FFFFFF] px-6 py-2.5 rounded font-bold tracking-wide transition-colors border border-[#6B7650]"
              >
                LOGIN
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden min-h-[90vh] flex items-center">
        <TopoGridBackground />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#26352A] text-[#D8C9A7] text-[11px] font-bold tracking-[0.2em] mb-6 self-start shadow-sm border border-[#4B5320]">
                <Target className="w-3.5 h-3.5" />
                TACTICAL DECISION-MAKING TRAINING
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-[#26352A] tracking-tighter mb-6 leading-[1.1]">
                TRAIN FOR <br/>THE UNKNOWN.
              </h1>
              
              <p className="text-xl md:text-2xl text-[#687064] mb-8 max-w-xl leading-relaxed font-medium">
                Train commanders and teams to make time-critical decisions when communication, information, and situational awareness are degraded.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-[#26352A] hover:bg-[#344638] text-[#FFFFFF] px-8 py-4 rounded text-sm font-black tracking-widest transition-colors shadow-lg border border-[#4B5320] flex items-center justify-center gap-3"
                >
                  <Terminal className="w-5 h-5 text-[#A88B52]" />
                  START TRAINING
                </button>
                <a 
                  href="#features"
                  className="bg-[#F2F0E7] hover:bg-[#E8E5D5] text-[#26352A] border-2 border-[#4B5320] px-8 py-4 rounded text-sm font-black tracking-widest transition-colors flex items-center justify-center shadow-sm"
                >
                  EXPLORE PLATFORM
                </a>
              </div>

              <div className="text-[10px] font-bold text-[#A88B52] tracking-[0.25em] flex items-center gap-2">
                OPERATIONAL READINESS <span className="text-[#4B5320]">/</span> COMMAND <span className="text-[#4B5320]">/</span> DECISION SUPPORT
              </div>
            </div>

            {/* Right Side: Command Console */}
            <div className="relative w-full h-[550px] bg-[#26352A] rounded shadow-2xl border-4 border-[#344638] overflow-hidden flex flex-col">
              {/* Console Header */}
              <div className="h-14 bg-[#1C261F] border-b-2 border-[#4B5320] flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-[#A88B52]" />
                  <span className="text-[#FFFFFF] font-bold tracking-widest text-sm">TACTICAL COMMAND CONSOLE</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-6 bg-[#A94438] opacity-80"></div>
                  <div className="w-1.5 h-6 bg-[#5C7A29]"></div>
                  <div className="w-1.5 h-6 bg-[#5C7A29]"></div>
                </div>
              </div>

              {/* Console Metadata Bar */}
              <div className="bg-[#344638] px-6 py-3 border-b border-[#4B5320] grid grid-cols-3 gap-4 text-xs font-mono font-bold tracking-wider">
                <div className="flex flex-col">
                  <span className="text-[#A88B52] text-[10px]">OPERATION</span>
                  <span className="text-[#FFFFFF]">SILENT LINK</span>
                </div>
                <div className="flex flex-col border-l border-[#4B5320] pl-4">
                  <span className="text-[#A88B52] text-[10px]">EXERCISE STATUS</span>
                  <span className="text-[#5C7A29]">ACTIVE</span>
                </div>
                <div className="flex flex-col border-l border-[#4B5320] pl-4">
                  <span className="text-[#A88B52] text-[10px]">TIME REMAINING</span>
                  <span className="text-[#FFFFFF] flex items-center gap-1"><Clock className="w-3 h-3"/> 18:42</span>
                </div>
              </div>

              <div className="flex flex-1">
                {/* Console Sidebar */}
                <div className="w-48 bg-[#212E24] border-r border-[#4B5320] p-4 flex flex-col gap-4">
                  <div className="p-3 bg-[#1C261F] border border-[#4B5320] rounded shadow-inner">
                    <span className="text-[#A88B52] text-[10px] block mb-1 font-bold">COMMUNICATION</span>
                    <span className="text-[#A94438] font-bold text-xs flex items-center gap-2"><WifiOff className="w-3 h-3"/> DEGRADED</span>
                  </div>
                  <div className="p-3 bg-[#1C261F] border border-[#4B5320] rounded shadow-inner">
                    <span className="text-[#A88B52] text-[10px] block mb-1 font-bold">TEAM STATUS</span>
                    <span className="text-[#5C7A29] font-bold text-xs flex items-center gap-2"><Users className="w-3 h-3"/> READY (2/2)</span>
                  </div>
                  <div className="p-3 bg-[#1C261F] border border-[#4B5320] rounded shadow-inner">
                    <span className="text-[#A88B52] text-[10px] block mb-1 font-bold">CURRENT GRID</span>
                    <span className="text-[#FFFFFF] font-mono text-xs">24A-TANGO</span>
                  </div>
                </div>

                {/* Map Area */}
                <div className="flex-1 bg-[#151C17] relative p-6 overflow-hidden">
                  {/* Radar/Map Grid */}
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#4B5320 1px, transparent 1px), linear-gradient(90deg, #4B5320 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-[#4B5320]/30 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] border border-[#4B5320]/50 rounded-full"></div>
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#4B5320]/40"></div>
                  <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-[#4B5320]/40"></div>

                  {/* Units */}
                  <div className="absolute top-[30%] left-[40%] flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#26352A] border-2 border-[#5C7A29] flex items-center justify-center relative">
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#5C7A29] rounded-full"></div>
                      <Crosshair className="w-3 h-3 text-[#5C7A29]" />
                    </div>
                    <div className="bg-[#1C261F] border border-[#4B5320] px-2 py-0.5 text-[10px] text-[#5C7A29] font-mono font-bold">A-COY</div>
                  </div>

                  <div className="absolute bottom-[40%] right-[30%] flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#26352A] border-2 border-[#A94438] flex items-center justify-center relative">
                      <AlertTriangle className="w-3 h-3 text-[#A94438]" />
                    </div>
                    <div className="bg-[#1C261F] border border-[#4B5320] px-2 py-0.5 text-[10px] text-[#A94438] font-mono font-bold">HVT-1</div>
                  </div>
                  
                  {/* Warning Overlay */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#A94438]/20 border border-[#A94438] px-4 py-1.5 flex items-center gap-2 backdrop-blur-sm">
                    <WifiOff className="w-4 h-4 text-[#A94438]" />
                    <span className="text-[#FFFFFF] text-xs font-bold tracking-widest">RF JAMMING DETECTED IN SECTOR B</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 bg-[#EBE8D8] border-y border-[#D8C9A7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#A88B52] text-xs font-bold tracking-[0.2em] uppercase mb-4 block">Core Capabilities</span>
            <h2 className="text-3xl md:text-4xl font-black text-[#26352A] mb-4 tracking-tight uppercase">Master Cognitive Friction</h2>
            <div className="w-24 h-1 bg-[#4B5320] mx-auto mb-6"></div>
            <p className="text-[#687064] text-lg max-w-2xl mx-auto font-medium">
              Our simulator injects realistic electronic warfare and communication breakdowns into your training pipeline.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-[#FFFFFF] p-8 rounded border-t-4 border-t-[#4B5320] border-[#D8C9A7] border-l border-r border-b shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-[#F2F0E7] border border-[#D8C9A7] rounded flex items-center justify-center mb-6">
                <Map className="w-6 h-6 text-[#4B5320]" />
              </div>
              <h3 className="text-xl font-black text-[#252B25] mb-3 uppercase tracking-wide">Realistic Scenarios</h3>
              <p className="text-[#687064] leading-relaxed font-medium">
                Common Operating Pictures (COP) aren't always real-time. Learn to recognize frozen GPS tracks and navigate contradictory scouting reports in field conditions.
              </p>
            </div>
            
            {/* Card 2 */}
            <div className="bg-[#FFFFFF] p-8 rounded border-t-4 border-t-[#A94438] border-[#D8C9A7] border-l border-r border-b shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-[#F2F0E7] border border-[#D8C9A7] rounded flex items-center justify-center mb-6">
                <WifiOff className="w-6 h-6 text-[#A94438]" />
              </div>
              <h3 className="text-xl font-black text-[#252B25] mb-3 uppercase tracking-wide">Communication Disruption</h3>
              <p className="text-[#687064] leading-relaxed font-medium">
                Experience simulated radio delays, packet drops, and complete RF jamming. Train your teams to operate autonomously when the network goes dark.
              </p>
            </div>
            
            {/* Card 3 */}
            <div className="bg-[#FFFFFF] p-8 rounded border-t-4 border-t-[#A88B52] border-[#D8C9A7] border-l border-r border-b shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-[#F2F0E7] border border-[#D8C9A7] rounded flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-[#A88B52]" />
              </div>
              <h3 className="text-xl font-black text-[#252B25] mb-3 uppercase tracking-wide">After-Action Review</h3>
              <p className="text-[#687064] leading-relaxed font-medium">
                Automatically generate objective debriefs mapping every tactical decision to the verified or denied facts available at that exact second.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#26352A] py-16 border-t-[8px] border-[#4B5320]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-[#D8C9A7]" />
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-wider text-[#FFFFFF] leading-tight">TACTICAL-SIM</span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#A88B52] leading-tight">DEFENCE TRAINING SYSTEM</span>
            </div>
          </div>
          <p className="text-[#D8C9A7] text-sm font-medium tracking-wide">
            &copy; {new Date().getFullYear()} TACTICAL-SIM INC. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6 text-xs font-bold tracking-widest text-[#D8C9A7]">
            <a href="#" className="hover:text-[#FFFFFF] transition-colors">PRIVACY POLICY</a>
            <a href="#" className="hover:text-[#FFFFFF] transition-colors">SECURITY PROTOCOL</a>
            <a href="#" className="hover:text-[#FFFFFF] transition-colors">CONTACT COMMAND</a>
          </div>
        </div>
      </footer>

      {/* Demo Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#252B25]/80 backdrop-blur-sm"
            onClick={() => setIsLoginModalOpen(false)}
          ></div>
          <div className="relative bg-[#F2F0E7] w-full max-w-md rounded shadow-2xl border-4 border-[#344638] overflow-hidden flex flex-col">
            
            <div className="relative z-10 flex justify-between items-center p-6 border-b border-[#D8C9A7] bg-[#FFFFFF]">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#4B5320]" />
                <h3 className="text-lg font-black text-[#26352A] uppercase tracking-wide">Secure Access</h3>
              </div>
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="text-[#687064] hover:text-[#A94438] transition-colors bg-[#F2F0E7] p-1.5 rounded border border-[#D8C9A7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative z-10 p-6">
              <div className="bg-[#D8C9A7]/30 border-l-4 border-[#A88B52] p-3 mb-6 text-sm text-[#252B25] font-medium">
                Select your operational role to enter the training environment. No secure credential required for demo mode.
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => handleRoleLogin('/instructor', 'instructor')}
                  className="w-full flex items-center gap-4 p-4 rounded border border-[#C3B091] bg-[#FFFFFF] hover:border-[#4B5320] hover:bg-[#EBE8D8] transition-all group text-left shadow-sm"
                >
                  <div className="bg-[#F2F0E7] border border-[#C3B091] group-hover:bg-[#4B5320] group-hover:border-[#344638] group-hover:text-[#FFFFFF] text-[#26352A] w-10 h-10 rounded flex items-center justify-center transition-colors">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-[#252B25] uppercase tracking-wide">Instructor</div>
                    <div className="text-sm text-[#687064] font-medium">Control scenarios & inject disruption</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleRoleLogin('/commander', 'commander')}
                  className="w-full flex items-center gap-4 p-4 rounded border border-[#C3B091] bg-[#FFFFFF] hover:border-[#4B5320] hover:bg-[#EBE8D8] transition-all group text-left shadow-sm"
                >
                  <div className="bg-[#F2F0E7] border border-[#C3B091] group-hover:bg-[#4B5320] group-hover:border-[#344638] group-hover:text-[#FFFFFF] text-[#26352A] w-10 h-10 rounded flex items-center justify-center transition-colors">
                    <Map className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-[#252B25] uppercase tracking-wide">Commander</div>
                    <div className="text-sm text-[#687064] font-medium">Access C2 dashboard & tactical map</div>
                  </div>
                </button>

                <button 
                  onClick={() => handleRoleLogin('/team', 'team')}
                  className="w-full flex items-center gap-4 p-4 rounded border border-[#C3B091] bg-[#FFFFFF] hover:border-[#4B5320] hover:bg-[#EBE8D8] transition-all group text-left shadow-sm"
                >
                  <div className="bg-[#F2F0E7] border border-[#C3B091] group-hover:bg-[#4B5320] group-hover:border-[#344638] group-hover:text-[#FFFFFF] text-[#26352A] w-10 h-10 rounded flex items-center justify-center transition-colors">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-[#252B25] uppercase tracking-wide">Team Member</div>
                    <div className="text-sm text-[#687064] font-medium">Submit SITREPs & navigate terrain</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
