import { render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/Header";

beforeEach(() => {
  render(<Header />);
});

describe("Header", () => {
  it('renders "TokenOwl" app name', () => {
    expect(screen.getByText("TokenOwl")).toBeInTheDocument();
  });

  it('renders "No runs" chip', () => {
    expect(screen.getByText("No runs")).toBeInTheDocument();
  });

  it("center zone has no interactive elements", () => {
    const header = screen.getByRole("banner");
    expect(header.querySelectorAll("button")).toHaveLength(0);
    expect(header.querySelectorAll("a")).toHaveLength(0);
    expect(header.querySelectorAll("input")).toHaveLength(0);
  });
});
