import { redirect } from "next/navigation";

export default async function SpaceDetailRedirectPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  redirect(`/spaces/${params.id}/edit`);
}
