import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username}'s Instagram Strategy Breakdown | The Hook Lab`,
    description: `Deep AI Analysis of @${username}'s growth, content themes, and viral hooks. View the full report and insights.`,
  };
}

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
