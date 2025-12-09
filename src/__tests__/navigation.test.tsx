import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import APIDocs from "@/pages/APIDocs";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Security from "@/pages/Security";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe("Navigation Pages", () => {
  const pages = [
    { path: "/features", Component: Features, title: "Features" },
    { path: "/pricing", Component: Pricing, title: "Pricing" },
    { path: "/api-docs", Component: APIDocs, title: "API" },
    { path: "/about", Component: About, title: "About" },
    { path: "/contact", Component: Contact, title: "Contact" },
    { path: "/security", Component: Security, title: "Security" },
    { path: "/privacy", Component: Privacy, title: "Privacy" },
    { path: "/terms", Component: Terms, title: "Terms" },
  ];

  pages.forEach(({ path, Component, title }) => {
    it(`renders ${title} page`, () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path={path} element={<Component />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it(`${title} page has footer`, () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path={path} element={<Component />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      const footer = screen.getByRole("contentinfo");
      expect(footer).toBeInTheDocument();
      expect(footer.textContent).toContain("FlowBills.ca");
    });
  });
});
