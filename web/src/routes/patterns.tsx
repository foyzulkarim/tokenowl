import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/patterns")({
  component: () => <h1>Patterns</h1>,
});
