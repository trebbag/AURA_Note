import { WorkspaceClient } from './workspace-client';

interface WorkspacePageProps {
  params: Promise<{ appointmentId: string }>;
}

export default async function DocumentationWorkspacePage({ params }: WorkspacePageProps) {
  const { appointmentId } = await params;
  return <WorkspaceClient appointmentId={appointmentId} />;
}
