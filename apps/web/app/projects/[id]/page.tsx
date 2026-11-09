import ProjectDemo from "./ProjectDemo";

interface DemoPageProps {
  // Next 15: params is a Promise in server components.
  params: Promise<{ id: string }>;
}

export default async function ProjectDemoPage({ params }: DemoPageProps) {
  const { id } = await params;
  // Project data lives in localStorage, so all loading happens client-side.
  return <ProjectDemo id={id} />;
}
