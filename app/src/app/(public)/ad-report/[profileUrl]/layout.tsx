import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ profileUrl: string }> }): Promise<Metadata> {
  const { profileUrl } = await params;
  const decoded = decodeURIComponent(profileUrl);
  return {
    title: `${decoded} Ad Intelligence Breakdown | The Hook Lab`,
    description: `Deep AI Analysis of ${decoded}'s Facebook ad creatives, strategy, and viral hooks. View the full report and insights.`,
  };
}

export default function AdReportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
