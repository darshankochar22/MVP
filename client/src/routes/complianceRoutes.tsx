import ComplianceWorkspace from "../pages/compliance/ComplianceWorkspace";
import type { RouteConfig } from "./types";

export const complianceRoutes: RouteConfig[] = [
  { path: "/compliance", element: <ComplianceWorkspace /> },
  { path: "/compliance/:tab", element: <ComplianceWorkspace /> },
];
