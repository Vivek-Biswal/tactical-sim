"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { PanelCard } from "@/components/ui/PanelCard";
import { StatusBadge, StatusVariant } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Filter, Search, ChevronRight, BookOpen } from "lucide-react";

/* ── Mock Data ────────────────────────────────────── */
type Scenario = {
  id: string;
  name: string;
  description: string;
  type: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  status: StatusVariant;
  exercises: string;
  updated: string;
};

const mockScenarios: Scenario[] = [
  {
    id: "SCN-001",
    name: "Operation Silent Link",
    description: "Decision-making under degraded communication conditions.",
    type: "COMMANDER",
    difficulty: "ADVANCED",
    status: "ACTIVE",
    exercises: "04",
    updated: "02 OCT 2026",
  },
  {
    id: "SCN-002",
    name: "Iron Horizon",
    description: "Small-team coordination with limited information.",
    type: "TEAM",
    difficulty: "INTERMEDIATE",
    status: "PENDING",
    exercises: "02",
    updated: "01 OCT 2026",
  },
  {
    id: "SCN-003",
    name: "Field Echo",
    description: "Decision-making with conflicting field reports.",
    type: "DECISION MAKING",
    difficulty: "ADVANCED",
    status: "ACTIVE",
    exercises: "03",
    updated: "29 SEP 2026",
  },
  {
    id: "SCN-004",
    name: "Silent Grid",
    description: "Communication disruption and information delay training.",
    type: "COMMUNICATION",
    difficulty: "INTERMEDIATE",
    status: "ARCHIVED",
    exercises: "05",
    updated: "18 SEP 2026",
  },
];

export default function ScenariosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [diffFilter, setDiffFilter] = useState("ALL");

  // Filtering logic
  const filteredScenarios = mockScenarios.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Convert status PENDING back to DRAFT for the UI filter concept
    const sStatus = s.status === "PENDING" ? "DRAFT" : s.status;
    const matchesStatus = statusFilter === "ALL" || sStatus === statusFilter;
    
    const matchesType = typeFilter === "ALL" || s.type === typeFilter;
    const matchesDiff = diffFilter === "ALL" || s.difficulty === diffFilter;

    return matchesSearch && matchesStatus && matchesType && matchesDiff;
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setDiffFilter("ALL");
  };

  return (
    <AppShell pageTitle="SCENARIO MANAGEMENT" role="instructor">
      <PageHeader
        label="SCENARIO MANAGEMENT"
        title="Training Scenarios"
        description="Create, manage and deploy decision-making exercises."
        action={
          <div className="flex gap-3 flex-wrap">
            <SecondaryButton icon={<Filter size={16} />}>FILTER</SecondaryButton>
            <Link href="/instructor/scenarios/create">
              <PrimaryButton icon={<Plus size={16} />}>CREATE SCENARIO</PrimaryButton>
            </Link>
          </div>
        }
      />

      <div className="mt-8 flex flex-col gap-6">
        {/* Search & Filter Bar */}
        <PanelCard noPadding className="overflow-visible">
          <div className="p-4 flex flex-col lg:flex-row gap-4 items-center">
            
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A59E]" />
              <input
                type="text"
                placeholder="Search scenarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded border border-[#D9D8CE] bg-[#F7F5EE] text-[#263229] placeholder-[#A0A59E] font-medium text-sm focus:outline-none focus:border-[#556B3F] focus:ring-1 focus:ring-[#556B3F] transition-all"
              />
            </div>
            
            <div className="flex flex-wrap lg:flex-nowrap gap-4 w-full lg:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 lg:w-32 px-3 py-2 rounded border border-[#D9D8CE] bg-[#FFFFFF] text-[#263229] font-medium text-sm focus:outline-none focus:border-[#556B3F]"
              >
                <option value="ALL">Status: All</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex-1 lg:w-40 px-3 py-2 rounded border border-[#D9D8CE] bg-[#FFFFFF] text-[#263229] font-medium text-sm focus:outline-none focus:border-[#556B3F]"
              >
                <option value="ALL">Type: All</option>
                <option value="COMMANDER">Commander</option>
                <option value="TEAM">Team</option>
                <option value="COMMUNICATION">Communication</option>
                <option value="DECISION MAKING">Decision Making</option>
              </select>

              <select
                value={diffFilter}
                onChange={(e) => setDiffFilter(e.target.value)}
                className="flex-1 lg:w-36 px-3 py-2 rounded border border-[#D9D8CE] bg-[#FFFFFF] text-[#263229] font-medium text-sm focus:outline-none focus:border-[#556B3F]"
              >
                <option value="ALL">Difficulty: All</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>

          </div>
        </PanelCard>

        {/* Scenario List */}
        {filteredScenarios.length === 0 ? (
          <PanelCard>
            <EmptyState
              icon={<BookOpen size={28} />}
              title="No scenarios found"
              description="Try changing your search or filter settings."
              action={
                <SecondaryButton onClick={handleClearFilters}>
                  CLEAR FILTERS
                </SecondaryButton>
              }
            />
          </PanelCard>
        ) : (
          <PanelCard noPadding className="overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#EFE8D8] border-b border-[#D9D8CE]">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#687066]">Scenario</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#687066]">Type</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#687066]">Difficulty</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#687066]">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#687066]">Exercises</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#687066]">Last Updated</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#687066] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D8CE]">
                  {filteredScenarios.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F7F5EE] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#263229]">{s.name}</span>
                          <span className="text-[10px] font-mono font-bold tracking-widest text-[#B69B63] mt-0.5">{s.id}</span>
                          <span className="text-xs text-[#687066] font-medium mt-1">{s.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold tracking-widest text-[#344438] bg-[#EFE8D8] px-2 py-1 rounded">{s.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-black tracking-wide text-[#556B3F]">{s.difficulty}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-bold text-[#263229]">{s.exercises}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-[#687066]">
                        {s.updated}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/instructor/exercises/${s.id}`}>
                          <SecondaryButton size="sm">OPEN</SecondaryButton>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden divide-y divide-[#D9D8CE]">
              {filteredScenarios.map((s) => (
                <div key={s.id} className="p-5 hover:bg-[#F7F5EE] transition-colors flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="text-base font-black text-[#263229]">{s.name}</div>
                      <div className="text-[10px] font-mono font-bold tracking-widest text-[#B69B63] mt-0.5">{s.id}</div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  
                  <div className="text-sm text-[#687066] font-medium">
                    {s.description}
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-[#687066] mb-0.5">Type</div>
                      <span className="font-bold tracking-widest text-[#344438] bg-[#EFE8D8] px-1.5 py-0.5 rounded">{s.type}</span>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-[#687066] mb-0.5">Difficulty</div>
                      <span className="font-black tracking-wide text-[#556B3F]">{s.difficulty}</span>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-[#687066] mb-0.5">Exercises</div>
                      <span className="font-mono font-bold text-[#263229]">{s.exercises}</span>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-[#687066] mb-0.5">Updated</div>
                      <span className="font-medium text-[#687066]">{s.updated}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link href={`/instructor/exercises/${s.id}`} className="block">
                      <SecondaryButton fullWidth className="justify-center">OPEN SCENARIO</SecondaryButton>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </PanelCard>
        )}
      </div>
    </AppShell>
  );
}
