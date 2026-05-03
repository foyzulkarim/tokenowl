import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sessions/$id")({
  component: () => <h1>Session Detail</h1>,
});
