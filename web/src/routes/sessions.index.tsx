import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sessions/")({
  component: () => <h1>Sessions</h1>,
});
