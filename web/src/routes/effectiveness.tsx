import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/effectiveness")({
  component: () => <h1>Effectiveness</h1>,
});
