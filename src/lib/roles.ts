/** Workspace types. Live exercise authority is assigned by server room ownership. */
export type AccountRole = "instructor" | "commander" | "team";
export type TeamParticipantRole = "TEAM_ALPHA" | "TEAM_BRAVO" | "TEAM_CHARLIE";
export type AccountParticipantRole = "INSTRUCTOR" | "COMMANDER" | TeamParticipantRole;

export const accountRoleLabels: Record<AccountRole, string> = {
  instructor: "Instructor",
  commander: "Commander",
  team: "Team member",
};

export function isLocalPracticeHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function accountRoleFromClaims(claims: Record<string, unknown>): AccountRole | null {
  void claims;
  // All signed-in users can create or join rooms. The server assigns room roles.
  return "commander";
}

export function accountHome(role: AccountRole): string {
  void role;
  return "/training";
}

export function accountParticipantRole(role: AccountRole, team: TeamParticipantRole = "TEAM_ALPHA"): AccountParticipantRole {
  return role === "instructor" ? "INSTRUCTOR" : role === "commander" ? "COMMANDER" : team;
}

function applicationPath(path: string): string | null {
  if (!path.startsWith("/") || path.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(path)) return null;
  try {
    // Decode before normalising so encoded separators and '..' cannot bypass a role prefix.
    const decoded = decodeURIComponent(path.split(/[?#]/, 1)[0]);
    if (decoded.startsWith("//") || /[\\%\u0000-\u001f\u007f]/.test(decoded)) return null;
    return new URL(decoded, "https://chakravyuh.invalid").pathname;
  } catch {
    return null;
  }
}

export function canAccessPath(role: AccountRole | null, path: string): boolean {
  if (!role) return false;
  const pathname = applicationPath(path);
  if (!pathname) return false;
  const inSection = (section: string) => pathname === section || pathname.startsWith(`${section}/`);
  for (const restricted of ["instructor", "commander", "team"] as const) {
    if (inSection(`/${restricted}`)) return true;
  }
  return pathname === "/" || ["/maps", "/training", "/aar", "/dashboard"].some(inSection);
}

/** A saved destination may improve navigation; it cannot expand account permissions. */
export function accountDestination(role: AccountRole, path: string | null): string {
  return path && canAccessPath(role, path) ? path : accountHome(role);
}
