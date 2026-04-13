export async function ProfilePage(props: PageProps<"/profile/[username]">) {
  const { username } = await props.params;
  return <div>Profile page {username}</div>;
}
