import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DownloadSettingsModal from "../pages/master/statutory/company-gst-details/components/DownloadSettingsModal";

describe("DownloadSettingsModal Component Tests", () => {
  const registrations = [
    { gst_id: 1, state_id: "Chhattisgarh Registration", gstin: "22AAAAA0000A1Z1" },
    { gst_id: 2, state_id: "Maharashtra Registration", gstin: "27BBBBB1111B2Z2" }
  ];

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <DownloadSettingsModal
        isOpen={false}
        registrations={registrations}
        initialRegistration=""
        initialReturnType="All Returns"
        onSave={() => {}}
        onClose={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render correct initial state and lists when open", () => {
    render(
      <DownloadSettingsModal
        isOpen={true}
        registrations={registrations}
        initialRegistration="Chhattisgarh Registration"
        initialReturnType="All Returns"
        onSave={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByText("Download Settings")).toBeInTheDocument();
    expect(screen.getAllByText("Chhattisgarh Registration").length).toBeGreaterThan(0);
    expect(screen.getByText("All Returns")).toBeInTheDocument();

    // The registrations list panel should be visible for selection initially
    expect(screen.getByText("List of GST Registrations")).toBeInTheDocument();
    expect(screen.getByText("Maharashtra Registration")).toBeInTheDocument();
  });

  it("should trigger onClose when close button is clicked", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <DownloadSettingsModal
        isOpen={true}
        registrations={registrations}
        initialRegistration="Chhattisgarh Registration"
        initialReturnType="All Returns"
        onSave={() => {}}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByRole("button");
    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it("should navigate options list and save selection on Enter key", async () => {
    const handleSave = vi.fn();
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <DownloadSettingsModal
        isOpen={true}
        registrations={registrations}
        initialRegistration="Chhattisgarh Registration"
        initialReturnType="All Returns"
        onSave={handleSave}
        onClose={handleClose}
      />
    );

    // Keyboard events:
    // 1. Press Enter to select the current GST registration (Chhattisgarh Registration) and move to Return Type
    await user.keyboard("{Enter}");

    // The dropdown panel should switch to "Types of Return"
    expect(screen.getByText("Types of Return")).toBeInTheDocument();

    // 2. Press ArrowDown to select "GSTR-1" (1st index of GSTR-1, GSTR-2A, GSTR-2B, GSTR-3B after All Returns)
    await user.keyboard("{ArrowDown}");

    // 3. Press Enter to save
    await user.keyboard("{Enter}");

    expect(handleSave).toHaveBeenCalledWith("Chhattisgarh Registration", "GSTR-1");
  });
});
