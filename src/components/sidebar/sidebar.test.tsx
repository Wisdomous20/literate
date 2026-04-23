import { render, screen } from "@testing-library/react";
import { Sidebar } from "./sidebar";

const mockUsePathname = vi.fn();
const mockUseSession = vi.fn();
const mockSignOut = vi.fn();
const mockHasActiveAccessAction = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

vi.mock("@/app/actions/subscription/hasActiveAccess", () => ({
  hasActiveAccessAction: () => mockHasActiveAccessAction(),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/dashboard");
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          name: "Paid Teacher",
          role: "TEACHER",
        },
      },
      status: "authenticated",
    });
    mockHasActiveAccessAction.mockReset();
  });

  it("hides the upgrade card while subscription access is still loading", () => {
    mockHasActiveAccessAction.mockReturnValue(new Promise(() => {}));

    render(<Sidebar />);

    expect(screen.queryByText("Upgrade to Premium")).not.toBeInTheDocument();
  });
});
