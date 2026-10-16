export interface Actor {
  userId: number;
  login: string;
  roles: string[];
  projectIds: number[];
}

/**
 * Xác thực actor từ session/token đã kiểm chứng.
 * KHÔNG tin actorId/role từ body/prompt AI.
 */
export function resolveActor(req: any): Actor {
  const session = req.session;
  if (!session?.actor) throw new Error('UNAUTHENTICATED');
  return session.actor;
}