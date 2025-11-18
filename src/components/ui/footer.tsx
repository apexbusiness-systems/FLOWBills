import { TrackLink } from "@/components/ui/TrackLink";

export const Footer = () => {
  return (
    <footer className="border-t bg-card text-card-foreground relative z-50 pointer-events-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3 mb-8">
          <div>
            <div className="font-semibold text-lg mb-2">FlowBills.ca</div>
            <p className="text-sm text-muted-foreground">AI-powered invoice processing for Canadian energy.</p>
          </div>
          
          <div>
            <div className="font-semibold mb-2">Product</div>
            <ul className="space-y-2 text-sm">
              <li><TrackLink to="/features" source="footer" className="text-muted-foreground hover:text-foreground transition-colors">Features</TrackLink></li>
              <li><TrackLink to="/pricing" source="footer" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</TrackLink></li>
              <li><TrackLink to="/api-docs" source="footer" className="text-muted-foreground hover:text-foreground transition-colors">API</TrackLink></li>
              <li><TrackLink to="/blog" source="footer" className="text-muted-foreground hover:text-foreground transition-colors">Blog</TrackLink></li>
            </ul>
          </div>
          
          <div>
            <div className="font-semibold mb-2">Company</div>
            <ul className="space-y-2 text-sm">
              <li><TrackLink to="/about" source="footer" className="text-muted-foreground hover:text-foreground transition-colors">About</TrackLink></li>
              <li><TrackLink to="/contact" source="footer" className="text-muted-foreground hover:text-foreground transition-colors">Contact</TrackLink></li>
              <li><TrackLink to="/security" source="footer" className="text-muted-foreground hover:text-foreground transition-colors">Security</TrackLink></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t pt-8">
          <div className="font-semibold mb-2">Legal</div>
          <ul className="space-y-2 text-sm flex gap-6">
            <li><TrackLink to="/privacy" source="footer" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</TrackLink></li>
            <li><TrackLink to="/terms" source="footer" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</TrackLink></li>
          </ul>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            Apex Business Systems <span className="mx-2">•</span> Edmonton, Alberta
          </p>
        </div>
      </div>
    </footer>
  );
};