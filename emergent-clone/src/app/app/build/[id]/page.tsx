import { Builder } from "@/components/app/Builder";

export default async function BuildPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Builder id={id} />;
}
