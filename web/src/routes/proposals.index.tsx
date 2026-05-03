import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/proposals/")({
  component: () => <h1>Proposals</h1>,
});
