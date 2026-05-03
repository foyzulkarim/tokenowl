import { render, screen } from "@testing-library/react";

describe("test harness", () => {
  it("renders a React component", () => {
    render(<div>hello tokenowl</div>);
    expect(screen.getByText("hello tokenowl")).toBeInTheDocument();
  });
});
