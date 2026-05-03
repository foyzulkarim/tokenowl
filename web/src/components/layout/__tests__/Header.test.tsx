import { Header } from "@/components/layout/Header";
import { cleanup, render, screen } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

describe("Header", () => {
  it('renders "TokenOwl" app name', () => {
    render(<Header />);
    expect(screen.getByText("TokenOwl")).toBeInTheDocument();
  });

  it('renders "No runs" chip', () => {
    render(<Header />);
    expect(screen.getByText("No runs")).toBeInTheDocument();
  });

  it("center zone has no interactive elements", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header.querySelectorAll("button")).toHaveLength(0);
    expect(header.querySelectorAll("a")).toHaveLength(0);
    expect(header.querySelectorAll("input")).toHaveLength(0);
  });
});
