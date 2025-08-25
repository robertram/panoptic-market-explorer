// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="text-center space-y-8 max-w-2xl">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-bullish bg-clip-text text-transparent">
            Panoptic Market Explorer
          </h1>
          <p className="text-xl text-muted-foreground">
            Advanced DeFi market visualization and liquidity analysis
          </p>
        </div>

        <div className="bg-card p-8 rounded-lg border shadow-card space-y-6">
          <h2 className="text-2xl font-semibold">Sample Market</h2>
          <p className="text-muted-foreground">
            Explore the DAI/WETH market with sophisticated price zone analysis, 
            collateral monitoring, and real-time liquidity tracking.
          </p>
          
          <a 
            href="/markets/0xPool123456" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            View DAI/WETH Market →
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <h3 className="font-semibold text-success">Price Zone Analysis</h3>
            <p className="text-muted-foreground">
              Visualize liquidity distribution above and below current market price
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-primary">Collateral Monitoring</h3>
            <p className="text-muted-foreground">
              Track utilization rates with risk-based color coding
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-warning">Advanced Controls</h3>
            <p className="text-muted-foreground">
              Toggle between USD and token views with customizable price windows
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
