import { AppShell } from "@/components/shell/app-shell";
import { getContext } from "@/lib/auth";
import { getFormOptions } from "@/lib/options";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user, workspace, role, workspaces } = await getContext();
  const options = await getFormOptions(workspace.id);

  return (
    <AppShell
      user={{ name: user.name, email: user.email }}
      workspace={{ ...workspace, role }}
      workspaces={workspaces}
      options={options}
    >
      {children}
    </AppShell>
  );
}
