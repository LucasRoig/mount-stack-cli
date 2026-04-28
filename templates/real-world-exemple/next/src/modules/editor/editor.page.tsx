import { Container } from "@/components/layout/container";
import { EditorForm } from "./editor.form";

export function EditorPage() {
  return (
    <Container className="w-full my-6" maxWidth="sm">
      <EditorForm />
    </Container>
  );
}
