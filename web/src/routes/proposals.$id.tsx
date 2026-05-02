import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/proposals/$id")({
  component: () => <h1>Proposal Detail</h1>,
});
