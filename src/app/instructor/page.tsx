import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { PanelCard } from "@/components/ui/PanelCard";
import { StatusBadge, StatusVariant } from "@/components/ui/StatusBadge";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Plus, List, Target, Users, Calendar, Activity, BarChart } from "lucide-react";
import Link from "next/link";
import React from "react";
import { TrainingExampleNotice } from "@/components/integration/TrainingExampleNotice";

export default function InstructorPage() {
  return (
    <AppShell pageTitle="INSTRUCTOR CONTROL" role="instructor">
      <TrainingExampleNotice />
      <PageHeader
        label="INSTRUCTOR CONTROL"
        title="Training Dashboard"
        description="Monitor exercises, manage scenarios and review trainee activity."
        action={
          <div className="flex gap-3 flex-wrap">
            <Link href="/instructor/scenarios">
              <SecondaryButton icon={<List size={16} />}>VIEW SCENARIOS</SecondaryButton>
            </Link>
            <Link href="/training">
              <PrimaryButton icon={<Plus size={16} />}>CREATE EXERCISE</PrimaryButton>
            </Link>
          </div>
        }
      />

      <div className="mt-8 flex flex-col gap-6">
        
        {/* 1. SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PanelCard accent="olive">
            <div className="flex justify-between items-start mb-2">
              <div className="text-[10px] font-black tracking-[0.15em] text-[#687066]">ACTIVE EXERCISES</div>
              <StatusBadge status="ACTIVE" showDot={false} />
            </div>
            <div className="text-3xl font-black text-[#263229]">03</div>
            <div className="text-xs font-medium text-[#687066] mt-1">Currently running</div>
          </PanelCard>
          
          <PanelCard accent="brass">
            <div className="flex justify-between items-start mb-2">
              <div className="text-[10px] font-black tracking-[0.15em] text-[#687066]">TOTAL TRAINEES</div>
              <Users size={16} className="text-[#B69B63]" />
            </div>
            <div className="text-3xl font-black text-[#263229]">24</div>
            <div className="text-xs font-medium text-[#687066] mt-1">Across active exercises</div>
          </PanelCard>

          <PanelCard>
            <div className="flex justify-between items-start mb-2">
              <div className="text-[10px] font-black tracking-[0.15em] text-[#687066]">UPCOMING EXERCISES</div>
              <Calendar size={16} className="text-[#687066]" />
            </div>
            <div className="text-3xl font-black text-[#263229]">05</div>
            <div className="text-xs font-medium text-[#687066] mt-1">Scheduled this week</div>
          </PanelCard>

          <PanelCard>
            <div className="flex justify-between items-start mb-2">
              <div className="text-[10px] font-black tracking-[0.15em] text-[#687066]">COMPLETION RATE</div>
              <Activity size={16} className="text-[#687066]" />
            </div>
            <div className="text-3xl font-black text-[#263229]">86%</div>
            <div className="text-xs font-medium text-[#687066] mt-1">Current training cycle</div>
          </PanelCard>
        </div>

        {/* 2. MAIN PANELS: Active Exercises (2/3) + Recent Activity (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2">
            <PanelCard
              header={
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#263229]">Active Exercises</h3>
                  <p className="text-xs text-[#687066] font-medium mt-0.5">Currently running training exercises</p>
                </div>
              }
              noPadding
            >
              <div className="divide-y divide-[#D9D8CE]">
                {[
                  { id: "EX-001", name: "Operation Silent Link", status: "ACTIVE", role: "COMMANDER TRAINING", trainees: "08", time: "18:42 remaining", link: "/instructor/exercises/ex-001" },
                  { id: "EX-002", name: "Exercise Iron Horizon", status: "DEGRADED", role: "TEAM TRAINING", trainees: "06", time: "32:15 remaining", link: "/instructor/exercises/ex-002" },
                  { id: "EX-003", name: "Exercise Field Echo", status: "ACTIVE", role: "COMMAND TRAINING", trainees: "10", time: "11:27 remaining", link: "/instructor/exercises/ex-003" }
                ].map((ex) => (
                  <div key={ex.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F7F5EE]/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-base font-black text-[#263229]">{ex.name}</span>
                        <StatusBadge status={ex.status as StatusVariant} />
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs font-mono font-bold tracking-widest text-[#71805A]">
                        <span>ID: {ex.id}</span>
                        <span className="hidden md:inline text-[#D9D8CE]">|</span>
                        <span>{ex.role}</span>
                        <span className="hidden md:inline text-[#D9D8CE]">|</span>
                        <span>{ex.trainees} TRAINEES</span>
                        <span className="hidden md:inline text-[#D9D8CE]">|</span>
                        <span className="text-[#344438]">{ex.time}</span>
                      </div>
                    </div>
                    <Link href={ex.link}>
                      <SecondaryButton size="sm">OPEN EXERCISE</SecondaryButton>
                    </Link>
                  </div>
                ))}
              </div>
            </PanelCard>
          </div>

          <div className="lg:col-span-1">
            <PanelCard
              header={<h3 className="text-sm font-black uppercase tracking-widest text-[#263229]">Recent Training Activity</h3>}
            >
              <div className="relative border-l border-[#D9D8CE] ml-2 space-y-6 pb-2">
                {[
                  { time: "14:32", text: "Exercise Operation Silent Link started.", iconBg: "bg-[#4A7A3A]" },
                  { time: "13:48", text: "Commander assessment completed.", iconBg: "bg-[#71805A]" },
                  { time: "12:20", text: "New scenario Field Echo created.", iconBg: "bg-[#B69B63]" },
                  { time: "11:15", text: "Team Member group assigned to Exercise Iron Horizon.", iconBg: "bg-[#D9D8CE]" },
                ].map((item, i) => (
                  <div key={i} className="relative pl-6">
                    <span className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${item.iconBg} ring-4 ring-white`} />
                    <div className="text-[10px] font-mono font-bold tracking-widest text-[#B69B63] mb-1">{item.time}</div>
                    <div className="text-sm font-medium text-[#263229] leading-relaxed">{item.text}</div>
                  </div>
                ))}
              </div>
            </PanelCard>
          </div>

        </div>

        {/* 3. BOTTOM PANELS: Quick Actions (2/3) + Upcoming (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#687066] mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/instructor/scenarios/create" className="group">
                <PanelCard className="h-full border-[#D9D8CE] group-hover:border-[#556B3F] group-hover:bg-[#EFE8D8] transition-all cursor-pointer">
                  <Target size={24} className="text-[#556B3F] mb-3" />
                  <div className="text-sm font-black uppercase tracking-widest text-[#344438] mb-1">Create Scenario</div>
                  <div className="text-xs text-[#687066] font-medium">Build a new training scenario.</div>
                </PanelCard>
              </Link>
              
              <Link href="/instructor/scenarios" className="group">
                <PanelCard className="h-full border-[#D9D8CE] group-hover:border-[#556B3F] group-hover:bg-[#EFE8D8] transition-all cursor-pointer">
                  <List size={24} className="text-[#556B3F] mb-3" />
                  <div className="text-sm font-black uppercase tracking-widest text-[#344438] mb-1">Manage Exercises</div>
                  <div className="text-xs text-[#687066] font-medium">View and manage active exercises.</div>
                </PanelCard>
              </Link>
              
              <Link href="#" className="group">
                <PanelCard className="h-full border-[#D9D8CE] group-hover:border-[#B69B63] group-hover:bg-[#EFE8D8] transition-all cursor-pointer">
                  <BarChart size={24} className="text-[#B69B63] mb-3" />
                  <div className="text-sm font-black uppercase tracking-widest text-[#344438] mb-1">Review Performance</div>
                  <div className="text-xs text-[#687066] font-medium">Review trainee training results.</div>
                </PanelCard>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#687066] mb-3">Upcoming Training</h3>
            <PanelCard noPadding>
              <div className="divide-y divide-[#D9D8CE]">
                {[
                  { date: "03 OCT", title: "Operation Silent Link", type: "Commander Decision Exercise" },
                  { date: "05 OCT", title: "Field Echo", type: "Team Coordination Exercise" },
                  { date: "07 OCT", title: "Iron Horizon", type: "Degraded Communication Exercise" },
                ].map((item, i) => (
                  <div key={i} className="p-4 flex gap-4 hover:bg-[#F7F5EE] transition-colors">
                    <div className="w-12 h-12 bg-[#EFE8D8] rounded flex flex-col items-center justify-center flex-shrink-0 border border-[#D8C7A5]">
                      <span className="text-sm font-black text-[#344438] leading-none">{item.date.split(" ")[0]}</span>
                      <span className="text-[9px] font-black tracking-widest text-[#71805A] mt-1">{item.date.split(" ")[1]}</span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="text-sm font-black text-[#263229] truncate">{item.title}</div>
                      <div className="text-xs font-medium text-[#687066] truncate mt-0.5">{item.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </PanelCard>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
